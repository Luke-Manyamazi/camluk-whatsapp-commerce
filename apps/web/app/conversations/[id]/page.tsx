"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import { apiFetch } from "../../../lib/api";

type Conversation = {
  id: string; customerId: string; customerName: string; phone: string; email: string;
  tags: string[]; notes: string; lastMessage: string;
  status: "open" | "closed" | "human-handoff"; updatedAt: string;
  channel: { id: string; name: string; phoneNumberId: string } | null;
  unreadCount: number; inboxReadAt?: string | null;
};
type Message = {
  id: string; conversationId: string; direction: "inbound" | "outbound"; content: string;
  createdAt: string; externalMessageId?: string | null;
  deliveryStatus?: "pending" | "sent" | "delivered" | "read" | "failed" | null;
  deliveryError?: string | null;
};

const statusLabel = (s: Conversation["status"]) => s === "human-handoff" ? "Human Handoff" : s.charAt(0).toUpperCase() + s.slice(1);
const statusClass = (s: Conversation["status"]) => s === "open" ? "bg-green-500/10 text-green-400" : s === "human-handoff" ? "bg-yellow-500/10 text-yellow-400" : "bg-slate-800 text-slate-400";
const deliveryLabel = (s: Message["deliveryStatus"]) => s === "pending" ? "Sending…" : s === "sent" ? "Sent" : s === "delivered" ? "Delivered" : s === "read" ? "Read" : s === "failed" ? "Failed" : "";
const deliveryClass = (s: Message["deliveryStatus"]) => s === "failed" ? "text-red-300" : s === "read" ? "text-blue-200" : "text-slate-300";
const formatDate = (value: string) => new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [retrying, setRetrying] = useState("");

  async function loadConversation(conversationId: string, filter = statusFilter) {
    setLoading(true); setMessagesLoading(true); setError("");
    try {
      const query = new URLSearchParams({ page: "1", limit: "50" });
      if (search.trim()) query.set("search", search.trim());
      if (filter) query.set("status", filter);
      const [c, m] = await Promise.all([
        apiFetch<{ conversations: Conversation[] }>(`/api/conversations?${query.toString()}`),
        apiFetch<{ messages: Message[] }>(`/api/messages/${conversationId}`),
      ]);
      setConversations(c.conversations || []); setMessages(m.messages || []);
      await apiFetch(`/api/conversations/${conversationId}/read`, { method: "POST" });
    } catch (e) { console.error(e); setError(e instanceof Error ? e.message : "Unable to load this conversation."); }
    finally { setLoading(false); setMessagesLoading(false); }
  }

  useEffect(() => {
    let active = true;
    (async () => { const resolved = await params; if (!active) return; setId(resolved.id); })();
    return () => { active = false; };
  }, [params]);

  useEffect(() => { if (id) void loadConversation(id); }, [id]);

  const conversation = conversations.find(c => c.id === id);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter(c => !q || c.customerName.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.channel?.name.toLowerCase().includes(q));
  }, [conversations, search]);

  async function send() {
    if (!input.trim() || sending || !id) return;
    try {
      setSending(true); setError("");
      const d = await apiFetch<{ message: Message }>(`/api/messages/${id}`, { method: "POST", body: JSON.stringify({ content: input.trim() }) });
      setMessages(m => [...m, d.message]); setInput("");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to send message."); }
    finally { setSending(false); }
  }

  async function updateStatus(status: Conversation["status"]) {
    if (!conversation || updatingStatus || status === conversation.status) return;
    try {
      setUpdatingStatus(true); setError("");
      await apiFetch(`/api/conversations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setConversations(items => items.map(c => c.id === id ? { ...c, status } : c));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update conversation status."); }
    finally { setUpdatingStatus(false); }
  }

  async function retry(messageId: string) {
    if (retrying) return;
    try {
      setRetrying(messageId); setError("");
      const d = await apiFetch<{ message: Message }>(`/api/messages/${id}/${messageId}/retry`, { method: "POST" });
      setMessages(items => items.map(m => m.id === messageId ? d.message : m));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to retry message."); }
    finally { setRetrying(""); }
  }

  return <main className="min-h-screen bg-slate-950 text-white"><div className="flex min-h-screen"><Sidebar/><div className="flex min-w-0 flex-1 p-3 md:p-6 lg:p-8"><div className="flex min-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 lg:min-h-[calc(100vh-3rem)]">
    <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-800 lg:flex"><div className="border-b border-slate-800 px-5 py-5"><div className="flex items-center justify-between"><div><h1 className="text-lg font-semibold">Inbox</h1><p className="mt-1 text-xs text-slate-500">WhatsApp conversations</p></div><Link href="/conversations" className="text-xs text-blue-400">View all</Link></div><div className="mt-4 flex gap-2"><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none"/><select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);if(id)void loadConversation(id,e.target.value)}} className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2.5 text-xs outline-none"><option value="">All</option><option value="open">Open</option><option value="human-handoff">Handoff</option><option value="closed">Closed</option></select></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{filtered.length===0?<p className="p-5 text-center text-xs text-slate-500">No conversations found.</p>:filtered.map(c=><Link key={c.id} href={`/conversations/${c.id}`} className={`mb-1 block rounded-lg border p-3 ${c.id===id?"border-slate-700 bg-slate-800":"border-transparent hover:bg-slate-800/60"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{c.customerName}</p><p className="mt-1 truncate text-xs text-slate-500">{c.phone}</p></div>{c.unreadCount>0&&<span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold">{c.unreadCount}</span>}</div><div className="mt-2 flex items-center justify-between gap-2"><p className="truncate text-xs text-slate-400">{c.lastMessage||"No messages yet"}</p><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${statusClass(c.status)}`}>{statusLabel(c.status)}</span></div></Link>)}</div></aside>
    <section className="flex min-w-0 flex-1 flex-col bg-slate-950/40"><header className="border-b border-slate-800 bg-slate-900 px-4 py-4 md:px-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><Link href="/conversations" className="mb-2 inline-block text-xs text-slate-400 lg:hidden">← Back to inbox</Link><h2 className="truncate text-lg font-semibold">{conversation?.customerName||"Conversation"}</h2><p className="mt-1 truncate text-sm text-slate-400">{conversation?.phone||"Loading customer details..."}</p></div>{conversation&&<div className="flex items-center gap-2"><select value={conversation.status} onChange={e=>void updateStatus(e.target.value as Conversation["status"])} disabled={updatingStatus} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none"><option value="open">Open</option><option value="human-handoff">Human Handoff</option><option value="closed">Closed</option></select><span className={`hidden rounded-full px-3 py-1.5 text-xs md:inline-block ${statusClass(conversation.status)}`}>{statusLabel(conversation.status)}</span></div>}</div></header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_280px]"> <div className="min-h-0 overflow-y-auto px-4 py-5 md:px-8"><div className="mx-auto flex w-full max-w-4xl flex-col gap-4">{loading||messagesLoading?<p className="py-12 text-center text-sm text-slate-400">Loading conversation…</p>:error&&messages.length===0?<p className="py-12 text-center text-sm text-red-400">{error}</p>:messages.length===0?<p className="py-12 text-center text-sm text-slate-400">No messages in this conversation yet.</p>:messages.map(m=><div key={m.id} className={`flex ${m.direction==="outbound"?"justify-end":"justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${m.direction==="outbound"?"rounded-br-md bg-blue-500":"rounded-bl-md bg-slate-800"}`}><p className="whitespace-pre-wrap leading-6">{m.content}</p><div className="mt-2 flex items-center justify-end gap-2 text-[11px] opacity-80"><span>{formatDate(m.createdAt)}</span>{m.direction==="outbound"&&m.deliveryStatus&&<span className={deliveryClass(m.deliveryStatus)}>· {deliveryLabel(m.deliveryStatus)}</span>}</div>{m.direction==="outbound"&&m.deliveryStatus==="failed"&&<div className="mt-2 flex items-center justify-end gap-3"><p className="text-right text-[10px] text-red-300">{m.deliveryError||"Delivery failed"}</p><button onClick={()=>void retry(m.id)} disabled={retrying===m.id} className="rounded-md border border-red-400/40 px-2 py-1 text-[10px] text-red-200 hover:bg-red-500/10 disabled:opacity-50">{retrying===m.id?"Retrying…":"Retry"}</button></div>}</div></div>)}</div>{error&&messages.length>0&&<p className="mx-auto mt-4 max-w-4xl rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">{error}</p>}</div>
        <aside className="hidden border-l border-slate-800 bg-slate-900/70 p-5 lg:block"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer context</p>{conversation?<div className="mt-4 space-y-5"><div><p className="text-sm font-medium">{conversation.customerName}</p><p className="mt-1 text-xs text-slate-400">{conversation.phone}</p>{conversation.email&&<p className="mt-1 truncate text-xs text-slate-400">{conversation.email}</p>}</div>{conversation.channel&&<div><p className="text-[11px] uppercase text-slate-500">Channel</p><p className="mt-1 text-sm text-slate-200">{conversation.channel.name}</p><p className="mt-1 text-[10px] text-slate-500">{conversation.channel.phoneNumberId}</p></div>}<div><p className="text-[11px] uppercase text-slate-500">Status</p><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] ${statusClass(conversation.status)}`}>{statusLabel(conversation.status)}</span></div>{conversation.tags.length>0&&<div><p className="text-[11px] uppercase text-slate-500">Tags</p><div className="mt-2 flex flex-wrap gap-1.5">{conversation.tags.map(tag=><span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300">{tag}</span>)}</div></div>}{conversation.notes&&<div><p className="text-[11px] uppercase text-slate-500">Notes</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">{conversation.notes}</p></div>}<Link href={`/customers/${conversation.customerId}`} className="block rounded-lg border border-slate-700 px-3 py-2 text-center text-xs text-blue-400 hover:bg-slate-800">View customer</Link></div>:<p className="mt-4 text-xs text-slate-500">Customer details unavailable.</p>}</aside>
      </div><footer className="border-t border-slate-800 bg-slate-900 px-4 py-4 md:px-5"><div className="mx-auto flex w-full max-w-4xl gap-3"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send()}}} placeholder={conversation?.status==="closed"?"Conversation is closed":"Type a message…"} disabled={!conversation||conversation.status==="closed"||sending} className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none disabled:opacity-50"/><button onClick={()=>void send()} disabled={!conversation||conversation.status==="closed"||sending||!input.trim()} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-950 disabled:opacity-50">{sending?"Sending…":"Send"}</button></div></footer></section>
  </div></div></div></main>;
}
