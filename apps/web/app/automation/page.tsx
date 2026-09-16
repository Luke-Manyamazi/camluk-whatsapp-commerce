"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { apiFetch } from "@/lib/api";

type Rule = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  priority: number;
  match_type: string;
  keywords: string[];
  response_text: string | null;
  action_type: string;
};

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ rules: Rule[] }>("/api/automation/rules");
        setRules(data.rules ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load automation.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <p className="text-sm text-slate-400">Business automation</p>
            <h1 className="mt-1 text-2xl font-bold">Automation</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">Camluk handles the rules that turn customer messages into useful business actions.</p>
          </header>

          <div className="p-6 md:p-10">
            <div className="max-w-5xl space-y-6">
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

              <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Managed automation</p>
                    <h2 className="mt-2 text-xl font-semibold">Your business automation is configured for you.</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Camluk configures triggers, replies, lead handling, customer actions and human handoff based on how your business operates. You can review what is active below.</p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-center">
                    <p className="text-2xl font-bold">{loading ? "—" : rules.filter((rule) => rule.enabled).length}</p>
                    <p className="text-xs text-slate-500">active automations</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">What Camluk is handling</h2>
                    <p className="mt-1 text-sm text-slate-400">These rules run automatically when matching customer messages arrive.</p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400">Camluk managed</span>
                </div>

                {loading ? (
                  <p className="py-10 text-center text-sm text-slate-500">Loading automation...</p>
                ) : rules.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">No automation has been configured yet. Contact Camluk to set up your first workflow.</div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {rules.map((rule) => (
                      <article key={rule.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{rule.name}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-xs ${rule.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>{rule.enabled ? "Active" : "Paused"}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-400">{rule.description || "Configured automation for your business."}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {rule.keywords.map((keyword) => <span key={keyword} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400">{keyword}</span>)}
                            </div>
                          </div>
                          <div className="shrink-0 text-left md:text-right">
                            <p className="text-xs uppercase tracking-wide text-slate-600">Action</p>
                            <p className="mt-1 text-sm capitalize text-slate-300">{rule.action_type.replaceAll("_", " ")}</p>
                          </div>
                        </div>
                        {rule.response_text && <div className="mt-4 rounded-lg bg-slate-900 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-600">Customer reply</p><p className="mt-1 text-sm text-slate-400">{rule.response_text}</p></div>}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="font-semibold">Need a change?</h2>
                <p className="mt-1 text-sm text-slate-400">Tell Camluk what you want your WhatsApp assistant to do differently. We can configure the automation without exposing the technical rule builder to your team.</p>
                <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                  Examples: add a new enquiry type, change an automated reply, create a different lead workflow, or route a conversation to a person.
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
