"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Business = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  members: number;
  customers: number;
  leads: number;
  conversations: number;
  services: number;
};

type PlatformMe = { userId: string; role: "super_admin" | "support_admin" };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function PlatformAdminPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [me, setMe] = useState<PlatformMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [identity, data] = await Promise.all([
        apiFetch<PlatformMe>("/api/platform/me"),
        apiFetch<{ businesses: Business[] }>("/api/platform/businesses"),
      ]);
      setMe(identity);
      setBusinesses(data.businesses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load platform data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totals = businesses.reduce(
    (acc, business) => ({
      customers: acc.customers + business.customers,
      leads: acc.leads + business.leads,
      conversations: acc.conversations + business.conversations,
      members: acc.members + business.members,
    }),
    { customers: 0, leads: 0, conversations: 0, members: 0 }
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Camluk Platform</p>
            <h1 className="mt-1 text-2xl font-bold">Platform Control Centre</h1>
            <p className="mt-1 text-sm text-slate-400">Manage the Camluk SaaS platform and its businesses.</p>
          </div>
          <div className="flex items-center gap-3">
            {me && <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-300">{me.role.replace("_", " ")}</span>}
            <Link href="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Business app</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Platform overview</h2>
            <p className="mt-1 text-sm text-slate-400">This is the platform layer. Business onboarding and creation will be added next.</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Businesses", businesses.length, "Tenants on the platform"],
            ["Members", totals.members, "Business memberships"],
            ["Customers", totals.customers, "Across all businesses"],
            ["Conversations", totals.conversations, "Across all businesses"],
          ].map(([label, value, description]) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-bold">{loading ? "—" : value}</p>
              <p className="mt-2 text-xs text-slate-500">{description}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-6">
            <div>
              <h2 className="font-semibold">Businesses</h2>
              <p className="mt-1 text-sm text-slate-400">Every tenant currently stored in the platform.</p>
            </div>
            <span className="rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-400">{businesses.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-3 p-6"><div className="h-20 animate-pulse rounded-lg bg-slate-950" /><div className="h-20 animate-pulse rounded-lg bg-slate-950" /></div>
          ) : businesses.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">No businesses exist yet. The Create Business workflow will live here.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {businesses.map((business) => (
                <div key={business.id} className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold">{business.name}</h3>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">Active</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">/{business.slug} · Created {formatDate(business.created_at)}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="rounded-lg bg-slate-950 px-3 py-2">{business.members} members</span>
                      <span className="rounded-lg bg-slate-950 px-3 py-2">{business.customers} customers</span>
                      <span className="rounded-lg bg-slate-950 px-3 py-2">{business.leads} leads</span>
                      <span className="rounded-lg bg-slate-950 px-3 py-2">{business.conversations} conversations</span>
                      <span className="rounded-lg bg-slate-950 px-3 py-2">{business.services} services</span>
                    </div>
                  </div>
                  <button disabled className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-500">Manage — next phase</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 p-5 text-sm text-blue-200">
          <strong>Next platform milestone:</strong> replace seeded businesses with a protected <span className="font-semibold">Create Business</span> workflow, then hand the newly created tenant to its owner.
        </div>
      </div>
    </main>
  );
}
