const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getServices() {
  const response = await fetch(`${API_URL}/api/services`);

  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }

  return response.json();
}