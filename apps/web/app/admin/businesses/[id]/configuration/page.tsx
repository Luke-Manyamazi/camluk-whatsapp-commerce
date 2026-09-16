"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Rule = { id: string; name: string; description: string | null; enabled: boolean; priority: number; keywords: string[]; response_text: string | null; action_type: string; match_type: string; action_config: Record<string, unknown> };
type Channel = { id: string; name: string; whatsapp_business_account_id: string; phone_number_id: string; graph_api_version: string; active: boolean };

const input = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-slate-500";

export default function BusinessConfigurationPage() {
  const { id } = useParams<{ id: string }>();
  const [rules, setRules] = useState<Rule[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rule, setRule] = useState({ name: "", description: "", keywords: "", responseText: "", actionType: "send_reply", priority: "0" });
  const [channel, setChannel] = useState({ name: "", whatsappBusinessAccountId: "", phoneNumberId: "", accessToken: "", verifyToken: "", graphApiVersion: "v23.0" });
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [r, c] = await Promise.all([
        apiFetch<{ rules: Rule[] }>(`/api/platform/businesses/${id}/automation`),
        apiFetch<{ channels: Channel[] }>(`/api/platform/businesses/${id}/whatsapp`),
      ]);
      setRules(r.rules ?? []); setChannels(c.channels ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load configuration."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [id]);

  function resetRule() { setEditingRule(null); setRule({ name: "", description: "", keywords: "", responseText: "", actionType: "send_reply", priority: "0" }); }
  function editRule(item: Rule) { setEditingRule(item.id); setRule({ name: item.name, description: item.description ?? "", keywords: item.keywords.join(", "), responseText: item.response_text ?? "", actionType: item.action_type, priority: String(item.priority) }); }
  async function saveRule(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const payload = { name: rule.name.trim(), description: rule.description.trim() || null, keywords: rule.keywords.split(",").map(x => x.trim()).filter(Boolean), responseText: rule.responseText.trim() || null, actionType: rule.actionType, priority: Number(rule.priority) || 0, enabled: true, matchType: "any", actionConfig: {} };
    try {
      await apiFetch(editingRule ? `/api/platform/businesses/${id}/automation/${editingRule}` : `/api/platform/businesses/${id}/automation`, { method: editingRule ? "PATCH" : "POST", body: JSON.stringify(payload) });
      resetRule(); setMessage(editingRule ? "Automation updated." : "Automation created."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save automation."); }
    finally { setSaving(false); }
  }
  async function toggleRule(item: Rule) { try { await apiFetch(`/api/platform/businesses/${id}/automation/${item.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !item.enabled }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to update automation."); } }
  async function deleteRule(item: Rule) { if (!window.confirm(`Delete ${item.name}?`)) return; try { await apiFetch(`/api/platform/businesses/${id}/automation/${item.id}`, { method: "DELETE" }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete automation."); } }

  function editChannel(item: Channel) { setEditingChannel(item.id); setChannel({ name: item.name, whatsappBusinessAccountId: item.whatsapp_business_account_id, phoneNumberId: item.phone_number_id, accessToken: "", verifyToken: "", graphApiVersion: item.graph_api_version }); }
  function resetChannel() { setEditingChannel(null); setChannel({ name: "", whatsappBusinessAccountId: "", phoneNumberId: "", accessToken: "", verifyToken: "", graphApiVersion: "v23.0" }); }
  async function saveChannel(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const payload: Record<string, unknown> = { name: channel.name.trim(), whatsappBusinessAccountId: channel.whatsappBusinessAccountId.trim(), phoneNumberId: channel.phoneNumberId.trim(), graphApiVersion: channel.graphApiVersion.trim() || "v23.0" };
    if (channel.accessToken.trim()) payload.accessToken = channel.accessToken.trim();
    if (channel.verifyToken.trim()) payload.verifyToken = channel.verifyToken.trim();
    try {
      if (!editingChannel && (!payload.accessToken || !payload.verifyToken)) throw new Error("Access token and verify token are required for a new channel.");
      await apiFetch(editingChannel ? `/api/platform/businesses/${id}/whatsapp/${editingChannel}` : `/api/platform/businesses/${id}/whatsapp`, { method: editingChannel ? "PATCH" : "POST", body: JSON.stringify(payload) });
      resetChannel(); setMessage(editingChannel ? "WhatsApp channel updated." : "WhatsApp channel connected."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save WhatsApp channel."); }
    finally { setSaving(false); }
  }
  async function toggleChannel(item: Channel) { try { await apiFetch(`/api/platform/businesses/${id}/whatsapp/${item.id}`, { method: "PATCH", body: JSON.stringify({ active: !item.active }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to update channel."); } }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-5 sm:px-8"><div className="mx-auto max-w-6xl"><Link href={`/admin/businesses/${id}`} className="text-xs text-slate-400 hover:text-white">← Business</Link><h1 className="mt-3 text-2xl font-bold">Camluk-managed configuration</h1><p className="mt-1 text-sm text-slate-400">Technical automation and WhatsApp configuration for this tenant. Business users do not need access to these controls.</p></div></header>
      <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        {(error || message) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`}>{error || message}</div>}
        {loading ? <div className="py-12 text-center text-sm text-slate-500">Loading configuration...</div> : <>
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-semibold">Automation rules</h2><p className="mt-1 text-sm text-slate-400">Configure how incoming customer messages are handled.</p></div><span className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400">{rules.filter(r => r.enabled).length} active</span></div>
            <div className="mt-5 space-y-3">{rules.map(item => <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap gap-2"><span className="font-medium">{item.name}</span><span className={`rounded-full px-2 py-1 text-xs ${item.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>{item.enabled ? "Active" : "Paused"}</span></div><p className="mt-1 text-sm text-slate-400">{item.description || "No description"}</p><p className="mt-2 text-xs text-slate-500">Keywords: {item.keywords.join(", ") || "none"} · Action: {item.action_type.replaceAll("_", " ")}</p></div><div className="flex gap-2"><button onClick={() => void toggleRule(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">{item.enabled ? "Pause" : "Enable"}</button><button onClick={() => editRule(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">Edit</button><button onClick={() => void deleteRule(item)} className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300">Delete</button></div></div></div>)}</div>
            <form onSubmit={saveRule} className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5"><h3 className="font-medium">{editingRule ? "Edit automation" : "Add automation"}</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-xs text-slate-400">Name<input required value={rule.name} onChange={e => setRule({ ...rule, name: e.target.value })} className={input} placeholder="Product enquiry" /></label><label className="text-xs text-slate-400">Priority<input type="number" value={rule.priority} onChange={e => setRule({ ...rule, priority: e.target.value })} className={input} /></label><label className="text-xs text-slate-400 md:col-span-2">Description<textarea value={rule.description} onChange={e => setRule({ ...rule, description: e.target.value })} rows={2} className={input} /></label><label className="text-xs text-slate-400">Keywords<input required value={rule.keywords} onChange={e => setRule({ ...rule, keywords: e.target.value })} className={input} placeholder="price, cost, how much" /></label><label className="text-xs text-slate-400">Action<select value={rule.actionType} onChange={e => setRule({ ...rule, actionType: e.target.value })} className={input}><option value="send_reply">Send reply</option><option value="create_lead">Create lead</option><option value="update_lead">Update lead</option><option value="change_status">Change conversation status</option><option value="add_tag">Add tag</option><option value="human_handoff">Human handoff</option></select></label><label className="text-xs text-slate-400 md:col-span-2">Reply<textarea value={rule.responseText} onChange={e => setRule({ ...rule, responseText: e.target.value })} rows={3} className={input} placeholder="Thanks for your enquiry..." /></label></div><div className="mt-4 flex gap-2"><button disabled={saving} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving..." : editingRule ? "Update automation" : "Create automation"}</button>{editingRule && <button type="button" onClick={resetRule} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Cancel</button>}</div></form>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-semibold">WhatsApp channels</h2><p className="mt-1 text-sm text-slate-400">Connect and maintain Meta WhatsApp Business numbers on behalf of the business.</p></div><span className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400">{channels.length} channel{channels.length === 1 ? "" : "s"}</span></div>
            <div className="mt-5 space-y-3">{channels.map(item => <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap gap-2"><span className="font-medium">{item.name}</span><span className={`rounded-full px-2 py-1 text-xs ${item.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>{item.active ? "Active" : "Inactive"}</span></div><p className="mt-2 text-xs text-slate-500">Phone number ID: {item.phone_number_id} · Graph API: {item.graph_api_version}</p></div><div className="flex gap-2"><button onClick={() => editChannel(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">Edit</button><button onClick={() => void toggleChannel(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">{item.active ? "Deactivate" : "Activate"}</button></div></div></div>)}</div>
            <form onSubmit={saveChannel} className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5"><div className="flex items-center justify-between"><div><h3 className="font-medium">{editingChannel ? "Edit WhatsApp channel" : "Connect WhatsApp channel"}</h3><p className="mt-1 text-xs text-slate-500">Secrets are encrypted and are never returned to the UI.</p></div>{editingChannel && <button type="button" onClick={resetChannel} className="text-xs text-slate-400 underline">Cancel</button>}</div><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-xs text-slate-400">Channel name<input required value={channel.name} onChange={e => setChannel({ ...channel, name: e.target.value })} className={input} /></label><label className="text-xs text-slate-400">WhatsApp Business Account ID<input required value={channel.whatsappBusinessAccountId} onChange={e => setChannel({ ...channel, whatsappBusinessAccountId: e.target.value })} className={input} /></label><label className="text-xs text-slate-400">Phone number ID<input required value={channel.phoneNumberId} onChange={e => setChannel({ ...channel, phoneNumberId: e.target.value })} className={input} /></label><label className="text-xs text-slate-400">Graph API version<input value={channel.graphApiVersion} onChange={e => setChannel({ ...channel, graphApiVersion: e.target.value })} className={input} /></label><label className="text-xs text-slate-400">Access token<input type="password" autoComplete="new-password" value={channel.accessToken} onChange={e => setChannel({ ...channel, accessToken: e.target.value })} className={input} placeholder={editingChannel ? "Leave blank to keep existing" : "Meta access token"} /></label><label className="text-xs text-slate-400">Verify token<input type="password" autoComplete="new-password" value={channel.verifyToken} onChange={e => setChannel({ ...channel, verifyToken: e.target.value })} className={input} placeholder={editingChannel ? "Leave blank to keep existing" : "Webhook verify token"} /></label></div><button disabled={saving} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving..." : editingChannel ? "Save channel" : "Connect channel"}</button></form>
          </section>
        </>}
      </div>
    </main>
  );
}
