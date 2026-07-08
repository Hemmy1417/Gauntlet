"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Crosshair, Bug, ScrollText, Trophy } from "lucide-react";
import { GauntletMark } from "./Logo";
import { ConnectButton } from "./ConnectButton";
import { useProtocolStats } from "@/lib/hooks/useGauntlet";
import { formatGen } from "@/lib/utils";

const links = [
  { href: "/",            label: "Console",     icon: Home },
  { href: "/targets",     label: "Targets",     icon: Crosshair },
  { href: "/new",         label: "Plant",       icon: Bug },
  { href: "/log",         label: "Breach log",  icon: ScrollText },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

/** Top-left floating brand chip + top-right live status readout. */
export function Hud() {
  const { data: s } = useProtocolStats();
  return (
    <>
      <Link href="/" className="fixed top-4 left-4 z-40 flex items-center gap-2 px-3 h-10 rounded-full backdrop-blur-md hover:opacity-90 transition-opacity"
        style={{ background: "rgba(20,20,25,0.7)", border: "1px solid var(--line)" }}>
        <GauntletMark size={22} />
        <span className="display text-base tracking-tight" style={{ color: "var(--ink)" }}>Gauntlet</span>
      </Link>

      <div className="hidden sm:flex fixed top-4 right-4 z-40 items-center gap-4 px-4 h-10 rounded-full backdrop-blur-md mono text-[11px]"
        style={{ background: "rgba(20,20,25,0.7)", border: "1px solid var(--line)" }}>
        <span className="flex items-center gap-1.5" style={{ color: "var(--defended)" }}>
          <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: "var(--defended)" }} /> LIVE
        </span>
        <span className="text-muted">BREACHES <span style={{ color: "var(--breach)" }}>{s?.total_breaks ?? 0}</span></span>
        <span className="text-muted">PAID <span style={{ color: "var(--defended)" }}>{formatGen(s?.total_paid_wei ?? "0")}</span></span>
      </div>
    </>
  );
}

/** Floating bottom command dock — the primary nav (HUD style). */
export function Dock() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path?.startsWith(href));

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl backdrop-blur-xl max-w-full overflow-x-auto"
        style={{ background: "rgba(18,18,23,0.82)", border: "1px solid var(--line-hi)", boxShadow: "0 12px 40px -12px rgba(255,90,77,0.35), 0 4px 12px rgba(0,0,0,0.5)" }}>
        {links.map((l) => {
          const active = isActive(l.href);
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} title={l.label}
              className="flex items-center gap-2 px-3 sm:px-3.5 h-11 rounded-xl transition-colors shrink-0"
              style={{ background: active ? "var(--breach-soft)" : "transparent", color: active ? "var(--breach)" : "var(--ink-soft)" }}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline text-sm font-semibold mono">{l.label}</span>
            </Link>
          );
        })}
        <div className="w-px h-7 mx-1 shrink-0" style={{ background: "var(--line-hi)" }} />
        <div className="shrink-0 pr-1"><ConnectButton /></div>
      </div>
    </div>
  );
}
