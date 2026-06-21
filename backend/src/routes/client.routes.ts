import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { prisma } from "../lib/prisma";
import { ok } from "../utils/http";
import { AppError } from "../utils/errors";
import type { AuthRequest } from "../types/express";
import { getUserById } from "../services/auth.service";
import { resolveStoragePath, ensureUploadDir, statusLabel } from "../services/application.service";
import { env } from "../config/env";

export const clientRouter = Router();
clientRouter.use(requireAuth);

clientRouter.use((req: AuthRequest, _res, next) => {
  if (req.user?.role !== "CLIENT") {
    throw new AppError(403, "FORBIDDEN", "Раздел доступен клиентам");
  }
  next();
});

clientRouter.get(
  "/me",
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await getUserById(req.user!.id);
    return ok(res, { user });
  })
);

const profileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(5).max(32).optional(),
});

clientRouter.put(
  "/me",
  validateBody(profileSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: req.body,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });
    return ok(res, { user });
  })
);

clientRouter.get(
  "/applications",
  asyncHandler(async (req: AuthRequest, res) => {
    const items = await prisma.application.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        attachments: true,
        _count: { select: { messages: true } },
      },
    });
    return ok(res, {
      items: items.map((a) => ({
        id: a.id,
        publicNumber: a.publicNumber,
        status: a.status,
        statusLabel: statusLabel(a.status),
        serviceSlug: a.serviceSlug,
        requestType: a.requestType,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        attachmentsCount: a.attachments.length,
        messagesCount: a._count.messages,
      })),
    });
  })
);

clientRouter.get(
  "/applications/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const row = await prisma.application.findFirst({
      where: { id: String(req.params.id), userId: req.user!.id },
      include: { attachments: true },
    });
    if (!row) throw new AppError(404, "NOT_FOUND", "Обращение не найдено");
    return ok(res, {
      item: {
        ...row,
        statusLabel: statusLabel(row.status),
      },
    });
  })
);

clientRouter.get(
  "/applications/:id/messages",
  asyncHandler(async (req: AuthRequest, res) => {
    const appRow = await prisma.application.findFirst({
      where: { id: String(req.params.id), userId: req.user!.id },
    });
    if (!appRow) throw new AppError(404, "NOT_FOUND", "Обращение не найдено");
    const items = await prisma.applicationMessage.findMany({
      where: { applicationId: appRow.id },
      orderBy: { createdAt: "asc" },
    });
    return ok(res, { items });
  })
);

const msgSchema = z.object({
  body: z.string().min(1).max(8000),
});

clientRouter.post(
  "/applications/:id/messages",
  validateBody(msgSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const appRow = await prisma.application.findFirst({
      where: { id: String(req.params.id), userId: req.user!.id },
    });
    if (!appRow) throw new AppError(404, "NOT_FOUND", "Обращение не найдено");
    const row = await prisma.applicationMessage.create({
      data: {
        applicationId: appRow.id,
        authorRole: "CLIENT",
        authorUserId: req.user!.id,
        body: req.body.body,
      },
    });
    return ok(res, { item: row }, 201);
  })
);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, resolveStoragePath(env.UPLOAD_SUBDIR));
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-А-Яа-яёЁ]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

clientRouter.post(
  "/applications/:id/attachments",
  upload.single("file"),
  asyncHandler(async (req: AuthRequest, res) => {
    await ensureUploadDir();
    const appRow = await prisma.application.findFirst({
      where: { id: String(req.params.id), userId: req.user!.id },
    });
    if (!appRow) throw new AppError(404, "NOT_FOUND", "Обращение не найдено");
    const f = req.file;
    if (!f) throw new AppError(400, "VALIDATION_ERROR", "Файл не получен");
    const rel = path.join(env.UPLOAD_SUBDIR, f.filename).replace(/\\/g, "/");
    const row = await prisma.applicationAttachment.create({
      data: {
        applicationId: appRow.id,
        fileName: f.originalname,
        storedPath: rel,
        mimeType: f.mimetype,
        sizeBytes: f.size,
      },
    });
    return ok(res, { item: row }, 201);
  })
);

clientRouter.get(
  "/applications/:id/attachments/:aid/download",
  asyncHandler(async (req: AuthRequest, res) => {
    const appRow = await prisma.application.findFirst({
      where: { id: String(req.params.id), userId: req.user!.id },
    });
    if (!appRow) throw new AppError(404, "NOT_FOUND", "Обращение не найдено");
    const att = await prisma.applicationAttachment.findFirst({
      where: { id: String(req.params.aid), applicationId: appRow.id },
    });
    if (!att) throw new AppError(404, "NOT_FOUND", "Вложение не найдено");
    const full = resolveStoragePath(att.storedPath);
    if (!fs.existsSync(full)) throw new AppError(404, "NOT_FOUND", "Файл отсутствует");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(att.fileName)}`);
    return res.sendFile(full);
  })
);

clientRouter.get(
  "/notifications",
  asyncHandler(async (req: AuthRequest, res) => {
    const items = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok(res, { items });
  })
);

clientRouter.patch(
  "/notifications/read-all",
  asyncHandler(async (req: AuthRequest, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    return ok(res, { ok: true });
  })
);

clientRouter.patch(
  "/notifications/:id/read",
  asyncHandler(async (req: AuthRequest, res) => {
    const n = await prisma.notification.updateMany({
      where: { id: String(req.params.id), userId: req.user!.id },
      data: { read: true },
    });
    if (n.count === 0) throw new AppError(404, "NOT_FOUND", "Уведомление не найдено");
    return ok(res, { ok: true });
  })
);

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(600).optional(),
});

clientRouter.post(
  "/reviews",
  validateBody(reviewSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const name = `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "Клиент";
    const row = await prisma.review.create({
      data: {
        userId: req.user!.id,
        authorName: name,
        rating: req.body.rating,
        comment: req.body.comment,
        published: false,
      },
    });
    return ok(res, { review: row }, 201);
  })
);
