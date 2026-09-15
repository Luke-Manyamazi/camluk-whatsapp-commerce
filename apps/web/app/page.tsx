"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Service = { id: string; name: string; description: string };
type Conversation = { id: string; customerName: string; phone: string; lastMessage: string; status: string; updatedAt: string };
type Lead = { id: string; customerName: string; phone: string; serviceCategory: string | null; status: string; updatedAt: string };
type Pagination = { page: number; limit: number; total: number; totalPages: number };
type LeadSummary = { total: number; new: number; contacted: number; qualified: number; converted: number; lost: number };

type DashboardData = {
  services: Service[];
  conversations: Conversation[];
  conversationTotal: number;
  customerTotal: number;
  leads: Lead[];
  leadSummary: LeadSummary;
};

const emptySummary: LeadSummary = { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
const emptyData: DashboardData = { services: [], conversations: [], conversationTotal: 0, customerTotal: 0, leads: [], leadSummary: emptySummary };
const navigation = [
  { label: "Overview", href: "/" },
  { label: "Conversations", href: "/conversations" },
  { label: "Leads", href: "/leads" },
  { label: "Customers", href: "/customers" },
  { label: "Services", href: "/services" },
  { label: "Automation", href: "/automation" },
  { label: "Settings", href: "/settings" },
];

function formatDate(date: string) { return new Date(date).toLocaleString(); }
function formatServiceCategory(category: string | null) { if (!category) return "Not specified"; return category.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function getStatusClass(status: string) {
  switch (status) {
    case "open": case "new": return "bg-blue-500/10 text-blue-400";
    case "qualified": return "bg-green-500/10 text-green-400";
    case "contacted": return "bg-yellow-500/10 text-yellow-400";
    case "converted": return "bg-purple-500/10 text-purple-400";
    case "human-handoff": return "bg-orange-500/10 text-orange-400";
    case "lost": return "bg-red-500/10 text-red-400";
    default: return "bg-slate-800 text-slate-400";
  }
}

function LoadingRows({ label }: { label: string }) {
  return <div className="space-y-3" aria-label={`Loading ${label}`}><div className="h-20 animate-pulse rounded-lg bg-slate-950" /><div className="h-20 animate-pulse rounded-lg bg-slate-950" /><div className="h-20 animate-pulse rounded-lg bg-slate-950" /></div>;
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [services, conversations, leads, customers] = await Promise.all([
        apiFetch<{ services: Service[] }>("/api/services"),
        apiFetch<{ conversations: Conversation[]; pagination: Pagination }>("/api/conversations?page=1&limit=5"),
        apiFetch<{ leads: Lead[]; pagination: Pagination; summary: LeadSummary }>("/api/leads?page=1&limit=5"),
        apiFetch<{ customers: unknown[]; pagination: Pagination }>("/api/customers?page=1&limit=1"),
      ]);
      setData({
        services: services.services || [],
        conversations: conversations.conversations || [],
        conversationTotal: conversations.pagination?.total ?? 0,
        customerTotal: customers.pagination?.total ?? 0,
        leads: leads.leads || [],
        leadSummary: leads.summary || emptySummary,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const openRequests = data.leadSummary.new + data.leadSummary.contacted + data.leadSummary.qualified;
  const stats = [
    { label: "Conversations", value: data.conversationTotal, description: "Total WhatsApp conversations", href: "/conversations" },
    { label: "New Leads", value: data.leadSummary.new, description: "Leads awaiting follow-up", href: "/leads" },
    { label: "Customers", value: data.customerTotal, description: "Total customers", href: "/customers" },
    { label: "Open Requests", value: openRequests, description: "Active service requests", href: "/leads" },
  ];

  return <main className="min-h-screen bg-slate-950 text-white"><div className="flex min-h-screen">
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 p-6 md:block"><div className="mb-10"><h1 className="text-xl font-bold">Camluk</h1><p className="text-sm text-slate-400">WhatsApp Commerce</p></div><nav className="space-y-2">{navigation.map(item => <Link key={item.label} href={item.href} className={`block w-full rounded-lg px-4 py-3 text-sm transition ${item.href === "/" ? "bg-white font-medium text-slate-950" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>{item.label}</Link>)}</nav></aside>
    <section className="min-w-0 flex-1"><header className="border-b border-slate-800 px-5 py-5 sm:px-6 md:px-10"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wider text-blue-400">Camluk Commerce</p><h2 className="mt-1 text-2xl font-bold">Dashboard</h2><p className="mt-1 text-sm text-slate-400">Manage your WhatsApp business assistant.</p></div><div className="rounded-full bg-green-500/10 px-4 py-2 text-sm text-green-400">● System Online</div></div><nav className="mt-5 flex gap-2 overflow-x-auto md:hidden">{navigation.map(item => <Link key={item.label} href={item.href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs ${item.href === "/" ? "bg-white font-medium text-slate-950" : "bg-slate-900 text-slate-400"}`}>{item.label}</Link>)}</nav></header>
      <div className="p-5 sm:p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Business overview</h3><p className="mt-1 text-sm text-slate-400">Totals cover the whole business; lists show the latest 5 records.</p></div><button onClick={() => void loadDashboard()} disabled={loading} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Refreshing..." : "Refresh"}</button></div>
        {error && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"><span>We could not load the latest dashboard data.</span><button onClick={() => void loadDashboard()} className="rounded-lg border border-red-400/30 px-3 py-2 text-xs hover:bg-red-500/10">Try again</button></div>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(stat => <Link key={stat.label} href={stat.href} className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-800"><p className="text-sm text-slate-400">{stat.label}</p><p className="mt-3 text-3xl font-bold">{loading ? "—" : stat.value}</p><p className="mt-2 text-xs text-slate-500">{stat.description}</p></Link>)}</div>
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6"><div className="mb-6"><h3 className="font-semibold">Camluk Services</h3><p className="mt-1 text-sm text-slate-400">Services currently available through the platform.</p></div>{loading && <LoadingRows label="services" />}{!loading && !error && data.services.length === 0 && <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">No services configured yet. <Link href="/services" className="text-blue-400 hover:text-blue-300">Manage services</Link>.</div>}{!loading && !error && data.services.length > 0 && <div className="grid gap-4 md:grid-cols-2">{data.services.map(service => <Link key={service.id} href={`/services/${service.id}`} className="rounded-lg border border-slate-800 bg-slate-950 p-5 transition hover:border-slate-700"><h4 className="font-medium">{service.name}</h4><p className="mt-2 text-sm leading-6 text-slate-400">{service.description}</p></Link>)}</div>}</div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6"><div className="flex items-center justify-between gap-4"><div><h3 className="font-semibold">Recent conversations</h3><p className="mt-1 text-xs text-slate-500">Latest 5 of {data.conversationTotal} conversations.</p></div><Link href="/conversations" className="text-xs text-blue-400 hover:text-blue-300">View all</Link></div><div className="mt-6">{loading && <LoadingRows label="conversations" />}{!loading && !error && data.conversations.length === 0 && <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">No conversations yet. Incoming WhatsApp conversations will appear here.</div>}{!loading && !error && data.conversations.length > 0 && <div className="space-y-3">{data.conversations.map(conversation => <Link key={conversation.id} href={`/conversations/${conversation.id}`} className="block rounded-lg border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-medium">{conversation.customerName}</p><p className="mt-1 text-xs text-slate-500">{conversation.phone}</p><p className="mt-2 truncate text-sm text-slate-400">{conversation.lastMessage || "No messages yet"}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs ${getStatusClass(conversation.status)}`}>{conversation.status}</span></div><p className="mt-3 text-xs text-slate-600">{formatDate(conversation.updatedAt)}</p></Link>)}</div>}</div></section>
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6"><div className="flex items-center justify-between gap-4"><div><h3 className="font-semibold">Lead pipeline</h3><p className="mt-1 text-xs text-slate-500">Latest 5 of {data.leadSummary.total} leads.</p></div><Link href="/leads" className="text-xs text-blue-400 hover:text-blue-300">View all</Link></div><div className="mt-6">{loading && <LoadingRows label="leads" />}{!loading && !error && data.leads.length === 0 && <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">No leads yet. Leads captured from WhatsApp will appear here.</div>}{!loading && !error && data.leads.length > 0 && <div className="space-y-3">{data.leads.map(lead => <Link key={lead.id} href={`/leads/${lead.id}`} className="block rounded-lg border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-medium">{lead.customerName}</p><p className="mt-1 text-xs text-slate-500">{lead.phone}</p><p className="mt-2 truncate text-sm text-slate-400">{formatServiceCategory(lead.serviceCategory)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs ${getStatusClass(lead.status)}`}>{lead.status}</span></div><p className="mt-3 text-xs text-slate-600">{formatDate(lead.updatedAt)}</p></Link>)}</div>}</div></section>
        </div>
      </div>
    </section>
  </div></main>;
}
