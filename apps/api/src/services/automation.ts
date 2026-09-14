import { supabase } from "../lib/supabase.js";

export type AutomationMatchType =
  | "any"
  | "all"
  | "exact"
  | "contains";

export type AutomationActionType =
  | "send_reply"
  | "create_lead"
  | "update_lead"
  | "change_status"
  | "add_tag"
  | "human_handoff";

export interface AutomationRule {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  priority: number;
  match_type: AutomationMatchType;
  keywords: string[];
  response_text: string | null;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateAutomationRuleInput {
  businessId: string;
  name: string;
  description?: string | null;
  enabled?: boolean;
  priority?: number;
  matchType?: AutomationMatchType;
  keywords: string[];
  responseText?: string | null;
  actionType?: AutomationActionType;
  actionConfig?: Record<string, unknown>;
}

export interface UpdateAutomationRuleInput {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  priority?: number;
  matchType?: AutomationMatchType;
  keywords?: string[];
  responseText?: string | null;
  actionType?: AutomationActionType;
  actionConfig?: Record<string, unknown>;
}

export async function getAutomationRules(
  businessId: string
): Promise<AutomationRule[]> {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("business_id", businessId)
    .order("priority", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getAutomationRuleById(
  id: string,
  businessId: string
): Promise<AutomationRule | null> {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createAutomationRule(
  input: CreateAutomationRuleInput
): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from("automation_rules")
    .insert({
      business_id: input.businessId,
      name: input.name,
      description: input.description ?? null,
      enabled: input.enabled ?? true,
      priority: input.priority ?? 0,
      match_type: input.matchType ?? "any",
      keywords: input.keywords,
      response_text: input.responseText ?? null,
      action_type: input.actionType ?? "send_reply",
      action_config: input.actionConfig ?? {}
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAutomationRule(
  id: string,
  businessId: string,
  input: UpdateAutomationRuleInput
): Promise<AutomationRule | null> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  if (input.enabled !== undefined) {
    updateData.enabled = input.enabled;
  }

  if (input.priority !== undefined) {
    updateData.priority = input.priority;
  }

  if (input.matchType !== undefined) {
    updateData.match_type = input.matchType;
  }

  if (input.keywords !== undefined) {
    updateData.keywords = input.keywords;
  }

  if (input.responseText !== undefined) {
    updateData.response_text = input.responseText;
  }

  if (input.actionType !== undefined) {
    updateData.action_type = input.actionType;
  }

  if (input.actionConfig !== undefined) {
    updateData.action_config = input.actionConfig;
  }

  const { data, error } = await supabase
    .from("automation_rules")
    .update(updateData)
    .eq("id", id)
    .eq("business_id", businessId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAutomationRule(
  id: string,
  businessId: string
): Promise<AutomationRule | null> {
  const { data, error } = await supabase
    .from("automation_rules")
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