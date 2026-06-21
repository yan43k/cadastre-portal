import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../lib/logger";

let transporter: nodemailer.Transporter | null = null;

function getTransport() {
  if (!env.SMTP_HOST || !env.SMTP_PORT) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
  }
  return transporter;
}

export async function sendMailSafe(opts: { to: string; subject: string; text: string }) {
  const t = getTransport();
  if (!t || !env.SMTP_FROM) {
    logger.info({ mail: "skipped", ...opts }, "SMTP не настроен");
    return;
  }
  await t.sendMail({ from: env.SMTP_FROM, ...opts });
}
