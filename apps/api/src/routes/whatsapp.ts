import { Router, type Request, type Response } from "express";
import { getWhatsAppConfig, parseWhatsAppWebhook, processIncomingWhatsAppMessage, processWhatsAppStatusUpdate } from "../services/whatsapp.js";
import { verifyMetaSignature } from "../services/meta-signature.js";

const router = Router();

router.get("/status", (_req: Request, res: Response) => {
  const config = getWhatsAppConfig();
  res.json({ channel: "whatsapp", configured: config.configured, liveSendingEnabled: config.liveSendingEnabled, phoneNumberId: config.phoneNumberId || "PLACEHOLDER_PHONE_NUMBER_ID", graphApiVersion: config.graphApiVersion, mode: config.liveSendingEnabled ? "meta" : "placeholder" });
});

router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"], token = req.query["hub.verify_token"], challenge = req.query["hub.challenge"], verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (!verifyToken) { res.status(500).json({ error: "WhatsApp webhook verification is not configured." }); return; }
  if (mode === "subscribe" && token === verifyToken && typeof challenge === "string") { res.status(200).send(challenge); return; }
  res.status(403).send("Forbidden");
});

router.post("/webhook", async (req: Request, res: Response) => {
  if (process.env.WHATSAPP_APP_SECRET?.trim() && !verifyMetaSignature(req)) { res.status(401).json({ message: "Invalid webhook signature." }); return; }
  try {
    const parsed = parseWhatsAppWebhook(req.body);
    if (parsed.messages.length === 0 && parsed.statuses.length === 0) { res.sendStatus(200); return; }
    const config = getWhatsAppConfig();
    if (!config.businessId) { res.status(503).json({ message: "WhatsApp webhook is ready, but the business mapping is not configured." }); return; }

    for (const status of parsed.statuses) {
      if (config.phoneNumberId && status.phoneNumberId && status.phoneNumberId !== config.phoneNumberId) continue;
      await processWhatsAppStatusUpdate(config.businessId, status);
    }
    for (const incoming of parsed.messages) {
      if (config.phoneNumberId && incoming.phoneNumberId && incoming.phoneNumberId !== config.phoneNumberId) continue;
      const result = await processIncomingWhatsAppMessage(config.businessId, incoming);
      console.log("Processed WhatsApp message", { messageId: incoming.messageId, conversationId: result.conversation.id, matched: result.automation.matched });
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to process WhatsApp webhook:", error);
    res.status(500).json({ message: "Failed to process WhatsApp webhook." });
  }
});

export default router;
