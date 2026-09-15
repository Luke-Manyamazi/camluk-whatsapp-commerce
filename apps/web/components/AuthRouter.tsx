"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuthRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setReady(true);
      const hasSession = Boolean(data.session);
      if (!hasSession && pathname !== "/login") router.replace("/login");
      if (hasSession && pathname === "/login") router.replace("/");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setReady(true);
      if (!session && pathname !== "/login") router.replace("/login");
      if (session && pathname === "/login") router.replace("/");
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [pathname, router]);

  if (!ready && pathname !== "/login") return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Checking authentication...</main>;
  return <>{children}</>;
}
