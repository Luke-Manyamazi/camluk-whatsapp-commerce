import { supabase } from "../lib/supabase.js";

export interface BusinessSettings {
  business_id: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  business_hours: Record<string, unknown>;
  automation_enabled: boolean;
  default_response: string | null;
  human_handoff_message: string | null;
  auto_create_leads: boolean;
  default_lead_status: string;
  ai_fallback_enabled: boolean;
  ai_provider: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateBusinessSettingsInput = Partial<Omit<BusinessSettings, "business_id" | "created_at" | "updated_at">>;

const defaultSettings = {
  automation_enabled: true,
  default_response:
    "Thanks for contacting Camluk Technologies. We have received your message and will get back to you shortly.",
  human_handoff_message:
    "Thanks. I’m connecting you with a member of the Camluk Technologies team.",
  auto_create_leads: true,
  default_lead_status: "new",
  ai_fallback_enabled: false,
  ai_provider: null,
  business_hours: {},
};

export async function getBusinessSettings(
  businessId: string,
): Promise<BusinessSettings> {
  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("business_settings")
    .insert({ business_id: businessId, ...defaultSettings })
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
}

export async function updateBusinessSettings(
  businessId: string,
  input: UpdateBusinessSettingsInput,
): Promise<BusinessSettings> {
  const current = await getBusinessSettings(businessId);

  const updateData = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("business_settings")
    .update(updateData)
    .eq("business_id", businessId)
    .select("*")
    .single();

  if (error) throw error;
  return data ?? current;
}
