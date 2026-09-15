import type { NextFunction, Response } from "express";
import { supabase } from "../lib/supabase.js";
import type { AuthenticatedRequest } from "./auth.js";

export type PlatformRole = "super_admin" | "admin" | "support";

export interface PlatformAuthContext {
  userId: string;
  platformUserId: string;
  role: PlatformRole;
}

export interface PlatformAuthenticatedRequest extends AuthenticatedRequest {
  platformAuth?: PlatformAuthContext;
}

function getBearerToken(req: PlatformAuthenticatedRequest): string | null {
  const authorization = req.header("Authorization");
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function requirePlatformAuth(
  req: PlatformAuthenticatedRequest,
  res: Response,
  next: NextFunction,
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

    const { data: platformUser, error } = await supabase
      .from("platform_users")
      .select("id, role, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Platform membership lookup failed:", error);
      res.status(500).json({ error: "Internal Server Error", message: "Unable to determine platform access." });
      return;
    }

    if (!platformUser || platformUser.status !== "active") {
      res.status(403).json({ error: "Forbidden", message: "The authenticated user is not a Camluk platform administrator." });
      return;
    }

    const role = platformUser.role as PlatformRole;
    if (!["super_admin", "admin", "support"].includes(role)) {
      res.status(403).json({ error: "Forbidden", message: "The platform role is invalid." });
      return;
    }

    req.platformAuth = { userId: user.id, platformUserId: platformUser.id, role };
    next();
  } catch (error) {
    console.error("Platform authentication failed:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Platform authentication could not be completed." });
  }
}

export function requirePlatformManager(
  req: PlatformAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (req.platformAuth?.role !== "super_admin" && req.platformAuth?.role !== "admin") {
    res.status(403).json({ error: "Forbidden", message: "Only platform administrators can perform this action." });
    return;
  }
  next();
}
