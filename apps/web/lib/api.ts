import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  console.log("apiFetch session:", {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token
  });

  if (!session?.access_token) {
    throw new Error("You are not authenticated.");
  }

  const headers = new Headers(options.headers);

  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );

  headers.set("Content-Type", "application/json");

  console.log("apiFetch request:", {
    url: `${API_URL}${path}`,
    hasAuthorization: headers.has("Authorization")
  });

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();

  console.log("apiFetch response:", {
    status: response.status,
    ok: response.ok,
    data
  });

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "API request failed."
    );
  }

  return data as T;
}