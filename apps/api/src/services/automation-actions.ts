import { supabase } from "../lib/supabase.js";
import type { AutomationMatchResult } from "./automation-engine.js";

export interface AutomationActionContext {
  businessId: string;
  customerId?: string;
  conversationId?: string;
  messageId?: string;
  inputText: string;
}

export interface AutomationActionResult {
  success: boolean;
  actionType: string | null;
  result: Record<string, unknown>;
}

const leadStatuses = ["new", "qualified", "contacted", "converted", "lost"] as const;
const serviceCategories = ["general", "web-development", "business-software", "ai-automation", "cloud-deployment"] as const;

type ServiceCategory = (typeof serviceCategories)[number];

function inferServiceCategory(inputText: string): Exclude<ServiceCategory, "general"> | null {
  const text = inputText.toLowerCase();

  if (/\b(website|web site|websites|web design|web development|online store|ecommerce|e-commerce)\b/.test(text)) {
    return "web-development";
  }

  if (/\b(software|system|pos|point of sale|inventory|stock system|booking system|school management|business system)\b/.test(text)) {
    return "business-software";
  }

  if (/\b(ai|artificial intelligence|automation|automate|chatbot|workflow automation)\b/.test(text)) {
    return "ai-automation";
  }

  if (/\b(aws|cloud|deployment|deploy|hosting|server|cloudfront|s3)\b/.test(text)) {
    return "cloud-deployment";
  }

  return null;
}

function resolveServiceCategory(match: AutomationMatchResult, inputText: string): ServiceCategory {
  const configured = typeof match.actionConfig.serviceCategory === "string"
    ? match.actionConfig.serviceCategory.trim()
    : "";

  if (configured && configured !== "general" && serviceCategories.includes(configured as ServiceCategory)) {
    return configured as ServiceCategory;
  }

  return inferServiceCategory(inputText) ?? "general";
}

export async function executeAutomationAction(
  match: AutomationMatchResult,
  context: AutomationActionContext,
): Promise<AutomationActionResult> {
  if (!match.matched || !match.rule || !match.actionType) {
    return { success: false, actionType: null, result: { message: "No automation rule matched." } };
  }

  switch (match.actionType) {
    case "create_lead":
      return executeCreateLead(match, context);
    case "update_lead":
      return executeUpdateLead(match, context);
    case "send_reply":
      return executeSendReply(match, context);
    case "change_status":
      return executeChangeStatus(match, context);
    case "add_tag":
      return executeAddTag(match, context);
    case "human_handoff":
      return executeHumanHandoff(match, context);
    default:
      return { success: false, actionType: match.actionType, result: { message: `Action "${match.actionType}" is not implemented.` } };
  }
}

async function executeCreateLead(match: AutomationMatchResult, context: AutomationActionContext): Promise<AutomationActionResult> {
  if (!context.customerId) return { success: false, actionType: "create_lead", result: { message: "A customerId is required to create a lead." } };

  const serviceCategory = resolveServiceCategory(match, context.inputText);
  const configuredStatus = typeof match.actionConfig.status === "string" ? match.actionConfig.status : "new";
  const leadStatus = leadStatuses.includes(configuredStatus as (typeof leadStatuses)[number]) ? configuredStatus : "new";
  const ruleName = match.rule?.name ?? "automation rule";
  const notes = typeof match.actionConfig.notes === "string" ? match.actionConfig.notes : `Created automatically by rule "${ruleName}" from message: ${context.inputText}`;

  const { data: existingLead, error: existingLeadError } = await supabase
    .from("leads").select("*").eq("business_id", context.businessId).eq("customer_id", context.customerId)
    .in("status", ["new", "qualified", "contacted"]).order("updated_at", { ascending: false }).limit(20);
  if (existingLeadError) throw existingLeadError;

  const matchingLead = (existingLead ?? []).find((lead) => lead.service_category === serviceCategory);
  if (matchingLead) {
    return { success: true, actionType: "create_lead", result: { created: false, existing: true, lead: matchingLead } };
  }

  // If an earlier generic rule created a "general" lead for the same customer,
  // upgrade that lead instead of creating a duplicate lead for the same enquiry.
  const genericLead = (existingLead ?? []).find((lead) => lead.service_category === "general");
  if (genericLead && serviceCategory !== "general") {
    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update({ service_category: serviceCategory, status: leadStatus, notes, updated_at: new Date().toISOString() })
      .eq("id", genericLead.id)
      .eq("business_id", context.businessId)
      .select("*")
      .single();
    if (updateError) throw updateError;

    return { success: true, actionType: "create_lead", result: { created: false, existing: true, upgraded: true, lead: updatedLead } };
  }

  const { data: lead, error: leadError } = await supabase.from("leads").insert({
    business_id: context.businessId, customer_id: context.customerId, service_category: serviceCategory, status: leadStatus, notes,
  }).select("*").single();
  if (leadError) throw leadError;
  return { success: true, actionType: "create_lead", result: { created: true, existing: false, lead } };
}

async function executeUpdateLead(match: AutomationMatchResult, context: AutomationActionContext): Promise<AutomationActionResult> {
  if (!context.customerId) return { success: false, actionType: "update_lead", result: { message: "A customerId is required to update a lead." } };
  const updates: Record<string, unknown> = {};
  if (typeof match.actionConfig.status === "string" && leadStatuses.includes(match.actionConfig.status as (typeof leadStatuses)[number])) updates.status = match.actionConfig.status;
  if (typeof match.actionConfig.serviceCategory === "string" && match.actionConfig.serviceCategory.trim()) updates.service_category = match.actionConfig.serviceCategory.trim();
  if (typeof match.actionConfig.notes === "string") updates.notes = match.actionConfig.notes;
  if (Object.keys(updates).length === 0) return { success: false, actionType: "update_lead", result: { message: "No valid lead fields were supplied." } };

  const { data: lead, error } = await supabase.from("leads").update(updates).eq("business_id", context.businessId).eq("customer_id", context.customerId).in("status", ["new", "qualified", "contacted"]).order("updated_at", { ascending: false }).limit(1).select("*").maybeSingle();
  if (error) throw error;
  if (!lead) return { success: false, actionType: "update_lead", result: { message: "No active lead was found for this customer." } };
  return { success: true, actionType: "update_lead", result: { lead } };
}

async function executeSendReply(match: AutomationMatchResult, context: AutomationActionContext): Promise<AutomationActionResult> {
  if (!context.conversationId) return { success: false, actionType: "send_reply", result: { message: "A conversationId is required to send a reply." } };
  if (!match.responseText?.trim()) return { success: false, actionType: "send_reply", result: { message: "A responseText is required to send a reply." } };

  const { data: conversation, error: conversationError } = await supabase.from("conversations").select("id").eq("id", context.conversationId).eq("business_id", context.businessId).maybeSingle();
  if (conversationError) throw conversationError;
  if (!conversation) return { success: false, actionType: "send_reply", result: { message: "Conversation was not found for this business." } };

  const { data: message, error } = await supabase.from("messages").insert({ conversation_id: context.conversationId, direction: "outbound", content: match.responseText.trim() }).select("*").single();
  if (error) throw error;
  return { success: true, actionType: "send_reply", result: { message } };
}

async function executeChangeStatus(match: AutomationMatchResult, context: AutomationActionContext): Promise<AutomationActionResult> {
  if (!context.conversationId) return { success: false, actionType: "change_status", result: { message: "A conversationId is required to change status." } };
  const status = match.actionConfig.status;
  if (status !== "open" && status !== "closed" && status !== "human-handoff") return { success: false, actionType: "change_status", result: { message: "Invalid conversation status." } };
  const { data: conversation, error } = await supabase.from("conversations").update({ status, updated_at: new Date().toISOString() }).eq("id", context.conversationId).eq("business_id", context.businessId).select("*").maybeSingle();
  if (error) throw error;
  if (!conversation) return { success: false, actionType: "change_status", result: { message: "Conversation was not found for this business." } };
  return { success: true, actionType: "change_status", result: { conversation } };
}

async function executeAddTag(match: AutomationMatchResult, context: AutomationActionContext): Promise<AutomationActionResult> {
  if (!context.customerId) return { success: false, actionType: "add_tag", result: { message: "A customerId is required to add a tag." } };
  const tag = typeof match.actionConfig.tag === "string" ? match.actionConfig.tag.trim() : "";
  if (!tag) return { success: false, actionType: "add_tag", result: { message: "A tag is required." } };

  const { data: customer, error: fetchError } = await supabase.from("customers").select("id,tags").eq("id", context.customerId).eq("business_id", context.businessId).maybeSingle();
  if (fetchError) throw fetchError;
  if (!customer) return { success: false, actionType: "add_tag", result: { message: "Customer was not found for this business." } };

  const tags = Array.isArray(customer.tags) ? customer.tags : [];
  const nextTags = tags.includes(tag) ? tags : [...tags, tag];
  const { data: updatedCustomer, error } = await supabase.from("customers").update({ tags: nextTags, updated_at: new Date().toISOString() }).eq("id", context.customerId).eq("business_id", context.businessId).select("*").single();
  if (error) throw error;
  return { success: true, actionType: "add_tag", result: { customer: updatedCustomer, added: !tags.includes(tag) } };
}

async function executeHumanHandoff(match: AutomationMatchResult, context: AutomationActionContext): Promise<AutomationActionResult> {
  if (!context.conversationId) return { success: false, actionType: "human_handoff", result: { message: "A conversationId is required for human handoff." } };
  const { data: conversation, error } = await supabase.from("conversations").update({ status: "human-handoff", updated_at: new Date().toISOString() }).eq("id", context.conversationId).eq("business_id", context.businessId).select("*").maybeSingle();
  if (error) throw error;
  if (!conversation) return { success: false, actionType: "human_handoff", result: { message: "Conversation was not found for this business." } };
  return { success: true, actionType: "human_handoff", result: { conversation } };
}
