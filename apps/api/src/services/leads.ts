import { supabase } from "../lib/supabase.js";

const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost"] as const;

export async function getLeads(
  businessId: string,
  page = 1,
  limit = 5,
  status = "",
  service = ""
) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;
  const safeStatus = status.trim();
  const safeService = service.trim();

  let query = supabase
    .from("leads")
    .select(`id, service_category, status, notes, created_at, updated_at, customers (id, name, phone, email)`, { count: "exact" })
    .eq("business_id", businessId);

  if (safeStatus) query = query.eq("status", safeStatus);
  if (safeService) query = query.eq("service_category", safeService);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Failed to load leads: ${error.message}`);

  const leads = (data ?? []).map((lead) => {
    const customer = Array.isArray(lead.customers) ? lead.customers[0] : lead.customers;
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

  const statusCounts = await Promise.all(
    LEAD_STATUSES.map(async (leadStatus) => {
      const { count: statusCount, error: statusError } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("status", leadStatus);
      if (statusError) throw new Error(`Failed to load lead summary: ${statusError.message}`);
      return [leadStatus, statusCount ?? 0] as const;
    })
  );

  const summary = Object.fromEntries(statusCounts);

  return {
    leads,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / safeLimit)
    },
    summary: {
      total: LEAD_STATUSES.reduce((total, leadStatus) => total + (summary[leadStatus] ?? 0), 0),
      new: summary.new ?? 0,
      contacted: summary.contacted ?? 0,
      qualified: summary.qualified ?? 0,
      converted: summary.converted ?? 0,
      lost: summary.lost ?? 0
    }
  };
}

export async function getLeadById(id: string, businessId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select(`id, service_category, status, notes, created_at, updated_at, customers (id, name, phone, email)`)
    .eq("id", id).eq("business_id", businessId).maybeSingle();
  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  if (!data) return null;
  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
  return { id: data.id, customerId: customer?.id ?? "", customerName: customer?.name ?? "Unknown customer", phone: customer?.phone ?? "", email: customer?.email ?? "", serviceCategory: data.service_category, status: data.status, notes: data.notes ?? "", createdAt: data.created_at, updatedAt: data.updated_at };
}

export async function createLead(businessId: string, customerId: string, serviceCategory?: string, notes?: string) {
  const { data: customer, error: customerError } = await supabase.from("customers").select("id").eq("id", customerId).eq("business_id", businessId).maybeSingle();
  if (customerError) throw new Error(`Failed to validate customer: ${customerError.message}`);
  if (!customer) return null;
  const { data, error } = await supabase.from("leads").insert({ business_id: businessId, customer_id: customerId, service_category: serviceCategory ?? null, status: "new", notes: notes ?? null }).select(`id, service_category, status, notes, created_at, updated_at`).single();
  if (error) throw new Error(`Failed to create lead: ${error.message}`);
  return { id: data.id, serviceCategory: data.service_category, status: data.status, notes: data.notes ?? "", createdAt: data.created_at, updatedAt: data.updated_at };
}

export async function updateLead(id: string, businessId: string, updates: { status?: string; serviceCategory?: string; notes?: string }) {
  const updateData: Record<string, string | null> = {};
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.serviceCategory !== undefined) updateData.service_category = updates.serviceCategory || null;
  if (updates.notes !== undefined) updateData.notes = updates.notes || null;
  const { data, error } = await supabase.from("leads").update(updateData).eq("id", id).eq("business_id", businessId).select(`id, service_category, status, notes, created_at, updated_at`).maybeSingle();
  if (error) throw new Error(`Failed to update lead: ${error.message}`);
  if (!data) return null;
  return { id: data.id, serviceCategory: data.service_category, status: data.status, notes: data.notes ?? "", createdAt: data.created_at, updatedAt: data.updated_at };
}
