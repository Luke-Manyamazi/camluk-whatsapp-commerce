"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://camluk-whatsapp-commerce-api.onrender.com").replace(/\/$/, "");

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.session) { setError(signInError?.message || "Unable to sign in."); setLoading(false); return; }

    const headers = { Authorization: `Bearer ${data.session.access_token}` };
    const adminResponse = await fetch(`${API_URL}/api/admin/me`, { headers });
    if (adminResponse.ok) { router.replace("/admin"); router.refresh(); return; }

    const businessResponse = await fetch(`${API_URL}/api/auth/test`, { headers });
    const result = await businessResponse.json().catch(() => ({}));
    if (!businessResponse.ok) { setError(result?.message || "Your account is not assigned to a business."); setLoading(false); return; }
    router.replace("/"); router.refresh();
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4"><div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"><div className="mb-8"><h1 className="text-2xl font-bold text-white">Camluk</h1><p className="mt-1 text-sm text-slate-400">WhatsApp Commerce</p></div><div className="mb-6"><h2 className="text-xl font-semibold text-white">Sign in</h2><p className="mt-1 text-sm text-slate-400">Sign in to access your Camluk workspace.</p></div><form onSubmit={handleLogin} className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">Email</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-500" placeholder="you@example.com" /></div><div><label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-500" placeholder="••••••••" /></div>{error && <div className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">{error}</div>}<button type="submit" disabled={loading} className="w-full rounded-lg bg-white px-4 py-3 font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button></form></div></main>;
}
