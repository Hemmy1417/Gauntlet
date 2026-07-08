"use client";

import Link from "next/link";
import { Loader2, ScrollText } from "lucide-react";
import { useChallenges, useAttacks } from "@/lib/hooks/useGauntlet";
import { shortAddr } from "@/lib/utils";
import { OutcomeChip } from "@/components/Chips";
import { HowTo } from "@/components/HowTo";
import type { Challenge } from "@/lib/contracts/types";

export default function LogPage() {
  const { data: challenges, isLoading } = useChallenges(50);
  // Only challenges that have been attacked are worth loading.
  const attacked = (challenges ?? []).filter((c) => c.attempts > 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 space-y-8">
      <div>
        <div className="eyebrow mb-1">Every attempt, held or breach</div>
        <h1 className="display text-4xl text-ink">Breach log</h1>
      </div>

      <HowTo id="log" reference="GT-03" title="The public attack corpus"
        items={[
          { label: "Nothing is hidden", body: "Every payload ever fired — successful or not — is recorded on-chain against its target. This is the raw intel." },
          { label: "Held vs Breach", body: "Green 'Held' means the guardrail resisted the payload. Red 'Breach' means the attacker flipped the verdict and took the pot." },
          { label: "Mine it", body: "Study what breaks which guardrail phrasing. The corpus is the point — it hardens the whole ecosystem's defenses." },
        ]} />

      {isLoading ? (
        <div className="card p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--breach)" }} /></div>
      ) : attacked.length === 0 ? (
        <div className="card p-12 text-center">
          <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-soft">No attacks logged yet.</p>
          <Link href="/targets" className="btn btn-primary mt-4 inline-flex">Find a target</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {attacked.map((c) => <ChallengeLog key={c.challenge_id} challenge={c} />)}
        </div>
      )}
    </div>
  );
}

function ChallengeLog({ challenge }: { challenge: Challenge }) {
  const { data: attacks } = useAttacks(challenge.challenge_id);
  if (!attacks || attacks.length === 0) return null;
  return (
    <div>
      <Link href={`/targets/${challenge.challenge_id}`} className="flex items-baseline gap-2 mb-2 hover:underline">
        <span className="mono text-xs text-muted">#{challenge.challenge_id}</span>
        <span className="display text-base text-ink">{challenge.title}</span>
      </Link>
      <div className="space-y-2">
        {attacks.slice().reverse().map((a) => (
          <div key={a.seq} className={`card p-4 ${a.broke ? "card-breach" : ""}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <OutcomeChip broke={a.broke} />
              <span className="mono text-[11px] text-muted ml-auto">{shortAddr(a.attacker)} → forced <span style={{ color: a.broke ? "var(--breach)" : "var(--defended)" }}>{a.verdict}</span></span>
            </div>
            <div className="font-mono text-xs text-soft break-words"><span className="text-muted">› </span>{a.payload}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
