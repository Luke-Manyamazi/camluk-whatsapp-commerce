"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Rule = { id: string; name: string; enabled: boolean };
type RulesResponse = { rules: Rule[] };

type Settings = {
  phone: string;
  email: string;
  address: string;
  website: string;
  automation_enabled: boolean;
  default_response: string;
  human_handoff_message: string;
  auto_create_leads: boolean;
  default_lead_status: string;
  ai_fallback_enabled: boolean;
  ai_provider: string;
};

type SettingsResponse = { settings: Settings };

const defaults: Settings = {
  phone: "",
  email: "",
  address: "",
  website: "",
  automation_enabled: true,
  default_response: "Thanks for contacting Camluk Technologies. We have received your message and will get back to you shortly.",
  human_handoff_message: "Thanks. I’m connecting you with a member of the Camluk Technologies team.",
  auto_create_leads: true,
  default_lead_status: "new",
  ai_fallback_enabled: false,
  ai_provider: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [settingsData, rulesData] = await Promise.all([
          apiFetch<SettingsResponse>("/api/settings"),
          apiFetch<RulesResponse>("/api/automation/rules"),
        ]);
        setSettings(settingsData.settings);
        setRules(rulesData.rules);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const data = await apiFetch<SettingsResponse>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettings(data.settings);
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-medium text-slate-500">Workspace configuration</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Configure business details, automation defaults, channels and optional AI fallback.</p>
      </header>

      {(error || message) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || message}</div>}

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Business</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Phone<input value={settings.phone} onChange={(e) => update("phone", e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Business phone" /></label>
            <label className="text-sm font-medium text-slate-700">Email<input type="email" value={settings.email} onChange={(e) => update("email", e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Business email" /></label>
            <label className="text-sm font-medium text-slate-700">Website<input type="url" value={settings.website} onChange={(e) => update("website", e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="https://..." /></label>
            <label className="text-sm font-medium text-slate-700">Address<input value={settings.address} onChange={(e) => update("address", e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Business address" /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Automation</h2>
          <p className="mt-1 text-sm text-slate-500">Rules are the default automation layer and do not require AI API calls.</p>
          <div className="mt-5 space-y-5">
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-medium text-slate-800">Enable automation</span><span className="text-xs text-slate-500">Evaluate enabled rules for incoming messages.</span></span><input type="checkbox" checked={settings.automation_enabled} onChange={(e) => update("automation_enabled", e.target.checked)} /></label>
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-medium text-slate-800">Auto-create leads</span><span className="text-xs text-slate-500">Allow create_lead rules to create customer leads.</span></span><input type="checkbox" checked={settings.auto_create_leads} onChange={(e) => update("auto_create_leads", e.target.checked)} /></label>
            <label className="block text-sm font-medium text-slate-700">Default response<textarea value={settings.default_response} onChange={(e) => update("default_response", e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="block text-sm font-medium text-slate-700">Human handoff message<textarea value={settings.human_handoff_message} onChange={(e) => update("human_handoff_message", e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="block text-sm font-medium text-slate-700">Default lead status<select value={settings.default_lead_status} onChange={(e) => update("default_lead_status", e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="new">New</option><option value="qualified">Qualified</option><option value="contacted">Contacted</option><option value="converted">Converted</option><option value="lost">Lost</option></select></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Channels</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-medium text-slate-800">Website</p><p className="text-xs text-slate-500">Available for website enquiry integration.</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Available</span></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-medium text-slate-800">WhatsApp</p><p className="text-xs text-slate-500">Meta developer onboarding is currently paused.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Not connected</span></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">AI fallback</h2>
          <p className="mt-1 text-sm text-slate-500">Optional future fallback for messages that rules cannot confidently handle.</p>
          <label className="mt-5 flex items-center justify-between gap-4"><span><span className="block text-sm font-medium text-slate-800">Enable AI fallback</span><span className="text-xs text-slate-500">Off by default to keep automation costs predictable.</span></span><input type="checkbox" checked={settings.ai_fallback_enabled} onChange={(e) => update("ai_fallback_enabled", e.target.checked)} /></label>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Provider: {settings.ai_provider || "None configured"} · API key: Not stored in business settings</div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Automation status</h2>
          <p className="mt-1 text-sm text-slate-500">{loading ? "Loading..." : `${rules.filter((rule) => rule.enabled).length} enabled of ${rules.length} rules`}</p>
        </section>

        <button disabled={saving || loading} type="submit" className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">{saving ? "Saving..." : "Save settings"}</button>
      </form>
    </main>
  );
}
