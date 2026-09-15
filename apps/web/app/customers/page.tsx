"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { apiFetch } from "../../lib/api";

type Customer = { id: string; name: string; phone: string; email: string; conversationCount: number; leadCount: number; latestConversation: string | null; createdAt: string; updatedAt: string };
type Pagination = { page: number; limit: number; total: number; totalPages: number };

function formatDate(date: string | null) { return date ? new Date(date).toLocaleString() : "No activity"; }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 5, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "5" });
      if (search) params.set("search", search);
      const data = await apiFetch<{ customers: Customer[]; pagination: Pagination }>(`/api/customers?${params}`);
      setCustomers(data.customers ?? []); setPagination(data.pagination);
    } catch (err) { console.error(err); setError("Unable to load customers. Please try again."); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  function applySearch(event: React.FormEvent) { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }

  return <main className="min-h-screen bg-slate-950 text-white"><div className="flex min-h-screen"><Sidebar /><section className="flex-1">
    <header className="border-b border-slate-800 px-6 py-5 md:px-10"><h1 className="text-2xl font-bold">Customers</h1><p className="mt-1 text-sm text-slate-400">Manage customers and their WhatsApp activity.</p></header>
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Customer overview</h2><p className="mt-1 text-sm text-slate-400">Showing 5 customers per page.</p></div><form onSubmit={applySearch} className="flex gap-2"><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, phone or email" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-slate-500 sm:w-72"/><button className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700">Search</button></form></div>
      <div className="mb-8 grid gap-4 sm:grid-cols-1"><div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Total Customers</p><p className="mt-3 text-3xl font-bold">{pagination.total}</p><p className="mt-1 text-xs text-slate-500">{search ? "Matching the current search" : "Across this business"}</p></div></div>
      {loading ? <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center text-sm text-slate-400">Loading customers...</div> : error ? <div className="rounded-xl border border-red-900 bg-red-950/30 p-10 text-center text-sm text-red-400">{error}<button onClick={loadCustomers} className="ml-3 underline">Retry</button></div> : customers.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center text-sm text-slate-400">{search ? `No customers match “${search}”.` : "No customers yet."}</div> : <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="border-b border-slate-800 bg-slate-950/50"><tr><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">Customer</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">Contact</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">Conversations</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">Leads</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">Last Activity</th><th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">Action</th></tr></thead><tbody>{customers.map(customer => <tr key={customer.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"><td className="px-6 py-4"><p className="font-medium text-white">{customer.name}</p><p className="mt-1 text-xs text-slate-500">Added {new Date(customer.createdAt).toLocaleDateString()}</p></td><td className="px-6 py-4"><p className="text-sm text-slate-300">{customer.phone}</p><p className="mt-1 text-xs text-slate-500">{customer.email || "No email"}</p></td><td className="px-6 py-4">{customer.conversationCount}</td><td className="px-6 py-4">{customer.leadCount}</td><td className="px-6 py-4 text-sm text-slate-400">{formatDate(customer.latestConversation)}</td><td className="px-6 py-4"><Link href={`/customers/${customer.id}`} className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">Open</Link></td></tr>)}</tbody></table></div></div>}
      {!loading && !error && pagination.totalPages > 1 && <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"><p className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</p><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:opacity-40">Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:opacity-40">Next</button></div></div>}
    </div>
  </section></div></main>;
}
