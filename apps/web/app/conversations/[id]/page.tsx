"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";

type Conversation = {
  id: string;
  customerName: string;
  phone: string;
  lastMessage: string;
  status: "open" | "closed" | "human-handoff";
  updatedAt: string;
};

type Message = {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  content: string;
  createdAt: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getStatusLabel(status: Conversation["status"]) {
  switch (status) {
    case "open":
      return "Open";
    case "human-handoff":
      return "Human Handoff";
    case "closed":
      return "Closed";
  }
}

function getStatusClass(status: Conversation["status"]) {
  switch (status) {
    case "open":
      return "bg-green-500/10 text-green-400";
    case "human-handoff":
      return "bg-yellow-500/10 text-yellow-400";
    case "closed":
      return "bg-slate-800 text-slate-400";
  }
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [conversationId, setConversationId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch(`${API_URL}/api/conversations`);

        if (!response.ok) {
          throw new Error("Failed to load conversations");
        }

        const data = await response.json();
        setConversations(data.conversations || []);
      } catch (error) {
        console.error("Failed to load conversations:", error);
        setConversationsError(true);
      } finally {
        setConversationsLoading(false);
      }
    }

    loadConversations();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      try {
        setMessagesLoading(true);
        setMessagesError(false);

        const { id } = await params;
        setConversationId(id);

        const response = await fetch(`${API_URL}/api/messages/${id}`);

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Failed to load messages:", error);
        setMessagesError(true);
      } finally {
        setMessagesLoading(false);
      }
    }

    loadMessages();
  }, [params]);

  const conversation = conversations.find(
    (item) => item.id === conversationId
  );

  const filteredConversations = conversations.filter((item) => {
    const query = searchTerm.trim().toLowerCase();

    return (
      !query ||
      item.customerName.toLowerCase().includes(query) ||
      item.phone.toLowerCase().includes(query)
    );
  });

  async function sendMessage() {
    if (!messageInput.trim() || sending || !conversationId) {
      return;
    }

    try {
      setSending(true);

      const response = await fetch(
        `${API_URL}/api/messages/${conversationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageInput.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setMessages((currentMessages) => [
        ...currentMessages,
        data.message,
      ]);
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          <div className="flex min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/30 md:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)]">
            <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-800 bg-slate-900 lg:flex xl:w-96">
              <div className="border-b border-slate-800 px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-lg font-semibold">
                      Conversations
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                      {conversations.length} total
                    </p>
                  </div>

                  <Link
                    href="/conversations"
                    className="text-xs text-blue-400 transition hover:text-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                  >
                    View all
                  </Link>
                </div>

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search conversations"
                  className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {conversationsLoading && (
                  <p className="p-4 text-sm text-slate-400">
                    Loading conversations...
                  </p>
                )}

                {conversationsError && (
                  <p className="p-4 text-sm text-red-400">
                    Unable to load conversations.
                  </p>
                )}

                {!conversationsLoading &&
                  !conversationsError &&
                  filteredConversations.length === 0 && (
                    <p className="p-4 text-sm text-slate-400">
                      No matching conversations.
                    </p>
                  )}

                {filteredConversations.map((item) => {
                  const isSelected = item.id === conversationId;

                  return (
                    <Link
                      key={item.id}
                      href={`/conversations/${item.id}`}
                      className={`mb-1 block rounded-lg border p-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                        isSelected
                          ? "border-slate-700 bg-slate-800"
                          : "border-transparent hover:border-slate-800 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {item.customerName}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {item.phone}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-xs text-slate-400">
                        {item.lastMessage || "No messages yet"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col bg-slate-950/40">
              <header className="border-b border-slate-800 bg-slate-900 px-5 py-4 md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href="/conversations"
                      className="mb-2 inline-block text-xs text-slate-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 lg:hidden"
                    >
                      Back to conversations
                    </Link>

                    <h2 className="truncate text-lg font-semibold">
                      {conversation?.customerName || "Conversation"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {conversation?.phone || "Loading customer details..."}
                    </p>
                  </div>

                  {conversation && (
                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClass(
                        conversation.status
                      )}`}
                    >
                      {getStatusLabel(conversation.status)}
                    </span>
                  )}
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                  {messagesLoading && (
                    <p className="py-12 text-center text-sm text-slate-400">
                      Loading messages...
                    </p>
                  )}

                  {messagesError && (
                    <p className="py-12 text-center text-sm text-red-400">
                      Unable to load messages.
                    </p>
                  )}

                  {!messagesLoading &&
                    !messagesError &&
                    !conversation &&
                    !conversationsLoading && (
                      <div className="py-12 text-center">
                        <p className="text-sm text-slate-300">
                          Conversation not found.
                        </p>
                        <Link
                          href="/conversations"
                          className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
                        >
                          Back to conversations
                        </Link>
                      </div>
                    )}

                  {!messagesLoading &&
                    !messagesError &&
                    conversation &&
                    messages.length === 0 && (
                      <p className="py-12 text-center text-sm text-slate-400">
                        No messages in this conversation yet.
                      </p>
                    )}

                  {messages.map((message) => {
                    const isOutbound = message.direction === "outbound";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOutbound ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm md:max-w-[65%] ${
                            isOutbound
                              ? "rounded-br-md bg-blue-500 text-white"
                              : "rounded-bl-md bg-slate-800 text-slate-100"
                          }`}
                        >
                          <p className="leading-6">{message.content}</p>
                          <p
                            className={`mt-2 text-right text-[11px] ${
                              isOutbound
                                ? "text-blue-100/80"
                                : "text-slate-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <footer className="border-t border-slate-800 bg-slate-900 px-5 py-4 md:px-6">
                <div className="mx-auto flex w-full max-w-4xl gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    disabled={!conversation || sending}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={
                      !conversation || sending || !messageInput.trim()
                    }
                    className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
