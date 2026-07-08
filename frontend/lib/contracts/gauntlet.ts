import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Challenge, Attack, ProtocolStats, TransactionReceipt } from "./types";
import { CONTRACT_ADDRESS } from "../config";

/** Typed wrapper around the deployed Gauntlet contract. */
class Gauntlet {
  private client: ReturnType<typeof createClient>;
  private address: `0x${string}`;

  constructor(contractAddress: string = CONTRACT_ADDRESS, account?: string | null) {
    this.address = contractAddress as `0x${string}`;
    const config: any = { chain: studionet };
    if (account) config.account = account as `0x${string}`;
    this.client = createClient(config);
  }

  private toObj(raw: any): Record<string, any> {
    if (!raw) return {};
    if (raw instanceof Map) return Object.fromEntries(raw.entries());
    if (typeof raw === "object") return raw;
    return {};
  }

  private async waitAndVerify(txHash: `0x${string}`): Promise<TransactionReceipt> {
    const receipt = (await this.client.waitForTransactionReceipt({
      hash: txHash as any, status: "ACCEPTED" as any, retries: 80, interval: 5000,
    })) as any;
    const status = String(receipt?.status ?? "").toUpperCase();
    const lr = receipt?.consensus_data?.leader_receipt;
    const r = Array.isArray(lr) ? lr[0] : lr;
    if (status.includes("UNDETERMINED") || status.includes("CANCELED")) {
      throw new Error("Validators could not reach consensus — try again");
    }
    if (r?.execution_result === "ERROR") {
      const stderr: string = r?.genvm_result?.stderr ?? "";
      const userErr = stderr.match(/UserError: (.+)/)?.[1];
      if (userErr) throw new Error(userErr);
      const lines = stderr.trim().split("\n").filter((l) => l.trim() && !l.startsWith("  "));
      const last = lines[lines.length - 1] || "";
      console.error("[Gauntlet] execution error:", stderr);
      throw new Error(last.replace(/^.*?Error: /, "").slice(0, 200) || "Contract execution error");
    }
    return receipt as TransactionReceipt;
  }

  private async safeRead(functionName: string, args: any[] = []): Promise<any> {
    try {
      return await this.client.readContract({ address: this.address, functionName, args });
    } catch (err) {
      console.warn(`[Gauntlet] safeRead "${functionName}" failed:`, err);
      return null;
    }
  }

  private async write(functionName: string, args: any[], value: bigint = BigInt(0)) {
    const txHash = await this.client.writeContract({ address: this.address, functionName, args, value });
    const receipt = await this.waitAndVerify(txHash);
    return { receipt, txHash: String(txHash) };
  }

  private normChallenge(raw: any): Challenge {
    const c = this.toObj(raw);
    return {
      ...c,
      challenge_id:     String(c.challenge_id ?? ""),
      sponsor:          String(c.sponsor ?? ""),
      mode:             (String(c.mode ?? "VERDICT").toUpperCase() === "VAULT" ? "VAULT" : "VERDICT"),
      allowed_verdicts: Array.isArray(c.allowed_verdicts) ? c.allowed_verdicts.map(String) : [],
      bounty_wei:       String(c.bounty_wei ?? "0"),
      attempts:         Number(c.attempts ?? 0),
      broken_by:        String(c.broken_by ?? ""),
      winning_verdict:  String(c.winning_verdict ?? ""),
      created_seq:      Number(c.created_seq ?? 0),
      resolved_seq:     Number(c.resolved_seq ?? 0),
    } as Challenge;
  }

  private normAttack(raw: any): Attack {
    const a = this.toObj(typeof raw === "string" ? JSON.parse(raw) : raw);
    return {
      attack_id:    String(a.attack_id ?? ""),
      challenge_id: String(a.challenge_id ?? ""),
      attacker:     String(a.attacker ?? ""),
      payload:      String(a.payload ?? ""),
      verdict:      String(a.verdict ?? ""),
      expected:     String(a.expected ?? ""),
      broke:        !!a.broke,
      reasoning:    String(a.reasoning ?? ""),
      seq:          Number(a.seq ?? 0),
    };
  }

  // ── reads ──────────────────────────────────────────────────────────────

  async getProtocolStats(): Promise<ProtocolStats | null> {
    const raw = await this.safeRead("get_protocol_stats");
    if (!raw) return null;
    const s = this.toObj(raw);
    return {
      min_bounty_wei:          String(s.min_bounty_wei ?? "0"),
      attack_bond_wei:         String(s.attack_bond_wei ?? "0"),
      total_challenges:        Number(s.total_challenges ?? 0),
      total_attacks:           Number(s.total_attacks ?? 0),
      total_breaks:            Number(s.total_breaks ?? 0),
      total_bounty_volume_wei: String(s.total_bounty_volume_wei ?? "0"),
      total_paid_wei:          String(s.total_paid_wei ?? "0"),
    };
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    const raw = await this.safeRead("get_challenge", [id]);
    return raw ? this.normChallenge(raw) : null;
  }

  async getChallenges(limit = 50): Promise<Challenge[]> {
    const raw = await this.safeRead("get_challenges", [limit]);
    return Array.isArray(raw) ? raw.map((c) => this.normChallenge(c)) : [];
  }

  async getChallengesBySponsor(sponsor: string): Promise<Challenge[]> {
    const raw = await this.safeRead("get_challenges_by_sponsor", [sponsor]);
    return Array.isArray(raw) ? raw.map((c) => this.normChallenge(c)) : [];
  }

  async getAttacks(challengeId: string): Promise<Attack[]> {
    const raw = await this.safeRead("get_attacks", [challengeId]);
    return Array.isArray(raw) ? raw.map((a) => this.normAttack(a)) : [];
  }

  async getAttacksByAttacker(attacker: string): Promise<Attack[]> {
    const raw = await this.safeRead("get_attacks_by_attacker", [attacker]);
    return Array.isArray(raw) ? raw.map((a) => this.normAttack(a)) : [];
  }

  // ── writes ─────────────────────────────────────────────────────────────

  async createChallenge(args: {
    title: string; brief: string; task: string; criteria: string;
    guardrailText: string; expectedVerdict: string; allowedVerdicts: string[];
    mode?: "VERDICT" | "VAULT"; bountyWei: bigint;
  }) {
    return this.write(
      "create_challenge",
      [args.title, args.brief, args.task, args.criteria, args.guardrailText,
       args.expectedVerdict, args.allowedVerdicts, args.mode ?? "VERDICT"],
      args.bountyWei,
    );
  }

  async submitAttack(challengeId: string, payload: string, bondWei: bigint) {
    return this.write("submit_attack", [challengeId, payload], bondWei);
  }

  async closeChallenge(challengeId: string) {
    return this.write("close_challenge", [challengeId]);
  }
}

export default Gauntlet;
