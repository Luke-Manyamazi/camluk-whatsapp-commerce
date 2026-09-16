"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Member = { id: string; user_id: string; role: string; email: string | null; created_at: string };
type Business = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  member_count: number;
  customers: number;
  leads: number;
  conversations: number;
  services: number;
  members: Member[];
};

export default function BusinessAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await apiFetch<{ business: Business }>(`/api/platform/businesses/${id}`);
      setBusiness(result.business);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load business.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(status: string) {
    const message = status === "archived"
      ? "Archive this business? This will prevent normal business use."
      : status === "suspended"
        ? "Suspend this business? Business users will no longer be able to operate the workspace."
        : "Reactivate this business?";
    if (!window.confirm(message)) return;

    try {
      setActionLoading(true);
      setError("");
      const result = await apiFetch<{ business: Business }>(`/api/platform/businesses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setBusiness(current => current ? { ...current, ...result.business } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update business.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading business...</main>;
  if (!business) return <main className="min-h-screen bg-slate-950 p-8 text-red-300">{error || "Business not found."}</main>;

  const owner = business.members.find(member => member.role === "owner");
  const statusClass = business.status === "active"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : business.status === "suspended"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20";

  const areas = [
    ["Customers", business.customers, "/customers"],
    ["Leads", business.leads, "/leads"],
    ["Conversations", business.conversations, "/conversations"],
    ["Services", business.services, "/services"],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/admin" className="text-xs text-slate-400 hover:text-white">← Platform Control Centre</Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Business</p>
              <h1 className="mt-1 text-2xl font-bold">{business.name}</h1>
              <p className="mt-1 text-sm text-slate-400">/{business.slug}</p>
            </div>
            <span className={`rounded-full border px-3 py-2 text-xs font-medium capitalize ${statusClass}`}>{business.status}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-5 sm:p-8">
        {error && <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">Open Business Workspace →</Link>
          <Link href={`/customers`} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">View workspace data</Link>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="font-semibold">Overview</h2><p className="mt-1 text-sm text-slate-400">Tenant usage and operational areas.</p></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[["Members", business.member_count], ["Customers", business.customers], ["Leads", business.leads], ["Conversations", business.conversations], ["Services", business.services]].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold">Business Information</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><p className="text-xs uppercase tracking-wider text-slate-500">Business name</p><p className="mt-1 text-sm">{business.name}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-slate-500">Slug</p><p className="mt-1 text-sm">/{business.slug}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-slate-500">Business ID</p><p className="mt-1 break-all text-sm text-slate-300">{business.id}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-slate-500">Created</p><p className="mt-1 text-sm">{new Date(business.created_at).toLocaleDateString()}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-slate-500">Owner</p><p className="mt-1 text-sm">{owner?.email || owner?.user_id || "Not assigned"}</p></div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-semibold">Team & Access</h2><p className="mt-1 text-sm text-slate-400">Users currently assigned to this business.</p></div><button disabled className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-500">+ Add Member — coming soon</button></div>
          <div className="mt-5 space-y-3">
            {business.members.map(member => (
              <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950 p-4">
                <div><p className="text-sm font-medium">{member.email || member.user_id}</p><p className="mt-1 text-xs capitalize text-slate-500">{member.role}</p></div>
                <span className="text-xs text-slate-600">Joined {new Date(member.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold">Workspace</h2>
          <p className="mt-1 text-sm text-slate-400">Quick access to this tenant's operational areas.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {areas.map(([label, count, path]) => <Link key={label} href={path} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4 hover:border-slate-600"><span className="text-sm">{label}</span><span className="text-sm text-slate-400">{count} · View →</span></Link>)}
            <Link href="/automation" className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4 hover:border-slate-600"><span className="text-sm">Automation</span><span className="text-sm text-slate-400">Manage →</span></Link>
            <Link href="/settings" className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4 hover:border-slate-600"><span className="text-sm">WhatsApp & Settings</span><span className="text-sm text-slate-400">Manage →</span></Link>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold">Business Lifecycle</h2>
          <p className="mt-1 text-sm text-slate-400">Platform controls apply to the tenant; operational data remains inside the business workspace.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3"><span className={`rounded-full border px-3 py-2 text-xs font-medium capitalize ${statusClass}`}>Status: {business.status}</span>{business.status !== "archived" && <button disabled={actionLoading} onClick={() => void setStatus(business.status === "active" ? "suspended" : "active")} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">{actionLoading ? "Updating..." : business.status === "active" ? "Suspend Business" : "Reactivate Business"}</button>}</div>
        </section>

        <section className="mt-6 rounded-xl border border-red-900/60 bg-red-950/10 p-6">
          <h2 className="font-semibold text-red-300">Danger Zone</h2>
          <p className="mt-1 text-sm text-slate-400">Archive this tenant when it should no longer be available for normal business use.</p>
          {business.status !== "archived" ? <button disabled={actionLoading} onClick={() => void setStatus("archived")} className="mt-5 rounded-lg border border-red-900 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-50">Archive Business</button> : <p className="mt-5 text-sm font-medium text-red-300">This business is archived.</p>}
        </section>
      </div>
    </main>
  );
}
