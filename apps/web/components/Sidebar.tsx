import Link from "next/link";
import WorkspaceBrand from "./WorkspaceBrand";

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Conversations", href: "/conversations" },
  { label: "Leads", href: "/leads" },
  { label: "Customers", href: "/customers" },
  { label: "Services", href: "/services" },
  { label: "Automation", href: "/automation" },
  { label: "Settings", href: "/settings" }
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 p-6 md:flex md:flex-col">
      <div className="mb-10">
        <Link href="/" className="block">
          <h1 className="truncate text-xl font-bold text-white">
            <WorkspaceBrand />
          </h1>
          <p className="text-sm text-slate-400">WhatsApp Commerce</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="block w-full rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 border-t border-slate-800 pt-5">
        <p className="text-xs text-slate-500">Powered by Camluk</p>
        <p className="mt-1 text-xs font-medium text-slate-400">Simply Automated.</p>
      </div>
    </aside>
  );
}
