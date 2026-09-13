"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

type Lead = {
id: string;
customerId: string;
customerName: string;
phone: string;
email: string;
serviceCategory: string | null;
status: string;
notes: string;
createdAt: string;
updatedAt: string;
};

const API_URL =
process.env.NEXT_PUBLIC_API_URL ||
"http://localhost:4000";

function formatServiceCategory(category: string | null) {
if (!category) return "Not specified";

return category
.split("-")
.map((word) =>
word.charAt(0).toUpperCase() + word.slice(1)
)
.join(" ");
}

function statusClasses(status: string) {
switch (status) {
case "new":
return "bg-blue-500/10 text-blue-400 border-blue-500/20";


case "contacted":
  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

case "qualified":
  return "bg-purple-500/10 text-purple-400 border-purple-500/20";

case "converted":
  return "bg-green-500/10 text-green-400 border-green-500/20";

case "lost":
  return "bg-red-500/10 text-red-400 border-red-500/20";

default:
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";


}
}

function formatStatus(status: string) {
return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function LeadsPage() {
const [leads, setLeads] = useState<Lead[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
async function loadLeads() {
try {
setLoading(true);
setError("");


    const response = await fetch(
      `${API_URL}/api/leads`
    );

    if (!response.ok) {
      throw new Error("Failed to load leads.");
    }

    const data = await response.json();

    setLeads(data.leads ?? []);
  } catch (error) {
    console.error(error);

    setError(
      "Unable to load leads. Please try again."
    );
  } finally {
    setLoading(false);
  }
}

loadLeads();


}, []);

return (
  <main className="min-h-screen bg-slate-950 text-white">
    <div className="flex min-h-screen">
      <Sidebar />

      <section className="flex-1">
        <header className="border-b border-slate-800 px-6 py-5 md:px-10">
          <div>
          <h1 className="text-2xl font-semibold">
            Leads
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Track and manage potential customers
            generated from conversations.
          </p>
          </div>
        </header>

        <div className="p-6 md:p-10">

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Leads
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {leads.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              New
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {leads.filter(
                (lead) => lead.status === "new"
              ).length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Contacted
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {leads.filter(
                (lead) => lead.status === "contacted"
              ).length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Qualified
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {leads.filter(
                (lead) => lead.status === "qualified"
              ).length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Converted
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {leads.filter(
                (lead) => lead.status === "converted"
              ).length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Loading leads...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-400">
              {error}
            </div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No leads found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-800 bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Service
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Notes
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Created
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">
                            {lead.customerName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {lead.phone}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatServiceCategory(
                          lead.serviceCategory
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(
                            lead.status
                          )}`}
                        >
                          {formatStatus(lead.status)}
                        </span>
                      </td>

                      <td className="max-w-xs px-6 py-4 text-sm text-slate-400">
                        <p className="truncate">
                          {lead.notes || "—"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(
                          lead.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  </div>
</main>


);
}
