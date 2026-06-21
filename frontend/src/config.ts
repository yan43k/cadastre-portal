const raw = import.meta.env.VITE_API_URL as string | undefined;

/** Базовый URL API (в dev — прокси Vite на /api; на Render — VITE_API_URL или backend по умолчанию). */
export const API_BASE =
  (raw?.replace(/\/$/, "") ||
    (import.meta.env.PROD ? "https://cadastre-portal.onrender.com" : "")) + "/api";

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5174");
