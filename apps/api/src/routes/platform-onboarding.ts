import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requirePlatformAdmin } from "../middleware/platform-admin.js";

const router = Router();
router.use(requirePlatformAdmin);

const defaultState = {
  business_details_completed: false,
  workspace_completed: false,
  services_completed: false,
  whatsapp_completed: false,
  automation_completed: false,
  verification_completed: false,
  completed_at: null as string | null,
};

async function ensureState(businessId: string) {
  const { data, error } = await supabase.from("business_onboarding").upsert({ business_id: businessId }, { onConflict: "business_id" }).select("*").single();
  if (error) throw error;
  return data;
}

async function readiness(businessId: string) {
  const [business, owner, services, channels, rules] = await Promise.all([
    supabase.from("businesses").select("id,name,slug,status").eq("id", businessId).maybeSingle(),
    supabase.from("business_memberships").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("role", "owner"),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("whatsapp_channels").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true),
    supabase.from("automation_rules").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("enabled", true),
  ]);
  if (business.error) throw business.error;
  if (!business.data) return null;
  return {
    business: business.data,
    checks: {
      business_details: business.data.status !== "archived",
      workspace: (owner.count ?? 0) > 0,
      services: (services.count ?? 0) > 0,
      whatsapp: (channels.count ?? 0) > 0,
      automation: (rules.count ?? 0) > 0,
    },
    counts: { services: services.count ?? 0, whatsappChannels: channels.count ?? 0, activeAutomationRules: rules.count ?? 0 },
  };
}

router.get("/:businessId", async (req, res) => {
  try {
    const businessId = String(req.params.businessId);
    const state = await ensureState(businessId);
    const readinessState = await readiness(businessId);
    if (!readinessState) return res.status(404).json({ message: "Business not found." });
    res.json({ onboarding: { ...defaultState, ...state }, readiness: readinessState });
  } catch (error) {
    console.error("Platform onboarding lookup failed:", error);
    res.status(500).json({ message: "Unable to load business onboarding." });
  }
});

router.patch("/:businessId", async (req, res) => {
  try {
    const businessId = String(req.params.businessId);
    const allowed = ["business_details_completed", "workspace_completed", "services_completed", "whatsapp_completed", "automation_completed", "verification_completed"] as const;
    const updates: Record<string, boolean | string> = {};
    for (const key of allowed) if (typeof req.body?.[key] === "boolean") updates[key] = req.body[key];
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No onboarding fields supplied." });
    const current = await ensureState(businessId);
    const merged = { ...current, ...updates };
    const ready = merged.business_details_completed && merged.workspace_completed && merged.services_completed && merged.whatsapp_completed && merged.automation_completed && merged.verification_completed;
    updates.completed_at = ready ? new Date().toISOString() : "";
    const payload = { ...updates, completed_at: ready ? new Date().toISOString() : null };
    const { data, error } = await supabase.from("business_onboarding").update(payload).eq("business_id", businessId).select("*").single();
    if (error) throw error;
    res.json({ onboarding: data });
  } catch (error) {
    console.error("Platform onboarding update failed:", error);
    res.status(500).json({ message: "Unable to update business onboarding." });
  }
});

export default router;
