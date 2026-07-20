import type { ChallengeStatus, ChallengeMode } from "@/lib/contracts/types";

export function ModeChip({ mode }: { mode: ChallengeMode }) {
  const label = mode === "VAULT" ? "Vault" : mode === "LIVE" ? "Live page" : mode === "VISION" ? "Vision" : "Verdict";
  const cls = mode === "VAULT" ? "chip-amber" : "chip-closed";
  return <span className={`chip ${cls}`}>{label}</span>;
}

export function StatusChip({ status }: { status: ChallengeStatus }) {
  const cls = status === "OPEN" ? "chip-open" : status === "BROKEN" ? "chip-broken" : "chip-closed";
  const label = status === "OPEN" ? "Live" : status === "BROKEN" ? "Breached" : "Retired";
  return <span className={`chip ${cls}`}>{label}</span>;
}

export function OutcomeChip({ broke }: { broke: boolean }) {
  return broke
    ? <span className="chip chip-breached">Breach</span>
    : <span className="chip chip-held">Held</span>;
}

/** An attack's submitted payload, labelled by mode. In LIVE/VISION the payload
 *  is a URL the contract fetched — shown as selectable text (not a live link:
 *  a red-team arena shouldn't turn attacker-controlled URLs into one-click nav). */
export function AttackPayload({ mode, payload }: { mode: ChallengeMode; payload: string }) {
  const label = mode === "VISION" ? "attack image" : mode === "LIVE" ? "target page" : "payload";
  const isUrl = (mode === "LIVE" || mode === "VISION") && /^https?:\/\//i.test(payload);
  return (
    <div className="rounded-lg p-3 font-mono text-xs" style={{ background: "var(--surface-dim)" }}>
      <span className="text-muted">{label} › </span>
      <span className={`text-soft ${isUrl ? "break-all" : "break-words"}`}>{payload}</span>
      {isUrl && <span className="chip chip-closed ml-2" style={{ fontSize: "9px", verticalAlign: "middle" }}>URL · fetched on-chain</span>}
    </div>
  );
}

/** Resilience = attempts survived. Higher = tougher honeypot. */
export function ResilienceMeter({ attempts, broken }: { attempts: number; broken: boolean }) {
  const pct = Math.min(100, 12 + attempts * 12);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="mono text-[10px] text-muted">RESILIENCE</span>
        <span className="mono text-[10px]" style={{ color: broken ? "var(--breach)" : "var(--defended)" }}>
          {broken ? "BREACHED" : `${attempts} held`}
        </span>
      </div>
      <div className="meter">
        <span style={{ width: `${broken ? 100 : pct}%`, background: broken ? "var(--breach)" : undefined }} />
      </div>
    </div>
  );
}
