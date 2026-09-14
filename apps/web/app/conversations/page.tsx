"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { apiFetch } from "../../lib/api";

type Conversation = { id: string; customerName: string; phone: string; lastMessage: string; status: "open" | "closed" | "human-handoff"; updatedAt: string };
type Pagination = { page: number; limit: number; total: number; totalPages: number };

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 5, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true); setError(false);
    apiFetch<{ conversations: Conversation[]; pagination: Pagination }>(`/api/conversations?page=${page}&limit=5`)
      .then(data => { setConversations(data.conversations || []); setPagination(data.pagination); })
      .catch(error => { console.error("Failed to load conversations:", error); setError(true); })
      .finally(() => setLoading(false));
  }, [page]);

  const getStatusLabel = (status: Conversation["status"]) => status === "open" ? "Open" : status === "human-handoff" ? "Human Handoff" : "Closed";

  return <main className="min-h-screen bg-slate-950 text-white"><div className="flex min-h-screen"><Sidebar /><section className="flex-1">
    <header className="border-b border-slate-800 px-6 py-5 md:px-10"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Conversations</h2><p className="mt-1 text-sm text-slate-400">Manage customer conversations from WhatsApp.</p></div><div className="rounded-full bg-green-500/10 px-4 py-2 text-sm text-green-400">● System Online</div></div></header>
    <div className="p-6 md:p-10"><div className="mb-8"><h3 className="text-lg font-semibold">Customer conversations</h3><p className="mt-1 text-sm text-slate-400">5 conversations per page.</p></div>
      {loading && <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center text-sm text-slate-400">Loading conversations...</div>}
      {error && <div className="rounded-xl border border-red-900 bg-red-950/30 p-10 text-center text-sm text-red-400">Unable to load conversations.</div>}
      {!loading && !error && conversations.length === 0 && <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center text-sm text-slate-400">No conversations on this page.</div>}
      {!loading && !error && conversations.length > 0 && <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="border-b border-slate-800 bg-slate-950/50"><tr><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">Customer</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">Last message</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">Status</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">Updated</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">Action</th></tr></thead><tbody className="divide-y divide-slate-800">{conversations.map(c => <tr key={c.id} className="transition hover:bg-slate-800/40"><td className="px-6 py-5"><p className="font-medium">{c.customerName}</p><p className="mt-1 text-xs text-slate-500">{c.phone}</p></td><td className="max-w-md px-6 py-5"><p className="truncate text-sm text-slate-300">{c.lastMessage}</p></td><td className="px-6 py-5"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${c.status === "open" ? "bg-green-500/10 text-green-400" : c.status === "human-handoff" ? "bg-yellow-500/10 text-yellow-400" : "bg-slate-800 text-slate-400"}`}>{getStatusLabel(c.status)}</span></td><td className="px-6 py-5 text-sm text-slate-400">{new Date(c.updatedAt).toLocaleString()}</td><td className="px-6 py-5"><Link href={`/conversations/${c.id}`} className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800">Open</Link></td></tr>)}</tbody></table></div></div>}
      {!loading && !error && pagination.totalPages > 1 && <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"><p className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</p><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}
    </div>
  </section></div></main>;
}
