import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: memberships, error } = await supabase
      .from("business_memberships")
      .select("business_id, role, created_at, businesses (id, name, slug, status)")
      .eq("user_id", req.auth!.userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load user businesses:", error);
      res.status(500).json({ error: "Internal Server Error", message: "Unable to load business memberships." });
      return;
    }

    const businesses = (memberships ?? [])
      .map((membership) => {
        const business = Array.isArray(membership.businesses) ? membership.businesses[0] : membership.businesses;
        if (!business) return null;
        return {
          id: business.id,
          name: business.name,
          slug: business.slug,
          status: business.status,
          role: membership.role,
          joinedAt: membership.created_at,
        };
      })
      .filter(Boolean);

    res.json({ businesses });
  } catch (error) {
    console.error("Failed to load user businesses:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to load business memberships." });
  }
});

export default router;
