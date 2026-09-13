"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";

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

const statusOptions = [
"new",
"contacted",
"qualified",
"converted",
"lost"
];

function formatServiceCategory(category: string | null) {
if (!category) {
return "Not specified";
}

return category
.split("-")
.map(
(word) =>
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
return (
status.charAt(0).toUpperCase() +
status.slice(1)
);
}

function formatDate(date: string) {
return new Date(date).toLocaleString();
}

type PageProps = {
params: Promise<{
id: string;
}>;
};

export default function LeadDetailPage({
params
}: PageProps) {
const [leadId, setLeadId] = useState<string | null>(null);
const [lead, setLead] = useState<Lead | null>(null);

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const [status, setStatus] = useState("");
const [serviceCategory, setServiceCategory] =
useState("");
const [notes, setNotes] = useState("");

useEffect(() => {
async function loadLead() {
try {
const { id } = await params;


    setLeadId(id);
    setLoading(true);
    setError("");

    const response = await fetch(
      `${API_URL}/api/leads/${id}`
    );

    if (!response.ok) {
      throw new Error("Failed to load lead.");
    }

    const data = await response.json();

    if (!data.lead) {
      throw new Error("Lead not found.");
    }

    setLead(data.lead);
    setStatus(data.lead.status || "");
    setServiceCategory(
      data.lead.serviceCategory || ""
    );
    setNotes(data.lead.notes || "");
  } catch (error) {
    console.error(error);

    setError(
      "Unable to load this lead. Please try again."
    );
  } finally {
    setLoading(false);
  }
}

loadLead();


}, [params]);

async function handleSave() {
if (!leadId) {
return;
}


try {
  setSaving(true);
  setError("");
  setSuccess("");

  const response = await fetch(
    `${API_URL}/api/leads/${leadId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status,
        serviceCategory,
        notes
      })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update lead.");
  }

  const data = await response.json();

  if (data.lead) {
    setLead((currentLead) =>
      currentLead
        ? {
            ...currentLead,
            ...data.lead
          }
        : currentLead
    );
  }

  setSuccess("Lead updated successfully.");
} catch (error) {
  console.error(error);

  setError(
    "Unable to update this lead. Please try again."
  );
} finally {
  setSaving(false);
}


}

if (loading) {
return ( <main className="min-h-screen bg-slate-950 text-white"> <div className="flex min-h-screen"> <Sidebar />


      <section className="flex-1">
        <div className="p-6 md:p-10">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-sm text-slate-400">
              Loading lead...
            </p>
          </div>
        </div>
      </section>
    </div>
  </main>
);


}

if (error && !lead) {
return ( <main className="min-h-screen bg-slate-950 text-white"> <div className="flex min-h-screen"> <Sidebar />


      <section className="flex-1">
        <div className="p-6 md:p-10">
          <Link
            href="/leads"
            className="mb-6 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Back to Leads
          </Link>

          <div className="rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        </div>
      </section>
    </div>
  </main>
);


}

if (!lead) {
return null;
}

return ( <main className="min-h-screen bg-slate-950 text-white"> <div className="flex min-h-screen"> <Sidebar />


    <section className="flex-1">
      <header className="border-b border-slate-800 px-6 py-5 md:px-10">
        <div>
          <Link
            href="/leads"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to Leads
          </Link>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {lead.customerName}
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Lead details and follow-up management
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(
                status
              )}`}
            >
              {formatStatus(status)}
            </span>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-10">
        {success && (
          <div className="mb-6 rounded-lg border border-green-900 bg-green-950/30 px-4 py-3 text-sm text-green-400">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">
                Lead information
              </h2>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Customer
                  </p>

                  <p className="mt-2 text-sm text-white">
                    {lead.customerName}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Phone
                  </p>

                  <p className="mt-2 text-sm text-white">
                    {lead.phone || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Email
                  </p>

                  <p className="mt-2 text-sm text-white">
                    {lead.email || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Service
                  </p>

                  <p className="mt-2 text-sm text-white">
                    {formatServiceCategory(
                      lead.serviceCategory
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">
                Lead notes
              </h2>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={6}
                className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-500"
                placeholder="Add notes about this lead..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">
                Update lead
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                  >
                    {statusOptions.map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {formatStatus(option)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">
                    Service category
                  </label>

                  <select
                    value={serviceCategory}
                    onChange={(event) =>
                      setServiceCategory(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
                  >
                    <option value="">
                      Not specified
                    </option>

                    <option value="web-development">
                      Web Development
                    </option>

                    <option value="business-software">
                      Business Software
                    </option>

                    <option value="ai-automation">
                      AI & Automation
                    </option>

                    <option value="cloud-deployment">
                      Cloud & Deployment
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">
                Lead metadata
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">
                    Created
                  </p>

                  <p className="mt-1 text-slate-300">
                    {formatDate(lead.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Last updated
                  </p>

                  <p className="mt-1 text-slate-300">
                    {formatDate(lead.updatedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Lead ID
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-400">
                    {lead.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</main>

);
}
