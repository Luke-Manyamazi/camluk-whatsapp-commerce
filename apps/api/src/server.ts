import "dotenv/config";
import express from "express";
import cors from "cors";
import servicesRouter from "./routes/services.js";
import conversationsRouter from "./routes/conversations.js";
import messagesRouter from "./routes/messages.js";
import leadsRouter from "./routes/leads.js";
import customersRouter from "./routes/customers.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:3000"
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "camluk-whatsapp-commerce-api",
    message: "Camluk API is running"
  });
});

app.get(
  "/api/auth/test",
  requireAuth,
  (req: AuthenticatedRequest, res) => {
    res.json({
      authenticated: true,
      userId: req.auth?.userId,
      businessId: req.auth?.businessId,
      role: req.auth?.role
    });
  }
);

app.use("/api/services", servicesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/customers", customersRouter);

app.listen(PORT, () => {
  console.log(`Camluk API running on http://localhost:${PORT}`);
});