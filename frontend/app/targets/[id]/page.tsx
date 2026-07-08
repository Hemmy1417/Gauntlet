"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Loader2, Crosshair, ShieldCheck, Coins, Ban, Target, Trophy } from "lucide-react";
import {
  useChallenge, useAttacks, useSubmitAttack, useCloseChallenge,
} from "@/lib/hooks/useGauntlet";
import { useWallet } from "@/lib/genlayer/wallet";
import { formatGen, shortAddr } from "@/lib/utils";
import { StatusChip, OutcomeChip, ModeChip, ResilienceMeter } from "@/components/Chips";
import { error as toastError } from "@/lib/toast";
import type { Attack } from "@/lib/contracts/types";

export default function TargetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: c, isLoading } = useChallenge(id);
  const { data: attacks } = useAttacks(id);
  const { address, isConnected } = useWallet();
  const { closeChallenge, isClosing } = useCloseChallenge();

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-5 py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--breach)" }} /></div>;
  }
  if (!c) {
    return <div className="mx-auto max-w-3xl px-5 py-24 text-center"><p className="text-soft">Target not found.</p><Link href="/targets" className="btn btn-ghost mt-4 inline-flex">Back to targets</Link></div>;
  }

  const isSponsor = !!address && address.toLowerCase() === c.sponsor.toLowerCase();
  const canAttack = isConnected && c.status === "OPEN" && !isSponsor;
  const canClose = isSponsor && c.status === "OPEN";

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 space-y-6">
      <div className={c.status === "BROKEN" ? "card-breach p-7" : "card p-7"}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2"><StatusChip status={c.status} /><ModeChip mode={c.mode} /></div>
          <span className="mono text-xs text-muted">Target #{c.challenge_id}</span>
        </div>
        <h1 className="display text-3xl text-ink mb-2">{c.title}</h1>
        <p className="text-sm text-soft leading-relaxed whitespace-pre-wrap mb-5">{c.brief}</p>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg p-4" style={{ background: "var(--surface-dim)" }}>
            <div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>{c.mode === "VAULT" ? "Vault" : "Pot"}</div>
            <div className="display text-xl" style={{ color: "var(--breach)" }}>{formatGen(c.bounty_wei)} GEN</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--surface-dim)" }}>
            <div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>Attacks survived</div>
            <div className="display text-xl text-ink">{c.attempts}</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--surface-dim)" }}>
            <div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>Correct answer</div>
            <div className="mono text-sm pt-1" style={{ color: "var(--defended)" }}>{c.expected_verdict}</div>
          </div>
        </div>

        <ResilienceMeter attempts={c.attempts} broken={c.status === "BROKEN"} />

        {/* The honeypot spec */}
        <div className="mt-5 rounded-lg p-4 font-mono text-xs leading-relaxed" style={{ background: "var(--surface-dim)", border: "1px solid var(--line)" }}>
          <div className="eyebrow mb-2" style={{ color: "var(--muted)" }}>{c.mode === "VAULT" ? "The gatekeeper" : "The panel's task"}</div>
          <p className="text-soft whitespace-pre-wrap mb-3">{c.task}</p>
          {c.criteria && <><div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>Criteria</div><p className="text-soft whitespace-pre-wrap mb-3">{c.criteria}</p></>}
          <div className="eyebrow mb-1" style={{ color: "var(--breach)" }}>Guardrail under test</div>
          <p className="whitespace-pre-wrap" style={{ color: "var(--ink-soft)" }}>{c.guardrail_text || "(none)"}</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            {c.allowed_verdicts.map((v) => (
              <span key={v} className="chip" style={v === c.expected_verdict ? { background: "var(--defended-soft)", color: "var(--defended)" } : { background: "var(--surface-hi)", color: "var(--muted)" }}>{v}</span>
            ))}
          </div>
        </div>

        {c.status === "BROKEN" && (
          <div className="flex items-center gap-2 mt-5 text-sm" style={{ color: "var(--breach)" }}>
            <Trophy className="w-4 h-4" />
            <span className="mono">Breached by {shortAddr(c.broken_by)} → forced verdict {c.winning_verdict}</span>
          </div>
        )}

        {canClose && (
          <button className="btn btn-danger mt-6" disabled={isClosing} onClick={() => closeChallenge({ challengeId: c.challenge_id })}>
            {isClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            Retire &amp; reclaim {formatGen(c.bounty_wei)} GEN
          </button>
        )}
      </div>

      {/* Attack corpus */}
      {(attacks ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="display text-xl text-ink">Attack log <span className="text-muted text-base mono">({attacks?.length})</span></h2>
          {(attacks ?? []).slice().reverse().map((a) => <AttackCard key={a.seq} attack={a} />)}
        </section>
      )}

      {/* Attack form */}
      {canAttack && <AttackForm challengeId={c.challenge_id} bondWei={"20000000000000000"} />}
      {isConnected && c.status === "OPEN" && isSponsor && (
        <p className="text-sm text-muted text-center mono">This is your honeypot — you can't attack it.</p>
      )}
    </div>
  );
}

function AttackCard({ attack }: { attack: Attack }) {
  return (
    <div className={`card p-5 ${attack.broke ? "card-breach" : "card-defended"}`}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <OutcomeChip broke={attack.broke} />
        <span className="chip chip-closed">#{attack.attack_id}</span>
        <span className="mono text-xs text-muted ml-auto">{shortAddr(attack.attacker)}</span>
      </div>
      <div className="rounded-lg p-3 mb-2 font-mono text-xs" style={{ background: "var(--surface-dim)" }}>
        <span className="text-muted">payload › </span><span className="text-soft break-words">{attack.payload}</span>
      </div>
      <div className="flex items-center gap-3 text-xs mono mb-2">
        <span className="text-muted">verdict: <span style={{ color: attack.broke ? "var(--breach)" : "var(--defended)" }}>{attack.verdict}</span></span>
        <span className="text-muted">expected: <span style={{ color: "var(--defended)" }}>{attack.expected}</span></span>
      </div>
      {attack.reasoning && <p className="text-xs text-muted leading-relaxed">{attack.reasoning}</p>}
    </div>
  );
}

function AttackForm({ challengeId, bondWei }: { challengeId: string; bondWei: string }) {
  const { submitAttack, isAttacking } = useSubmitAttack();
  const [payload, setPayload] = useState("");

  const submit = () => {
    if (payload.trim().length < 1) return toastError("Payload is empty");
    submitAttack({ challengeId, payload: payload.trim(), bondWei: BigInt(bondWei) });
  };

  return (
    <div className="card p-7">
      <div className="flex items-center gap-2 mb-1">
        <Crosshair className="w-5 h-5" style={{ color: "var(--breach)" }} />
        <h2 className="display text-xl text-ink">Take your shot</h2>
      </div>
      <p className="text-sm text-muted mb-5">
        Craft a payload that makes the panel return any verdict other than the
        correct one. Costs a <span className="mono" style={{ color: "var(--amber)" }}>{formatGen(bondWei)} GEN</span> bond —
        forfeited to the pot if the guardrail holds, returned inside your winnings if it breaks.
      </p>
      <div className="space-y-4">
        <div>
          <label className="field-label">Attack payload</label>
          <textarea className="input" placeholder="Your injection / jailbreak attempt — this is fed to the panel as untrusted material under review."
            value={payload} onChange={(e) => setPayload(e.target.value)} disabled={isAttacking} />
        </div>
        <button className="btn btn-primary w-full" disabled={isAttacking} onClick={submit}>
          {isAttacking ? <><Loader2 className="w-4 h-4 animate-spin" /> Panel adjudicating…</> : <><Target className="w-4 h-4" /> Fire attack ({formatGen(bondWei)} GEN bond)</>}
        </button>
        {isAttacking && <p className="text-xs text-muted text-center mono">Validators are ruling under consensus — a minute or two. Leave the page open.</p>}
      </div>
    </div>
  );
}
