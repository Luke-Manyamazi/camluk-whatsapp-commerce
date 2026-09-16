import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requirePlatformAdmin, type PlatformAdminRequest } from "../middleware/platform-admin.js";
import { createAutomationRule, deleteAutomationRule, getAutomationRules, updateAutomationRule } from "../services/automation.js";
import { createWhatsAppChannel, listWhatsAppChannelsForBusiness, updateWhatsAppChannel } from "../services/whatsapp-channels.js";

const router = Router();
router.use(requirePlatformAdmin);

router.get("/me", (req: PlatformAdminRequest, res) => {
  res.json({ userId: req.platformUserId, role: req.platformRole });
});

async function businessStats(businessId: string) {
  const [memberships, customers, leads, conversations, services, channels] = await Promise.all([
    supabase.from("business_memberships").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("whatsapp_channels").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true),
  ]);
  return { members: memberships.count ?? 0, customers: customers.count ?? 0, leads: leads.count ?? 0, conversations: conversations.count ?? 0, services: services.count ?? 0, whatsappChannels: channels.count ?? 0 };
}

router.get("/businesses", async (_req, res) => {
  try {
    const { data: businesses, error } = await supabase.from("businesses").select("id, name, slug, status, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    const enriched = await Promise.all((businesses ?? []).map(async (business) => ({ ...business, ...(await businessStats(business.id)) })));
    res.json({ businesses: enriched });
  } catch (error) {
    console.error("Platform businesses request failed:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to load businesses." });
  }
});

router.get("/businesses/:id", async (req, res) => {
  try {
    const { data: business, error } = await supabase.from("businesses").select("id, name, slug, status, created_at").eq("id", String(req.params.id)).maybeSingle();
    if (error) throw error;
    if (!business) return res.status(404).json({ message: "Business not found." });
    const { data: memberships, error: memberError } = await supabase.from("business_memberships").select("id, user_id, role, created_at").eq("business_id", business.id).order("created_at", { ascending: true });
    if (memberError) throw memberError;
    const members = await Promise.all((memberships ?? []).map(async (member) => {
      const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
      return { ...member, email: userData.user?.email ?? null };
    }));
    res.json({ business: { ...business, ...(await businessStats(business.id)), members } });
  } catch (error) {
    console.error("Platform business lookup failed:", error);
    res.status(500).json({ message: "Unable to load business." });
  }
});

router.post("/businesses", async (req, res) => {
  try {
    const { name, slug, ownerEmail, ownerPassword, ownerName } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Business name is required." });
    if (typeof slug !== "string" || !slug.trim()) return res.status(400).json({ message: "Business slug is required." });
    if (typeof ownerEmail !== "string" || !ownerEmail.trim()) return res.status(400).json({ message: "Owner email is required." });
    if (ownerPassword !== undefined && (typeof ownerPassword !== "string" || ownerPassword.length < 8)) return res.status(400).json({ message: "Owner password must be at least 8 characters." });
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    const cleanEmail = ownerEmail.trim().toLowerCase();
    if (!cleanSlug) return res.status(400).json({ message: "A valid slug is required." });
    const { data: existingBusiness } = await supabase.from("businesses").select("id").eq("slug", cleanSlug).maybeSingle();
    if (existingBusiness) return res.status(409).json({ message: "A business with this slug already exists." });
    let ownerUserId: string;
    const { data: existingUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = existingUsers.users.find((user) => user.email?.toLowerCase() === cleanEmail);
    if (existingUser) ownerUserId = existingUser.id;
    else {
      if (typeof ownerPassword !== "string") return res.status(400).json({ message: "A password is required when creating a new owner account." });
      const { data: createdUser, error: userError } = await supabase.auth.admin.createUser({ email: cleanEmail, password: ownerPassword, email_confirm: true, user_metadata: { display_name: typeof ownerName === "string" ? ownerName.trim() : cleanEmail } });
      if (userError || !createdUser.user) return res.status(400).json({ message: userError?.message ?? "Unable to create owner account." });
      ownerUserId = createdUser.user.id;
    }
    const { data: business, error: businessError } = await supabase.from("businesses").insert({ name: name.trim(), slug: cleanSlug, status: "active" }).select("id, name, slug, status, created_at").single();
    if (businessError || !business) return res.status(400).json({ message: businessError?.message ?? "Unable to create business." });
    const { error: membershipError } = await supabase.from("business_memberships").insert({ business_id: business.id, user_id: ownerUserId, role: "owner" });
    if (membershipError) {
      await supabase.from("businesses").delete().eq("id", business.id);
      if (!existingUser) await supabase.auth.admin.deleteUser(ownerUserId);
      return res.status(400).json({ message: membershipError.message });
    }
    res.status(201).json({ business, owner: { userId: ownerUserId, email: cleanEmail, existingAccount: Boolean(existingUser) } });
  } catch (error) {
    console.error("Platform business creation failed:", error);
    res.status(500).json({ message: "Unable to create business." });
  }
});

router.patch("/businesses/:id", async (req, res) => {
  try {
    const { status } = req.body ?? {};
    if (!["active", "suspended", "archived"].includes(status)) return res.status(400).json({ message: "Invalid business status." });
    const { data, error } = await supabase.from("businesses").update({ status }).eq("id", String(req.params.id)).select("id, name, slug, status, created_at").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Business not found." });
    res.json({ business: data });
  } catch (error) {
    console.error("Platform business update failed:", error);
    res.status(500).json({ message: "Unable to update business." });
  }
});

router.get("/businesses/:id/automation", async (req, res) => {
  try {
    res.json({ rules: await getAutomationRules(String(req.params.id)) });
  } catch (error) {
    console.error("Platform automation lookup failed:", error);
    res.status(500).json({ message: "Unable to load automation rules." });
  }
});

router.post("/businesses/:id/automation", async (req, res) => {
  try {
    const { name, description, enabled, priority, matchType, keywords, responseText, actionType, actionConfig } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Rule name is required." });
    if (!Array.isArray(keywords) || keywords.length === 0 || keywords.some((k: unknown) => typeof k !== "string" || !k.trim())) return res.status(400).json({ message: "Keywords must be a non-empty array of strings." });
    const rule = await createAutomationRule({ businessId: String(req.params.id), name: name.trim(), description: typeof description === "string" ? description.trim() : null, enabled: typeof enabled === "boolean" ? enabled : true, priority: typeof priority === "number" ? priority : 0, matchType, keywords: keywords.map((k: string) => k.trim()), responseText: typeof responseText === "string" ? responseText.trim() : null, actionType, actionConfig: actionConfig && typeof actionConfig === "object" ? actionConfig : {} });
    res.status(201).json({ rule });
  } catch (error) {
    console.error("Platform automation create failed:", error);
    res.status(500).json({ message: "Unable to create automation rule." });
  }
});

router.patch("/businesses/:id/automation/:ruleId", async (req, res) => {
  try {
    const { name, description, enabled, priority, matchType, keywords, responseText, actionType, actionConfig } = req.body ?? {};
    const rule = await updateAutomationRule(String(req.params.ruleId), String(req.params.id), { name: typeof name === "string" ? name.trim() : undefined, description: typeof description === "string" ? description.trim() : description, enabled, priority, matchType, keywords: Array.isArray(keywords) ? keywords.map((k: string) => k.trim()) : undefined, responseText: typeof responseText === "string" ? responseText.trim() : responseText, actionType, actionConfig });
    if (!rule) return res.status(404).json({ message: "Automation rule not found." });
    res.json({ rule });
  } catch (error) {
    console.error("Platform automation update failed:", error);
    res.status(500).json({ message: "Unable to update automation rule." });
  }
});

router.delete("/businesses/:id/automation/:ruleId", async (req, res) => {
  try {
    const rule = await deleteAutomationRule(String(req.params.ruleId), String(req.params.id));
    if (!rule) return res.status(404).json({ message: "Automation rule not found." });
    res.json({ rule });
  } catch (error) {
    console.error("Platform automation delete failed:", error);
    res.status(500).json({ message: "Unable to delete automation rule." });
  }
});

router.get("/businesses/:id/whatsapp", async (req, res) => {
  try {
    res.json({ channels: await listWhatsAppChannelsForBusiness(String(req.params.id)) });
  } catch (error) {
    console.error("Platform WhatsApp lookup failed:", error);
    res.status(500).json({ message: "Unable to load WhatsApp channels." });
  }
});

router.post("/businesses/:id/whatsapp", async (req, res) => {
  try {
    const { name, whatsappBusinessAccountId, phoneNumberId, accessToken, verifyToken, graphApiVersion } = req.body ?? {};
    if (![name, whatsappBusinessAccountId, phoneNumberId, accessToken, verifyToken].every((value) => typeof value === "string" && value.trim())) return res.status(400).json({ message: "Name, WhatsApp Business Account ID, phone number ID, access token and verify token are required." });
    const channel = await createWhatsAppChannel({ businessId: String(req.params.id), name, whatsappBusinessAccountId, phoneNumberId, accessToken, verifyToken, graphApiVersion });
    res.status(201).json({ channel });
  } catch (error) {
    console.error("Platform WhatsApp create failed:", error);
    res.status(400).json({ message: error instanceof Error ? error.message : "Unable to create WhatsApp channel." });
  }
});

router.patch("/businesses/:id/whatsapp/:channelId", async (req, res) => {
  try {
    const { name, whatsappBusinessAccountId, phoneNumberId, accessToken, verifyToken, graphApiVersion, active } = req.body ?? {};
    const channel = await updateWhatsAppChannel({ businessId: String(req.params.id), channelId: String(req.params.channelId), name, whatsappBusinessAccountId, phoneNumberId, accessToken, verifyToken, graphApiVersion, active });
    res.json({ channel });
  } catch (error) {
    console.error("Platform WhatsApp update failed:", error);
    res.status(400).json({ message: error instanceof Error ? error.message : "Unable to update WhatsApp channel." });
  }
});

export default router;
