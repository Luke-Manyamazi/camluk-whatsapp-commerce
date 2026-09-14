"use client";

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
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
    leadStatus: typeof config.status === "string" ? config.status : "new",
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

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-500 focus:ring-1 focus:ring-slate-500";
const buttonClass =
  "rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white";

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
    setForm({ ...emptyForm });
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
    setError("");
    try {
      await apiFetch<RuleResponse>(`/api/automation/rules/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      setNotice(rule.enabled ? "Automation rule disabled." : "Automation rule enabled.");
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
    setNotice("");
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <p className="text-sm font-medium text-slate-400">Business automation</p>
            <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-2xl font-bold text-white">Automation</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-400">
                  Turn customer messages into predictable business actions without AI API costs.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
                Rules-based automation
              </div>
            </div>
          </header>

          <div className="p-6 md:p-10">
            {(error || notice) && (
              <div
                className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                  error
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {error || notice}
              </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-900">
                <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Automation rules</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Higher priority rules are evaluated first.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                  >
                    + New rule
                  </button>
                </div>

                <div className="p-5">
                  {loading ? (
                    <div className="py-10 text-center text-sm text-slate-400">Loading rules...</div>
                  ) : rules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
                      <p className="font-medium text-white">No automation rules yet</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Create your first rule to start automating enquiries.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-slate-700"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-white">{rule.name}</h3>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                    rule.enabled
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                      : "border-slate-700 bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {rule.enabled ? "Enabled" : "Disabled"}
                                </span>
                                <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                                  Priority {rule.priority}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-slate-400">
                                {rule.description || "No description"}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {rule.keywords.map((keyword) => (
                                  <span
                                    key={keyword}
                                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                                {rule.match_type} <span className="px-1 text-slate-600">→</span> {rule.action_type.replaceAll("_", " ")}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                              <button type="button" onClick={() => void toggleRule(rule)} className={buttonClass}>
                                {rule.enabled ? "Disable" : "Enable"}
                              </button>
                              <button type="button" onClick={() => editRule(rule)} className={buttonClass}>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteRule(rule)}
                                className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900">
                <div className="border-b border-slate-800 p-5">
                  <h2 className="text-lg font-semibold text-white">{editingId ? "Edit rule" : "Create rule"}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Define when the rule runs and what it should do.
                  </p>
                </div>

                <form onSubmit={saveRule} className="space-y-4 p-5">
                  <label className="block text-xs font-medium text-slate-400">
                    Rule name
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Website enquiry"
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-400">
                    Description
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe what this rule handles"
                      rows={2}
                      className={inputClass}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-medium text-slate-400">
                      Priority
                      <input
                        type="number"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-400">
                      Match
                      <select
                        value={form.matchType}
                        onChange={(e) => setForm({ ...form, matchType: e.target.value as MatchType })}
                        className={inputClass}
                      >
                        <option value="any">Any keyword</option>
                        <option value="all">All keywords</option>
                        <option value="exact">Exact</option>
                        <option value="contains">Contains</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-medium text-slate-400">
                    Keywords <span className="font-normal text-slate-600">comma separated</span>
                    <input
                      required
                      value={form.keywords}
                      onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                      placeholder="website, web design"
                      className={inputClass}
                    />
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                    />
                    <span>
                      <span className="block font-medium text-white">Rule enabled</span>
                      <span className="text-xs text-slate-500">Run this rule when matching messages arrive.</span>
                    </span>
                  </label>

                  <label className="block text-xs font-medium text-slate-400">
                    Action
                    <select
                      value={form.actionType}
                      onChange={(e) => setForm({ ...form, actionType: e.target.value as ActionType })}
                      className={inputClass}
                    >
                      <option value="send_reply">Send reply</option>
                      <option value="create_lead">Create lead</option>
                      <option value="update_lead">Update lead</option>
                      <option value="change_status">Change status</option>
                      <option value="add_tag">Add tag</option>
                      <option value="human_handoff">Human handoff</option>
                    </select>
                  </label>

                  {(form.actionType === "send_reply" || form.actionType === "create_lead" || form.actionType === "human_handoff") && (
                    <label className="block text-xs font-medium text-slate-400">
                      Response text
                      <textarea
                        value={form.responseText}
                        onChange={(e) => setForm({ ...form, responseText: e.target.value })}
                        rows={3}
                        placeholder="Automatic response"
                        className={inputClass}
                      />
                    </label>
                  )}

                  {(form.actionType === "create_lead" || form.actionType === "update_lead") && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-medium text-slate-400">
                        Service category
                        <input
                          value={form.serviceCategory}
                          onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })}
                          className={inputClass}
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-400">
                        Lead status
                        <select
                          value={form.leadStatus}
                          onChange={(e) => setForm({ ...form, leadStatus: e.target.value })}
                          className={inputClass}
                        >
                          <option value="new">New</option>
                          <option value="qualified">Qualified</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {form.actionType === "change_status" && (
                    <label className="block text-xs font-medium text-slate-400">
                      Conversation status
                      <select
                        value={form.conversationStatus}
                        onChange={(e) => setForm({ ...form, conversationStatus: e.target.value as FormState["conversationStatus"] })}
                        className={inputClass}
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="human-handoff">Human handoff</option>
                      </select>
                    </label>
                  )}

                  {form.actionType === "add_tag" && (
                    <label className="block text-xs font-medium text-slate-400">
                      Tag
                      <input
                        value={form.tag}
                        onChange={(e) => setForm({ ...form, tag: e.target.value })}
                        placeholder="hot-lead"
                        className={inputClass}
                      />
                    </label>
                  )}

                  <div className="flex gap-2 border-t border-slate-800 pt-4">
                    <button
                      disabled={saving}
                      type="submit"
                      className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : editingId ? "Update rule" : "Create rule"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 p-5">
                <h2 className="text-lg font-semibold text-white">Test automation</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Test a message against your active rules without changing customer data.
                </p>
              </div>
              <div className="p-5">
                <form onSubmit={testRules} className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className={`${inputClass} mt-0 flex-1`}
                    placeholder="Type a customer message"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                  >
                    Test rule
                  </button>
                </form>
                {testResult && (
                  <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-300">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
