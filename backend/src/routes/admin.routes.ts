import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { validateBody, validateQuery } from "../middleware/validateBody";
import { ok } from "../utils/http";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { AppError } from "../utils/errors";
import type { AuthRequest } from "../types/express";
import type { Prisma } from "@prisma/client";
import { sendMailSafe } from "../services/email.service";
import { statusLabel } from "../services/application.service";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
  q: z.string().optional(),
});

async function audit(
  adminId: string,
  action: string,
  entity: string,
  entityId?: string,
  meta?: unknown
) {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      entity,
      entityId,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
}

adminRouter.get(
  "/dashboard",
  asyncHandler(async (_req: AuthRequest, res) => {
    const [apps, clients, pendingReviews, vacancyApps] = await Promise.all([
      prisma.application.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.review.count({ where: { published: false } }),
      prisma.vacancyApplication.count(),
    ]);
    const byStatus = await prisma.application.groupBy({
      by: ["status"],
      _count: true,
    });
    return ok(res, {
      applicationsTotal: apps,
      clientsTotal: clients,
      reviewsPending: pendingReviews,
      vacancyApplicationsTotal: vacancyApps,
      applicationsByStatus: byStatus.map((b) => ({
        status: b.status,
        label: statusLabel(b.status),
        count: b._count,
      })),
    });
  })
);

adminRouter.get(
  "/applications",
  validateQuery(paginationSchema.extend({ status: z.string().optional() })),
  asyncHandler(async (req: AuthRequest, res) => {
    const qp = req.validatedQuery as z.infer<typeof paginationSchema> & {
      status?: string;
    };
    const { page, pageSize, q, status } = qp;
    const skip = (page - 1) * pageSize;
    const where: Prisma.ApplicationWhereInput = {};
    if (status) where.status = status;
    if (q?.trim()) {
      where.OR = [
        { publicNumber: { contains: q } },
        { contactName: { contains: q } },
        { contactEmail: { contains: q } },
      ];
    }
    const [total, items] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
    ]);
    return ok(res, {
      meta: {
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
      items: items.map((a) => ({
        ...a,
        statusLabel: statusLabel(a.status),
      })),
    });
  })
);

const appPatchSchema = z.object({
  status: z
    .enum(["NEW", "IN_PROGRESS", "DOCS", "REVIEW", "DONE", "CANCELLED"])
    .optional(),
  internalNote: z.string().max(8000).optional(),
});

adminRouter.patch(
  "/applications/:id",
  validateBody(appPatchSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const updated = await prisma.application.update({
      where: { id },
      data: req.body,
    });
    if (updated.userId) {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          type: "APPLICATION",
          title: "Обновление статуса обращения",
          body: `${updated.publicNumber}: ${statusLabel(updated.status)}`,
          payload: JSON.stringify({ applicationId: updated.id }),
        },
      });
      const user = await prisma.user.findUnique({ where: { id: updated.userId } });
      if (user?.email) {
        await sendMailSafe({
          to: user.email,
          subject: `Статус обращения ${updated.publicNumber}`,
          text: `Статус: ${statusLabel(updated.status)}`,
        }).catch(() => undefined);
      }
    }
    await audit(req.user!.id, "application.update", "Application", id, req.body);
    return ok(res, { item: { ...updated, statusLabel: statusLabel(updated.status) } });
  })
);

const adminMsgSchema = z.object({
  body: z.string().min(1).max(8000),
});

adminRouter.post(
  "/applications/:id/messages",
  validateBody(adminMsgSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const appRow = await prisma.application.findUnique({ where: { id } });
    if (!appRow) throw new AppError(404, "NOT_FOUND", "Обращение не найдено");
    const row = await prisma.applicationMessage.create({
      data: {
        applicationId: id,
        authorRole: "ADMIN",
        authorUserId: req.user!.id,
        body: req.body.body,
      },
    });
    if (appRow.userId) {
      await prisma.notification.create({
        data: {
          userId: appRow.userId,
          type: "MESSAGE",
          title: "Новое сообщение по обращению",
          body: appRow.publicNumber,
          payload: JSON.stringify({ applicationId: id, messageId: row.id }),
        },
      });
    }
    await audit(req.user!.id, "application.message", "Application", id);
    return ok(res, { item: row }, 201);
  })
);

adminRouter.get(
  "/applications/:id/messages",
  asyncHandler(async (req, res) => {
    const { id: applicationId } = req.params as { id: string };
    const items = await prisma.applicationMessage.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
    });
    return ok(res, { items });
  })
);

const serviceSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  shortDesc: z.string().max(500).optional(),
  description: z.string().min(1),
  steps: z.array(z.string()),
  documents: z.array(z.string()),
  timelineNote: z.string().max(2000).optional(),
  priceFromRub: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

adminRouter.get("/services", asyncHandler(async (_req, res) => {
  const items = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  return ok(res, { items });
}));

adminRouter.post(
  "/services",
  validateBody(serviceSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const row = await prisma.service.create({
      data: {
        slug: req.body.slug,
        title: req.body.title,
        shortDesc: req.body.shortDesc,
        description: req.body.description,
        stepsJson: JSON.stringify(req.body.steps),
        documentsJson: JSON.stringify(req.body.documents),
        timelineNote: req.body.timelineNote,
        priceFromRub: req.body.priceFromRub,
        sortOrder: req.body.sortOrder ?? 0,
        isActive: req.body.isActive ?? true,
      },
    });
    await audit(req.user!.id, "create", "Service", row.id);
    return ok(res, { item: row }, 201);
  })
);

adminRouter.patch(
  "/services/:id",
  validateBody(serviceSchema.partial()),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const data: Prisma.ServiceUpdateInput = { ...req.body };
    if (req.body.steps) data.stepsJson = JSON.stringify(req.body.steps);
    if (req.body.documents) data.documentsJson = JSON.stringify(req.body.documents);
    delete (data as { steps?: unknown }).steps;
    delete (data as { documents?: unknown }).documents;
    const row = await prisma.service.update({ where: { id }, data });
    await audit(req.user!.id, "update", "Service", id);
    return ok(res, { item: row });
  })
);

const docSchema = z.object({
  kind: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  filePath: z.string().optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

adminRouter.get("/official-documents", asyncHandler(async (_req, res) => {
  const items = await prisma.officialDocument.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  return ok(res, { items });
}));

adminRouter.post(
  "/official-documents",
  validateBody(docSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const row = await prisma.officialDocument.create({ data: req.body });
    await audit(req.user!.id, "create", "OfficialDocument", row.id);
    return ok(res, { item: row }, 201);
  })
);

adminRouter.patch(
  "/official-documents/:id",
  validateBody(docSchema.partial()),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const row = await prisma.officialDocument.update({
      where: { id },
      data: req.body,
    });
    await audit(req.user!.id, "update", "OfficialDocument", id);
    return ok(res, { item: row });
  })
);

const newsSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  body: z.string().min(1),
  published: z.boolean().optional(),
});

adminRouter.get("/news", asyncHandler(async (_req, res) => {
  const items = await prisma.news.findMany({ orderBy: { updatedAt: "desc" } });
  return ok(res, { items });
}));

adminRouter.post(
  "/news",
  validateBody(newsSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const row = await prisma.news.create({
      data: {
        ...req.body,
        publishedAt: req.body.published ? new Date() : null,
      },
    });
    await audit(req.user!.id, "create", "News", row.id);
    return ok(res, { item: row }, 201);
  })
);

adminRouter.patch(
  "/news/:id",
  validateBody(newsSchema.partial()),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const data = { ...req.body } as Prisma.NewsUpdateInput;
    if (req.body.published === true && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const row = await prisma.news.update({ where: { id }, data });
    await audit(req.user!.id, "update", "News", id);
    return ok(res, { item: row });
  })
);

const normSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  externalUrl: z.string().optional(),
  filePath: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

adminRouter.get("/normatives", asyncHandler(async (_req, res) => {
  const items = await prisma.normativeItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  return ok(res, { items });
}));

adminRouter.post(
  "/normatives",
  validateBody(normSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const row = await prisma.normativeItem.create({ data: req.body });
    await audit(req.user!.id, "create", "NormativeItem", row.id);
    return ok(res, { item: row }, 201);
  })
);

adminRouter.patch(
  "/normatives/:id",
  validateBody(normSchema.partial()),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const row = await prisma.normativeItem.update({
      where: { id },
      data: req.body,
    });
    await audit(req.user!.id, "update", "NormativeItem", id);
    return ok(res, { item: row });
  })
);

adminRouter.get("/vacancy-applications", asyncHandler(async (_req, res) => {
  const items = await prisma.vacancyApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: { vacancy: true },
    take: 200,
  });
  return ok(res, { items });
}));

adminRouter.get(
  "/reviews",
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.validatedQuery as z.infer<typeof paginationSchema>;
    const skip = (page - 1) * pageSize;
    const [total, items] = await Promise.all([
      prisma.review.count(),
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);
    return ok(res, {
      meta: {
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
      items,
    });
  })
);

adminRouter.patch(
  "/reviews/:id",
  validateBody(z.object({ published: z.boolean() })),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const row = await prisma.review.update({
      where: { id },
      data: { published: req.body.published },
    });
    await audit(req.user!.id, "review.moderate", "Review", id);
    return ok(res, { item: row });
  })
);

adminRouter.get("/appointments", asyncHandler(async (_req, res) => {
  const items = await prisma.appointment.findMany({
    orderBy: { startsAt: "asc" },
    take: 200,
  });
  return ok(res, { items });
}));

adminRouter.patch(
  "/appointments/:id",
  validateBody(
    z.object({
      status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
    })
  ),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const row = await prisma.appointment.update({
      where: { id },
      data: { status: req.body.status },
    });
    await audit(req.user!.id, "appointment.update", "Appointment", id);
    return ok(res, { item: row });
  })
);

adminRouter.get("/pricing-rules", asyncHandler(async (_req, res) => {
  const items = await prisma.pricingRule.findMany({ orderBy: { key: "asc" } });
  return ok(res, { items });
}));

adminRouter.put(
  "/pricing-rules/:key",
  validateBody(z.object({ value: z.string().min(1) })),
  asyncHandler(async (req: AuthRequest, res) => {
    const key = String(req.params.key);
    const row = await prisma.pricingRule.upsert({
      where: { key },
      create: { key, value: req.body.value },
      update: { value: req.body.value },
    });
    await audit(req.user!.id, "pricing.upsert", "PricingRule", key);
    return ok(res, { item: row });
  })
);

adminRouter.get(
  "/users",
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { page, pageSize, q } = req.validatedQuery as z.infer<typeof paginationSchema>;
    const skip = (page - 1) * pageSize;
    const where: Prisma.UserWhereInput = q?.trim()
      ? {
          OR: [
            { email: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);
    return ok(res, {
      meta: {
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
      items,
    });
  })
);

const userRolePatch = z.object({
  role: z.enum(["CLIENT", "ADMIN"]).optional(),
});

adminRouter.patch(
  "/users/:id",
  validateBody(userRolePatch),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const user = await prisma.user.update({
      where: { id },
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
    await audit(req.user!.id, "user.update", "User", id);
    return ok(res, { user });
  })
);

adminRouter.get("/vacancies", asyncHandler(async (_req, res) => {
  const items = await prisma.vacancy.findMany({ orderBy: { createdAt: "desc" } });
  return ok(res, { items });
}));

const vacancySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().min(1),
  isActive: z.boolean().optional(),
});

adminRouter.post(
  "/vacancies",
  validateBody(vacancySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const row = await prisma.vacancy.create({ data: req.body });
    await audit(req.user!.id, "create", "Vacancy", row.id);
    return ok(res, { item: row }, 201);
  })
);

adminRouter.patch(
  "/vacancies/:id",
  validateBody(vacancySchema.partial()),
  asyncHandler(async (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const row = await prisma.vacancy.update({ where: { id }, data: req.body });
    await audit(req.user!.id, "update", "Vacancy", id);
    return ok(res, { item: row });
  })
);
