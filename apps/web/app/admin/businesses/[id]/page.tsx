"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Member = { id: string; user_id: string; role: string; email: string | null; created_at: string };
type Business = { id: string; name: string; slug: string; status: string; created_at: string; member_count: number; customers: number; leads: number; conversations: number; services: number; members: Member[] };

export default function BusinessAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); setError(""); const result = await apiFetch<{ business: Business }>(`/api/platform/businesses/${id}`); setBusiness(result.business); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load business."); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function setStatus(status: string) {
    try { const result = await apiFetch<{ business: Business }>(`/api/platform/businesses/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setBusiness(current => current ? { ...current, ...result.business } : current); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update business."); }
  }

  if (loading) return <main className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading business...</main>;
  if (!business) return <main className="min-h-screen bg-slate-950 p-8 text-red-300">{error || "Business not found."}</main>;

  return <main className="min-h-screen bg-slate-950 text-white"><header className="border-b border-slate-800 bg-slate-900/80 px-5 py-5 sm:px-8"><div className="mx-auto max-w-6xl"><Link href="/admin" className="text-xs text-slate-400 hover:text-white">← Platform Control Centre</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Business</p><h1 className="mt-1 text-2xl font-bold">{business.name}</h1><p className="mt-1 text-sm text-slate-400">/{business.slug}</p></div><span className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{business.status}</span></div></div></header><div className="mx-auto max-w-6xl p-5 sm:p-8">{error && <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["Members",business.member_count],["Customers",business.customers],["Leads",business.leads],["Conversations",business.conversations],["Services",business.services]].map(([label,value]) => <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-2xl font-bold">{value}</p></div>)}</div><section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="font-semibold">Members</h2><div className="mt-5 space-y-3">{business.members.map(member => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950 p-4"><div><p className="text-sm font-medium">{member.email || member.user_id}</p><p className="mt-1 text-xs text-slate-500">{member.role}</p></div><span className="text-xs text-slate-600">{new Date(member.created_at).toLocaleDateString()}</span></div>)}</div></section><section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="font-semibold">Business lifecycle</h2><p className="mt-1 text-sm text-slate-400">Platform controls apply to the tenant; operational data remains inside the business workspace.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => void setStatus(business.status === "active" ? "suspended" : "active")} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">{business.status === "active" ? "Suspend business" : "Reactivate business"}</button>{business.status !== "archived" && <button onClick={() => void setStatus("archived")} className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40">Archive business</button>}</div></section></div></main>;
}
