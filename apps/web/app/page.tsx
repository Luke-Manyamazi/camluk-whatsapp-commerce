const stats = [
  {
    label: "Conversations",
    value: "0",
    description: "WhatsApp conversations"
  },
  {
    label: "New Leads",
    value: "0",
    description: "Leads awaiting follow-up"
  },
  {
    label: "Customers",
    value: "0",
    description: "Total customers"
  },
  {
    label: "Open Requests",
    value: "0",
    description: "Active service requests"
  }
];

const navigation = [
  "Overview",
  "Conversations",
  "Leads",
  "Customers",
  "Services",
  "Automation",
  "Settings"
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 p-6 md:block">
          <div className="mb-10">
            <h1 className="text-xl font-bold">Camluk</h1>
            <p className="text-sm text-slate-400">WhatsApp Commerce</p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item, index) => (
              <div
                key={item}
                className={`rounded-lg px-4 py-3 text-sm ${
                  index === 0
                    ? "bg-white text-slate-950"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        <section className="flex-1">
          <header className="border-b border-slate-800 px-6 py-5 md:px-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
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
            <div className="mb-8">
              <h3 className="text-lg font-semibold">
                Business overview
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Your WhatsApp operations at a glance.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <p className="text-sm text-slate-400">{stat.label}</p>

                  <p className="mt-3 text-3xl font-bold">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="font-semibold">Recent conversations</h3>

                <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    No conversations yet.
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    WhatsApp conversations will appear here.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="font-semibold">Lead pipeline</h3>

                <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    No leads yet.
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Leads captured from WhatsApp will appear here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}