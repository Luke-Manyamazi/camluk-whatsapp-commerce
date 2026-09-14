import { supabase } from "../lib/supabase.js";

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
      created_at
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
    createdAt: message.created_at
  }));
}

export async function createMessage(
  conversationId: string,
  businessId: string,
  content: string
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
    return null;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: content.trim()
    })
    .select(`
      id,
      conversation_id,
      direction,
      content,
      created_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    direction: data.direction,
    content: data.content,
    createdAt: data.created_at
  };
}
