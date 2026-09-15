"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Audit { id: string; action: string; business_id: string | null; target_user_id: string | null; metadata: Record<string, unknown>; created_at: string; }
export default function AuditPage() {
  const [logs, setLogs] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { void apiFetch<{ auditLogs: Audit[] }>("/api/admin/audit").then((r) => setLogs(r.auditLogs ?? [])).catch((e: Error) => setError(e.message)); }, []);
  return <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8 md:p-10"><div className="mx-auto max-w-6xl"><Link href="/admin" className="text-xs text-slate-500 hover:text-white">← Admin Dashboard</Link><h1 className="mt-4 text-3xl font-bold">Platform Activity</h1><p className="mt-1 text-sm text-slate-400">Administrative actions recorded for support and accountability.</p>{error && <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}<div className="mt-8 space-y-3">{logs.map((log) => <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{log.action}</span><span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span></div><p className="mt-2 text-xs text-slate-500">Business: {log.business_id ?? "Platform"}</p></div>)}{logs.length === 0 && <p className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-500">No platform activity recorded yet.</p>}</div></div></main>;
}
