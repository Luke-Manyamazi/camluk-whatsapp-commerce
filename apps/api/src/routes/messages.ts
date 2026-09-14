import { Router } from "express";
import {
  getMessages,
  createMessage
} from "../services/messages.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/:conversationId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const messages = await getMessages(
        req.params.conversationId,
        req.auth!.businessId
      );

      res.json({ messages });
    } catch (error) {
      console.error("Failed to load messages:", error);
      res.status(500).json({ message: "Failed to load messages." });
    }
  }
);

router.post(
  "/:conversationId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Message content is required."
      });
    }

    try {
      const message = await createMessage(
        conversationId,
        req.auth!.businessId,
        content
      );

      if (!message) {
        return res.status(404).json({
          message: "Conversation not found."
        });
      }

      res.status(201).json({ message });
    } catch (error) {
      console.error("Failed to create message:", error);
      res.status(500).json({ message: "Failed to create message." });
    }
  }
);

export default router;
