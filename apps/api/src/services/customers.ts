import { supabase } from "../lib/supabase.js";

export async function getCustomers(businessId: string, page = 1, limit = 5, search = "") {
  const safePage = Math.max(1, Math.floor(page)); const safeLimit = Math.min(50, Math.max(1, Math.floor(limit))); const from = (safePage - 1) * safeLimit; const to = from + safeLimit - 1;
  const term = search.trim().replace(/[%_,.()\\]/g, "");
  let query = supabase.from("customers").select(`id,name,phone,email,tags,notes,created_at,updated_at,conversations (id,status,updated_at),leads (id,status,service_category,created_at)`, { count: "exact" }).eq("business_id", businessId);
  if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw new Error(`Failed to load customers: ${error.message}`);
  const customers = (data ?? []).map((customer) => {
    const conversations = Array.isArray(customer.conversations) ? customer.conversations : []; const leads = Array.isArray(customer.leads) ? customer.leads : [];
    const latestConversation = conversations.reduce<string | null>((latest, conversation) => !latest || new Date(conversation.updated_at).getTime() > new Date(latest).getTime() ? conversation.updated_at : latest, null);
    return { id: customer.id, name: customer.name ?? "Unnamed customer", phone: customer.phone, email: customer.email ?? "", tags: Array.isArray(customer.tags) ? customer.tags : [], notes: customer.notes ?? "", conversationCount: conversations.length, leadCount: leads.length, latestConversation, createdAt: customer.created_at, updatedAt: customer.updated_at };
  });
  return { customers, pagination: { page: safePage, limit: safeLimit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / safeLimit) } };
}

export async function getCustomerById(id: string, businessId: string) {
  const { data, error } = await supabase.from("customers").select(`id,name,phone,email,tags,notes,created_at,updated_at,conversations (id,status,updated_at),leads (id,status,service_category,created_at)`).eq("id", id).eq("business_id", businessId).maybeSingle();
  if (error) throw new Error(`Failed to load customer: ${error.message}`); if (!data) return null;
  return { id: data.id, name: data.name ?? "Unnamed customer", phone: data.phone, email: data.email ?? "", tags: Array.isArray(data.tags) ? data.tags : [], notes: data.notes ?? "", created_at: data.created_at, updated_at: data.updated_at, conversations: Array.isArray(data.conversations) ? data.conversations : [], leads: Array.isArray(data.leads) ? data.leads : [] };
}

export async function updateCustomer(id: string, businessId: string, input: { name?: string; phone?: string; email?: string; tags?: string[]; notes?: string }) {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.phone !== undefined) updates.phone = input.phone.trim();
  if (input.email !== undefined) updates.email = input.email.trim();
  if (input.tags !== undefined) updates.tags = [...new Set(input.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
  if (input.notes !== undefined) updates.notes = input.notes.trim().slice(0, 5000);
  if (Object.keys(updates).length === 0) throw new Error("No customer fields supplied.");
  if (updates.name === "") throw new Error("Customer name is required.");
  if (updates.phone === "") throw new Error("Customer phone is required.");

  const { data, error } = await supabase.from("customers").update(updates).eq("id", id).eq("business_id", businessId).select(`id,name,phone,email,tags,notes,created_at,updated_at`).maybeSingle();
  if (error) throw new Error(`Failed to update customer: ${error.message}`);
  if (!data) return null;
  return { id: data.id, name: data.name ?? "Unnamed customer", phone: data.phone, email: data.email ?? "", tags: Array.isArray(data.tags) ? data.tags : [], notes: data.notes ?? "", created_at: data.created_at, updated_at: data.updated_at };
}
