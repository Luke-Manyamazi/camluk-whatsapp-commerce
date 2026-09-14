import { supabase } from "../lib/supabase.js";

export async function getConversations(
  businessId: string,
  page = 1,
  limit = 5
) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  const { data, error, count } = await supabase
    .from("conversations")
    .select(`
      id,
      status,
      created_at,
      updated_at,
      customers (name, phone),
      messages (content, created_at)
    `, { count: "exact" })
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Failed to load conversations: ${error.message}`);

  const conversations = data.map((conversation) => {
    const customer = Array.isArray(conversation.customers) ? conversation.customers[0] : conversation.customers;
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const latestMessage = [...messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return {
      id: conversation.id,
      customerName: customer?.name ?? "Unknown customer",
      phone: customer?.phone ?? "",
      lastMessage: latestMessage?.content ?? "",
      status: conversation.status,
      updatedAt: conversation.updated_at
    };
  });

  return {
    conversations,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / safeLimit)
    }
  };
}
