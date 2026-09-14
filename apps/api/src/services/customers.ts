import { supabase } from "../lib/supabase.js";

export async function getCustomers(
  businessId: string,
  page = 1,
  limit = 5,
  search = ""
) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;
  const term = search.trim();

  let query = supabase
    .from("customers")
    .select(`
      id,
      name,
      phone,
      email,
      created_at,
      updated_at,
      conversations (id, status, updated_at),
      leads (id, status, service_category, created_at)
    `, { count: "exact" })
    .eq("business_id", businessId);

  if (term) {
    const escaped = term.replace(/[%_,]/g, "").trim();
    if (escaped) {
      query = query.or(`name.ilike.%${escaped}%,phone.ilike.%${escaped}%,email.ilike.%${escaped}%`);
    }
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to load customers: ${error.message}`);
  }

  const customers = (data ?? []).map((customer) => {
    const conversations = Array.isArray(customer.conversations) ? customer.conversations : [];
    const leads = Array.isArray(customer.leads) ? customer.leads : [];
    const latestConversation = conversations.reduce<string | null>((latest, conversation) => {
      if (!latest || new Date(conversation.updated_at).getTime() > new Date(latest).getTime()) {
        return conversation.updated_at;
      }
      return latest;
    }, null);

    return {
      id: customer.id,
      name: customer.name ?? "Unnamed customer",
      phone: customer.phone,
      email: customer.email ?? "",
      conversationCount: conversations.length,
      leadCount: leads.length,
      latestConversation,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  });

  return {
    customers,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / safeLimit)
    }
  };
}

export async function getCustomerById(id: string, businessId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      phone,
      email,
      created_at,
      updated_at,
      conversations (id, status, updated_at),
      leads (id, status, service_category, created_at)
    `)
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load customer: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name ?? "Unnamed customer",
    phone: data.phone,
    email: data.email ?? "",
    created_at: data.created_at,
    updated_at: data.updated_at,
    conversations: Array.isArray(data.conversations) ? data.conversations : [],
    leads: Array.isArray(data.leads) ? data.leads : []
  };
}
