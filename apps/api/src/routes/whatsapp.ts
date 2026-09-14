import { Router, type Request, type Response } from "express";
import {
  getWhatsAppConfig,
  parseWhatsAppWebhook,
  processIncomingWhatsAppMessage
} from "../services/whatsapp.js";
import { verifyMetaSignature } from "../services/meta-signature.js";

const router = Router();

router.get("/status", (_req: Request, res: Response) => {
  const config = getWhatsAppConfig();
  res.json({
    channel: "whatsapp",
    configured: config.configured,
    liveSendingEnabled: config.liveSendingEnabled,
    phoneNumberId: config.phoneNumberId || "PLACEHOLDER_PHONE_NUMBER_ID",
    graphApiVersion: config.graphApiVersion,
    mode: config.liveSendingEnabled ? "meta" : "placeholder"
  });
});

router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (!verifyToken) {
    res.status(500).json({
      error: "WhatsApp webhook verification is not configured.",
      hint: "Set WHATSAPP_VERIFY_TOKEN when Meta developer onboarding is available."
    });
    return;
  }

  if (mode === "subscribe" && token === verifyToken && typeof challenge === "string") {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send("Forbidden");
});

router.post("/webhook", async (req: Request, res: Response) => {
  if (process.env.WHATSAPP_APP_SECRET?.trim() && !verifyMetaSignature(req)) {
    res.status(401).json({ message: "Invalid webhook signature." });
    return;
  }

  try {
    const incomingMessages = parseWhatsAppWebhook(req.body);
    if (incomingMessages.length === 0) {
      res.sendStatus(200);
      return;
    }

    const config = getWhatsAppConfig();
    if (!config.businessId) {
      console.warn("WhatsApp webhook received without a business mapping.");
      res.status(503).json({
        message: "WhatsApp webhook is ready, but the business mapping is not configured."
      });
      return;
    }

    for (const incoming of incomingMessages) {
      if (
        config.phoneNumberId &&
        incoming.phoneNumberId &&
        incoming.phoneNumberId !== config.phoneNumberId
      ) {
        console.warn("Ignoring WhatsApp message for an unknown phone number ID.", {
          received: incoming.phoneNumberId
        });
        continue;
      }

      const result = await processIncomingWhatsAppMessage(config.businessId, incoming);
      console.log("Processed WhatsApp message", {
        messageId: incoming.messageId,
        from: incoming.from,
        conversationId: result.conversation.id,
        matched: result.automation.matched
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to process WhatsApp webhook:", error);
    res.status(500).json({ message: "Failed to process WhatsApp webhook." });
  }
});

export default router;
