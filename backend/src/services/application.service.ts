import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";

export function resolveStoragePath(...segments: string[]) {
  return path.join(process.cwd(), env.STORAGE_ROOT, ...segments);
}

export async function nextPublicNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const count = await prisma.application.count({
    where: { createdAt: { gte: start } },
  });
  const seq = count + 1;
  return `ПК-${year}-${String(seq).padStart(5, "0")}`;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Обращение зарегистрировано",
  IN_PROGRESS: "В работе",
  DOCS: "Подготовка документов",
  REVIEW: "Проверка и согласование",
  DONE: "Работы завершены",
  CANCELLED: "Отменено",
};

export function statusLabel(code: string) {
  return STATUS_LABELS[code] ?? code;
}

export async function ensureUploadDir() {
  const dir = resolveStoragePath(env.UPLOAD_SUBDIR);
  await fs.promises.mkdir(dir, { recursive: true });
  const demo = resolveStoragePath("demo-pdf");
  await fs.promises.mkdir(demo, { recursive: true });
}
