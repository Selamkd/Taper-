"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { TrendingDown, Activity, Pill } from "lucide-react";

const NAV_ITEMS = [
  { href: "/taper", label: "Taper", icon: TrendingDown },
  { href: "/meds", label: "Meds", icon: Activity },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <header className="sticky top-0 z-40 bg-surface-0/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-lg mx-auto flex items-center justify-end px-5 h-14">
          {/* <Link href="/taper" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-glow border border-accent-dim/20 flex items-center justify-center">
              <Pill size={14} className="text-accent" />
            </div>
            <span className="text-sm font-bold text-zinc-200 tracking-tight">Taper</span>
          </Link> */}

          <nav className="flex gap-1 bg-surface-2 p-1 rounded-xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${isActive
                      ? "bg-surface-4 text-zinc-200 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                    }
                  `}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
