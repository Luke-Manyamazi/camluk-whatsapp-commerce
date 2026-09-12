import { Router } from "express";
import { camlukServices } from "../services/camlukServices.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    services: camlukServices
  });
});

export default router;