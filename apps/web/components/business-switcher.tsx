"use client";

import { useEffect, useState } from "react";
import { apiFetch, getActiveBusinessId, setActiveBusinessId } from "@/lib/api";

type Business = { id: string; name: string; slug: string; status: string; role: string };

type BusinessesResponse = { businesses: Business[] };

export default function BusinessSwitcher() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void apiFetch<BusinessesResponse>("/api/businesses")
      .then(({ businesses: available }) => {
        if (!mounted) return;
        const active = getActiveBusinessId();
        const firstActive = available.find((business) => business.status === "active");
        const selected = available.some((business) => business.id === active && business.status === "active")
          ? active
          : firstActive?.id ?? null;
        setBusinesses(available);
        setActiveId(selected);
        if (selected && selected !== active) setActiveBusinessId(selected);
      })
      .catch(() => {
        if (mounted) setBusinesses([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail;
      setActiveId(detail);
    };
    window.addEventListener("camluk:business-changed", onChange);
    return () => {
      mounted = false;
      window.removeEventListener("camluk:business-changed", onChange);
    };
  }, []);

  if (loading || businesses.length <= 1) return null;

  function handleChange(value: string) {
    setActiveBusinessId(value);
    setActiveId(value);
    window.location.reload();
  }

  return (
    <div className="border-b border-slate-800 bg-slate-950 px-4 py-2">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <label htmlFor="business-switcher" className="text-xs font-medium text-slate-500">
          Workspace
        </label>
        <select
          id="business-switcher"
          value={activeId ?? ""}
          onChange={(event) => handleChange(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none focus:border-slate-500"
        >
          {businesses.filter((business) => business.status === "active").map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
