import { Router } from "express";
import { getConversations, markConversationRead, updateConversationStatus } from "../services/conversations.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const VALID_STATUSES = new Set(["open", "closed", "human-handoff"]);

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 5);
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    res.json(await getConversations(req.auth!.businessId, page, limit, search, status));
  } catch (error) {
    console.error("Failed to load conversations:", error);
    res.status(500).json({ message: "Failed to load conversations." });
  }
});

router.patch("/:conversationId/status", requireAuth, async (req: AuthenticatedRequest, res) => {
  const status = typeof req.body?.status === "string" ? req.body.status : "";
  if (!VALID_STATUSES.has(status)) return res.status(400).json({ message: "Invalid conversation status." });
  try {
    const conversation = await updateConversationStatus(String(req.params.conversationId), req.auth!.businessId, status as "open" | "closed" | "human-handoff");
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    res.json({ conversation });
  } catch (error) {
    console.error("Failed to update conversation status:", error);
    res.status(500).json({ message: "Failed to update conversation status." });
  }
});

router.post("/:conversationId/read", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const conversation = await markConversationRead(String(req.params.conversationId), req.auth!.businessId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    res.json({ conversation });
  } catch (error) {
    console.error("Failed to mark conversation read:", error);
    res.status(500).json({ message: "Failed to mark conversation read." });
  }
});

export default router;
