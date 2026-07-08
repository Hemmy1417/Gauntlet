// Shapes returned by the Gauntlet contract, post-normalization: u256 → decimal
// string, counts → number. No BigInt past the wrapper.

export type ChallengeStatus = "OPEN" | "BROKEN" | "CLOSED";

export interface Challenge {
  challenge_id: string;
  sponsor: string;
  title: string;
  brief: string;
  task: string;
  criteria: string;
  guardrail_text: string;
  expected_verdict: string;
  allowed_verdicts: string[];
  bounty_wei: string;
  status: ChallengeStatus;
  attempts: number;
  broken_by: string;
  winning_verdict: string;
  created_seq: number;
  resolved_seq: number;
}

export interface Attack {
  attack_id: string;
  challenge_id: string;
  attacker: string;
  payload: string;
  verdict: string;
  expected: string;
  broke: boolean;
  reasoning: string;
  seq: number;
}

export interface ProtocolStats {
  min_bounty_wei: string;
  attack_bond_wei: string;
  total_challenges: number;
  total_attacks: number;
  total_breaks: number;
  total_bounty_volume_wei: string;
  total_paid_wei: string;
}

export type TransactionReceipt = Record<string, any>;
