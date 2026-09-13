import { supabase } from "../lib/supabase.js";

export async function getCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      phone,
      email,
      created_at,
      updated_at,
      conversations (
        id,
        status,
        updated_at
      ),
      leads (
        id,
        status,
        service_category,
        created_at
      )
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    throw new Error(
      `Failed to load customers: ${error.message}`
    );
  }

  return data.map((customer) => {
    const conversations = Array.isArray(
      customer.conversations
    )
      ? customer.conversations
      : [];

    const leads = Array.isArray(customer.leads)
      ? customer.leads
      : [];

    return {
      id: customer.id,
      name: customer.name ?? "Unnamed customer",
      phone: customer.phone,
      email: customer.email ?? "",
      conversationCount: conversations.length,
      leadCount: leads.length,
      latestConversation:
        conversations.length > 0
          ? conversations.sort(
              (a, b) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime()
            )[0]?.updated_at ?? null
          : null,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  });
}

export async function getCustomerById(id: string) {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      phone,
      email,
      created_at,
      updated_at,
      conversations (
        id,
        status,
        updated_at
      ),
      leads (
        id,
        status,
        service_category,
        created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(
      `Failed to load customer: ${error.message}`
    );
  }

  return {
    id: data.id,
    name: data.name ?? "Unnamed customer",
    phone: data.phone,
    email: data.email ?? "",
    created_at: data.created_at,
    updated_at: data.updated_at,
    conversations: Array.isArray(data.conversations)
      ? data.conversations
      : [],
    leads: Array.isArray(data.leads)
      ? data.leads
      : []
  };
}