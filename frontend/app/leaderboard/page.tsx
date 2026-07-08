"use client";

import Link from "next/link";
import { Loader2, Trophy, ShieldCheck, Crosshair } from "lucide-react";
import { useChallenges } from "@/lib/hooks/useGauntlet";
import { formatGen, shortAddr } from "@/lib/utils";

export default function LeaderboardPage() {
  const { data: challenges, isLoading } = useChallenges(100);
  const list = challenges ?? [];

  // Top breakers — derived from broken_by on each breached challenge.
  const breakers = new Map<string, { addr: string; breaks: number; won_wei: bigint }>();
  for (const c of list) {
    if (c.status === "BROKEN" && c.broken_by) {
      const k = c.broken_by.toLowerCase();
      const cur = breakers.get(k) ?? { addr: c.broken_by, breaks: 0, won_wei: BigInt(0) };
      cur.breaks += 1;
      cur.won_wei += BigInt(c.bounty_wei || "0");
      breakers.set(k, cur);
    }
  }
  const topBreakers = [...breakers.values()].sort((a, b) => b.breaks - a.breaks || Number(b.won_wei - a.won_wei)).slice(0, 10);

  // Most resilient — live/retired targets ranked by attacks survived.
  const resilient = list
    .filter((c) => c.status !== "BROKEN" && c.attempts > 0)
    .sort((a, b) => b.attempts - a.attempts).slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 space-y-10">
      <div>
        <div className="eyebrow mb-1">Who's winning the arena</div>
        <h1 className="display text-4xl text-ink">Leaderboard</h1>
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--breach)" }} /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top breakers */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: "var(--breach)" }} />
              <h2 className="display text-xl text-ink">Top breakers</h2>
            </div>
            {topBreakers.length === 0 ? (
              <div className="card p-8 text-center"><Crosshair className="w-8 h-8 mx-auto mb-2 text-muted opacity-40" /><p className="text-soft text-sm">No guardrail has been breached yet. Be the first.</p></div>
            ) : (
              <div className="card divide-y" style={{ borderColor: "var(--line)" }}>
                {topBreakers.map((b, i) => (
                  <div key={b.addr} className="flex items-center gap-3 px-5 py-3" style={{ borderColor: "var(--line)" }}>
                    <span className="display text-lg w-6 shrink-0" style={{ color: i === 0 ? "var(--breach)" : "var(--muted)" }}>{i + 1}</span>
                    <span className="mono text-sm text-ink flex-1">{shortAddr(b.addr)}</span>
                    <span className="chip chip-breached">{b.breaks} break{b.breaks > 1 ? "s" : ""}</span>
                    <span className="mono text-xs" style={{ color: "var(--defended)" }}>{formatGen(b.won_wei.toString())} GEN</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Most resilient */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: "var(--defended)" }} />
              <h2 className="display text-xl text-ink">Most resilient targets</h2>
            </div>
            {resilient.length === 0 ? (
              <div className="card p-8 text-center"><ShieldCheck className="w-8 h-8 mx-auto mb-2 text-muted opacity-40" /><p className="text-soft text-sm">No target has survived an attack yet.</p></div>
            ) : (
              <div className="card divide-y" style={{ borderColor: "var(--line)" }}>
                {resilient.map((c, i) => (
                  <Link key={c.challenge_id} href={`/targets/${c.challenge_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]" style={{ borderColor: "var(--line)" }}>
                    <span className="display text-lg w-6 shrink-0" style={{ color: i === 0 ? "var(--defended)" : "var(--muted)" }}>{i + 1}</span>
                    <span className="text-sm text-ink flex-1 truncate">{c.title}</span>
                    <span className="chip chip-held">{c.attempts} held</span>
                    <span className="mono text-xs" style={{ color: "var(--breach)" }}>{formatGen(c.bounty_wei)} GEN</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
