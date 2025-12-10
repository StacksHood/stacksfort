"use client";

import { useState } from "react";
import { useMultisig } from "@/hooks/useMultisig";

type Props = {
  contractAddress: string;
  contractName?: string;
};

const formatAddress = (address: string) => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
};

const formatAmount = (amount: bigint) => {
  const stx = Number(amount) / 1_000_000;
  return stx.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

export function MultisigDashboard({ contractAddress, contractName = "multisig" }: Props) {
  const { state, balance, isLoading, error } = useMultisig(contractAddress, contractName);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = async () => {
    const fullAddress = `${contractAddress}.${contractName}`;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-2xl border border-white/5 bg-white/5 p-6">
          <div className="h-6 w-48 rounded bg-white/10" />
          <div className="mt-4 h-10 w-full rounded bg-white/10" />
        </div>
        <div className="animate-pulse rounded-2xl border border-white/5 bg-white/5 p-6">
          <div className="h-6 w-32 rounded bg-white/10" />
          <div className="mt-4 space-y-3">
            <div className="h-12 w-full rounded bg-white/10" />
            <div className="h-12 w-full rounded bg-white/10" />
            <div className="h-12 w-full rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-200">Failed to load multisig</p>
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!state?.initialized) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-semibold text-amber-200">Multisig not initialized</p>
            <p className="text-sm text-amber-300/80">
              This multisig contract has not been initialized yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = `${contractAddress}.${contractName}`;

  return (
    <div className="space-y-6">
      {/* Multisig Address & Balance */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-white/0 p-6 shadow-xl shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.12em] text-slate-400">
              Multisig Address
            </p>
            <div className="mt-2 flex items-center gap-3">
              <code className="rounded-lg bg-black/30 px-3 py-2 font-mono text-sm text-white">
                {formatAddress(fullAddress)}
              </code>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors duration-150 hover:border-amber-300 hover:text-amber-200"
              >
                {copiedAddress ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Balance</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatAmount(balance)} STX
            </p>
          </div>
        </div>
      </div>

      {/* Threshold Information */}
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-slate-400">
              Signature Threshold
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {state.threshold} of {state.signers.length}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {state.threshold} signature{state.threshold !== 1 ? "s" : ""} required to execute
              transactions
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/20 to-amber-600/20">
            <span className="text-3xl">🔐</span>
          </div>
        </div>
      </div>

      {/* Signers List */}
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-slate-400">
              Authorized Signers
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {state.signers.length} signer{state.signers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            Active
          </span>
        </div>

        <div className="space-y-2">
          {state.signers.map((signer, index) => (
            <div
              key={signer}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition-colors duration-150 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/20 to-amber-600/20">
                  <span className="font-semibold text-amber-200">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <code className="block font-mono text-sm font-medium text-white">
                    {formatAddress(signer)}
                  </code>
                  <p className="text-xs text-slate-400">Authorized signer</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-emerald-200">Active</span>
              </div>
            </div>
          ))}
        </div>

        {state.signers.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-8 text-center">
            <p className="text-sm text-slate-400">No signers configured</p>
          </div>
        )}
      </div>

      {/* Transaction Counter */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-white/5 to-white/0 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-slate-400">
              Total Transactions
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {state.nextTxnId}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Transactions submitted to this multisig
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/20 via-sky-500/20 to-sky-600/20">
            <span className="text-3xl">📋</span>
          </div>
        </div>
      </div>
    </div>
  );
}
