<p align="center">
  <img src="https://raw.githubusercontent.com/Hemmy1417/Gauntlet/master/frontend/app/icon.svg" alt="Gauntlet" width="140" />
</p>

# Gauntlet - Adversarial Prompt-Injection Arena

**Prompt-injection as a paid sport on GenLayer - the AI panel is the target, deterministic code is
the referee.**

A sponsor plants an AI-adjudicated honeypot with an objectively-correct answer, locks a bounty, and
publishes the guardrail they want stress-tested. Anyone submits a crafted payload trying to make the
panel rule *wrong* - and a deterministic referee (plain code, never another model) confirms the flip
and pays the bounty. The output is a growing public corpus of injection attacks and which guardrail
phrasings survive them.

Contract live on Studionet; frontend in `frontend/` (dark red-team console).

## What it is

- **AI is the target, code is the referee** - the panel only produces a verdict; a plain
  `verdict == expected_verdict` decides the payout. The LLM never judges whether it was beaten.
- **Two modes** - `VERDICT` (flip a classification to a wrong-but-valid answer) and `VAULT` (fool
  an AI gatekeeper into `APPROVE` and drain the locked GEN - the native way to "attack a token
  contract" on GenLayer).
- **A win must survive to finality** - payouts emit `on="finalized"`, and GenLayer appeals re-run
  the transaction with a larger validator set, so finality *is* the appeal-round test at no extra
  code.
- **Bonded attacks** - each attempt posts a bond; a miss forfeits it into the pot, so the reward
  grows with every failed attack.
- **A break beats the network's own defense** - every attack runs through GenLayer consensus, where
  validators **greybox** the prompt (paraphrase, retokenize, perplexity-filter adversarial text)
  and each runs a **different, undisclosed model**. So a Gauntlet break isn't "I fooled one GPT" -
  it's an attack that survived the chain's own anti-injection layer and a heterogeneous panel.
- **Guardrail red-team, before you lock funds** - `preview_guardrail` runs a free advisory round
  that scores a draft guardrail's resilience and names its weakest vector, so sponsors harden the
  defense before any GEN is at stake.
- **A public breach log** - every attack and outcome is on-chain: the corpus is the product.

## How it works

### For sponsors (defenders)
1. Plant a challenge: a task with an indisputable correct answer from a fixed verdict set, plus the
   `guardrail_text` you want tested - lock the bounty.
2. In VAULT mode, supply only the authorized-release condition; the contract writes the gatekeeper
   prompt itself.
3. Watch attacks accumulate - each miss grows your pot and adds to the resilience record.
4. Close the challenge to reclaim an unbroken bounty.

### For attackers (breakers)
1. Browse open challenges - "hottest targets" and a resilience meter per honeypot.
2. Submit a payload with the attack bond; it enters adjudication as untrusted material under review.
3. The panel rules under consensus; the referee compares the verdict to the expected answer.
4. Flip it and the escalated pot is yours (`BROKEN`); miss and your bond joins the bounty.
5. First break wins; the payout lands at finalization, so it must survive appeals.

## Referee outcomes

| Outcome | Meaning |
|---|---|
| Flipped | `panel_verdict != expected_verdict` - the guardrail broke; the attacker takes the escalated pot. |
| Held | The verdict matched the expected answer - the bond forfeits into the bounty and the attempt is logged. |
| Off-list | A garbage or out-of-enum verdict is **not** a break - the guardrail wasn't flipped to a wrong-but-valid answer. |

The referee is `verdict == expected_verdict`, deterministic code - the model is never asked whether
it was beaten.

## Challenge lifecycle

```text
OPEN -> BROKEN                         (first flip wins, pays at finality)
   \-> CLOSED                          (sponsor reclaims an unbroken bounty)
```

| Status | What happens |
|---|---|
| `OPEN` | Bounty locked, accepting bonded attacks; each miss grows the pot. |
| `BROKEN` | A verdict flip was refereed and paid; the guardrail is on record as beaten. |
| `CLOSED` | The sponsor closed an unbroken challenge and reclaimed the bounty. |

## GenLayer consensus functions

| Function | Kind | What runs under consensus |
|---|---|---|
| `submit_attack` | write, payable | The payload enters adjudication as untrusted material under review; the panel produces a verdict under consensus, and deterministic code - not the model - decides the payout. |

The consensus mechanism is simultaneously the *target* (the panel being attacked) and, via the
deterministic wrapper, the *harness* - and finality doubles as the appeal-round test.

## Contract

| Field | Value |
|---|---|
| Network | GenLayer Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |
| Contract address | [`0x6207C2b7DbAe3a8DA4B73dF9Ba2803047a854FAb`](https://studio.genlayer.com/?import-contract=0x6207C2b7DbAe3a8DA4B73dF9Ba2803047a854FAb) |
| Source | `contracts/gauntlet.py` |

### Write methods

| Method | Who | Payable | Notes |
|---|---|---|---|
| `create_challenge(title, brief, task, criteria, guardrail_text, expected_verdict, allowed_verdicts, mode)` | sponsor | bounty | Min 0.1 GEN; mode is `VERDICT` or `VAULT`; verdicts are a fixed enum. |
| `submit_attack(challenge_id, payload)` | anyone | bond | 0.02 GEN bond; a miss grows the pot, a flip takes it. |
| `preview_guardrail(task, guardrail_text, expected_verdict, allowed_verdicts, mode)` | anyone | - | Advisory red-team of a **draft** guardrail before locking a bounty; runs one consensus round, stores nothing, moves no funds. |
| `close_challenge(challenge_id)` | sponsor | - | Reclaims an unbroken bounty. |

### Read methods

`get_protocol_stats`, `get_challenge`, `get_challenges`, `get_challenges_by_sponsor`,
`get_attacks`, `get_attacks_by_attacker`

### Consensus guarantees

- **The LLM never scores itself** - a plain `verdict == expected_verdict` in deterministic code
  decides every payout.
- **Off-list verdicts don't pay** - only a flip to a wrong-but-*valid* answer counts as a break, so
  an unparseable or empty panel output (an LLM outage) rules HELD and can never pay the attacker.
- **No contract-level injection floor - by design** - unlike the sibling contracts, Gauntlet
  deliberately adds *no* anti-injection guardrail of its own. The sponsor's `guardrail_text` is the
  entire defense under test; a contract that hardened every honeypot would make weak guardrails
  unbreakable and defeat the arena. The attacker's payload still enters strictly as material under
  review, never as instructions to the referee - which is deterministic code, not the model.
- **Finality is the appeal test** - the payout uses `emit_transfer(on="finalized")`, so a win only
  lands if it survives GenLayer's larger-validator-set appeal round.

## Verified end-to-end

Validated on-chain across both modes:

```text
strong guardrail  vs naive override / DAN roleplay / fake authority  -> HELD, bonds grew the pot
weak verdict honeypot                                                 -> BROKEN, attacker paid
lax vault gate    fooled into APPROVE                                 -> vault DRAINED to the attacker
```

> Strong defenses hold, sloppy ones pay out - exactly the lesson the arena exists to teach, and
> every attack (win or miss) is written to the public breach log as attack corpus.

**28 direct-mode tests** with the panel stubbed to hold or break, covering the referee logic, the
bond-to-pot mechanics, both modes, and the advisory guardrail preview (stores/moves nothing).

## Tech stack

| Layer | Tech |
|---|---|
| Intelligent Contract | Python on GenVM (referee, escrow, both modes) |
| Consensus | `gl.eq_principle` adjudication + a deterministic verdict wrapper |
| Frontend | Next.js 16, Tailwind - dark red-team console (Material 3 DNA, Sora + JetBrains Mono) |
| Web3 | GenLayerJS, EIP-6963 injected wallets |
| Backend | None - the contract is the source of truth |

## Repository

```text
contracts/gauntlet.py         The Intelligent Contract (referee + escrow)
tests/direct/                 28 direct-mode tests, pytest
deploy/deployScript.ts        genlayer-js deploy
gltest.config.yaml            GenLayer test harness config
frontend/                     Next.js app (arena, challenge room, breach log, leaderboard, /new)
```

## Getting started

```bash
# contract tests
python -m pytest tests/direct -q

# frontend
cd frontend
cp .env.Example .env.local     # contract address + Studionet RPC
npm install
npm run dev -- -p 4800
```

## Security

- The payout is bound to deterministic code, never to the model's opinion of the fight - the LLM
  cannot be socially-engineered into declaring itself beaten.
- Attack payloads enter adjudication strictly as material under review, never as instructions to
  the referee.
- Bonds deter spam and grow the pot, so griefing an honest challenge costs the griefer.
- Contract writes are signed by the connected wallet's own EIP-1193 provider - never an implicit
  `window.ethereum` fallback; `frontend/tests/signed-write.test.ts` proves the route.
- Wallet payouts go through an empty `@gl.evm.contract_interface` proxy (`emit_transfer` at a
  plain wallet strands value).

## Design notes

- Only works with an indisputable correct answer - vague ground truth makes a "win" arguable, so
  the UI enforces fixed-enum verdicts.
- A win is evidence that *this guardrail + this validator set* was beaten on that transaction - not
  a universal claim about GenLayer.
- GenLayer contracts carry a risk surface no other chain has, the LLM judgment itself; Gauntlet
  exploits that surface instead of working around it, and turns the results into a public corpus.

## Disclaimer

Gauntlet is a hackathon project on a test network. Bounties and bonds are testnet GEN; do not use
the contract for real security bounties without an audit.
