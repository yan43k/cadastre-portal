import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody, validateQuery } from "../middleware/validateBody";
import { ok, sendError } from "../utils/http";
import type { AuthRequest } from "../types/express";
import { nextPublicNumber, resolveStoragePath, statusLabel, ensureUploadDir } from "../services/application.service";
import { env } from "../config/env";
import { optionalAuth } from "../middleware/optionalAuth";
import { sendMailSafe } from "../services/email.service";
import path from "path";
import fs from "fs";

export const publicRouter = Router();

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

publicRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [applications, clients, services] = await Promise.all([
      prisma.application.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.service.count({ where: { isActive: true } }),
    ]);
    return ok(res, {
      applicationsTotal: applications,
      activeClients: clients,
      servicesPublished: services,
      regionDistrict: "Павловский район, Алтайский край",
    });
  })
);

publicRouter.get(
  "/services",
  asyncHandler(async (_req, res) => {
    const items = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(res, {
      items: items.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        shortDesc: s.shortDesc,
        priceFromRub: s.priceFromRub,
        timelineNote: s.timelineNote,
      })),
    });
  })
);

publicRouter.get(
  "/services/:slug",
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };
    const s = await prisma.service.findFirst({
      where: { slug, isActive: true },
    });
    if (!s) {
      return sendError(res, 404, "NOT_FOUND", "Услуга не найдена");
    }
    return ok(res, {
      item: {
        ...s,
        steps: JSON.parse(s.stepsJson) as string[],
        documents: JSON.parse(s.documentsJson) as string[],
      },
    });
  })
);

publicRouter.get(
  "/news",
  validateQuery(
    z.object({
      take: z.coerce.number().int().min(1).max(30).optional().default(10),
    })
  ),
  asyncHandler(async (req, res) => {
    const { take } = req.query as unknown as { take: number };
    const items = await prisma.news.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take,
    });
    return ok(res, { items });
  })
);

publicRouter.get(
  "/news/:slug",
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };
    const n = await prisma.news.findFirst({
      where: { slug, published: true },
    });
    if (!n) return sendError(res, 404, "NOT_FOUND", "Материал не найден");
    return ok(res, { item: n });
  })
);

publicRouter.get(
  "/normatives",
  validateQuery(
    z.object({
      category: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { category } = req.query as unknown as { category?: string };
    const items = await prisma.normativeItem.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return ok(res, { items });
  })
);

publicRouter.get(
  "/documents",
  asyncHandler(async (_req, res) => {
    const items = await prisma.officialDocument.findMany({
      where: { isPublic: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return ok(res, { items });
  })
);

publicRouter.get(
  "/documents/:id/file",
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const doc = await prisma.officialDocument.findFirst({
      where: { id, isPublic: true },
    });
    if (!doc?.filePath) {
      return sendError(res, 404, "NOT_FOUND", "Файл не найден");
    }
    const full = resolveStoragePath(doc.filePath);
    if (!fs.existsSync(full)) {
      return sendError(res, 404, "NOT_FOUND", "Файл отсутствует на сервере");
    }
    return res.sendFile(full);
  })
);

publicRouter.get(
  "/qualifications",
  asyncHandler(async (_req, res) => {
    const items = await prisma.qualification.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    });
    return ok(res, { items });
  })
);

publicRouter.get(
  "/normatives/:id/file",
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const row = await prisma.normativeItem.findUnique({
      where: { id },
    });
    if (!row?.filePath) {
      return sendError(res, 404, "NOT_FOUND", "Файл не найден");
    }
    const full = resolveStoragePath(row.filePath);
    if (!fs.existsSync(full)) {
      return sendError(res, 404, "NOT_FOUND", "Файл отсутствует на сервере");
    }
    return res.sendFile(full);
  })
);

publicRouter.get(
  "/applications/:publicNumber",
  asyncHandler(async (req, res) => {
    const { publicNumber: pn } = req.params as { publicNumber: string };
    const publicNumber = decodeURIComponent(pn).trim();
    const appRow = await prisma.application.findUnique({
      where: { publicNumber },
    });
    if (!appRow) {
      return sendError(res, 404, "NOT_FOUND", "Обращение не найдено");
    }
    return ok(res, {
      item: {
        publicNumber: appRow.publicNumber,
        status: appRow.status,
        statusLabel: statusLabel(appRow.status),
        serviceSlug: appRow.serviceSlug,
        requestType: appRow.requestType,
        updatedAt: appRow.updatedAt,
        createdAt: appRow.createdAt,
      },
    });
  })
);

const createApplicationSchema = z.object({
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(5).max(32).optional(),
  serviceSlug: z.string().max(120).optional(),
  requestType: z.enum(["CONSULTATION", "REQUEST", "CALLBACK"]),
  message: z.string().max(8000).optional(),
  preferredDate: z.string().max(40).optional(),
  priority: z.enum(["NORMAL", "URGENT"]).optional(),
});

publicRouter.post(
  "/applications",
  optionalAuth,
  upload.array("files", 8),
  asyncHandler(async (req: AuthRequest, res) => {
    await ensureUploadDir();
    const raw = req.body as Record<string, unknown>;
    const body = createApplicationSchema.parse({
      contactName: raw.contactName,
      contactEmail: raw.contactEmail,
      contactPhone: raw.contactPhone === "" ? undefined : raw.contactPhone,
      serviceSlug: raw.serviceSlug === "" ? undefined : raw.serviceSlug,
      requestType: raw.requestType,
      message: raw.message === "" ? undefined : raw.message,
      preferredDate: raw.preferredDate === "" ? undefined : raw.preferredDate,
      priority: raw.priority === "" ? undefined : raw.priority,
    });
    const publicNumber = await nextPublicNumber();

    const created = await prisma.application.create({
      data: {
        publicNumber,
        userId: req.user?.role === "CLIENT" ? req.user.id : undefined,
        serviceSlug: body.serviceSlug ?? null,
        requestType: body.requestType,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone ?? null,
        message: body.message ?? null,
        preferredDate: body.preferredDate ?? null,
        priority: body.priority ?? "NORMAL",
      },
    });

    const files = (req.files ?? []) as Express.Multer.File[];
    for (const f of files) {
      const rel = path.join(env.UPLOAD_SUBDIR, f.filename).replace(/\\/g, "/");
      await prisma.applicationAttachment.create({
        data: {
          applicationId: created.id,
          fileName: f.originalname,
          storedPath: rel,
          mimeType: f.mimetype,
          sizeBytes: f.size,
        },
      });
    }

    if (req.user?.id && req.user.role === "CLIENT") {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          type: "APPLICATION",
          title: "Обращение зарегистрировано",
          body: `Номер: ${publicNumber}. Статус можно отслеживать в личном кабинете.`,
          payload: JSON.stringify({ applicationId: created.id }),
        },
      });
    }

    await sendMailSafe({
      to: body.contactEmail,
      subject: `Регистрация обращения ${publicNumber}`,
      text: `Ваше обращение зарегистрировано.\nНомер: ${publicNumber}\nОтслеживание статуса: раздел сайта «Проверка готовности».`,
    }).catch(() => undefined);

    return ok(
      res,
      {
        publicNumber: created.publicNumber,
        id: created.id,
        status: created.status,
        statusLabel: statusLabel(created.status),
      },
      201
    );
  })
);

publicRouter.get(
  "/pricing-rules",
  asyncHandler(async (_req, res) => {
    const items = await prisma.pricingRule.findMany({ orderBy: { key: "asc" } });
    return ok(res, { items });
  })
);

publicRouter.get(
  "/appointments/availability",
  validateQuery(
    z.object({
      days: z.coerce.number().int().min(1).max(60).optional().default(21),
    })
  ),
  asyncHandler(async (req, res) => {
    const { days } = req.query as unknown as { days: number };
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + days);

    const booked = await prisma.appointment.findMany({
      where: {
        startsAt: { gte: from, lt: to },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    const workStart = 10;
    const workEnd = 17;
    const slotMinutes = 60;
    const busyKeys = new Set(
      booked.map((b) => `${b.startsAt.toISOString().slice(0, 10)}-${b.startsAt.getHours()}`)
    );

    const slots: { start: string; end: string }[] = [];
    const cursor = new Date(from);
    while (cursor < to) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        for (let h = workStart; h < workEnd; h++) {
          const s = new Date(cursor);
          s.setHours(h, 0, 0, 0);
          const e = new Date(s);
          e.setMinutes(e.getMinutes() + slotMinutes);
          const key = `${s.toISOString().slice(0, 10)}-${h}`;
          if (!busyKeys.has(key)) {
            slots.push({ start: s.toISOString(), end: e.toISOString() });
          }
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return ok(res, { slots: slots.slice(0, 80) });
  })
);

const appointmentBookSchema = z.object({
  start: z.string().datetime(),
  contactName: z.string().min(2).max(120),
  contactPhone: z.string().min(5).max(32),
  contactEmail: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
});

publicRouter.post(
  "/appointments",
  optionalAuth,
  validateBody(appointmentBookSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const start = new Date(req.body.start);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    if (start.getHours() < 10 || start.getHours() >= 17) {
      return sendError(res, 400, "VALIDATION_ERROR", "Недопустимое время консультации");
    }
    const clash = await prisma.appointment.findFirst({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: start,
      },
    });
    if (clash) {
      return sendError(res, 409, "CONFLICT", "Выбранный интервал уже занят");
    }
    const row = await prisma.appointment.create({
      data: {
        userId: req.user?.role === "CLIENT" ? req.user.id : undefined,
        startsAt: start,
        endsAt: end,
        contactName: req.body.contactName,
        contactPhone: req.body.contactPhone,
        contactEmail: req.body.contactEmail ?? null,
        notes: req.body.notes ?? null,
      },
    });
    return ok(res, { item: row }, 201);
  })
);

publicRouter.get(
  "/vacancies",
  asyncHandler(async (_req, res) => {
    const items = await prisma.vacancy.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, { items });
  })
);

const vacancyApplySchema = z.object({
  vacancyId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(32).optional(),
  message: z.string().max(4000).optional(),
});

publicRouter.post(
  "/vacancy-applications",
  validateBody(vacancyApplySchema),
  asyncHandler(async (req, res) => {
    const v = await prisma.vacancy.findFirst({
      where: { id: req.body.vacancyId, isActive: true },
    });
    if (!v) return sendError(res, 404, "NOT_FOUND", "Вакансия не найдена");
    const row = await prisma.vacancyApplication.create({
      data: {
        vacancyId: v.id,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone ?? null,
        message: req.body.message ?? null,
      },
    });
    return ok(res, { id: row.id }, 201);
  })
);

publicRouter.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const items = await prisma.review.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    return ok(res, { items });
  })
);

publicRouter.use((_req, res) => sendError(res, 404, "NOT_FOUND", "Ресурс не найден"));
