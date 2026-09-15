"use client";

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { apiFetch } from "@/lib/api";

type ActionType = "send_reply" | "create_lead" | "update_lead" | "change_status" | "add_tag" | "human_handoff";
type MatchType = "any" | "all" | "exact" | "contains";
type Rule = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  priority: number;
  match_type: MatchType;
  keywords: string[];
  response_text: string | null;
  action_type: ActionType;
  action_config: Record<string, unknown>;
};
type FormState = {
  name: string;
  description: string;
  enabled: boolean;
  priority: string;
  matchType: MatchType;
  keywords: string;
  responseText: string;
  actionType: ActionType;
  serviceCategory: string;
  leadStatus: string;
  tag: string;
  conversationStatus: "open" | "closed" | "human-handoff";
};

const emptyForm: FormState = {
  name: "",
  description: "",
  enabled: true,
  priority: "0",
  matchType: "any",
  keywords: "",
  responseText: "",
  actionType: "send_reply",
  serviceCategory: "general",
  leadStatus: "new",
  tag: "",
  conversationStatus: "open",
};

const inputClass = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500";
const buttonClass = "rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white";

function formFromRule(rule: Rule): FormState {
  const config = rule.action_config ?? {};
  const status = typeof config.status === "string" ? config.status : "new";
  return {
    name: rule.name,
    description: rule.description ?? "",
    enabled: rule.enabled,
    priority: String(rule.priority),
    matchType: rule.match_type,
    keywords: rule.keywords.join(", "),
    responseText: rule.response_text ?? "",
    actionType: rule.action_type,
    serviceCategory: typeof config.serviceCategory === "string" ? config.serviceCategory : "general",
    leadStatus: status,
    tag: typeof config.tag === "string" ? config.tag : "",
    conversationStatus: status === "closed" || status === "human-handoff" ? status : "open",
  };
}

function actionConfig(form: FormState): Record<string, unknown> {
  if (form.actionType === "create_lead" || form.actionType === "update_lead") {
    return { serviceCategory: form.serviceCategory.trim() || "general", status: form.leadStatus };
  }
  if (form.actionType === "change_status") return { status: form.conversationStatus };
  if (form.actionType === "add_tag") return { tag: form.tag.trim() };
  return {};
}

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState("I need a website for my business");
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadRules() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ rules: Rule[] }>("/api/automation/rules");
      setRules(data.rules ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automation rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRules();
  }, []);

  function reset() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function edit(rule: Rule) {
    setEditingId(rule.id);
    setForm(formFromRule(rule));
    setNotice("");
    setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      enabled: form.enabled,
      priority: Number(form.priority) || 0,
      matchType: form.matchType,
      keywords: form.keywords.split(",").map((x) => x.trim()).filter(Boolean),
      responseText: form.responseText.trim() || null,
      actionType: form.actionType,
      actionConfig: actionConfig(form),
    };
    try {
      if (editingId) {
        await apiFetch(`/api/automation/rules/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setNotice("Automation rule updated.");
      } else {
        await apiFetch("/api/automation/rules", { method: "POST", body: JSON.stringify(payload) });
        setNotice("Automation rule created.");
      }
      reset();
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save automation rule.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(rule: Rule) {
    try {
      await apiFetch(`/api/automation/rules/${rule.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !rule.enabled }) });
      setNotice(rule.enabled ? "Rule disabled." : "Rule enabled.");
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rule.");
    }
  }

  async function remove(rule: Rule) {
    if (!window.confirm(`Delete "${rule.name}"?`)) return;
    try {
      await apiFetch(`/api/automation/rules/${rule.id}`, { method: "DELETE" });
      if (editingId === rule.id) reset();
      setNotice("Automation rule deleted.");
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule.");
    }
  }

  async function test(event: FormEvent) {
    event.preventDefault();
    setTesting(true);
    setError("");
    setTestResult(null);
    try {
      setTestResult(await apiFetch<Record<string, unknown>>("/api/automation/test", {
        method: "POST",
        body: JSON.stringify({ message: testMessage }),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test rules.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <p className="text-sm text-slate-400">Business automation</p>
            <h1 className="mt-1 text-2xl font-bold">Automation</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">Create predictable rules that turn customer messages into business actions.</p>
          </header>

          <div className="p-6 md:p-10">
            {(error || notice) && <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`}>{error || notice}</div>}

            <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
              <section className="rounded-xl border border-slate-800 bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-800 p-5">
                  <div><h2 className="font-semibold">Automation rules</h2><p className="mt-1 text-sm text-slate-400">Higher priority rules are evaluated first.</p></div>
                  <button type="button" onClick={reset} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950">+ New rule</button>
                </div>
                <div className="p-5">
                  {loading ? <p className="py-10 text-center text-sm text-slate-400">Loading rules...</p> : rules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center"><p className="font-medium">No automation rules yet</p><p className="mt-1 text-sm text-slate-400">Create your first rule to automate enquiries.</p></div>
                  ) : (
                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <article key={rule.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">{rule.name}</h3>
                                <span className={`rounded-full px-2.5 py-1 text-xs ${rule.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>{rule.enabled ? "Enabled" : "Disabled"}</span>
                                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">Priority {rule.priority}</span>
                              </div>
                              <p className="mt-2 text-sm text-slate-400">{rule.description || "No description"}</p>
                              <div className="mt-3 flex flex-wrap gap-2">{rule.keywords.map((keyword) => <span key={keyword} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">{keyword}</span>)}</div>
                              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">{rule.match_type} → {rule.action_type.replaceAll("_", " ")}</p>
                              {rule.response_text && <p className="mt-2 rounded-lg bg-slate-900 p-3 text-xs text-slate-400">Reply: {rule.response_text}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => void toggle(rule)} className={buttonClass}>{rule.enabled ? "Disable" : "Enable"}</button>
                              <button type="button" onClick={() => edit(rule)} className={buttonClass}>Edit</button>
                              <button type="button" onClick={() => void remove(rule)} className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">Delete</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="space-y-6">
                <section className="rounded-xl border border-slate-800 bg-slate-900">
                  <div className="border-b border-slate-800 p-5"><h2 className="font-semibold">{editingId ? "Edit rule" : "Create rule"}</h2><p className="mt-1 text-sm text-slate-400">Define the trigger and action.</p></div>
                  <form onSubmit={save} className="space-y-4 p-5">
                    <label className="block text-xs text-slate-400">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Website enquiry" /></label>
                    <label className="block text-xs text-slate-400">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass} /></label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-slate-400">Priority<input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass} /></label>
                      <label className="text-xs text-slate-400">Match<select value={form.matchType} onChange={(e) => setForm({ ...form, matchType: e.target.value as MatchType })} className={inputClass}><option value="any">Any keyword</option><option value="all">All keywords</option><option value="exact">Exact</option><option value="contains">Contains</option></select></label>
                    </div>
                    <label className="block text-xs text-slate-400">Keywords<input required value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className={inputClass} placeholder="website, web design" /></label>
                    <label className="block text-xs text-slate-400">Action<select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value as ActionType })} className={inputClass}>{(["send_reply", "create_lead", "update_lead", "change_status", "add_tag", "human_handoff"] as ActionType[]).map((action) => <option key={action} value={action}>{action.replaceAll("_", " ")}</option>)}</select></label>
                    {form.actionType === "send_reply" && <label className="block text-xs text-slate-400">Reply<textarea required value={form.responseText} onChange={(e) => setForm({ ...form, responseText: e.target.value })} rows={3} className={inputClass} placeholder="Thanks for your enquiry..." /></label>}
                    {(form.actionType === "create_lead" || form.actionType === "update_lead") && <><label className="block text-xs text-slate-400">Service category<input value={form.serviceCategory} onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })} className={inputClass} /></label><label className="block text-xs text-slate-400">Lead status<select value={form.leadStatus} onChange={(e) => setForm({ ...form, leadStatus: e.target.value })} className={inputClass}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="converted">Converted</option><option value="lost">Lost</option></select></label></>}
                    {form.actionType === "change_status" && <label className="block text-xs text-slate-400">Conversation status<select value={form.conversationStatus} onChange={(e) => setForm({ ...form, conversationStatus: e.target.value as FormState["conversationStatus"] })} className={inputClass}><option value="open">Open</option><option value="human-handoff">Human handoff</option><option value="closed">Closed</option></select></label>}
                    {form.actionType === "add_tag" && <label className="block text-xs text-slate-400">Tag<input required value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className={inputClass} placeholder="vip" /></label>}
                    <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enable rule</label>
                    <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update rule" : "Create rule"}</button>{editingId && <button type="button" onClick={reset} className={buttonClass}>Cancel</button>}</div>
                  </form>
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-900">
                  <div className="border-b border-slate-800 p-5"><h2 className="font-semibold">Test automation</h2><p className="mt-1 text-sm text-slate-400">Preview which rule matches a message.</p></div>
                  <form onSubmit={test} className="p-5"><textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} rows={3} className={inputClass} /><button disabled={testing || !testMessage.trim()} className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">{testing ? "Testing..." : "Test rules"}</button>{testResult && <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">{JSON.stringify(testResult, null, 2)}</pre>}</form>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
