"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearActiveBusinessId } from "@/lib/api";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      return;
    }

    clearActiveBusinessId();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loading}
      aria-label="Log out"
      className={compact
        ? "rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        : "w-full rounded-lg border border-slate-700 px-4 py-3 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"}
    >
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}
