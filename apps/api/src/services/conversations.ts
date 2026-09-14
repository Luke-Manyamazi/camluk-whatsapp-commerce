import { supabase } from "../lib/supabase.js";

export async function getConversations(businessId: string, page = 1, limit = 5, search = "", status = "") {
  const safePage = Math.max(1, Math.floor(page)); const safeLimit = Math.min(50, Math.max(1, Math.floor(limit))); const from = (safePage - 1) * safeLimit; const to = from + safeLimit - 1;
  const term = search.trim().replace(/[%_,.()\\]/g, ""); const safeStatus = status.trim();
  let customerIds: string[] | null = null;
  if (term) {
    const { data: matchingCustomers, error: customerError } = await supabase.from("customers").select("id").eq("business_id", businessId).or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
    if (customerError) throw new Error(`Failed to search customers: ${customerError.message}`);
    customerIds = (matchingCustomers ?? []).map(customer => customer.id);
    if (customerIds.length === 0) return { conversations: [], pagination: { page: safePage, limit: safeLimit, total: 0, totalPages: 0 } };
  }
  let query = supabase.from("conversations").select(`id,status,created_at,updated_at,customers (name,phone),messages (content,created_at)`, { count: "exact" }).eq("business_id", businessId);
  if (customerIds) query = query.in("customer_id", customerIds); if (safeStatus) query = query.eq("status", safeStatus);
  const { data, error, count } = await query.order("updated_at", { ascending: false }).range(from, to);
  if (error) throw new Error(`Failed to load conversations: ${error.message}`);
  const conversations = (data ?? []).map(conversation => {
    const customer = Array.isArray(conversation.customers) ? conversation.customers[0] : conversation.customers; const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    let latestMessage = messages[0]; for (const message of messages) if (!latestMessage || new Date(message.created_at).getTime() > new Date(latestMessage.created_at).getTime()) latestMessage = message;
    return { id: conversation.id, customerName: customer?.name ?? "Unknown customer", phone: customer?.phone ?? "", lastMessage: latestMessage?.content ?? "", status: conversation.status, updatedAt: conversation.updated_at };
  });
  return { conversations, pagination: { page: safePage, limit: safeLimit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / safeLimit) } };
}
