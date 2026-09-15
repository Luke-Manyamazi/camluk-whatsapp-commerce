"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Business { id: string; name: string; slug: string; created_at: string; }

export default function AdminDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiFetch<{ businesses: Business[] }>("/api/admin/businesses")
      .then((result) => setBusinesses(result.businesses ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 p-6 md:block">
          <div className="mb-10"><h1 className="text-xl font-bold">Camluk</h1><p className="text-sm text-slate-400">Platform Admin</p></div>
          <nav className="space-y-2">
            <Link href="/admin" className="block rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-950">Dashboard</Link>
            <Link href="/admin/businesses" className="block rounded-lg px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">Businesses</Link>
            <Link href="/admin/support" className="block rounded-lg px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">Support</Link>
            <Link href="/admin/audit" className="block rounded-lg px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">Activity</Link>
          </nav>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-800 px-5 py-5 sm:px-6 md:px-10"><p className="text-xs font-medium uppercase tracking-wider text-blue-400">Camluk Platform</p><h2 className="mt-1 text-2xl font-bold">Admin Dashboard</h2><p className="mt-1 text-sm text-slate-400">Manage businesses, onboarding and customer support.</p></header>
          <div className="p-5 sm:p-6 md:p-10">
            {error && <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Link href="/admin/businesses" className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:bg-slate-800"><p className="text-sm text-slate-400">Businesses</p><p className="mt-3 text-3xl font-bold">{loading ? "—" : businesses.length}</p><p className="mt-2 text-xs text-slate-500">Managed customer businesses</p></Link>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Platform role</p><p className="mt-3 text-xl font-bold">Administrator</p><p className="mt-2 text-xs text-slate-500">Access controlled by the API</p></div>
              <Link href="/admin/businesses/new" className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:bg-slate-800"><p className="text-sm text-slate-400">Onboarding</p><p className="mt-3 text-xl font-bold">New business</p><p className="mt-2 text-xs text-slate-500">Create a customer tenant</p></Link>
              <Link href="/admin/support" className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:bg-slate-800"><p className="text-sm text-slate-400">Support</p><p className="mt-3 text-xl font-bold">Customer support</p><p className="mt-2 text-xs text-slate-500">Open a business support view</p></Link>
            </div>
            <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6"><div className="flex items-center justify-between gap-4"><div><h3 className="font-semibold">Businesses</h3><p className="mt-1 text-sm text-slate-400">Latest managed customer businesses.</p></div><Link href="/admin/businesses" className="text-xs text-blue-400">View all</Link></div><div className="mt-6 space-y-3">{loading ? <div className="h-16 animate-pulse rounded-lg bg-slate-950" /> : businesses.length === 0 ? <p className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">No businesses onboarded yet.</p> : businesses.slice(0, 8).map((business) => <Link key={business.id} href={`/admin/businesses/${business.id}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4 hover:border-slate-700"><div><p className="font-medium">{business.name}</p><p className="mt-1 text-xs text-slate-500">{business.slug}</p></div><span className="text-xs text-green-400">Active</span></Link>)}</div></section>
          </div>
        </section>
      </div>
    </main>
  );
}
