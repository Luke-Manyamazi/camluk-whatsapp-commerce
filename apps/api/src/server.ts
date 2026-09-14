import "dotenv/config";
import express, { type Request } from "express";
import cors from "cors";
import servicesRouter from "./routes/services.js";
import conversationsRouter from "./routes/conversations.js";
import messagesRouter from "./routes/messages.js";
import leadsRouter from "./routes/leads.js";
import customersRouter from "./routes/customers.js";
import whatsappRouter from "./routes/whatsapp.js";
import automationRouter from "./routes/automation.js";
import settingsRouter from "./routes/settings.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS."));
    }
  })
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req: Request, _res, buffer) => {
      req.rawBody = Buffer.from(buffer);
    }
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/auth/test", requireAuth, (req, res) => {
  res.json({ authenticated: true, auth: req.auth });
});

app.use("/api/services", servicesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/automation", automationRouter);
app.use("/api/settings", settingsRouter);

app.use((error: unknown, _req: Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error && error.message.includes("CORS")) {
    res.status(403).json({ message: "Origin is not allowed." });
    return;
  }

  console.error("Unhandled API error:", error);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}
