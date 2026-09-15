import { supabase } from "../lib/supabase.js";

export interface Service {
  id: string;
  business_id: string;
  name: string;
  category: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceInput {
  businessId: string;
  name: string;
  category: string;
  description?: string;
  active?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  category?: string;
  description?: string | null;
  active?: boolean;
}

export async function getServices(
  businessId: string
): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getServiceById(
  id: string,
  businessId: string
): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createService(
  input: CreateServiceInput
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .insert({
      business_id: input.businessId,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      active: input.active ?? true
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateService(
  id: string,
  businessId: string,
  input: UpdateServiceInput
): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("business_id", businessId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteService(
  id: string,
  businessId: string
): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("business_id", businessId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}