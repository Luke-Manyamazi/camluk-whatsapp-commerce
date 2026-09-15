"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Business { id: string; name: string; slug: string; created_at: string; }

export default function SupportPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void apiFetch<{ businesses: Business[] }>("/api/admin/businesses").then((r) => setBusinesses(r.businesses ?? [])).catch((e: Error) => setError(e.message)); }, []);
  const filtered = businesses.filter((b) => `${b.name} ${b.slug}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8 md:p-10"><div className="mx-auto max-w-5xl"><Link href="/admin" className="text-xs text-slate-500 hover:text-white">← Admin Dashboard</Link><h1 className="mt-4 text-3xl font-bold">Support Console</h1><p className="mt-1 text-sm text-slate-400">Find a business and open its support view. Cross-tenant actions remain protected by platform authorization.</p><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search businesses..." className="mt-8 w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-slate-600" />{error && <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}<div className="mt-6 space-y-3">{filtered.map((business) => <div key={business.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5"><div><p className="font-semibold">{business.name}</p><p className="mt-1 text-xs text-slate-500">{business.slug}</p></div><Link href={`/admin/businesses/${business.id}`} className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">Open support view</Link></div>)}</div></div></main>;
}
