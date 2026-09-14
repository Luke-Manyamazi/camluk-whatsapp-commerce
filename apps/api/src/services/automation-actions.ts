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

export async function executeAutomationAction(
  match: AutomationMatchResult,
  context: AutomationActionContext,
): Promise<AutomationActionResult> {
  if (!match.matched || !match.rule || !match.actionType) {
    return {
      success: false,
      actionType: null,
      result: {
        message: "No automation rule matched.",
      },
    };
  }

  switch (match.actionType) {
    case "create_lead":
      return executeCreateLead(match, context);

    case "send_reply":
      return {
        success: true,
        actionType: "send_reply",
        result: {
          responseText: match.responseText,
        },
      };

    case "human_handoff":
      return executeHumanHandoff(match, context);

    default:
      return {
        success: false,
        actionType: match.actionType,
        result: {
          message: `Action "${match.actionType}" is not implemented yet.`,
        },
      };
  }
}

async function executeCreateLead(
  match: AutomationMatchResult,
  context: AutomationActionContext,
): Promise<AutomationActionResult> {
  if (!context.customerId) {
    return {
      success: false,
      actionType: "create_lead",
      result: {
        message: "A customerId is required to create a lead.",
      },
    };
  }

  const serviceCategory =
    typeof match.actionConfig.serviceCategory === "string"
      ? match.actionConfig.serviceCategory
      : "general";

  const leadStatus =
    typeof match.actionConfig.status === "string"
      ? match.actionConfig.status
      : "new";

  const ruleName = match.rule?.name ?? "automation rule";

  const notes =
    typeof match.actionConfig.notes === "string"
      ? match.actionConfig.notes
      : `Created automatically by rule "${ruleName}" from message: ${context.inputText}`;

  const { data: existingLead, error: existingLeadError } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", context.businessId)
    .eq("customer_id", context.customerId)
    .eq("service_category", serviceCategory)
    .in("status", ["new", "qualified", "contacted"])
    .limit(1)
    .maybeSingle();

  if (existingLeadError) {
    throw existingLeadError;
  }

  if (existingLead) {
    return {
      success: true,
      actionType: "create_lead",
      result: {
        created: false,
        existing: true,
        lead: existingLead,
      },
    };
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      business_id: context.businessId,
      customer_id: context.customerId,
      service_category: serviceCategory,
      status: leadStatus,
      notes,
    })
    .select("*")
    .single();

  if (leadError) {
    throw leadError;
  }

  return {
    success: true,
    actionType: "create_lead",
    result: {
      created: true,
      existing: false,
      lead,
    },
  };
}

async function executeHumanHandoff(
  match: AutomationMatchResult,
  context: AutomationActionContext,
): Promise<AutomationActionResult> {
  if (!context.conversationId) {
    return {
      success: false,
      actionType: "human_handoff",
      result: {
        message: "A conversationId is required for human handoff.",
      },
    };
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .update({
      status: "human-handoff",
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.conversationId)
    .eq("business_id", context.businessId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!conversation) {
    return {
      success: false,
      actionType: "human_handoff",
      result: {
        message: "Conversation was not found for this business.",
      },
    };
  }

  return {
    success: true,
    actionType: "human_handoff",
    result: {
      conversation,
    },
  };
}
