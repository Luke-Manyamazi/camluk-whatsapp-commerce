import { Router } from "express";
import crypto from "node:crypto";
import { requirePlatformManager, type PlatformAuthenticatedRequest } from "../middleware/platformAuth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(requirePlatformManager);

function generateTemporaryPassword(): string {
  return `${crypto.randomBytes(12).toString("base64url")}Aa1!`;
}

function normalizeSlug(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
    : "";
}

router.post("/", async (req: PlatformAuthenticatedRequest, res) => {
  const businessName = typeof req.body?.businessName === "string" ? req.body.businessName.trim() : "";
  const slug = normalizeSlug(req.body?.slug);
  const ownerName = typeof req.body?.ownerName === "string" ? req.body.ownerName.trim() : "";
  const ownerEmail = typeof req.body?.ownerEmail === "string" ? req.body.ownerEmail.trim().toLowerCase() : "";

  if (!businessName || !slug || !ownerName || !ownerEmail) {
    res.status(400).json({
      error: "Bad Request",
      message: "Business name, slug, owner name and owner email are required.",
    });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    res.status(400).json({ error: "Bad Request", message: "A valid owner email is required." });
    return;
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({ name: businessName, slug })
    .select("id, name, slug, created_at")
    .single();

  if (businessError || !business) {
    console.error("Onboarding business creation failed:", businessError);
    res.status(400).json({
      error: "Bad Request",
      message: businessError?.code === "23505"
        ? "A business with this slug already exists."
        : "Unable to create the business.",
    });
    return;
  }

  const temporaryPassword = generateTemporaryPassword();
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: ownerEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { display_name: ownerName },
  });

  if (authError || !authUser.user) {
    await supabase.from("businesses").delete().eq("id", business.id);
    console.error("Onboarding owner creation failed:", authError);
    res.status(400).json({
      error: "Bad Request",
      message: "Unable to create the owner account. The business was not kept.",
    });
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: authUser.user.id, display_name: ownerName }, { onConflict: "id" });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.from("businesses").delete().eq("id", business.id);
    console.error("Onboarding profile creation failed:", profileError);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to finish owner onboarding." });
    return;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_memberships")
    .insert({ business_id: business.id, user_id: authUser.user.id, role: "owner" })
    .select("id, business_id, user_id, role, created_at")
    .single();

  if (membershipError || !membership) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.from("businesses").delete().eq("id", business.id);
    console.error("Onboarding membership creation failed:", membershipError);
    res.status(500).json({ error: "Internal Server Error", message: "Unable to finish owner onboarding." });
    return;
  }

  const { error: auditError } = await supabase.from("platform_audit_logs").insert({
    platform_user_id: req.platformAuth?.platformUserId,
    action: "business.owner_onboarded",
    business_id: business.id,
    target_user_id: authUser.user.id,
    metadata: {
      businessName,
      slug,
      ownerEmail,
      ownerName,
      membershipId: membership.id,
      credentialDelivery: "manual_one_time_display",
    },
  });

  if (auditError) {
    console.error("Owner onboarding audit failed:", auditError);
  }

  res.status(201).json({
    business,
    owner: {
      userId: authUser.user.id,
      name: ownerName,
      email: ownerEmail,
      role: "owner",
    },
    credentials: {
      email: ownerEmail,
      temporaryPassword,
      note: "This temporary password is returned only in this onboarding response. Give it to the business owner securely and ask them to change it after signing in.",
    },
  });
});

export default router;
