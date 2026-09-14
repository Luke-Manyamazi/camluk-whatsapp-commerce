import { supabase } from "../lib/supabase.js";

export async function getConversations(businessId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      status,
      created_at,
      updated_at,
      customers (
        name,
        phone
      ),
      messages (
        content,
        created_at
      )
    `)
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load conversations: ${error.message}`);
  }

  return data.map((conversation) => {
    const customer = Array.isArray(conversation.customers)
      ? conversation.customers[0]
      : conversation.customers;

    const messages = Array.isArray(conversation.messages)
      ? conversation.messages
      : [];

    const latestMessage = messages
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )[0];

    return {
      id: conversation.id,
      customerName: customer?.name ?? "Unknown customer",
      phone: customer?.phone ?? "",
      lastMessage: latestMessage?.content ?? "",
      status: conversation.status,
      updatedAt: conversation.updated_at
    };
  });
}
