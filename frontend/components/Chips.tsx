import type { ChallengeStatus, ChallengeMode } from "@/lib/contracts/types";

export function ModeChip({ mode }: { mode: ChallengeMode }) {
  return mode === "VAULT"
    ? <span className="chip chip-amber">Vault</span>
    : <span className="chip chip-closed">Verdict</span>;
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
