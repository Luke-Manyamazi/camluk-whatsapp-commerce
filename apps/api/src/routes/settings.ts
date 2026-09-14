import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  getBusinessSettings,
  updateBusinessSettings,
  type UpdateBusinessSettingsInput,
} from "../services/settings.js";

const router = Router();

const allowedKeys = new Set<keyof UpdateBusinessSettingsInput>([
  "phone",
  "email",
  "address",
  "website",
  "business_hours",
  "automation_enabled",
  "default_response",
  "human_handoff_message",
  "auto_create_leads",
  "default_lead_status",
  "ai_fallback_enabled",
  "ai_provider",
]);

function isManager(req: AuthenticatedRequest): boolean {
  return req.auth?.role === "owner" || req.auth?.role === "admin";
}

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await getBusinessSettings(req.auth!.businessId);
    res.json({ settings });
  } catch (error) {
    console.error("Failed to load business settings:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load business settings.",
    });
  }
});

router.patch("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!isManager(req)) {
      res.status(403).json({
        error: "Forbidden",
        message: "Only business owners and admins can update settings.",
      });
      return;
    }

    const input: UpdateBusinessSettingsInput = {};

    for (const [key, value] of Object.entries(req.body ?? {})) {
      if (allowedKeys.has(key as keyof UpdateBusinessSettingsInput)) {
        (input as Record<string, unknown>)[key] = value;
      }
    }

    if (
      input.default_lead_status !== undefined &&
      !["new", "qualified", "contacted", "converted", "lost"].includes(input.default_lead_status)
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid default lead status.",
      });
      return;
    }

    const settings = await updateBusinessSettings(
      req.auth!.businessId,
      input,
    );

    res.json({ settings });
  } catch (error) {
    console.error("Failed to update business settings:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update business settings.",
    });
  }
});

export default router;
