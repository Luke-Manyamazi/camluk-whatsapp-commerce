import { Router } from "express";
import { getConversations } from "../services/conversations.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const conversations = await getConversations();

    res.json({
      conversations
    });
  } catch (error) {
    console.error("Failed to load conversations:", error);

    res.status(500).json({
      message: "Failed to load conversations."
    });
  }
});

export default router;