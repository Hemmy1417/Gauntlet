"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Crosshair } from "lucide-react";
import { useChallenges } from "@/lib/hooks/useGauntlet";
import { formatGen, shortAddr } from "@/lib/utils";
import { StatusChip, ModeChip, ResilienceMeter } from "@/components/Chips";
import { HowTo } from "@/components/HowTo";
import type { ChallengeStatus } from "@/lib/contracts/types";

const FILTERS: { key: "all" | ChallengeStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "OPEN", label: "Live" },
  { key: "BROKEN", label: "Breached" },
  { key: "CLOSED", label: "Retired" },
];

export default function TargetsPage() {
  const { data: challenges, isLoading } = useChallenges(50);
  const [filter, setFilter] = useState<"all" | ChallengeStatus>("all");
  const list = (challenges ?? []).filter((c) => filter === "all" || c.status === filter);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 space-y-8">
      <div>
        <div className="eyebrow mb-1">Every honeypot, public</div>
        <h1 className="display text-4xl text-ink">Targets</h1>
      </div>

      <HowTo id="targets" reference="GT-01" title="Reading a target"
        items={[
          { label: "Live means attackable", body: "A live target holds a locked bounty. Submit a payload with the attack bond; flip the verdict and the pot is yours." },
          { label: "Resilience is a badge", body: "Each attack a target survives raises its resilience — proof the guardrail is holding. Breached targets are marked in red." },
          { label: "The pot escalates", body: "Every failed attack forfeits its bond into the bounty, so a well-defended target gets more tempting over time." },
          { label: "Breaches are final at finality", body: "A flip pays the attacker only after the appeal window — an attack that fools one validator set but not a larger one never lands." },
        ]} />

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className="chip transition-colors"
            style={filter === f.key ? { background: "var(--breach)", color: "#16060a" } : { background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--line-hi)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--breach)" }} /></div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center">
          <Crosshair className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-soft">No targets match this filter.</p>
          <Link href="/new" className="btn btn-primary mt-4 inline-flex">Plant the first honeypot</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((c) => (
            <Link key={c.challenge_id} href={`/targets/${c.challenge_id}`}
              className={`card card-hover p-5 block ${c.status === "BROKEN" ? "card-breach" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><StatusChip status={c.status} /><ModeChip mode={c.mode} /></div>
                <span className="mono text-xs text-muted">#{c.challenge_id}</span>
              </div>
              <div className="display text-xl text-ink mb-1">{c.title}</div>
              <p className="text-sm text-muted line-clamp-2 mb-4">{c.brief}</p>
              <ResilienceMeter attempts={c.attempts} broken={c.status === "BROKEN"} />
              <div className="flex items-center justify-between text-sm mt-4">
                <span className="mono text-xs text-muted">expected: <span style={{ color: "var(--defended)" }}>{c.expected_verdict}</span></span>
                <span className="display" style={{ color: "var(--breach)" }}>{formatGen(c.bounty_wei)} GEN</span>
              </div>
              <div className="text-[11px] text-muted mt-2 mono">Sponsor {shortAddr(c.sponsor)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
