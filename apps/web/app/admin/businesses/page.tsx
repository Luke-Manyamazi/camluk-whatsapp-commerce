"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Business { id: string; name: string; slug: string; created_at: string; }

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { void apiFetch<{ businesses: Business[] }>("/api/admin/businesses").then((r) => setBusinesses(r.businesses ?? [])).catch((e: Error) => setError(e.message)); }, []);
  const filtered = useMemo(() => businesses.filter((b) => `${b.name} ${b.slug}`.toLowerCase().includes(query.toLowerCase())), [businesses, query]);

  return <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8 md:p-10"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/admin" className="text-xs text-slate-500 hover:text-white">← Admin Dashboard</Link><h1 className="mt-3 text-3xl font-bold">Businesses</h1><p className="mt-1 text-sm text-slate-400">Manage every business on the Camluk platform.</p></div><Link href="/admin/businesses/new" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200">+ New business</Link></div><div className="mt-8"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search businesses..." className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" /></div>{error && <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}<div className="mt-6 grid gap-3">{filtered.map((business) => <Link key={business.id} href={`/admin/businesses/${business.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700"><div><h2 className="font-semibold">{business.name}</h2><p className="mt-1 text-xs text-slate-500">{business.slug}</p></div><div className="text-right"><span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">Active</span><p className="mt-2 text-xs text-slate-600">Created {new Date(business.created_at).toLocaleDateString()}</p></div></Link>)}{filtered.length === 0 && <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-400">No businesses match your search.</div>}</div></div></main>;
}
