import { Router, type Request, type Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createWhatsAppChannel, getWhatsAppChannelForBusiness, verifyWhatsAppWebhookToken } from "../services/whatsapp-channels.js";
import { getWhatsAppConfig, parseWhatsAppWebhook, processIncomingWhatsAppMessage, processWhatsAppStatusUpdate, resolveWhatsAppChannelByPhoneNumberId } from "../services/whatsapp.js";
import { verifyMetaSignature } from "../services/meta-signature.js";

const router = Router();
const isManager = (req: AuthenticatedRequest) => req.auth?.role === "owner" || req.auth?.role === "admin";

router.get("/status", (_req: Request, res: Response) => { const config = getWhatsAppConfig(); res.json({ channel: "whatsapp", configured: config.configured, liveSendingEnabled: config.liveSendingEnabled, phoneNumberId: config.phoneNumberId || "multi-channel", graphApiVersion: config.graphApiVersion, mode: config.liveSendingEnabled ? "meta" : "placeholder" }); });

router.get("/channels", requireAuth, async (req: AuthenticatedRequest, res: Response) => { try { const channel = await getWhatsAppChannelForBusiness(req.auth!.businessId); res.json({ channels: channel ? [{ id: channel.id, name: channel.name, whatsappBusinessAccountId: channel.whatsappBusinessAccountId, phoneNumberId: channel.phoneNumberId, graphApiVersion: channel.graphApiVersion, active: channel.active }] : [] }); } catch (error) { console.error("Failed to load WhatsApp channels:", error); res.status(500).json({ message: "Failed to load WhatsApp channels." }); } });

router.post("/channels", requireAuth, async (req: AuthenticatedRequest, res: Response) => { try { if (!isManager(req)) return res.status(403).json({ message: "Only business owners and admins can manage WhatsApp channels." }); const { name, whatsappBusinessAccountId, phoneNumberId, accessToken, verifyToken, graphApiVersion } = req.body ?? {}; if (![name, whatsappBusinessAccountId, phoneNumberId, accessToken, verifyToken].every(value => typeof value === "string" && value.trim())) return res.status(400).json({ message: "name, WhatsApp Business Account ID, phone number ID, access token and verify token are required." }); const channel = await createWhatsAppChannel({ businessId: req.auth!.businessId, name, whatsappBusinessAccountId, phoneNumberId, accessToken, verifyToken, graphApiVersion }); return res.status(201).json({ channel }); } catch (error) { console.error("Failed to create WhatsApp channel:", error); return res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create WhatsApp channel." }); } });

router.get("/webhook", async (req: Request, res: Response) => {
  const mode = req.query["hub.mode"], token = req.query["hub.verify_token"], challenge = req.query["hub.challenge"];
  if (mode !== "subscribe" || typeof token !== "string" || typeof challenge !== "string") return res.status(403).send("Forbidden");
  try { const channel = await verifyWhatsAppWebhookToken(token); if (channel) return res.status(200).send(challenge); const legacyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim(); if (legacyToken && token === legacyToken) return res.status(200).send(challenge); return res.status(403).send("Forbidden"); } catch (error) { console.error("Failed to verify WhatsApp webhook:", error); return res.status(500).json({ message: "Webhook verification failed." }); }
});

router.post("/webhook", async (req: Request, res: Response) => {
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim(); if (process.env.NODE_ENV === "production" && !appSecret) return res.status(503).json({ message: "WhatsApp webhook security is not configured." }); if (appSecret && !verifyMetaSignature(req)) return res.status(401).json({ message: "Invalid webhook signature." });
  try { const parsed = parseWhatsAppWebhook(req.body); if (parsed.messages.length === 0 && parsed.statuses.length === 0) return res.sendStatus(200); for (const status of parsed.statuses) { const channel = await resolveWhatsAppChannelByPhoneNumberId(status.phoneNumberId); if (!channel) continue; await processWhatsAppStatusUpdate(channel.businessId, status); } for (const incoming of parsed.messages) { const channel = await resolveWhatsAppChannelByPhoneNumberId(incoming.phoneNumberId); if (!channel) { console.warn("Ignoring WhatsApp message for unknown phone number", { phoneNumberId: incoming.phoneNumberId }); continue; } const result = await processIncomingWhatsAppMessage(channel.businessId, incoming, channel); console.log("Processed WhatsApp message", { messageId: incoming.messageId, conversationId: result.conversation.id, businessId: channel.businessId, channelId: channel.id, matched: result.automation.matched }); } return res.sendStatus(200); } catch (error) { console.error("Failed to process WhatsApp webhook:", error); return res.status(500).json({ message: "Failed to process WhatsApp webhook." }); }
});

export default router;
