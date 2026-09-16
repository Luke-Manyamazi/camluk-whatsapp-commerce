"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Sidebar from "../../components/Sidebar";

type Settings = {
  phone: string;
  email: string;
  address: string;
  website: string;
  automation_enabled: boolean;
};

type SettingsResponse = { settings: Partial<Settings> | null };

const defaults: Settings = {
  phone: "",
  email: "",
  address: "",
  website: "",
  automation_enabled: true,
};

function normalize(value: Partial<Settings> | null | undefined): Settings {
  return {
    phone: typeof value?.phone === "string" ? value.phone : "",
    email: typeof value?.email === "string" ? value.email : "",
    address: typeof value?.address === "string" ? value.address : "",
    website: typeof value?.website === "string" ? value.website : "",
    automation_enabled: typeof value?.automation_enabled === "boolean" ? value.automation_enabled : defaults.automation_enabled,
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<SettingsResponse>("/api/settings");
        setSettings(normalize(data.settings));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update(key: keyof Settings, value: string | boolean) {
    setSettings((current) => ({ ...current, [key]: value } as Settings));
    setMessage("");
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await apiFetch<SettingsResponse>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettings(normalize(data.settings));
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    ["phone", "Phone", "text", "Business phone"],
    ["email", "Email", "email", "Business email"],
    ["website", "Website", "url", "https://..."],
    ["address", "Address", "text", "Business address"],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <p className="text-sm font-medium text-slate-400">Workspace preferences</p>
            <h1 className="mt-1 text-2xl font-bold">Settings</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">Manage the business information and simple preferences your team uses day to day.</p>
          </header>

          <div className="p-6 md:p-10">
            <div className="max-w-4xl space-y-6">
              {(error || message) && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`}>
                  {error || message}
                </div>
              )}

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">Business details</h2>
                <p className="mt-1 text-sm text-slate-400">These details can be used when Camluk communicates with your customers.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fields.map(([key, label, type, placeholder]) => (
                    <label key={key} className="text-sm font-medium text-slate-300">
                      {label}
                      <input
                        type={type}
                        value={settings[key]}
                        onChange={(event) => update(key, event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-slate-500"
                        placeholder={placeholder}
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">Automation</h2>
                <p className="mt-1 text-sm text-slate-400">Camluk manages the automation rules behind your workspace. You only need to decide whether automation is active.</p>
                <label className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span>
                    <span className="block text-sm font-medium">Enable automation</span>
                    <span className="mt-1 block text-xs text-slate-500">When enabled, Camluk evaluates the business automation configured for your workspace.</span>
                  </span>
                  <input type="checkbox" checked={settings.automation_enabled} onChange={(event) => update("automation_enabled", event.target.checked)} />
                </label>
                <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-slate-300">
                  <p className="font-medium text-white">Automation is managed for you</p>
                  <p className="mt-1 text-slate-400">Your Camluk setup team can configure rules, replies, lead handling, WhatsApp connections and other technical settings for your business.</p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">WhatsApp</h2>
                <p className="mt-1 text-sm text-slate-400">Your WhatsApp connection is managed by Camluk. You do not need to enter Meta API credentials here.</p>
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">WhatsApp Business connection</p>
                    <p className="mt-1 text-xs text-slate-500">Contact Camluk when you want to connect or change a WhatsApp Business number.</p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400">Camluk managed</span>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">AI</h2>
                <p className="mt-1 text-sm text-slate-400">AI is optional. If enabled for your business, Camluk configures the provider and protects the required credentials.</p>
                <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
                  AI fallback configuration is managed by Camluk and is not exposed as a business API-key setting.
                </div>
              </section>

              <div className="flex justify-end">
                <button disabled={saving || loading} type="button" onClick={() => void save()} className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">
                  {saving ? "Saving..." : "Save settings"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
