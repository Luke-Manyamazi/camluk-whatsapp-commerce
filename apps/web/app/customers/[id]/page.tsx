"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";

type Conversation = {
  id: string;
  status: "open" | "closed" | "human-handoff";
  updated_at: string;
};

type Lead = {
  id: string;
  status: string;
  service_category: string | null;
  created_at: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
  conversations: Conversation[];
  leads: Lead[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function formatStatus(status: string) {
  return status
    .replace("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError("");

        const { id } = await params;

        const response = await fetch(
          `${API_URL}/api/customers/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to load customer.");
        }

        const data = await response.json();

        setCustomer(data.customer);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load customer. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [params]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link
                  href="/customers"
                  className="text-sm text-slate-400 transition hover:text-white"
                >
                  ← Back to Customers
                </Link>

                <h1 className="mt-2 text-2xl font-bold">
                  Customer Details
                </h1>
              </div>
            </div>
          </header>

          <div className="p-6 md:p-10">
            {loading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
                Loading customer...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-400">
                {error}
              </div>
            ) : !customer ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
                Customer not found.
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold">
                    {customer.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Customer profile and activity
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-sm font-semibold text-slate-300">
                      Contact Information
                    </h3>

                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          Phone
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {customer.phone}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Email
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {customer.email || "No email"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Customer Since
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {formatDate(customer.created_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Last Updated
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {formatDate(customer.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-sm font-semibold text-slate-300">
                      Conversations
                    </h3>

                    <p className="mt-4 text-4xl font-bold">
                      {customer.conversations.length}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Total conversations
                    </p>

                    <div className="mt-6 space-y-3">
                      {customer.conversations.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No conversations yet.
                        </p>
                      ) : (
                        customer.conversations.map(
                          (conversation) => (
                            <Link
                              key={conversation.id}
                              href={`/conversations/${conversation.id}`}
                              className="block rounded-lg border border-slate-800 p-4 transition hover:bg-slate-800"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium">
                                  Conversation
                                </span>

                                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                                  {formatStatus(
                                    conversation.status
                                  )}
                                </span>
                              </div>

                              <p className="mt-2 text-xs text-slate-500">
                                Updated{" "}
                                {formatDate(
                                  conversation.updated_at
                                )}
                              </p>
                            </Link>
                          )
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-sm font-semibold text-slate-300">
                      Leads
                    </h3>

                    <p className="mt-4 text-4xl font-bold">
                      {customer.leads.length}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Total leads
                    </p>

                    <div className="mt-6 space-y-3">
                      {customer.leads.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No leads yet.
                        </p>
                      ) : (
                        customer.leads.map((lead) => (
                          <Link
                            key={lead.id}
                            href={`/leads/${lead.id}`}
                            className="block rounded-lg border border-slate-800 p-4 transition hover:bg-slate-800"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium">
                                {lead.service_category
                                  ? formatStatus(
                                      lead.service_category
                                    )
                                  : "General enquiry"}
                              </span>

                              <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                                {formatStatus(lead.status)}
                              </span>
                            </div>

                            <p className="mt-2 text-xs text-slate-500">
                              Created{" "}
                              {formatDate(lead.created_at)}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}