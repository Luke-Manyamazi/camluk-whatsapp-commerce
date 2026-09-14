"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Sidebar from "../../components/Sidebar";

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

type SettingsResponse = { settings: Partial<Settings> | null };

const defaults: Settings = {
  phone: "",
  email: "",
  address: "",
  website: "",
  automation_enabled: true,
  default_response:
    "Thanks for contacting Camluk Technologies. We have received your message and will get back to you shortly.",
  human_handoff_message:
    "Thanks. I’m connecting you with a member of the Camluk Technologies team.",
  auto_create_leads: true,
  default_lead_status: "new",
  ai_fallback_enabled: false,
  ai_provider: "",
};

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeSettings(value: Partial<Settings> | null | undefined): Settings {
  return {
    phone: stringValue(value?.phone),
    email: stringValue(value?.email),
    address: stringValue(value?.address),
    website: stringValue(value?.website),
    automation_enabled:
      typeof value?.automation_enabled === "boolean"
        ? value.automation_enabled
        : defaults.automation_enabled,
    default_response: stringValue(value?.default_response, defaults.default_response),
    human_handoff_message: stringValue(
      value?.human_handoff_message,
      defaults.human_handoff_message
    ),
    auto_create_leads:
      typeof value?.auto_create_leads === "boolean"
        ? value.auto_create_leads
        : defaults.auto_create_leads,
    default_lead_status: stringValue(
      value?.default_lead_status,
      defaults.default_lead_status
    ),
    ai_fallback_enabled:
      typeof value?.ai_fallback_enabled === "boolean"
        ? value.ai_fallback_enabled
        : defaults.ai_fallback_enabled,
    ai_provider: stringValue(value?.ai_provider),
  };
}

const businessFields: Array<{
  label: string;
  key: keyof Pick<Settings, "phone" | "email" | "website" | "address">;
  type: string;
  placeholder: string;
}> = [
  { label: "Phone", key: "phone", type: "text", placeholder: "Business phone" },
  { label: "Email", key: "email", type: "email", placeholder: "Business email" },
  { label: "Website", key: "website", type: "url", placeholder: "https://..." },
  { label: "Address", key: "address", type: "text", placeholder: "Business address" },
];

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
        setSettings(normalizeSettings(settingsData.settings));
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
      setSettings(normalizeSettings(data.settings));
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <p className="text-sm font-medium text-slate-400">Workspace configuration</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Settings</h1>
            <p className="mt-1 text-sm text-slate-400">
              Configure business details, automation defaults, channels and optional AI fallback.
            </p>
          </header>

          <div className="p-6 md:p-10">
            {(error || message) && (
              <div
                className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                  error
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {error || message}
              </div>
            )}

            <form onSubmit={save} className="max-w-5xl space-y-6">
              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white">Business</h2>
                <p className="mt-1 text-sm text-slate-400">Your primary business contact details.</p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {businessFields.map((field) => (
                    <label key={field.key} className="text-sm font-medium text-slate-300">
                      {field.label}
                      <input
                        type={field.type}
                        value={stringValue(settings[field.key])}
                        onChange={(event) => update(field.key, event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-500"
                        placeholder={field.placeholder}
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white">Automation</h2>
                <p className="mt-1 text-sm text-slate-400">Rules are the default automation layer and do not require AI API calls.</p>

                <div className="mt-5 space-y-4">
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <span>
                      <span className="block text-sm font-medium text-slate-200">Enable automation</span>
                      <span className="text-xs text-slate-500">Evaluate enabled rules for incoming messages.</span>
                    </span>
                    <input type="checkbox" checked={settings.automation_enabled} onChange={(e) => update("automation_enabled", e.target.checked)} />
                  </label>

                  <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <span>
                      <span className="block text-sm font-medium text-slate-200">Auto-create leads</span>
                      <span className="text-xs text-slate-500">Allow create lead rules to create customer leads.</span>
                    </span>
                    <input type="checkbox" checked={settings.auto_create_leads} onChange={(e) => update("auto_create_leads", e.target.checked)} />
                  </label>

                  <label className="block text-sm font-medium text-slate-300">
                    Default response
                    <textarea value={stringValue(settings.default_response)} onChange={(e) => update("default_response", e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500" />
                  </label>

                  <label className="block text-sm font-medium text-slate-300">
                    Human handoff message
                    <textarea value={stringValue(settings.human_handoff_message)} onChange={(e) => update("human_handoff_message", e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500" />
                  </label>

                  <label className="block text-sm font-medium text-slate-300">
                    Default lead status
                    <select value={stringValue(settings.default_lead_status, "new")} onChange={(e) => update("default_lead_status", e.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500">
                      <option value="new">New</option>
                      <option value="qualified">Qualified</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white">Channels</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div><p className="font-medium text-slate-200">Website</p><p className="text-xs text-slate-500">Available for website enquiry integration.</p></div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">Available</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div><p className="font-medium text-slate-200">WhatsApp</p><p className="text-xs text-slate-500">Meta developer onboarding is currently paused.</p></div>
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">Not connected</span>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white">AI fallback</h2>
                <p className="mt-1 text-sm text-slate-400">Optional future fallback for messages that rules cannot confidently handle.</p>
                <label className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <span><span className="block text-sm font-medium text-slate-200">Enable AI fallback</span><span className="text-xs text-slate-500">Off by default to keep automation costs predictable.</span></span>
                  <input type="checkbox" checked={settings.ai_fallback_enabled} onChange={(e) => update("ai_fallback_enabled", e.target.checked)} />
                </label>
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">Provider: {stringValue(settings.ai_provider) || "None configured"} · API key: Not stored in business settings</div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white">Automation status</h2>
                <p className="mt-1 text-sm text-slate-400">{loading ? "Loading..." : `${rules.filter((rule) => rule.enabled).length} enabled of ${rules.length} rules`}</p>
              </section>

              <button disabled={saving || loading} type="submit" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50">
                {saving ? "Saving..." : "Save settings"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
