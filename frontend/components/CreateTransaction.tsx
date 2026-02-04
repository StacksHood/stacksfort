"use client";

import { useState } from "react";
import { useMultisig, TXN_TYPE_STX, TXN_TYPE_TOKEN } from "@/hooks/useMultisig";
import { 
  X, 
  Plus, 
  Coins, 
  ArrowRight, 
  ShieldCheck, 
  Send, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";

type Props = {
  contractAddress: string;
  contractName: string;
  onClose: () => void;
  onSuccess: (txid: string) => void;
};

export function CreateTransaction({ 
  contractAddress, 
  contractName, 
  onClose,
  onSuccess 
}: Props) {
  const { submitTransaction, isCurrentUserSigner } = useMultisig(contractAddress, contractName);
  
  const [type, setType] = useState<number>(TXN_TYPE_STX);
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [tokenContract, setTokenContract] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentUserSigner()) {
      setError("Only authorized signers can submit transactions.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!recipient.startsWith("SP") && !recipient.startsWith("ST")) {
      setError("Please enter a valid Stacks address.");
      return;
    }

    if (type === TXN_TYPE_TOKEN && !tokenContract) {
      setError("Please enter a token contract address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert amount to micro-units (assuming 6 decimals for now as a default)
      // In a real app, we would fetch token decimals
      const microAmount = Math.floor(parseFloat(amount) * 1_000_000);
      
      const txid = await submitTransaction(
        type,
        microAmount,
        recipient,
        type === TXN_TYPE_TOKEN ? tokenContract : undefined
      );

      if (txid) {
        onSuccess(txid);
      } else {
        setError("Failed to submit transaction to the network.");
      }
    } catch (err) {
      console.error("Error submitting transaction:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0B0F1A] shadow-2xl shadow-black animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20">
              <Plus className="h-6 w-6 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white italic">Create Transaction</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                New multisig proposal
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Transaction Type */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Asset Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType(TXN_TYPE_STX)}
                className={`flex items-center justify-center gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                  type === TXN_TYPE_STX 
                    ? "border-amber-500/50 bg-amber-500/10 text-white" 
                    : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                <Coins className="h-5 w-5" />
                <span className="font-bold">STX</span>
              </button>
              <button
                type="button"
                onClick={() => setType(TXN_TYPE_TOKEN)}
                className={`flex items-center justify-center gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                  type === TXN_TYPE_TOKEN 
                    ? "border-purple-500/50 bg-purple-500/10 text-white" 
                    : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
                <span className="font-bold">SIP-010</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Amount</label>
            <div className="relative group">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-lg font-bold text-white outline-none transition-all focus:border-amber-500/50 group-hover:bg-white/10"
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-widest text-slate-500">
                {type === TXN_TYPE_STX ? "STX" : "Tokens"}
              </span>
            </div>
          </div>

          {/* Recipient */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Recipient Address</label>
            <div className="relative group">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="SP... / ST..."
                className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 font-mono text-sm text-slate-200 outline-none transition-all focus:border-amber-500/50 group-hover:bg-white/10"
                required
              />
              <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {/* Token Contract (Conditional) */}
          {type === TXN_TYPE_TOKEN && (
            <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Token Contract Address</label>
              <input
                type="text"
                value={tokenContract}
                onChange={(e) => setTokenContract(e.target.value)}
                placeholder="SP...contract-name"
                className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 font-mono text-sm text-slate-200 outline-none transition-all focus:border-purple-500/50 hover:bg-white/10"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-500 py-5 text-sm font-black uppercase tracking-[0.2em] text-zinc-950 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-xl shadow-amber-500/20"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                Submit Proposal
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="bg-white/5 px-8 py-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" /> All transactions require threshold authorization before execution.
          </p>
        </div>
      </div>
    </div>
  );
}
