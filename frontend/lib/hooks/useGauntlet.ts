"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Gauntlet from "../contracts/gauntlet";
import { CONTRACT_ADDRESS, CONTRACT_CONFIGURED, explorerTxUrl } from "../config";
import { useWallet } from "../genlayer/wallet";
import { success, error } from "../toast";
import type { Challenge, Attack, ProtocolStats, GuardrailPreview } from "../contracts/types";

export function useGauntletContract(): Gauntlet | null {
  const { address } = useWallet();
  return useMemo(() => {
    if (!CONTRACT_CONFIGURED) return null;
    return new Gauntlet(CONTRACT_ADDRESS, address || null);
  }, [address]);
}

// Studionet rate-limits the RPC at 500 req/hour.
const READ_DEFAULTS = { refetchOnWindowFocus: false, staleTime: 60_000, retry: 1 } as const;

export function useProtocolStats() {
  const contract = useGauntletContract();
  return useQuery<ProtocolStats | null, Error>({
    queryKey: ["stats"],
    queryFn: () => (contract ? contract.getProtocolStats() : Promise.resolve(null)),
    ...READ_DEFAULTS, enabled: !!contract,
  });
}

export function useChallenges(limit = 50) {
  const contract = useGauntletContract();
  return useQuery<Challenge[], Error>({
    queryKey: ["challenges", limit],
    queryFn: () => (contract ? contract.getChallenges(limit) : Promise.resolve([])),
    ...READ_DEFAULTS, enabled: !!contract,
  });
}

export function useChallenge(id: string | null) {
  const contract = useGauntletContract();
  return useQuery<Challenge | null, Error>({
    queryKey: ["challenge", id],
    queryFn: () => (contract && id ? contract.getChallenge(id) : Promise.resolve(null)),
    ...READ_DEFAULTS, enabled: !!contract && !!id,
  });
}

export function useAttacks(challengeId: string | null) {
  const contract = useGauntletContract();
  return useQuery<Attack[], Error>({
    queryKey: ["attacks", challengeId],
    queryFn: () => (contract && challengeId ? contract.getAttacks(challengeId) : Promise.resolve([])),
    ...READ_DEFAULTS, enabled: !!contract && !!challengeId,
  });
}

export function useMyChallenges() {
  const contract = useGauntletContract();
  const { address } = useWallet();
  return useQuery<Challenge[], Error>({
    queryKey: ["myChallenges", address],
    queryFn: () => (contract && address ? contract.getChallengesBySponsor(address) : Promise.resolve([])),
    ...READ_DEFAULTS, enabled: !!contract && !!address,
  });
}

export function useMyAttacks() {
  const contract = useGauntletContract();
  const { address } = useWallet();
  return useQuery<Attack[], Error>({
    queryKey: ["myAttacks", address],
    queryFn: () => (contract && address ? contract.getAttacksByAttacker(address) : Promise.resolve([])),
    ...READ_DEFAULTS, enabled: !!contract && !!address,
  });
}

// ── WRITE HOOKS ─────────────────────────────────────────────────────────────

function useGauntletMutation<TArgs>(opts: {
  run: (contract: Gauntlet, args: TArgs) => Promise<{ receipt: any; txHash: string }>;
  successTitle: (args: TArgs, data: any) => string;
  successDescription?: (args: TArgs, data: any) => string;
  errorTitle: string;
}) {
  const contract = useGauntletContract();
  const qc = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const mutation = useMutation({
    mutationFn: async (args: TArgs) => {
      if (!contract) throw new Error("Contract not configured");
      setIsPending(true);
      const out = await opts.run(contract, args);
      return { ...out, args };
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries();
      setIsPending(false);
      success(opts.successTitle(data.args, data), {
        description: opts.successDescription?.(data.args, data),
        explorerUrl: explorerTxUrl(data?.txHash),
      });
    },
    onError: (err: any) => {
      setIsPending(false);
      error(opts.errorTitle, { description: err?.message || "Please try again." });
    },
  });

  return { mutate: mutation.mutate, isPending };
}

export function useCreateChallenge() {
  const m = useGauntletMutation<{
    title: string; brief: string; task: string; criteria: string;
    guardrailText: string; expectedVerdict: string; allowedVerdicts: string[];
    mode?: "VERDICT" | "VAULT"; bountyWei: bigint;
  }>({
    run: (c, a) => c.createChallenge(a),
    successTitle: (a) => (a.mode === "VAULT" ? "Vault sealed" : "Honeypot planted"),
    successDescription: () => "The funds are locked. Attackers can now take their shot.",
    errorTitle: "Could not plant the honeypot",
  });
  return { createChallenge: m.mutate, isCreating: m.isPending };
}

export function useSubmitAttack() {
  const m = useGauntletMutation<{ challengeId: string; payload: string; bondWei: bigint }>({
    run: (c, a) => c.submitAttack(a.challengeId, a.payload, a.bondWei),
    successTitle: (_a, d) => (d?.args ? "Attack adjudicated" : "Attack adjudicated"),
    successDescription: () => "The panel has ruled — check the target for the outcome.",
    errorTitle: "Attack failed to submit",
  });
  return { submitAttack: m.mutate, isAttacking: m.isPending };
}

export function useCloseChallenge() {
  const m = useGauntletMutation<{ challengeId: string }>({
    run: (c, a) => c.closeChallenge(a.challengeId),
    successTitle: () => "Challenge retired",
    successDescription: () => "The unbroken pot has been returned to you.",
    errorTitle: "Could not close",
  });
  return { closeChallenge: m.mutate, isClosing: m.isPending };
}

// Advisory red-team of a DRAFT guardrail — one consensus round, no funds moved,
// nothing stored. Holds its own result state so the /new page can render it.
export function usePreviewGuardrail() {
  const contract = useGauntletContract();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<GuardrailPreview | null>(null);

  const runPreview = async (args: {
    task: string; guardrailText: string; expectedVerdict: string;
    allowedVerdicts: string[]; mode?: "VERDICT" | "VAULT";
  }) => {
    if (!contract) { error("Contract not configured"); return; }
    setIsPreviewing(true);
    setPreview(null);
    try {
      const res = await contract.previewGuardrail(args);
      if (res) setPreview(res);
      else error("Preview came back empty", { description: "The panel didn't return a readable result — try again." });
    } catch (err: any) {
      error("Red-team preview failed", { description: err?.message || "Please try again." });
    } finally {
      setIsPreviewing(false);
    }
  };

  return { preview, isPreviewing, runPreview, clearPreview: () => setPreview(null) };
}
