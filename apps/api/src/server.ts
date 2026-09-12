import "dotenv/config";
import express from "express";
import cors from "cors";
import servicesRouter from "./routes/services.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "camluk-whatsapp-commerce-api",
    message: "Camluk API is running"
  });
});

app.use("/api/services", servicesRouter);

app.listen(PORT, () => {
  console.log(`Camluk API running on http://localhost:${PORT}`);
});