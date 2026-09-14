"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type ActionType =
  | "send_reply"
  | "create_lead"
  | "update_lead"
  | "change_status"
  | "add_tag"
  | "human_handoff";

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
  created_at: string;
  updated_at: string;
};

type RulesResponse = { rules: Rule[] };
type RuleResponse = { rule: Rule };

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

function formFromRule(rule: Rule): FormState {
  const config = rule.action_config ?? {};
  return {
    name: rule.name,
    description: rule.description ?? "",
    enabled: rule.enabled,
    priority: String(rule.priority),
    matchType: rule.match_type,
    keywords: rule.keywords.join(", "),
    responseText: rule.response_text ?? "",
    actionType: rule.action_type,
    serviceCategory:
      typeof config.serviceCategory === "string" ? config.serviceCategory : "general",
    leadStatus:
      typeof config.status === "string" ? config.status : "new",
    tag: typeof config.tag === "string" ? config.tag : "",
    conversationStatus:
      config.status === "closed" || config.status === "human-handoff"
        ? config.status
        : "open",
  };
}

function buildActionConfig(form: FormState): Record<string, unknown> {
  if (form.actionType === "create_lead") {
    return {
      serviceCategory: form.serviceCategory.trim() || "general",
      status: form.leadStatus,
    };
  }

  if (form.actionType === "update_lead") {
    return {
      status: form.leadStatus,
      serviceCategory: form.serviceCategory.trim() || "general",
    };
  }

  if (form.actionType === "change_status") {
    return { status: form.conversationStatus };
  }

  if (form.actionType === "add_tag") {
    return { tag: form.tag.trim() };
  }

  return {};
}

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState("I need a website for my business");
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadRules() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<RulesResponse>("/api/automation/rules");
      setRules(data.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automation rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRules();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function editRule(rule: Rule) {
    setEditingId(rule.id);
    setForm(formFromRule(rule));
    setNotice("");
    setError("");
  }

  async function saveRule(event: FormEvent) {
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
      keywords: form.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      responseText: form.responseText.trim() || null,
      actionType: form.actionType,
      actionConfig: buildActionConfig(form),
    };

    try {
      if (editingId) {
        await apiFetch<RuleResponse>(`/api/automation/rules/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setNotice("Automation rule updated.");
      } else {
        await apiFetch<RuleResponse>("/api/automation/rules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Automation rule created.");
      }
      resetForm();
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save automation rule.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRule(rule: Rule) {
    try {
      await apiFetch<RuleResponse>(`/api/automation/rules/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rule.");
    }
  }

  async function deleteRule(rule: Rule) {
    if (!window.confirm(`Delete "${rule.name}"?`)) return;
    try {
      await apiFetch(`/api/automation/rules/${rule.id}`, { method: "DELETE" });
      if (editingId === rule.id) resetForm();
      setNotice("Automation rule deleted.");
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule.");
    }
  }

  async function testRules(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await apiFetch<Record<string, unknown>>("/api/automation/test", {
        method: "POST",
        body: JSON.stringify({ message: testMessage }),
      });
      setTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test rules.");
    }
  }

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-medium text-slate-500">Business automation</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Automation</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Create rules that turn customer messages into predictable business actions without AI API costs.
        </p>
      </header>

      {(error || notice) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error || notice}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Rules</h2>
              <p className="text-sm text-slate-500">Higher priority rules are evaluated first.</p>
            </div>
            <button onClick={resetForm} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              New rule
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading rules...</p>
          ) : rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="font-medium text-slate-800">No automation rules yet</p>
              <p className="mt-1 text-sm text-slate-500">Create your first rule to start automating enquiries.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Priority {rule.priority}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{rule.description || "No description"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {rule.keywords.map((keyword) => (
                          <span key={keyword} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{keyword}</span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {rule.match_type} → {rule.action_type}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => void toggleRule(rule)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        {rule.enabled ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => editRule(rule)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                      <button onClick={() => void deleteRule(rule)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit rule" : "Create rule"}</h2>
          <form onSubmit={saveRule} className="mt-5 space-y-4">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rule name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-600">Priority<input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-medium text-slate-600">Match<select value={form.matchType} onChange={(e) => setForm({ ...form, matchType: e.target.value as MatchType })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="any">Any keyword</option><option value="all">All keywords</option><option value="exact">Exact</option><option value="contains">Contains</option></select></label>
            </div>
            <label className="text-xs font-medium text-slate-600">Keywords <span className="font-normal text-slate-400">comma separated</span><input required value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="website, web design" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Rule enabled</label>
            <label className="text-xs font-medium text-slate-600">Action<select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value as ActionType })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="send_reply">Send reply</option><option value="create_lead">Create lead</option><option value="update_lead">Update lead</option><option value="change_status">Change status</option><option value="add_tag">Add tag</option><option value="human_handoff">Human handoff</option></select></label>

            {(form.actionType === "send_reply" || form.actionType === "create_lead" || form.actionType === "human_handoff") && (
              <label className="text-xs font-medium text-slate-600">Response text<textarea value={form.responseText} onChange={(e) => setForm({ ...form, responseText: e.target.value })} rows={3} placeholder="Automatic response" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            )}

            {(form.actionType === "create_lead" || form.actionType === "update_lead") && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-slate-600">Service category<input value={form.serviceCategory} onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                <label className="text-xs font-medium text-slate-600">Lead status<select value={form.leadStatus} onChange={(e) => setForm({ ...form, leadStatus: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="new">New</option><option value="qualified">Qualified</option><option value="contacted">Contacted</option><option value="converted">Converted</option><option value="lost">Lost</option></select></label>
              </div>
            )}

            {form.actionType === "change_status" && (
              <label className="text-xs font-medium text-slate-600">Conversation status<select value={form.conversationStatus} onChange={(e) => setForm({ ...form, conversationStatus: e.target.value as FormState["conversationStatus"] })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="open">Open</option><option value="closed">Closed</option><option value="human-handoff">Human handoff</option></select></label>
            )}

            {form.actionType === "add_tag" && (
              <label className="text-xs font-medium text-slate-600">Tag<input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="hot-lead" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            )}

            <label className="text-xs font-medium text-slate-600">Reply message<textarea value={form.responseText} onChange={(e) => setForm({ ...form, responseText: e.target.value })} rows={3} placeholder="Thanks for contacting Camluk..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>

            <div className="flex gap-2 pt-2">
              <button disabled={saving} type="submit" className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update rule" : "Create rule"}</button>
              {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>}
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Test automation</h2>
        <form onSubmit={testRules} className="mt-4 flex flex-col gap-3 md:flex-row">
          <input value={testMessage} onChange={(e) => setTestMessage(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Type a customer message" />
          <button type="submit" className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700">Test</button>
        </form>
        {testResult && <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(testResult, null, 2)}</pre>}
      </section>
    </main>
  );
}
