# Gauntlet — adversarial honeypot arena for Intelligent Contracts

Gauntlet turns prompt-injection into a paid sport. A sponsor plants an
AI-adjudicated honeypot with an **objectively-correct answer**, locks a
bounty, and publishes the guardrail block they want stress-tested. Anyone
can submit a crafted payload trying to make the panel rule *wrong* — and a
**deterministic referee** (plain code, never another model) confirms the
flip and pays the bounty.

**Contract:** `0xD69633CCB9AB3fEf1aebCcAf9cA019448bB3FC1b` (GenLayer Studionet)

## The loop

1. **Plant** — `create_challenge` locks a bounty and defines the honeypot: a
   task whose correct answer is `expected_verdict` (from a fixed
   `allowed_verdicts` set), plus the `guardrail_text` being tested.
2. **Attack** — `submit_attack` (with a small bond) feeds a payload into the
   challenge's adjudication as *untrusted material under review*. The panel
   rules under GenLayer consensus.
3. **Referee** — deterministic code compares `verdict` to `expected_verdict`:
   - **flipped** → the guardrail broke → the attacker takes the escalated
     pot, `BROKEN`.
   - **held** → the bond forfeits into the bounty (the pot grows), the
     attempt is logged.
4. **Settle** — first break wins. The payout pays at **finalization**.

## Two invariants (docs-confirmed)

- **AI is the target; code is the referee.** The panel only produces a
  verdict; a plain `verdict == expected_verdict` decides the payout. The LLM
  never judges whether it was beaten.
- **A win must survive to finality.** Because GenLayer appeals re-run the
  transaction with a fresh, larger validator set, a payout emitted
  `on="finalized"` only lands if the attack survives appeals — **finality is
  the appeal-round test**, at no extra code.

## Why this only exists on GenLayer

GenLayer contracts carry a risk surface no other chain has: the LLM
judgment itself. Gauntlet exploits that surface instead of working around
it — and it is *the same consensus mechanism that is both the target and,
via the deterministic wrapper, the harness*. The output is a growing public
corpus of prompt-injection attacks and which guardrail phrasings survive
them.

## Honest boundaries

- Only works with an **indisputable** correct answer — vague ground truth
  makes a "win" arguable. The UI enforces fixed-enum verdicts.
- An off-list or garbage verdict is **not** a break (the guardrail wasn't
  flipped to a wrong-but-valid answer).
- A win reflects that *this guardrail + validator set* was beaten on that
  transaction — it is evidence, not a universal claim about GenLayer.

## Frontend

Material 3 (Google Stitch DNA) flipped to a **dark red-team console**: live
status strip, "hottest targets," a resilience meter per honeypot, a public
**breach log** (the attack corpus), and a **leaderboard** of top breakers
and most-resilient targets. Sora display + JetBrains Mono.

```
├── contracts/gauntlet.py    # the Intelligent Contract (referee + escrow)
├── deploy/deployScript.ts   # genlayer-js deploy
├── tests/direct/            # 19 deterministic tests (panel stubbed hold/break)
├── frontend/                # Next.js 16 — dark security-console design
├── gltest.config.yaml · pyproject.toml · requirements.txt
```

## Running locally

```bash
cd frontend && npm install
# .env.local: NEXT_PUBLIC_CONTRACT_ADDRESS + Studionet RPC vars (see .env.Example)
npm run dev -- -p 4800
```

Tests: `python -m pytest tests/direct -q` from the repo root.
