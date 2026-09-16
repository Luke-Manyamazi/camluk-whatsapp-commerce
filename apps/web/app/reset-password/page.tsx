"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 12;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setReady(Boolean(data.session));
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY") {
        setReady(Boolean(session));
      }
    });

    void checkRecoverySession();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setMessage("Your password has been updated. You can now sign in with your new password.");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white">Password reset</h1>
          <p className="mt-2 text-sm text-slate-400">
            This reset link is invalid, expired, or has already been used.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block text-sm text-slate-300 underline-offset-4 hover:text-white hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Use a strong password you do not reuse on another service.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-slate-500"
            />
            <p className="mt-2 text-xs text-slate-500">At least {MIN_PASSWORD_LENGTH} characters.</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-300">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-slate-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-emerald-900 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}

          {message ? (
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full rounded-lg bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-200"
            >
              Return to sign in
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
