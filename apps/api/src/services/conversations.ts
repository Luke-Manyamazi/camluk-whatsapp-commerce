import { supabase } from "../lib/supabase.js";

const conversationSelect = `id,status,created_at,updated_at,inbox_read_at,customer_id,whatsapp_channel_id,customers (id,name,phone,email,tags,notes),whatsapp_channels (id,name,phone_number_id),messages (content,created_at,direction)`;

function mapConversation(conversation: any) {
  const customer = Array.isArray(conversation.customers) ? conversation.customers[0] : conversation.customers;
  const channel = Array.isArray(conversation.whatsapp_channels) ? conversation.whatsapp_channels[0] : conversation.whatsapp_channels;
  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  let latestMessage: any = messages[0];
  let latestOutboundAt: string | null = null;
  let unreadCount = 0;

  for (const message of messages) {
    if (!latestMessage || new Date(message.created_at).getTime() > new Date(latestMessage.created_at).getTime()) latestMessage = message;
    if (message.direction === "outbound" && (!latestOutboundAt || new Date(message.created_at).getTime() > new Date(latestOutboundAt).getTime())) latestOutboundAt = message.created_at;
    if (message.direction === "inbound" && (!conversation.inbox_read_at || new Date(message.created_at).getTime() > new Date(conversation.inbox_read_at).getTime())) unreadCount += 1;
  }

  return {
    id: conversation.id,
    customerId: conversation.customer_id,
    customerName: customer?.name ?? "Unknown customer",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    tags: Array.isArray(customer?.tags) ? customer.tags : [],
    notes: customer?.notes ?? "",
    lastMessage: latestMessage?.content ?? "",
    status: conversation.status,
    updatedAt: conversation.updated_at,
    channel: channel ? { id: channel.id, name: channel.name, phoneNumberId: channel.phone_number_id } : null,
    unreadCount,
    inboxReadAt: conversation.inbox_read_at,
    latestOutboundAt,
  };
}

export async function getConversations(businessId: string, page = 1, limit = 5, search = "", status = "") {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;
  const term = search.trim().replace(/[%_,.()\\]/g, "");
  const safeStatus = status.trim();
  let customerIds: string[] | null = null;

  if (term) {
    const { data: matchingCustomers, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", businessId)
      .or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
    if (customerError) throw new Error(`Failed to search customers: ${customerError.message}`);
    customerIds = (matchingCustomers ?? []).map(customer => customer.id);
    if (customerIds.length === 0) return { conversations: [], pagination: { page: safePage, limit: safeLimit, total: 0, totalPages: 0 } };
  }

  let query = supabase.from("conversations").select(conversationSelect, { count: "exact" }).eq("business_id", businessId);
  if (customerIds) query = query.in("customer_id", customerIds);
  if (safeStatus) query = query.eq("status", safeStatus);
  const { data, error, count } = await query.order("updated_at", { ascending: false }).range(from, to);
  if (error) throw new Error(`Failed to load conversations: ${error.message}`);

  return {
    conversations: (data ?? []).map(mapConversation),
    pagination: { page: safePage, limit: safeLimit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / safeLimit) },
  };
}

export async function updateConversationStatus(conversationId: string, businessId: string, status: "open" | "closed" | "human-handoff") {
  const { data, error } = await supabase.from("conversations").update({ status, updated_at: new Date().toISOString() }).eq("id", conversationId).eq("business_id", businessId).select("id,status,updated_at").maybeSingle();
  if (error) throw new Error(`Failed to update conversation status: ${error.message}`);
  return data;
}

export async function markConversationRead(conversationId: string, businessId: string) {
  const { data, error } = await supabase.from("conversations").update({ inbox_read_at: new Date().toISOString() }).eq("id", conversationId).eq("business_id", businessId).select("id,inbox_read_at").maybeSingle();
  if (error) throw new Error(`Failed to mark conversation read: ${error.message}`);
  return data;
}
