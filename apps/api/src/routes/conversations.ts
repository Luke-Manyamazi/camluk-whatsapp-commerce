import { Router } from "express";
import { getConversations } from "../services/conversations.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const conversations = await getConversations(
        req.auth!.businessId
      );

      res.json({ conversations });
    } catch (error) {
      console.error("Failed to load conversations:", error);
      res.status(500).json({ message: "Failed to load conversations." });
    }
  }
);

export default router;
