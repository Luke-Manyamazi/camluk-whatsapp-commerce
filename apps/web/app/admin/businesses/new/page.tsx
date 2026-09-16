"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function CreateBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleName(value: string) {
    setName(value);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const result = await apiFetch<{ business: { id: string } }>("/api/platform/businesses", {
        method: "POST",
        body: JSON.stringify({ name, slug, ownerEmail, ownerName, ownerPassword: ownerPassword || undefined }),
      });
      router.replace(`/admin/businesses/${result.business.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create business.");
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-slate-950 text-white"><header className="border-b border-slate-800 bg-slate-900/80 px-5 py-5 sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/admin" className="text-xs text-slate-400 hover:text-white">← Platform Control Centre</Link><p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Camluk Platform</p><h1 className="mt-1 text-2xl font-bold">Create Business</h1><p className="mt-1 text-sm text-slate-400">Create a tenant and its first owner in one protected workflow.</p></div></header><div className="mx-auto max-w-3xl p-5 sm:p-8"><form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"><section><h2 className="font-semibold">Business</h2><p className="mt-1 text-sm text-slate-400">This creates the isolated business workspace.</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm text-slate-300">Business name<input value={name} onChange={e => handleName(e.target.value)} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="Camluk Technologies" /></label><label className="text-sm text-slate-300">Slug<input value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} required pattern="[a-z0-9-]+" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="camluk-technologies" /></label></div></section><section className="border-t border-slate-800 pt-6"><h2 className="font-semibold">Business owner</h2><p className="mt-1 text-sm text-slate-400">An existing Supabase account will be reused; otherwise a new confirmed account is created.</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm text-slate-300">Owner name<input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="Business Owner" /></label><label className="text-sm text-slate-300">Owner email<input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="owner@example.com" /></label><label className="text-sm text-slate-300 sm:col-span-2">Password for a new owner account<input type="password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} minLength={8} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="Minimum 8 characters; leave blank for an existing account" /></label></div></section>{error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}<div className="flex flex-wrap justify-end gap-3"><Link href="/admin" className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">Cancel</Link><button disabled={loading} className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-slate-950 disabled:opacity-50">{loading ? "Creating..." : "Create Business"}</button></div></form></div></main>;
}
