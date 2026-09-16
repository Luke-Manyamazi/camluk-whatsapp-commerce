import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requirePlatformAdmin, type PlatformAdminRequest } from "../middleware/platform-admin.js";

const router = Router();

router.use(requirePlatformAdmin);

router.get("/me", (req: PlatformAdminRequest, res) => {
  res.json({
    userId: req.platformUserId,
    role: req.platformRole,
  });
});

router.get("/businesses", async (_req, res) => {
  try {
    const { data: businesses, error } = await supabase
      .from("businesses")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Platform businesses lookup failed:", error);
      res.status(500).json({ error: "Internal Server Error", message: "Unable to load businesses." });
      return;
    }

    const rows = businesses ?? [];
    const enriched = await Promise.all(rows.map(async (business) => {
      const [memberships, customers, leads, conversations, services] = await Promise.all([
        supabase.from("business_memberships").select("id, role", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("business_id", business.id),
      ]);

      return {
        ...business,
        members: memberships.count ?? 0,
        customers: customers.count ?? 0,
        leads: leads.count ?? 0,
        conversations: conversations.count ?? 0,
        services: services.count ?? 0,
      };
    }));

    res.json({ businesses: enriched });
  } catch (error) {
    console.error("Platform businesses request failed:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to load businesses." });
  }
});

export default router;
