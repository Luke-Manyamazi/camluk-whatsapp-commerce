import { Router } from "express";
import {
  getMessages,
  createMessage
} from "../services/messages.js";

const router = Router();

router.get("/:conversationId", async (req, res) => {
  try {
    const messages = await getMessages(req.params.conversationId);

    res.json({
      messages
    });
  } catch (error) {
    console.error("Failed to load messages:", error);

    res.status(500).json({
      message: "Failed to load messages."
    });
  }
});

router.post("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== "string") {
    return res.status(400).json({
      message: "Message content is required."
    });
  }

  try {
    const message = await createMessage(
      conversationId,
      content
    );

    res.status(201).json({
      message
    });
  } catch (error) {
    console.error("Failed to create message:", error);

    res.status(500).json({
      message: "Failed to create message."
    });
  }
});

export default router;