"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Business = {
  id: string;
  name: string;
  slug: string;
  status: string;
  role: string;
};

type BusinessesResponse = {
  businesses: Business[];
};

export default function WorkspaceBrand() {
  const [businessName, setBusinessName] = useState("Your Business");

  useEffect(() => {
    let mounted = true;

    async function loadBusiness() {
      try {
        const data = await apiFetch<BusinessesResponse>("/api/businesses");
        if (!mounted) return;

        const activeBusinessId = window.localStorage.getItem("camluk.activeBusinessId");
        const activeBusiness =
          data.businesses?.find(
            (business) =>
              business.id === activeBusinessId && business.status === "active"
          ) ??
          data.businesses?.find((business) => business.status === "active");

        if (activeBusiness?.name) setBusinessName(activeBusiness.name);
      } catch {
        // AuthGuard and BusinessSwitcher handle authentication and selection.
      }
    }

    void loadBusiness();

    const handleBusinessChanged = () => {
      void loadBusiness();
    };

    window.addEventListener("camluk:business-changed", handleBusinessChanged);
    return () => {
      mounted = false;
      window.removeEventListener("camluk:business-changed", handleBusinessChanged);
    };
  }, []);

  return <span>{businessName}</span>;
}
