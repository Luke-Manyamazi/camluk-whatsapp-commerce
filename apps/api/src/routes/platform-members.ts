import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requirePlatformAdmin } from "../middleware/platform-admin.js";

const router = Router();
router.use(requirePlatformAdmin);

router.post("/businesses/:id/members", async (req, res) => {
  try {
    const businessId = String(req.params.id);
    const { email, role } = req.body ?? {};
    if (typeof email !== "string" || !email.trim()) return res.status(400).json({ message: "Member email is required." });
    if (!["admin", "member"].includes(role)) return res.status(400).json({ message: "Member role must be admin or member." });
    const cleanEmail = email.trim().toLowerCase();
    const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.users.find((candidate) => candidate.email?.toLowerCase() === cleanEmail);
    if (!user) return res.status(404).json({ message: "No Camluk account exists for that email. Create the user account first." });
    const { data: existing } = await supabase.from("business_memberships").select("id").eq("business_id", businessId).eq("user_id", user.id).maybeSingle();
    if (existing) return res.status(409).json({ message: "That user is already a member of this business." });
    const { data, error } = await supabase.from("business_memberships").insert({ business_id: businessId, user_id: user.id, role }).select("id,user_id,role,created_at").single();
    if (error) throw error;
    res.status(201).json({ member: { ...data, email: user.email ?? null, name: user.user_metadata?.display_name ?? null } });
  } catch (error) {
    console.error("Platform member creation failed:", error);
    res.status(500).json({ message: "Unable to add member." });
  }
});

router.patch("/businesses/:id/members/:memberId", async (req, res) => {
  try {
    const businessId = String(req.params.id);
    const memberId = String(req.params.memberId);
    const { role } = req.body ?? {};
    if (!["admin", "member"].includes(role)) return res.status(400).json({ message: "Role must be admin or member. Owner changes require an ownership transfer workflow." });
    const { data: current } = await supabase.from("business_memberships").select("id,role").eq("id", memberId).eq("business_id", businessId).maybeSingle();
    if (!current) return res.status(404).json({ message: "Member not found." });
    if (current.role === "owner") return res.status(400).json({ message: "The owner cannot be changed here. Transfer ownership explicitly first." });
    const { error } = await supabase.from("business_memberships").update({ role }).eq("id", memberId).eq("business_id", businessId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Platform member update failed:", error);
    res.status(500).json({ message: "Unable to update member." });
  }
});

router.delete("/businesses/:id/members/:memberId", async (req, res) => {
  try {
    const businessId = String(req.params.id);
    const memberId = String(req.params.memberId);
    const { data: member } = await supabase.from("business_memberships").select("id,role").eq("id", memberId).eq("business_id", businessId).maybeSingle();
    if (!member) return res.status(404).json({ message: "Member not found." });
    if (member.role === "owner") return res.status(400).json({ message: "The owner cannot be removed." });
    const { error } = await supabase.from("business_memberships").delete().eq("id", memberId).eq("business_id", businessId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Platform member removal failed:", error);
    res.status(500).json({ message: "Unable to remove member." });
  }
});

export default router;
