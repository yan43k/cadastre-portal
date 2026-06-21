const raw = import.meta.env.VITE_API_URL as string | undefined;

/** Базовый URL API (в dev по умолчанию прокси Vite на /api). */
export const API_BASE = (raw?.replace(/\/$/, "") || "") + "/api";

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5174");
