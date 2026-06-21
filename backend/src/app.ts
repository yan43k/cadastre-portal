import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { env, corsOriginList } from "./config/env";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { publicRouter } from "./routes/public.routes";
import { clientRouter } from "./routes/client.routes";
import { adminRouter } from "./routes/admin.routes";
import { ensureUploadDir } from "./services/application.service";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/api/health" },
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: corsOriginList,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  const authLimiter = rateLimit({
    windowMs: 60_000,
    limit: 25,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  const submitLimiter = rateLimit({
    windowMs: 60_000,
    limit: 40,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  app.use("/api/public/applications", submitLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "cadastre-ip-api", env: env.NODE_ENV });
  });

  void ensureUploadDir();

  app.use("/api/auth", authRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/client", clientRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorHandler);
  return app;
}
