"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";

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

export default function ServiceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [service, setService] =
    useState<Service | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] =
    useState("");
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadService() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/services/${id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load service."
        );
      }

      const loadedService = data.service;

      setService(loadedService);

      setName(loadedService.name);
      setCategory(loadedService.category);
      setDescription(
        loadedService.description ?? ""
      );
      setActive(loadedService.active);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load service."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadService();
  }, [id]);

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>
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
      setSuccessMessage("");

      const response = await fetch(
        `${API_URL}/api/services/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.trim(),
            category: category.trim(),
            description: description.trim(),
            active
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update service."
        );
      }

      setService(data.service);

      setName(data.service.name);
      setCategory(data.service.category);
      setDescription(
        data.service.description ?? ""
      );
      setActive(data.service.active);

      setSuccessMessage(
        "Service updated successfully."
      );
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to update service."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service?.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setFormError("");

      const response = await fetch(
        `${API_URL}/api/services/${id}`,
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

      window.location.href = "/services";
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to delete service."
      );

      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Link
                  href="/services"
                  className="text-sm text-slate-400 transition hover:text-white"
                >
                  ← Back to Services
                </Link>

                <h1 className="mt-2 text-2xl font-bold">
                  {loading
                    ? "Service"
                    : service?.name ||
                      "Service"}
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  View and manage this service.
                </p>
              </div>
            </div>
          </header>

          <div className="p-6 md:p-10">
            {loading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
                <p className="text-sm text-slate-400">
                  Loading service...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
                <p className="text-sm text-red-400">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadService}
                  className="mt-4 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  Try Again
                </button>
              </div>
            ) : !service ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
                <p className="text-sm text-slate-400">
                  Service not found.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 md:p-8">
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Service Details
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        Update the service information
                        below.
                      </p>
                    </div>

                    {active ? (
                      <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>

                  {formError && (
                    <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                      {formError}
                    </div>
                  )}

                  {successMessage && (
                    <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
                      {successMessage}
                    </div>
                  )}

                  <form
                    onSubmit={handleUpdate}
                    className="space-y-6"
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
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500"
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
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500"
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
                        rows={5}
                        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500"
                      />
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(event) =>
                            setActive(
                              event.target.checked
                            )
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <div>
                          <p className="text-sm font-medium text-white">
                            Active service
                          </p>

                          <p className="text-xs text-slate-500">
                            Active services can be used
                            by automation and sales
                            workflows.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting || saving}
                        className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleting
                          ? "Deleting..."
                          : "Delete Service"}
                      </button>

                      <div className="flex gap-3">
                        <Link
                          href="/services"
                          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                          Cancel
                        </Link>

                        <button
                          type="submit"
                          disabled={
                            saving || deleting
                          }
                          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving
                            ? "Saving..."
                            : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}