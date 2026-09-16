import type { NextFunction, Response } from "express";
import { supabase } from "../lib/supabase.js";
import type { AuthenticatedRequest } from "./auth.js";

export interface PlatformAdminRequest extends AuthenticatedRequest {
  platformRole?: "super_admin" | "support_admin";
}

function getBearerToken(req: AuthenticatedRequest): string | null {
  const authorization = req.header("Authorization");
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function requirePlatformAdmin(
  req: PlatformAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized", message: "A valid Bearer access token is required." });
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      res.status(401).json({ error: "Unauthorized", message: "The access token is invalid or expired." });
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("platform_admins")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("Platform admin lookup failed:", adminError);
      res.status(500).json({ error: "Internal Server Error", message: "Unable to determine platform access." });
      return;
    }

    if (!admin) {
      res.status(403).json({ error: "Forbidden", message: "Platform administrator access is required." });
      return;
    }

    req.userId = user.id;
    req.platformRole = admin.role as "super_admin" | "support_admin";
    next();
  } catch (error) {
    console.error("Platform authentication failed:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Platform authentication could not be completed." });
  }
}
