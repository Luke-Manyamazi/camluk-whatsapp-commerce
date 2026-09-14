import { supabase } from "../lib/supabase.js";
import { evaluateAutomationRules } from "./automation-engine.js";
import { executeAutomationAction } from "./automation-actions.js";

export interface WhatsAppTextMessage {
  messageId: string;
  from: string;
  name?: string;
  text: string;
  phoneNumberId?: string;
  timestamp?: string;
}

export interface WhatsAppSendResult {
  sent: boolean;
  mode: "meta" | "placeholder";
  messageId?: string;
  message?: string;
  raw?: unknown;
}

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getWhatsAppConfig() {
  return {
    businessId: env("WHATSAPP_BUSINESS_ID"),
    phoneNumberId: env("WHATSAPP_PHONE_NUMBER_ID"),
    accessToken: env("WHATSAPP_ACCESS_TOKEN"),
    graphApiVersion: env("WHATSAPP_GRAPH_API_VERSION") || "vXX.X",
    configured: Boolean(env("WHATSAPP_BUSINESS_ID") && env("WHATSAPP_PHONE_NUMBER_ID")),
    liveSendingEnabled: Boolean(
      env("WHATSAPP_PHONE_NUMBER_ID") &&
      env("WHATSAPP_ACCESS_TOKEN") &&
      !env("WHATSAPP_ACCESS_TOKEN").startsWith("PLACEHOLDER_")
    )
  };
}

export async function sendWhatsAppText(
  to: string,
  text: string
): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();

  if (!config.liveSendingEnabled) {
    console.log("[WhatsApp placeholder] outbound message", {
      to,
      text,
      phoneNumberId: config.phoneNumberId || "PLACEHOLDER_PHONE_NUMBER_ID"
    });

    return {
      sent: false,
      mode: "placeholder",
      message: "WhatsApp API credentials are not configured yet."
    };
  }

  const url = `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text
      }
    })
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `WhatsApp API request failed (${response.status}): ${JSON.stringify(raw)}`
    );
  }

  return {
    sent: true,
    mode: "meta",
    messageId:
      Array.isArray(raw?.messages) && raw.messages[0]?.id
        ? raw.messages[0].id
        : undefined,
    raw
  };
}

async function getOrCreateCustomer(
  businessId: string,
  phone: string,
  name?: string
) {
  const { data, error } = await supabase
    .from("customers")
    .upsert(
      {
        business_id: businessId,
        phone,
        ...(name ? { name } : {})
      },
      { onConflict: "business_id,phone" }
    )
    .select("id,name,phone")
    .single();

  if (error) throw new Error(`Failed to create WhatsApp customer: ${error.message}`);
  return data;
}

async function getOrCreateConversation(
  businessId: string,
  customerId: string
) {
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id,status")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(`Failed to find WhatsApp conversation: ${existingError.message}`);

  if (existing) return existing;

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      business_id: businessId,
      customer_id: customerId,
      status: "open"
    })
    .select("id,status")
    .single();

  if (error) throw new Error(`Failed to create WhatsApp conversation: ${error.message}`);
  return conversation;
}

export async function processIncomingWhatsAppMessage(
  businessId: string,
  incoming: WhatsAppTextMessage
) {
  const customer = await getOrCreateCustomer(
    businessId,
    incoming.from,
    incoming.name
  );

  const conversation = await getOrCreateConversation(
    businessId,
    customer.id
  );

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      direction: "inbound",
      content: incoming.text.trim()
    })
    .select("id,conversation_id,direction,content,created_at")
    .single();

  if (messageError) {
    throw new Error(`Failed to store WhatsApp message: ${messageError.message}`);
  }

  if (conversation.status === "human-handoff") {
    return {
      customer,
      conversation,
      message,
      automation: { matched: false, skipped: true, reason: "human-handoff" }
    };
  }

  const match = await evaluateAutomationRules(businessId, incoming.text);

  if (!match.matched) {
    const { error: logError } = await supabase.from("automation_logs").insert({
      business_id: businessId,
      conversation_id: conversation.id,
      message_id: message.id,
      input_text: incoming.text,
      matched: false
    });

    if (logError) console.error("Failed to write WhatsApp automation log:", logError);

    return {
      customer,
      conversation,
      message,
      automation: { matched: false }
    };
  }

  const actionResult = await executeAutomationAction(match, {
    businessId,
    customerId: customer.id,
    conversationId: conversation.id,
    messageId: message.id,
    inputText: incoming.text
  });

  let delivery: WhatsAppSendResult | null = null;

  if (match.actionType === "send_reply" && match.responseText?.trim()) {
    delivery = await sendWhatsAppText(incoming.from, match.responseText.trim());
  }

  const { error: logError } = await supabase.from("automation_logs").insert({
    business_id: businessId,
    rule_id: match.rule?.id ?? null,
    conversation_id: conversation.id,
    message_id: message.id,
    input_text: incoming.text,
    matched: true,
    response_text: match.responseText,
    action_type: match.actionType,
    action_result: {
      ...actionResult.result,
      whatsappDelivery: delivery
        ? { mode: delivery.mode, sent: delivery.sent, messageId: delivery.messageId }
        : null
    }
  });

  if (logError) console.error("Failed to write WhatsApp automation log:", logError);

  return {
    customer,
    conversation,
    message,
    automation: {
      matched: true,
      rule: match.rule,
      actionType: match.actionType,
      actionResult,
      delivery
    }
  };
}

export function parseWhatsAppWebhook(body: any): WhatsAppTextMessage[] {
  const messages: WhatsAppTextMessage[] = [];

  for (const entry of Array.isArray(body?.entry) ? body.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const value = change?.value;
      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      const contactNames = new Map<string, string>();

      for (const contact of contacts) {
        const waId = typeof contact?.wa_id === "string" ? contact.wa_id : "";
        const name = typeof contact?.profile?.name === "string" ? contact.profile.name : "";
        if (waId && name) contactNames.set(waId, name);
      }

      for (const message of Array.isArray(value?.messages) ? value.messages : []) {
        if (message?.type !== "text") continue;
        if (typeof message?.from !== "string") continue;
        if (typeof message?.id !== "string") continue;
        if (typeof message?.text?.body !== "string") continue;

        messages.push({
          messageId: message.id,
          from: message.from,
          name: contactNames.get(message.from),
          text: message.text.body,
          phoneNumberId: typeof value?.metadata?.phone_number_id === "string"
            ? value.metadata.phone_number_id
            : undefined,
          timestamp: typeof message.timestamp === "string" ? message.timestamp : undefined
        });
      }
    }
  }

  return messages;
}
