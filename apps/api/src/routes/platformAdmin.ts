import { Router } from "express";
import { requirePlatformAuth, requirePlatformManager, type PlatformAuthenticatedRequest } from "../middleware/platformAuth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(requirePlatformAuth);

router.get("/me", (req: PlatformAuthenticatedRequest, res) => {
  res.json({ platformUser: req.platformAuth });
});

router.get("/businesses", async (_req, res) => {
  const { data, error } = await supabase.from("businesses").select("id, name, slug, created_at").order("created_at", { ascending: false });
  if (error) {
    console.error("Platform business listing failed:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to load businesses." });
    return;
  }
  res.json({ businesses: data ?? [] });
});

router.get("/businesses/:businessId", async (req, res) => {
  const businessId = String(req.params.businessId);
  const { data: business, error: businessError } = await supabase.from("businesses").select("id, name, slug, created_at").eq("id", businessId).maybeSingle();
  if (businessError) {
    console.error("Platform business lookup failed:", businessError);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to load the business." });
    return;
  }
  if (!business) {
    res.status(404).json({ error: "Not Found", message: "Business not found." });
    return;
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("business_memberships")
    .select("id, user_id, role, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (membershipError) {
    console.error("Platform membership lookup failed:", membershipError);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to load business users." });
    return;
  }

  res.json({ business, memberships: memberships ?? [] });
});

router.post("/businesses", requirePlatformManager, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const slug = typeof req.body?.slug === "string" ? req.body.slug.trim().toLowerCase() : "";
  if (!name || !slug) {
    res.status(400).json({ error: "Bad Request", message: "Business name and slug are required." });
    return;
  }

  const { data, error } = await supabase.from("businesses").insert({ name, slug }).select("id, name, slug, created_at").single();
  if (error) {
    console.error("Business creation failed:", error);
    res.status(400).json({ error: "Bad Request", message: error.code === "23505" ? "A business with this slug already exists." : "Unable to create the business." });
    return;
  }

  await supabase.from("platform_audit_logs").insert({
    platform_user_id: req.platformAuth?.platformUserId,
    action: "business.created",
    business_id: data.id,
    metadata: { name, slug },
  });

  res.status(201).json({ business: data });
});

router.get("/audit", async (_req, res) => {
  const { data, error } = await supabase
    .from("platform_audit_logs")
    .select("id, platform_user_id, action, business_id, target_user_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("Platform audit lookup failed:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to load platform activity." });
    return;
  }
  res.json({ auditLogs: data ?? [] });
});

export default router;
