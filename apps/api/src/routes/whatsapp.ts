import { Router, Request, Response } from "express";
import {
  getWhatsAppConfig,
  parseWhatsAppWebhook,
  processIncomingWhatsAppMessage
} from "../services/whatsapp.js";

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

  if (
    mode === "subscribe" &&
    token === verifyToken &&
    typeof challenge === "string"
  ) {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send("Forbidden");
});

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    // Meta expects a fast 200 response. The payload is processed after basic parsing.
    const incomingMessages = parseWhatsAppWebhook(req.body);

    if (incomingMessages.length === 0) {
      res.sendStatus(200);
      return;
    }

    const config = getWhatsAppConfig();
    const businessId = config.businessId;

    if (!businessId) {
      console.warn(
        "WhatsApp webhook received, but WHATSAPP_BUSINESS_ID is not configured."
      );
      res.status(503).json({
        message: "WhatsApp webhook is ready, but the business mapping is still a placeholder."
      });
      return;
    }

    const configuredPhoneNumberId = config.phoneNumberId;

    for (const incoming of incomingMessages) {
      if (
        configuredPhoneNumberId &&
        incoming.phoneNumberId &&
        incoming.phoneNumberId !== configuredPhoneNumberId
      ) {
        console.warn("Ignoring WhatsApp message for an unknown phone number ID.", {
          received: incoming.phoneNumberId
        });
        continue;
      }

      const result = await processIncomingWhatsAppMessage(
        businessId,
        incoming
      );

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
    res.status(500).json({
      message: "Failed to process WhatsApp webhook."
    });
  }
});

export default router;
