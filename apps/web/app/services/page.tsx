
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  active: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

const BUSINESS_ID =
  "32261ff6-ad0b-4492-802d-c976ff3a5226";

function formatCategory(category: string) {
  return category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [formError, setFormError] = useState("");
  const [actionError, setActionError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] =
    useState("");

  async function loadServices() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/services`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load services."
        );
      }

      setServices(data.services ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load services. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleAddService(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim() || !category.trim()) {
      setFormError(
        "Name and category are required."
      );

      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setActionError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_URL}/api/services`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            name: name.trim(),
            category: category.trim(),
            description: description.trim(),
            active: true
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create service."
        );
      }

      setName("");
      setCategory("");
      setDescription("");
      setShowAddForm(false);

      setSuccessMessage(
        `"${data.service.name}" was created successfully.`
      );

      await loadServices();
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create service."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteService(
    service: Service
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(service.id);
      setActionError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_URL}/api/services/${service.id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete service."
        );
      }

      setServices((current) =>
        current.filter(
          (item) => item.id !== service.id
        )
      );

      setSuccessMessage(
        `"${service.name}" was deleted successfully.`
      );
    } catch (error) {
      console.error(error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to delete service."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeServices = services.filter(
    (service) => service.active
  ).length;

  const inactiveServices = services.filter(
    (service) => !service.active
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Services
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Manage the services offered by your
                  business.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(
                    (current) => !current
                  );
                  setFormError("");
                  setActionError("");
                }}
                className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
              >
                {showAddForm
                  ? "Cancel"
                  : "+ Add Service"}
              </button>
            </div>
          </header>

          <div className="p-6 md:p-10">
            {actionError && (
              <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <span>{actionError}</span>

                <button
                  type="button"
                  onClick={() =>
                    setActionError("")
                  }
                  className="text-red-300 transition hover:text-white"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
                <span>{successMessage}</span>

                <button
                  type="button"
                  onClick={() =>
                    setSuccessMessage("")
                  }
                  className="text-green-300 transition hover:text-white"
                  aria-label="Dismiss success message"
                >
                  ×
                </button>
              </div>
            )}

            {showAddForm && (
              <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">
                    Add Service
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Add a service to your business catalogue.
                  </p>
                </div>

                {formError && (
                  <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                    {formError}
                  </div>
                )}

                <form
                  onSubmit={handleAddService}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="service-name"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Service Name
                    </label>

                    <input
                      id="service-name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      placeholder="e.g. IT Support"
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="service-category"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Category
                    </label>

                    <input
                      id="service-category"
                      type="text"
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target.value
                        )
                      }
                      placeholder="e.g. it-support"
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="service-description"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Description
                    </label>

                    <textarea
                      id="service-description"
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      placeholder="Describe what this service provides..."
                      rows={4}
                      disabled={saving}
                      className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setFormError("");
                      }}
                      disabled={saving}
                      className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : "Create Service"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-semibold">
                Service catalogue
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                These services can be used by your
                WhatsApp automation and sales workflows.
              </p>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Total Services
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {services.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Active
                </p>

                <p className="mt-3 text-3xl font-bold text-green-400">
                  {activeServices}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Inactive
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-500">
                  {inactiveServices}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  Loading services...
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-red-400">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={loadServices}
                    className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Try Again
                  </button>
                </div>
              ) : services.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-400">
                    No services found.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAddForm(true)
                    }
                    className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                  >
                    Add your first service
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-800 bg-slate-950/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Service
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Category
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Description
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Status
                        </th>

                        <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {services.map((service) => (
                        <tr
                          key={service.id}
                          className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">
                              {service.name}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                              {formatCategory(
                                service.category
                              )}
                            </span>
                          </td>

                          <td className="max-w-md px-6 py-4">
                            <p className="text-sm text-slate-400">
                              {service.description ||
                                "No description"}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            {service.active ? (
                              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                                Active
                              </span>
                            ) : (
                              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/services/${service.id}`}
                                className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                              >
                                Edit
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteService(
                                    service
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  service.id
                                }
                                className="inline-flex rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                service.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
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

