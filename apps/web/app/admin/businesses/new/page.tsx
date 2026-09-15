"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function NewBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try { const result = await apiFetch<{ business: { id: string } }>("/api/admin/businesses", { method: "POST", body: JSON.stringify({ name, slug }) }); router.push(`/admin/businesses/${result.business.id}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to create the business."); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8 md:p-10"><div className="mx-auto max-w-2xl"><Link href="/admin/businesses" className="text-xs text-slate-500 hover:text-white">← Businesses</Link><h1 className="mt-4 text-3xl font-bold">Onboard a business</h1><p className="mt-1 text-sm text-slate-400">Create the customer tenant first. Owner credentials can then be provisioned through the onboarding workflow.</p><form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"><div><label className="mb-2 block text-sm text-slate-300">Business name</label><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="ABC Butchery" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-500" /></div><div><label className="mb-2 block text-sm text-slate-300">Business slug</label><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} required placeholder="abc-butchery" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-500" /></div>{error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}<button disabled={loading} className="w-full rounded-lg bg-white px-4 py-3 font-medium text-slate-950 disabled:opacity-50">{loading ? "Creating..." : "Create business"}</button></form></div></main>;
}
