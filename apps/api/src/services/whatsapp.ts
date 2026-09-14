import { supabase } from "../lib/supabase.js";
import { evaluateAutomationRules } from "./automation-engine.js";
import { executeAutomationAction } from "./automation-actions.js";

export interface WhatsAppTextMessage { messageId: string; from: string; name?: string; text: string; phoneNumberId?: string; timestamp?: string; }
export interface WhatsAppStatusUpdate { messageId: string; status: "sent" | "delivered" | "read" | "failed"; timestamp?: string; error?: string; phoneNumberId?: string; }
export interface WhatsAppSendResult { sent: boolean; mode: "meta" | "placeholder"; messageId?: string; message?: string; raw?: unknown; }
function env(name: string): string { return process.env[name]?.trim() ?? ""; }
export function getWhatsAppConfig() { return { businessId: env("WHATSAPP_BUSINESS_ID"), phoneNumberId: env("WHATSAPP_PHONE_NUMBER_ID"), accessToken: env("WHATSAPP_ACCESS_TOKEN"), graphApiVersion: env("WHATSAPP_GRAPH_API_VERSION") || "vXX.X", configured: Boolean(env("WHATSAPP_BUSINESS_ID") && env("WHATSAPP_PHONE_NUMBER_ID")), liveSendingEnabled: Boolean(env("WHATSAPP_PHONE_NUMBER_ID") && env("WHATSAPP_ACCESS_TOKEN") && !env("WHATSAPP_ACCESS_TOKEN").startsWith("PLACEHOLDER_")) }; }

export async function sendWhatsAppText(to: string, text: string): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();
  if (!config.liveSendingEnabled) { console.log("[WhatsApp placeholder] outbound message", { to, text, phoneNumberId: config.phoneNumberId || "PLACEHOLDER_PHONE_NUMBER_ID" }); return { sent: false, mode: "placeholder", message: "WhatsApp API credentials are not configured yet." }; }
  const url = `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`;
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body: text } }) });
  const raw = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`WhatsApp API request failed (${response.status}): ${JSON.stringify(raw)}`);
  return { sent: true, mode: "meta", messageId: Array.isArray(raw?.messages) && raw.messages[0]?.id ? raw.messages[0].id : undefined, raw };
}

async function getOrCreateCustomer(businessId: string, phone: string, name?: string) { const { data, error } = await supabase.from("customers").upsert({ business_id: businessId, phone, ...(name ? { name } : {}) }, { onConflict: "business_id,phone" }).select("id,name,phone").single(); if (error) throw new Error(`Failed to create WhatsApp customer: ${error.message}`); return data; }
async function getOrCreateConversation(businessId: string, customerId: string) { const { data: existing, error: existingError } = await supabase.from("conversations").select("id,status").eq("business_id", businessId).eq("customer_id", customerId).order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (existingError) throw new Error(`Failed to find WhatsApp conversation: ${existingError.message}`); if (existing) return existing; const { data: conversation, error } = await supabase.from("conversations").insert({ business_id: businessId, customer_id: customerId, status: "open" }).select("id,status").single(); if (error) throw new Error(`Failed to create WhatsApp conversation: ${error.message}`); return conversation; }

async function storeAutomatedReply(businessId: string, conversationId: string, to: string, text: string) {
  const { data: pending, error: insertError } = await supabase.from("messages").insert({ conversation_id: conversationId, direction: "outbound", content: text, delivery_status: "pending" }).select("id").single();
  if (insertError) throw new Error(`Failed to create automated outbound message: ${insertError.message}`);
  try {
    const delivery = await sendWhatsAppText(to, text);
    if (!delivery.sent && delivery.mode === "placeholder") {
      await supabase.from("messages").update({ delivery_status: "failed", delivery_error: "WhatsApp sending is not configured yet.", failed_at: new Date().toISOString() }).eq("id", pending.id);
      return { delivery, messageId: pending.id };
    }
    const { data: message, error } = await supabase.from("messages").update({ external_message_id: delivery.messageId ?? null, delivery_status: "sent", delivery_error: null }).eq("id", pending.id).eq("conversation_id", conversationId).select("id,conversation_id,direction,content,created_at,external_message_id,delivery_status").single();
    if (error) throw new Error(`Failed to store automated outbound message: ${error.message}`);
    return { delivery, messageId: message.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp delivery failed.";
    await supabase.from("messages").update({ delivery_status: "failed", delivery_error: message.slice(0, 1000), failed_at: new Date().toISOString() }).eq("id", pending.id);
    throw error;
  }
}

export async function processWhatsAppStatusUpdate(businessId: string, status: WhatsAppStatusUpdate) {
  const update: Record<string, string | null> = { delivery_status: status.status }; const timestamp = status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString();
  if (status.status === "delivered") update.delivered_at = timestamp; if (status.status === "read") update.read_at = timestamp; if (status.status === "failed") { update.failed_at = timestamp; update.delivery_error = status.error ?? "WhatsApp delivery failed."; }
  const { data, error } = await supabase.from("messages").update(update).eq("external_message_id", status.messageId).in("delivery_status", ["pending", "sent", "delivered"]).select("id,conversation_id,delivery_status").maybeSingle();
  if (error) throw new Error(`Failed to update WhatsApp delivery status: ${error.message}`);
  return { updated: Boolean(data), message: data ?? null, businessId };
}

export async function processIncomingWhatsAppMessage(businessId: string, incoming: WhatsAppTextMessage) {
  const { data: duplicate, error: duplicateError } = await supabase.from("messages").select("id,conversation_id").eq("external_message_id", incoming.messageId).maybeSingle(); if (duplicateError) throw new Error(`Failed to check WhatsApp message duplicate: ${duplicateError.message}`); if (duplicate) return { duplicate: true, customer: null, conversation: { id: duplicate.conversation_id, status: "unknown" }, message: duplicate, automation: { matched: false, skipped: true, reason: "duplicate" } };
  const customer = await getOrCreateCustomer(businessId, incoming.from, incoming.name); const conversation = await getOrCreateConversation(businessId, customer.id);
  const { data: message, error: messageError } = await supabase.from("messages").insert({ conversation_id: conversation.id, direction: "inbound", content: incoming.text.trim(), external_message_id: incoming.messageId }).select("id,conversation_id,direction,content,created_at,external_message_id").single();
  if (messageError) { if (messageError.code === "23505") return { duplicate: true, customer, conversation, message: null, automation: { matched: false, skipped: true, reason: "duplicate" } }; throw new Error(`Failed to store WhatsApp message: ${messageError.message}`); }
  if (conversation.status === "human-handoff") return { duplicate: false, customer, conversation, message, automation: { matched: false, skipped: true, reason: "human-handoff" } };
  const match = await evaluateAutomationRules(businessId, incoming.text);
  if (!match.matched) { const { error: logError } = await supabase.from("automation_logs").insert({ business_id: businessId, conversation_id: conversation.id, message_id: message.id, input_text: incoming.text, matched: false }); if (logError) console.error("Failed to write WhatsApp automation log:", logError); return { duplicate: false, customer, conversation, message, automation: { matched: false } }; }
  const actionResult = await executeAutomationAction(match, { businessId, customerId: customer.id, conversationId: conversation.id, messageId: message.id, inputText: incoming.text });
  let delivery: WhatsAppSendResult | null = null; let automatedMessageId: string | null = null;
  if (match.actionType === "send_reply" && match.responseText?.trim()) { const stored = await storeAutomatedReply(businessId, conversation.id, incoming.from, match.responseText.trim()); delivery = stored.delivery; automatedMessageId = stored.messageId; }
  const { error: logError } = await supabase.from("automation_logs").insert({ business_id: businessId, rule_id: match.rule?.id ?? null, conversation_id: conversation.id, message_id: message.id, input_text: incoming.text, matched: true, response_text: match.responseText, action_type: match.actionType, action_result: { ...actionResult.result, automatedMessageId, whatsappDelivery: delivery ? { mode: delivery.mode, sent: delivery.sent, messageId: delivery.messageId } : null } }); if (logError) console.error("Failed to write WhatsApp automation log:", logError);
  return { duplicate: false, customer, conversation, message, automation: { matched: true, rule: match.rule, actionType: match.actionType, actionResult, delivery } };
}

export function parseWhatsAppWebhook(body: any): { messages: WhatsAppTextMessage[]; statuses: WhatsAppStatusUpdate[] } {
  const messages: WhatsAppTextMessage[] = [], statuses: WhatsAppStatusUpdate[] = [];
  for (const entry of Array.isArray(body?.entry) ? body.entry : []) for (const change of Array.isArray(entry?.changes) ? entry.changes : []) { const value = change?.value, contacts = Array.isArray(value?.contacts) ? value.contacts : [], contactNames = new Map<string, string>(); for (const contact of contacts) { const waId = typeof contact?.wa_id === "string" ? contact.wa_id : ""; const name = typeof contact?.profile?.name === "string" ? contact.profile.name : ""; if (waId && name) contactNames.set(waId, name); } const phoneNumberId = typeof value?.metadata?.phone_number_id === "string" ? value.metadata.phone_number_id : undefined; for (const message of Array.isArray(value?.messages) ? value.messages : []) { if (message?.type !== "text" || typeof message?.from !== "string" || typeof message?.id !== "string" || typeof message?.text?.body !== "string") continue; messages.push({ messageId: message.id, from: message.from, name: contactNames.get(message.from), text: message.text.body, phoneNumberId, timestamp: typeof message.timestamp === "string" ? message.timestamp : undefined }); } for (const status of Array.isArray(value?.statuses) ? value.statuses : []) { if (typeof status?.id !== "string" || !["sent","delivered","read","failed"].includes(status?.status)) continue; statuses.push({ messageId: status.id, status: status.status, timestamp: typeof status.timestamp === "string" ? status.timestamp : undefined, error: Array.isArray(status?.errors) ? status.errors[0]?.title || status.errors[0]?.message : undefined, phoneNumberId }); } }
  return { messages, statuses };
}
