import { supabase } from "../lib/supabase.js";

export async function getServices() {
  const { data, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      category,
      description,
      active,
      created_at,
      updated_at
    `)
    .order("created_at", {
      ascending: true
    });

  if (error) {
    throw new Error(
      `Failed to load services: ${error.message}`
    );
  }

  return data;
}

export async function getServiceById(id: string) {
  const { data, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      category,
      description,
      active,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(
      `Failed to load service: ${error.message}`
    );
  }

  return data;
}

type CreateServiceInput = {
  businessId: string;
  name: string;
  category: string;
  description?: string;
  active?: boolean;
};

export async function createService(
  input: CreateServiceInput
) {
  const {
    businessId,
    name,
    category,
    description = "",
    active = true
  } = input;

  const { data, error } = await supabase
    .from("services")
    .insert({
      business_id: businessId,
      name,
      category,
      description,
      active
    })
    .select(`
      id,
      business_id,
      name,
      category,
      description,
      active,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(
      `Failed to create service: ${error.message}`
    );
  }

  return data;
}

type UpdateServiceInput = {
  name?: string;
  category?: string;
  description?: string;
  active?: boolean;
};

export async function updateService(
  id: string,
  input: UpdateServiceInput
) {
  const updates: UpdateServiceInput = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.category !== undefined) {
    updates.category = input.category;
  }

  if (input.description !== undefined) {
    updates.description = input.description;
  }

  if (input.active !== undefined) {
    updates.active = input.active;
  }

  const { data, error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id)
    .select(`
      id,
      name,
      category,
      description,
      active,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(
      `Failed to update service: ${error.message}`
    );
  }

  return data;
}

export async function deleteService(id: string) {
  const { data, error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(
      `Failed to delete service: ${error.message}`
    );
  }

  return data;
}