"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { GauntletWordmark } from "./Logo";
import { ConnectButton } from "./ConnectButton";
import { useProtocolStats } from "@/lib/hooks/useGauntlet";
import { formatGen } from "@/lib/utils";

const links = [
  { href: "/",            label: "Console" },
  { href: "/targets",     label: "Targets" },
  { href: "/new",         label: "Plant" },
  { href: "/log",         label: "Breach log" },
  { href: "/leaderboard", label: "Leaderboard" },
];

function StatusStrip() {
  const { data: s } = useProtocolStats();
  const items = [
    { k: "TARGETS", v: String(s?.total_challenges ?? 0), c: "var(--ink)" },
    { k: "ATTACKS", v: String(s?.total_attacks ?? 0), c: "var(--amber)" },
    { k: "BREACHES", v: String(s?.total_breaks ?? 0), c: "var(--breach)" },
    { k: "PAID OUT", v: `${formatGen(s?.total_paid_wei ?? "0")} GEN`, c: "var(--defended)" },
  ];
  return (
    <div className="hidden lg:flex items-center gap-5 mono text-[11px]">
      <span className="flex items-center gap-1.5" style={{ color: "var(--defended)" }}>
        <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: "var(--defended)" }} /> LIVE
      </span>
      {items.map((it) => (
        <span key={it.k} className="flex items-center gap-1.5">
          <span className="text-muted">{it.k}</span>
          <span style={{ color: it.c }}>{it.v}</span>
        </span>
      ))}
    </div>
  );
}

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const isActive = (href: string) => (href === "/" ? path === "/" : path?.startsWith(href));

  return (
    <>
      {/* Live status bar */}
      <div className="hidden lg:block" style={{ background: "var(--surface-dim)", borderBottom: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 h-8 flex items-center justify-between">
          <StatusStrip />
          <span className="mono text-[11px] text-muted">GenLayer · Studionet · adversarial testbed</span>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md"
        style={{ background: "rgba(12,12,15,0.82)", borderBottom: "1px solid var(--line)" }}>
        <nav className="mx-auto max-w-6xl px-5 h-[60px] flex items-center gap-4">
          <Link href="/" className="hover:opacity-80 transition-opacity shrink-0">
            <GauntletWordmark size="sm" />
          </Link>
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link key={l.href} href={l.href}
                  className="text-sm font-semibold px-3 py-2 rounded-lg transition-colors mono"
                  style={{ color: active ? "var(--breach)" : "var(--ink-soft)", background: active ? "var(--breach-soft)" : "transparent" }}>
                  {l.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0 md:ml-0 ml-auto">
            <ConnectButton />
            <button type="button" onClick={() => setOpen((v) => !v)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ background: "var(--surface-hi)", border: "1px solid var(--line-hi)", color: "var(--ink)" }}
              aria-label={open ? "Close menu" : "Open menu"}>
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu"
            className="md:hidden fixed inset-0 z-40 animate-fade-in"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
          <aside className="md:hidden fixed right-3 top-[68px] z-40 w-[74%] max-w-[280px] animate-slide-in card p-2">
            <ul className="flex flex-col">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link href={l.href} className="block px-4 py-3 rounded-lg text-sm font-semibold mono"
                      style={{ color: active ? "var(--breach)" : "var(--ink-soft)", background: active ? "var(--breach-soft)" : "transparent" }}>
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        </>
      )}
    </>
  );
}
