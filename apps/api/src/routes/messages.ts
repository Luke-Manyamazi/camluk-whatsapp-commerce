import { Router } from "express";
import { getMessages, createMessage } from "../services/messages.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const MAX_MESSAGE_LENGTH = 4096;

router.get("/:conversationId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const messages = await getMessages(req.params.conversationId, req.auth!.businessId);
    res.json({ messages });
  } catch (error) {
    console.error("Failed to load messages:", error);
    res.status(500).json({ message: "Failed to load messages." });
  }
});

router.post("/:conversationId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { content } = req.body ?? {};
  if (typeof content !== "string" || !content.trim()) return res.status(400).json({ message: "Message content is required." });
  if (content.trim().length > MAX_MESSAGE_LENGTH) return res.status(400).json({ message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.` });
  try {
    const message = await createMessage(req.params.conversationId, req.auth!.businessId, content);
    if (!message) return res.status(404).json({ message: "Conversation not found." });
    res.status(201).json({ message });
  } catch (error) {
    console.error("Failed to create message:", error);
    const safeMessage = error instanceof Error && error.message === "WhatsApp sending is not configured yet."
      ? error.message
      : "Failed to send message.";
    res.status(500).json({ message: safeMessage });
  }
});

export default router;
