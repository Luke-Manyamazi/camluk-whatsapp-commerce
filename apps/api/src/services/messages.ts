import { supabase } from "../lib/supabase.js";
import { sendWhatsAppText } from "./whatsapp.js";

export async function getMessages(
  conversationId: string,
  businessId: string
) {
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (conversationError) {
    throw new Error(`Failed to validate conversation: ${conversationError.message}`);
  }

  if (!conversation) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      conversation_id,
      direction,
      content,
      created_at,
      external_message_id
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return data.map((message) => ({
    id: message.id,
    conversationId: message.conversation_id,
    direction: message.direction,
    content: message.content,
    createdAt: message.created_at,
    externalMessageId: message.external_message_id
  }));
}

export async function createMessage(
  conversationId: string,
  businessId: string,
  content: string
) {
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id,customer_id,status")
    .eq("id", conversationId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (conversationError) {
    throw new Error(`Failed to validate conversation: ${conversationError.message}`);
  }

  if (!conversation) {
    return null;
  }

  const text = content.trim();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("phone")
    .eq("id", conversation.customer_id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (customerError) {
    throw new Error(`Failed to load conversation customer: ${customerError.message}`);
  }

  if (!customer?.phone) {
    throw new Error("Conversation customer does not have a WhatsApp phone number.");
  }

  const delivery = await sendWhatsAppText(customer.phone, text);

  if (!delivery.sent && delivery.mode === "placeholder") {
    throw new Error("WhatsApp sending is not configured yet.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: text,
      external_message_id: delivery.messageId ?? null
    })
    .select(`
      id,
      conversation_id,
      direction,
      content,
      created_at,
      external_message_id
    `)
    .single();

  if (error) {
    throw new Error(`Failed to store outbound message: ${error.message}`);
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    direction: data.direction,
    content: data.content,
    createdAt: data.created_at,
    externalMessageId: data.external_message_id,
    delivery: {
      mode: delivery.mode,
      sent: delivery.sent,
      messageId: delivery.messageId
    }
  };
}
