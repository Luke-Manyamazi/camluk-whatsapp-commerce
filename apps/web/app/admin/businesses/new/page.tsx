"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface OnboardingResult {
  business: { id: string; name: string; slug: string; created_at: string };
  owner: { userId: string; name: string; email: string; role: "owner" };
  credentials: { email: string; temporaryPassword: string; note: string };
}

export default function NewBusinessPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const onboarding = await apiFetch<OnboardingResult>("/api/admin/onboarding", {
        method: "POST",
        body: JSON.stringify({ businessName, slug, ownerName, ownerEmail }),
      });
      setResult(onboarding);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to complete onboarding.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8 md:p-10">
        <div className="mx-auto max-w-2xl">
          <Link href="/admin/businesses" className="text-xs text-slate-500 hover:text-white">← Businesses</Link>
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Onboarding complete</p>
            <h1 className="mt-2 text-2xl font-bold">{result.business.name}</h1>
            <p className="mt-1 text-sm text-slate-400">Owner account created and linked to this business.</p>

            <div className="mt-6 space-y-4 rounded-lg border border-slate-800 bg-slate-950 p-5">
              <div>
                <p className="text-xs text-slate-500">Owner</p>
                <p className="mt-1 font-medium">{result.owner.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Login email</p>
                <p className="mt-1 font-mono text-sm">{result.credentials.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Temporary password</p>
                <p className="mt-1 break-all rounded bg-slate-900 p-3 font-mono text-sm">{result.credentials.temporaryPassword}</p>
              </div>
              <p className="text-xs leading-5 text-amber-300">{result.credentials.note}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/admin/businesses/${result.business.id}`} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950">View business</Link>
              <Link href="/admin/businesses/new" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-white">Onboard another</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8 md:p-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/admin/businesses" className="text-xs text-slate-500 hover:text-white">← Businesses</Link>
        <h1 className="mt-4 text-3xl font-bold">Onboard a business</h1>
        <p className="mt-1 text-sm text-slate-400">Create the business, owner account and owner membership in one trusted workflow.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Business name</label>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="ABC Butchery" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-500" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Business slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} required placeholder="abc-butchery" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-500" />
          </div>
          <div className="border-t border-slate-800 pt-5">
            <p className="text-sm font-semibold text-white">Business owner</p>
            <p className="mt-1 text-xs text-slate-500">These details create the owner's Supabase Auth account and owner membership.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Owner name</label>
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required placeholder="Business Owner" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-500" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Owner email</label>
            <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required placeholder="owner@example.com" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-500" />
          </div>
          {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
          <button disabled={loading} className="w-full rounded-lg bg-white px-4 py-3 font-medium text-slate-950 disabled:opacity-50">{loading ? "Creating business and owner..." : "Create business & owner"}</button>
        </form>
      </div>
    </main>
  );
}
