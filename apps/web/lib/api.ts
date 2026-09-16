import { supabase } from "@/lib/supabase";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://camluk-whatsapp-commerce-api.onrender.com"
).replace(/\/$/, "");

const ACTIVE_BUSINESS_KEY = "camluk.activeBusinessId";

export function getActiveBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_BUSINESS_KEY);
}

export function setActiveBusinessId(businessId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
  window.dispatchEvent(new CustomEvent("camluk:business-changed", { detail: businessId }));
}

export function clearActiveBusinessId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
  window.dispatchEvent(new CustomEvent("camluk:business-changed", { detail: null }));
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You are not authenticated.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  const activeBusinessId = getActiveBusinessId();
  if (activeBusinessId) headers.set("X-Business-Id", activeBusinessId);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? data.message || data.error
        : undefined;

    throw new Error(message || `API request failed (${response.status}).`);
  }

  return data as T;
}
