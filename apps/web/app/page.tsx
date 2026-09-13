"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string;
};

type Conversation = {
  id: string;
  customerName: string;
  phone: string;
  lastMessage: string;
  status: string;
  updatedAt: string;
};

type Lead = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  serviceCategory: string | null;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const navigation = [
  {
    label: "Overview",
    href: "/"
  },
  {
    label: "Conversations",
    href: "/conversations"
  },
  {
    label: "Leads",
    href: "/leads"
  },
  {
    label: "Customers",
    href: "/customers"
  },
  {
    label: "Services",
    href: "/services"
  },
  {
    label: "Automation",
    href: "/automation"
  },
  {
    label: "Settings",
    href: "/settings"
  }
];

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function formatServiceCategory(category: string | null) {
  if (!category) {
    return "Not specified";
  }

  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusClass(status: string) {
  switch (status) {
    case "open":
    case "new":
      return "bg-blue-500/10 text-blue-400";

    case "qualified":
      return "bg-green-500/10 text-green-400";

    case "contacted":
      return "bg-yellow-500/10 text-yellow-400";

    case "converted":
      return "bg-purple-500/10 text-purple-400";

    case "human-handoff":
      return "bg-orange-500/10 text-orange-400";

    case "lost":
      return "bg-red-500/10 text-red-400";

    default:
      return "bg-slate-800 text-slate-400";
  }
}

export default function Home() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const [services, setServices] = useState<Service[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [servicesLoading, setServicesLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] =
    useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const [servicesError, setServicesError] = useState(false);
  const [conversationsError, setConversationsError] =
    useState(false);
  const [leadsError, setLeadsError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/services`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }

        return response.json();
      })
      .then((data) => {
        setServices(data.services || []);
        setServicesLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load services:", error);
        setServicesError(true);
        setServicesLoading(false);
      });

    fetch(`${API_URL}/api/conversations`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        return response.json();
      })
      .then((data) => {
        setConversations(data.conversations || []);
        setConversationsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load conversations:", error);
        setConversationsError(true);
        setConversationsLoading(false);
      });

    fetch(`${API_URL}/api/leads`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch leads");
        }

        return response.json();
      })
      .then((data) => {
        setLeads(data.leads || []);
        setLeadsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load leads:", error);
        setLeadsError(true);
        setLeadsLoading(false);
      });
  }, [API_URL]);

  const newLeads = leads.filter(
    (lead) => lead.status === "new"
  ).length;

  const openRequests = leads.filter(
    (lead) =>
      lead.status === "new" ||
      lead.status === "contacted" ||
      lead.status === "qualified"
  ).length;

  const stats = [
    {
      label: "Conversations",
      value: conversations.length,
      description: "WhatsApp conversations",
      href: "/conversations"
    },
    {
      label: "New Leads",
      value: newLeads,
      description: "Leads awaiting follow-up",
      href: "/leads"
    },
    {
      label: "Customers",
      value: new Set(
        conversations.map((conversation) => conversation.phone)
      ).size,
      description: "Customers with conversations",
      href: "/customers"
    },
    {
      label: "Open Requests",
      value: openRequests,
      description: "Active service requests",
      href: "/automation"
    }
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 p-6 md:block">
          <div className="mb-10">
            <h1 className="text-xl font-bold">
              Camluk
            </h1>

            <p className="text-sm text-slate-400">
              WhatsApp Commerce
            </p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block w-full rounded-lg px-4 py-3 text-sm transition ${
                  item.href === "/"
                    ? "bg-white font-medium text-slate-950"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <section className="flex-1">

          {/* Header */}
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  Dashboard
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Manage your Camluk WhatsApp business assistant.
                </p>
              </div>

              <div className="rounded-full bg-green-500/10 px-4 py-2 text-sm text-green-400">
                ● System Online
              </div>

            </div>
          </header>

          <div className="p-6 md:p-10">

            {/* Overview */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold">
                Business overview
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Your WhatsApp operations at a glance.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  <p className="text-sm text-slate-400">
                    {stat.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {stat.description}
                  </p>
                </Link>
              ))}
            </div>

            {/* Services */}
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">

              <div className="mb-6">
                <h3 className="font-semibold">
                  Camluk Services
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Services currently available through the platform.
                </p>
              </div>

              {servicesLoading && (
                <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    Loading services...
                  </p>
                </div>
              )}

              {servicesError && (
                <div className="rounded-lg border border-red-900 bg-red-950/30 p-8 text-center">
                  <p className="text-sm text-red-400">
                    Unable to load Camluk services.
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Make sure the Camluk API is running on port 4000.
                  </p>
                </div>
              )}

              {!servicesLoading &&
                !servicesError &&
                services.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {services.map((service) => (
                      <Link
                        key={service.id}
                        href={`/services/${service.id}`}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-5 transition hover:border-slate-700 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                      >
                        <h4 className="font-medium">
                          {service.name}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {service.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
            </div>

            {/* Conversations and Leads */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">

              {/* Recent conversations */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Recent conversations
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Latest WhatsApp conversations.
                    </p>
                  </div>

                  <Link
                    href="/conversations"
                    className="text-xs text-blue-400 hover:text-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                  >
                    View all
                  </Link>
                </div>

                <div className="mt-6 space-y-3">

                  {conversationsLoading && (
                    <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
                      <p className="text-sm text-slate-400">
                        Loading conversations...
                      </p>
                    </div>
                  )}

                  {conversationsError && (
                    <div className="rounded-lg border border-red-900 bg-red-950/30 p-6 text-center">
                      <p className="text-sm text-red-400">
                        Unable to load conversations.
                      </p>
                    </div>
                  )}

                  {!conversationsLoading &&
                    !conversationsError &&
                    conversations.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
                        <p className="text-sm text-slate-400">
                          No conversations yet.
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          WhatsApp conversations will appear here.
                        </p>
                      </div>
                    )}

                  {!conversationsLoading &&
                    !conversationsError &&
                    conversations.slice(0, 5).map((conversation) => (
                      <Link
                        key={conversation.id}
                        href={`/conversations/${conversation.id}`}
                        className="block rounded-lg border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">
                            <p className="font-medium">
                              {conversation.customerName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {conversation.phone}
                            </p>

                            <p className="mt-2 truncate text-sm text-slate-400">
                              {conversation.lastMessage}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-xs ${getStatusClass(
                              conversation.status
                            )}`}
                          >
                            {conversation.status}
                          </span>

                        </div>

                        <p className="mt-3 text-xs text-slate-600">
                          {formatDate(conversation.updatedAt)}
                        </p>
                      </Link>
                    ))}

                </div>
              </div>

              {/* Lead pipeline */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Lead pipeline
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Latest leads captured from WhatsApp.
                    </p>
                  </div>

                  <Link
                    href="/leads"
                    className="text-xs text-blue-400 hover:text-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                  >
                    View all
                  </Link>
                </div>

                <div className="mt-6 space-y-3">

                  {leadsLoading && (
                    <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
                      <p className="text-sm text-slate-400">
                        Loading leads...
                      </p>
                    </div>
                  )}

                  {leadsError && (
                    <div className="rounded-lg border border-red-900 bg-red-950/30 p-6 text-center">
                      <p className="text-sm text-red-400">
                        Unable to load leads.
                      </p>
                    </div>
                  )}

                  {!leadsLoading &&
                    !leadsError &&
                    leads.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
                        <p className="text-sm text-slate-400">
                          No leads yet.
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Leads captured from WhatsApp will appear here.
                        </p>
                      </div>
                    )}

                  {!leadsLoading &&
                    !leadsError &&
                    leads.slice(0, 5).map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="block rounded-lg border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">
                            <p className="font-medium">
                              {lead.customerName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatServiceCategory(
                                lead.serviceCategory
                              )}
                            </p>

                            <p className="mt-2 truncate text-sm text-slate-400">
                              {lead.notes || "No notes"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-xs ${getStatusClass(
                              lead.status
                            )}`}
                          >
                            {lead.status}
                          </span>

                        </div>

                        <p className="mt-3 text-xs text-slate-600">
                          {formatDate(lead.createdAt)}
                        </p>
                      </Link>
                    ))}

                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
