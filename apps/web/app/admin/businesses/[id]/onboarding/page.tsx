"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Onboarding = {
  business_details_completed: boolean;
  workspace_completed: boolean;
  services_completed: boolean;
  whatsapp_completed: boolean;
  automation_completed: boolean;
  verification_completed: boolean;
  completed_at: string | null;
};

type Readiness = {
  business: { id: string; name: string; status: string };
  checks: Record<string, boolean>;
  counts: { services: number; whatsappChannels: number; activeAutomationRules: number };
};

type Step = {
  key: keyof Omit<Onboarding, "completed_at">;
  title: string;
  description: string;
  check: string | null;
};

const steps: Step[] = [
  {
    key: "business_details_completed",
    title: "Business details",
    description: "Confirm the business profile and contact information.",
    check: "business_details",
  },
  {
    key: "workspace_completed",
    title: "Workspace",
    description: "Confirm the owner and workspace access are ready.",
    check: "workspace",
  },
  {
    key: "services_completed",
    title: "Services",
    description: "Add at least one service or product the business offers.",
    check: "services",
  },
  {
    key: "whatsapp_completed",
    title: "WhatsApp",
    description: "Connect and verify the business WhatsApp channel.",
    check: "whatsapp",
  },
  {
    key: "automation_completed",
    title: "Automation",
    description: "Configure at least one active customer-message rule.",
    check: "automation",
  },
  {
    key: "verification_completed",
    title: "Test & go live",
    description: "Run the production verification checks before handing over the workspace.",
    check: null,
  },
];

export default function BusinessOnboardingPage() {
  const { id } = useParams<{ id: string }>();
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await apiFetch<{ onboarding: Onboarding; readiness: Readiness }>(
          `/api/platform/onboarding/${id}`,
        );
        if (!cancelled) {
          setOnboarding(result.onboarding);
          setReadiness(result.readiness);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load onboarding.");
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function refresh() {
    const result = await apiFetch<{ onboarding: Onboarding; readiness: Readiness }>(
      `/api/platform/onboarding/${id}`,
    );
    setOnboarding(result.onboarding);
    setReadiness(result.readiness);
  }

  async function markComplete(key: Step["key"]) {
    try {
      setSaving(key);
      setError("");
      const result = await apiFetch<{ onboarding: Onboarding }>(
        `/api/platform/onboarding/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ [key]: true }),
        },
      );
      setOnboarding(result.onboarding);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update onboarding.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading onboarding...</main>;
  }

  if (!onboarding || !readiness) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-red-300">
        {error || "Business not found."}
      </main>
    );
  }

  const derived = steps.map((step) => ({
    ...step,
    complete: step.check
      ? Boolean(onboarding[step.key]) || Boolean(readiness.checks[step.check])
      : Boolean(onboarding[step.key]),
  }));
  const completed = derived.filter((step) => step.complete).length;
  const allReady = completed === steps.length;
  const businessHref = `/admin/businesses/${id}`;
  const configHref = `${businessHref}/configuration`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href={businessHref} className="text-xs text-slate-400 hover:text-white">
            ← Business
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                Business onboarding
              </p>
              <h1 className="mt-1 text-2xl font-bold">Set up {readiness.business.name}</h1>
              <p className="mt-1 text-sm text-slate-400">
                Complete the setup once, verify it, then hand the workspace over to the business.
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-2 text-xs font-medium ${
                allReady
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              {allReady ? "Ready" : `${completed} of ${steps.length} complete`}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Setup progress</h2>
              <p className="mt-1 text-sm text-slate-400">
                Camluk-managed setup checklist for this tenant.
              </p>
            </div>
            <span className="text-sm text-slate-400">
              {completed}/{steps.length}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>
        </section>

        <section className="space-y-3">
          {derived.map((step, index) => (
            <div key={step.key} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    step.complete
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-700 bg-slate-950 text-slate-500"
                  }`}
                >
                  {step.complete ? "✓" : index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{step.title}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] ${
                        step.complete
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {step.complete ? "Complete" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{step.description}</p>
                  {step.key === "services_completed" && (
                    <p className="mt-2 text-xs text-slate-500">
                      {readiness.counts.services} service(s) configured.
                    </p>
                  )}
                  {step.key === "whatsapp_completed" && (
                    <p className="mt-2 text-xs text-slate-500">
                      {readiness.counts.whatsappChannels} active WhatsApp channel(s).
                    </p>
                  )}
                  {step.key === "automation_completed" && (
                    <p className="mt-2 text-xs text-slate-500">
                      {readiness.counts.activeAutomationRules} active automation rule(s).
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href={step.key === "whatsapp_completed" || step.key === "automation_completed" ? configHref : businessHref}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    {step.complete ? "View" : "Open"} →
                  </Link>
                  {!step.complete && (
                    <button
                      disabled={saving === step.key}
                      onClick={() => void markComplete(step.key)}
                      className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {saving === step.key ? "Saving..." : "Mark complete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section
          id="verification"
          className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Test & go live
          </p>
          <h2 className="mt-1 font-semibold">Final verification</h2>
          <p className="mt-2 text-sm text-slate-400">
            Before marking this complete, verify the actual production path: inbound WhatsApp →
            customer → conversation → automation → outbound reply → sent/delivered/read callbacks.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-medium">Business status</p>
              <p className="mt-1 text-xs capitalize text-slate-500">{readiness.business.status}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-medium">WhatsApp channels</p>
              <p className="mt-1 text-xs text-slate-500">
                {readiness.counts.whatsappChannels} active
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={saving === "verification_completed"}
              onClick={() => void markComplete("verification_completed")}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {saving === "verification_completed"
                ? "Saving..."
                : onboarding.verification_completed
                  ? "Verification complete"
                  : "Mark verification complete"}
            </button>
            {allReady && (
              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                🟢 Business ready for handover
              </span>
            )}
          </div>
        </section>

        {onboarding.completed_at && (
          <p className="text-center text-xs text-slate-600">
            Onboarding completed {new Date(onboarding.completed_at).toLocaleString()}.
          </p>
        )}
      </div>
    </main>
  );
}
