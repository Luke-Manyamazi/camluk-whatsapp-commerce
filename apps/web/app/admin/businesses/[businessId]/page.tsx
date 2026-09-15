"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Business { id: string; name: string; slug: string; created_at: string; }
interface Membership { id: string; user_id: string; role: string; created_at: string; }

export default function BusinessDetailPage() {
  const params = useParams<{ businessId: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { void apiFetch<{ business: Business; memberships: Membership[] }>(`/api/admin/businesses/${params.businessId}`).then((r) => { setBusiness(r.business); setMemberships(r.memberships ?? []); }).catch((e: Error) => setError(e.message)); }, [params.businessId]);

  return <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8 md:p-10"><div className="mx-auto max-w-5xl"><Link href="/admin/businesses" className="text-xs text-slate-500 hover:text-white">← Businesses</Link>{error && <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}{business && <><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-blue-400">Customer business</p><h1 className="mt-2 text-3xl font-bold">{business.name}</h1><p className="mt-1 text-sm text-slate-500">{business.slug}</p></div><Link href="/admin/support" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900">Open support</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-xs text-slate-500">Status</p><p className="mt-2 font-semibold text-green-400">Active</p></div><div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-xs text-slate-500">Users</p><p className="mt-2 text-2xl font-bold">{memberships.length}</p></div><div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-xs text-slate-500">Created</p><p className="mt-2 font-semibold">{new Date(business.created_at).toLocaleDateString()}</p></div></div><section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="font-semibold">Business users</h2><div className="mt-5 space-y-3">{memberships.map((member) => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4"><div><p className="font-medium">{member.user_id}</p><p className="mt-1 text-xs text-slate-600">Added {new Date(member.created_at).toLocaleDateString()}</p></div><span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">{member.role}</span></div>)}{memberships.length === 0 && <p className="text-sm text-slate-500">No users are linked to this business yet.</p>}</div></section></>}</div></main>;
}
