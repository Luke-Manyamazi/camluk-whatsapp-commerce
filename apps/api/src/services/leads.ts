import { supabase } from "../lib/supabase.js";

export async function getLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      service_category,
      status,
      notes,
      created_at,
      updated_at,
      customers (
        id,
        name,
        phone,
        email
      )
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    throw new Error(
      `Failed to load leads: ${error.message}`
    );
  }

  return data.map((lead) => {
    const customer = Array.isArray(lead.customers)
      ? lead.customers[0]
      : lead.customers;

    return {
      id: lead.id,
      customerId: customer?.id ?? "",
      customerName: customer?.name ?? "Unknown customer",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      serviceCategory: lead.service_category,
      status: lead.status,
      notes: lead.notes ?? "",
      createdAt: lead.created_at,
      updatedAt: lead.updated_at
    };
  });
}

export async function getLeadById(id: string) {
  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      service_category,
      status,
      notes,
      created_at,
      updated_at,
      customers (
        id,
        name,
        phone,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(
      `Failed to load lead: ${error.message}`
    );
  }

  const customer = Array.isArray(data.customers)
    ? data.customers[0]
    : data.customers;

  return {
    id: data.id,
    customerId: customer?.id ?? "",
    customerName: customer?.name ?? "Unknown customer",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    serviceCategory: data.service_category,
    status: data.status,
    notes: data.notes ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function createLead(
  businessId: string,
  customerId: string,
  serviceCategory?: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      business_id: businessId,
      customer_id: customerId,
      service_category: serviceCategory ?? null,
      status: "new",
      notes: notes ?? null
    })
    .select(`
      id,
      service_category,
      status,
      notes,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(
      `Failed to create lead: ${error.message}`
    );
  }

  return {
    id: data.id,
    serviceCategory: data.service_category,
    status: data.status,
    notes: data.notes ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateLead(
  id: string,
  updates: {
    status?: string;
    serviceCategory?: string;
    notes?: string;
  }
) {
  const updateData: Record<string, string | null> = {};

  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  if (updates.serviceCategory !== undefined) {
    updateData.service_category =
      updates.serviceCategory || null;
  }

  if (updates.notes !== undefined) {
    updateData.notes = updates.notes || null;
  }

  const { data, error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", id)
    .select(`
      id,
      service_category,
      status,
      notes,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(
      `Failed to update lead: ${error.message}`
    );
  }

  return {
    id: data.id,
    serviceCategory: data.service_category,
    status: data.status,
    notes: data.notes ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}