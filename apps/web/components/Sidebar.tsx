"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Business = {
  id: string;
  name: string;
  slug: string;
};

type BusinessesResponse = {
  businesses: Business[];
};

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Conversations", href: "/conversations" },
  { label: "Leads", href: "/leads" },
  { label: "Customers", href: "/customers" },
  { label: "Services", href: "/services" },
  { label: "Automation", href: "/automation" },
  { label: "Settings", href: "/settings" }
];

export default function Sidebar() {
  const [businessName, setBusinessName] = useState("Business");

  useEffect(() => {
    let mounted = true;

    const loadBusiness = async (businessId?: string | null) => {
      try {
        const data = await apiFetch<BusinessesResponse>("/api/businesses");
        if (!mounted) return;
        const activeBusinessId = businessId ?? window.localStorage.getItem("camluk.activeBusinessId");
        const activeBusiness = data.businesses?.find((business) => business.id === activeBusinessId) ?? data.businesses?.[0];
        if (activeBusiness?.name) setBusinessName(activeBusiness.name);
      } catch {
        // BusinessSwitcher handles authentication and selection.
      }
    };

    loadBusiness();

    const handleBusinessChanged = (event: Event) => {
      const businessId = (event as CustomEvent<string | null>).detail;
      loadBusiness(businessId);
    };

    window.addEventListener("camluk:business-changed", handleBusinessChanged);
    return () => {
      mounted = false;
      window.removeEventListener("camluk:business-changed", handleBusinessChanged);
    };
  }, []);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 p-6 md:block">
      <div className="mb-10">
        <Link href="/" className="block">
          <h1 className="truncate text-xl font-bold text-white">{businessName}</h1>
          <p className="text-sm text-slate-400">WhatsApp Commerce</p>
        </Link>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => (
          <Link key={item.label} href={item.href} className="block w-full rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
