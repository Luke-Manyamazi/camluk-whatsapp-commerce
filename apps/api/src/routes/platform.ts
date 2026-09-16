import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requirePlatformAdmin, type PlatformAdminRequest } from "../middleware/platform-admin.js";

const router = Router();
router.use(requirePlatformAdmin);

router.get("/me", (req: PlatformAdminRequest, res) => {
  res.json({ userId: req.platformUserId, role: req.platformRole });
});

async function businessStats(businessId: string) {
  const [memberships, customers, leads, conversations, services] = await Promise.all([
    supabase.from("business_memberships").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("business_id", businessId),
  ]);
  return {
    members: memberships.count ?? 0,
    customers: customers.count ?? 0,
    leads: leads.count ?? 0,
    conversations: conversations.count ?? 0,
    services: services.count ?? 0,
  };
}

router.get("/businesses", async (_req, res) => {
  try {
    const { data: businesses, error } = await supabase
      .from("businesses")
      .select("id, name, slug, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const enriched = await Promise.all((businesses ?? []).map(async (business) => ({
      ...business,
      ...(await businessStats(business.id)),
    })));
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
    if (existingUser) {
      ownerUserId = existingUser.id;
    } else {
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

export default router;
