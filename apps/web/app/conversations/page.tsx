"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

type Conversation = {
  id: string;
  customerName: string;
  phone: string;
  lastMessage: string;
  status: "open" | "closed" | "human-handoff";
  updatedAt: string;
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    fetch(`${API_URL}/api/conversations`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        return response.json();
      })
      .then((data) => {
        setConversations(data.conversations || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load conversations:", error);
        setError(true);
        setLoading(false);
      });
  }, []);

  const getStatusLabel = (status: Conversation["status"]) => {
    switch (status) {
      case "open":
        return "Open";
      case "human-handoff":
        return "Human Handoff";
      case "closed":
        return "Closed";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Conversations</h2>

                <p className="mt-1 text-sm text-slate-400">
                  Manage customer conversations from WhatsApp.
                </p>
              </div>

              <div className="rounded-full bg-green-500/10 px-4 py-2 text-sm text-green-400">
                ● System Online
              </div>
            </div>
          </header>

          <div className="p-6 md:p-10">
            <div className="mb-8">
              <h3 className="text-lg font-semibold">Customer conversations</h3>

              <p className="mt-1 text-sm text-slate-400">
                Conversations received through your WhatsApp assistant.
              </p>
            </div>

            {loading && (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
                <p className="text-sm text-slate-400">
                  Loading conversations...
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-900 bg-red-950/30 p-10 text-center">
                <p className="text-sm text-red-400">
                  Unable to load conversations.
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Make sure the Camluk API is running on port 4000.
                </p>
              </div>
            )}

            {!loading && !error && conversations.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
                <p className="text-sm text-slate-400">No conversations yet.</p>
              </div>
            )}

            {!loading && !error && conversations.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-800 bg-slate-950/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Customer
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Last message
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Status
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Updated
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {conversations.map((conversation) => (
                        <tr
                          key={conversation.id}
                          className="transition hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-5">
                            <div>
                              <p className="font-medium">
                                {conversation.customerName}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {conversation.phone}
                              </p>
                            </div>
                          </td>

                          <td className="max-w-md px-6 py-5">
                            <p className="truncate text-sm text-slate-300">
                              {conversation.lastMessage}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                conversation.status === "open"
                                  ? "bg-green-500/10 text-green-400"
                                  : conversation.status === "human-handoff"
                                    ? "bg-yellow-500/10 text-yellow-400"
                                    : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {getStatusLabel(conversation.status)}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-400">
                            {new Date(conversation.updatedAt).toLocaleString()}
                          </td>

                          <td className="px-6 py-5">
                            <a
                              href={`/conversations/${conversation.id}`}
                              className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                            >
                              Open
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
