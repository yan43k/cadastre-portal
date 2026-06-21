# Кадастровый портал ИП

Отдельный full-stack проект в папке `cadastre-portal/`.

## Структура

- `backend/` — Node.js, Express 5, Prisma, SQLite по умолчанию.
- `frontend/` — React 19, Vite, TailwindCSS.

## Быстрый старт

### Backend

```bash
cd cadastre-portal/backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

API слушает порт из `.env` (по умолчанию `4001`).

### Frontend

```bash
cd cadastre-portal/frontend
cp .env.example .env.local
npm install
npm run dev
```

Сайт: `http://localhost:5174`, прокси `/api` → backend.

После сида (см. `backend/.env.example`): `admin@example.local` / `AdminPass123!`, `client@example.local` / `ClientPass123!`.

## PostgreSQL

В `backend/prisma/schema.prisma` укажите `provider = "postgresql"` и задайте `DATABASE_URL` в `.env`, затем `npx prisma migrate dev`.

## Продакшен

Задайте `VITE_SITE_URL`, при необходимости `VITE_API_URL`. Обновите `frontend/public/robots.txt` и `sitemap.xml` под домен.
