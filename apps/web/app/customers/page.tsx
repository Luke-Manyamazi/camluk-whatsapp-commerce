"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  conversationCount: number;
  leadCount: number;
  latestConversation: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

function formatDate(date: string | null) {
  if (!date) {
    return "No activity";
  }

  return new Date(date).toLocaleString();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/customers`
        );

        if (!response.ok) {
          throw new Error("Failed to load customers.");
        }

        const data = await response.json();

        setCustomers(data.customers ?? []);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load customers. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const totalConversations = customers.reduce(
    (total, customer) =>
      total + customer.conversationCount,
    0
  );

  const totalLeads = customers.reduce(
    (total, customer) =>
      total + customer.leadCount,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <div>
              <h1 className="text-2xl font-bold">
                Customers
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage customers and their WhatsApp activity.
              </p>
            </div>
          </header>

          <div className="p-6 md:p-10">
            <div className="mb-8">
              <h2 className="text-lg font-semibold">
                Customer overview
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Your customers and their activity across the platform.
              </p>
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Total Customers
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {customers.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Conversations
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {totalConversations}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Leads
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {totalLeads}
                </p>
              </div>
            </div>

            {/* Customers */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  Loading customers...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-sm text-red-400">
                  {error}
                </div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  No customers found.
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
                          Contact
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Conversations
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Leads
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Last Activity
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-white">
                                {customer.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Added{" "}
                                {new Date(
                                  customer.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-300">
                              {customer.phone}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {customer.email ||
                                "No email"}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                              {customer.conversationCount}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
                              {customer.leadCount}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-400">
                            {formatDate(
                              customer.latestConversation
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <Link
                              href={`/customers/${customer.id}`}
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