"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  useMultisig, 
  TXN_TYPE_STX, 
  TXN_TYPE_TOKEN 
} from "@/hooks/useMultisig";
import type { Transaction } from "@/hooks/useMultisig";
import { useSignatures } from "@/hooks/useSignatures";
import { useStacksWallet } from "@/hooks/useStacksWallet";
import { openSignatureRequest } from "@stacks/connect";
import { appDetails } from "@/lib/stacks-session";
import Link from "next/link";
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Hash, 
  ArrowRight,
  ShieldCheck,
  User,
  Copy,
  PenTool,
  Ban,
  AlertCircle
} from "lucide-react";

type Props = {
  transaction: Transaction;
  contractAddress: string;
  contractName: string;
  threshold: number;
  signers: string[];
  onClose: () => void;
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

export function TransactionDetail({ 
  transaction, 
  contractAddress, 
  contractName, 
  threshold,
  signers,
  onClose 
}: Props) {
  const { getTransactionHash, isCurrentUserSigner, cancelTransaction } = useMultisig(contractAddress, contractName);
  const wallet = useStacksWallet();
  const { addSignature, getTxnSignatures, hasSigned } = useSignatures();
  
  const [hash, setHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Get signatures for this transaction from our local store
  const localSignatures = useMemo(() => getTxnSignatures(transaction.id), [transaction.id, getTxnSignatures]);
  const signatureCount = localSignatures.length;

  useEffect(() => {
    async function fetchHash() {
      const txnHash = await getTransactionHash(transaction.id);
      setHash(txnHash);
    }
    fetchHash();
  }, [transaction.id, getTransactionHash]);

  const handleCopyHash = async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (err) {
      console.error("Failed to copy hash:", err);
    }
  };

  const { cancelTransaction, executeStxTransfer, executeTokenTransfer } = useMultisig(contractAddress, contractName);

  const handleCancel = async () => {
    if (!isCurrentUserSigner() || isCancelling) return;
    try {
      setIsCancelling(true);
      const txid = await cancelTransaction(transaction.id);
      console.log("Cancellation transaction broadcasted:", txid);
      setIsCancelling(false);
      onClose(); // Close modal after successful broadcast
    } catch (err) {
      console.error("Error cancelling transaction:", err);
      setIsCancelling(false);
    }
  };

  const handleExecute = async () => {
    if (signatureCount < threshold || isExecuting) return;

    try {
      setIsExecuting(true);
      const signatureBuffs = localSignatures.map(s => s.signature);
      
      let txid;
      if (transaction.type === TXN_TYPE_STX) {
        txid = await executeStxTransfer(transaction.id, signatureBuffs, transaction.amount);
      } else if (transaction.type === TXN_TYPE_TOKEN && transaction.token) {
        txid = await executeTokenTransfer(transaction.id, signatureBuffs, transaction.token, transaction.amount);
      }

      console.log("Execution transaction broadcasted:", txid);
      setIsExecuting(false);
      onClose();
    } catch (err) {
      console.error("Error executing transaction:", err);
      setIsExecuting(false);
    }
  };

  const handleSign = async () => {
    if (!hash || !wallet.address) return;
    
    try {
      setIsSigning(true);
      
      await openSignatureRequest({
        message: hash,
        appDetails,
        onFinish: (data) => {
          console.log("Signature successful:", data);
          addSignature({
            txnId: transaction.id,
            signer: wallet.address!,
            signature: data.signature,
            timestamp: Date.now()
          });
          setIsSigning(false);
        },
        onCancel: () => {
          console.log("Signature cancelled");
          setIsSigning(false);
        }
      });
    } catch (err) {
      console.error("Error during signing:", err);
      setIsSigning(false);
    }
  };

  const statusLabel = transaction.executed ? "Executed" : transaction.cancelled ? "Cancelled" : "Pending";
  const typeLabel = transaction.type === TXN_TYPE_STX ? "STX Transfer" : "Token Transfer";
  const canSign = isCurrentUserSigner() && !transaction.executed && !transaction.cancelled && !hasSigned(transaction.id, wallet.address || "");
  const canCancel = isCurrentUserSigner() && !transaction.executed && !transaction.cancelled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0B0F1A] shadow-2xl shadow-black animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/20 to-amber-600/20 font-black text-amber-200 shadow-inner">
              #{transaction.id}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{typeLabel}</h2>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Details & Authorization
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

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-8 py-8 space-y-8">
          {/* Status & Core Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
              <div className="flex items-center gap-2 pt-1">
                {transaction.executed ? (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> {statusLabel}
                  </div>
                ) : transaction.cancelled ? (
                  <div className="flex items-center gap-2 rounded-full bg-red-400/10 border border-red-400/20 px-3 py-1 text-xs font-bold text-red-400">
                    <Ban className="h-3 w-3" /> {statusLabel}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-xs font-bold text-amber-400">
                    <Clock className="h-3 w-3 animate-pulse" /> {statusLabel}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</span>
              <p className="text-2xl font-black text-white italic">
                {formatAmount(transaction.amount)}{" "}
                <span className="text-sm font-bold text-slate-500">
                  {transaction.type === TXN_TYPE_STX ? "STX" : "Tokens"}
                </span>
              </p>
            </div>
          </div>

          {/* Recipient */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <ArrowRight className="h-3 w-3 text-primary" /> Recipient Address
            </div>
            <code className="block rounded-lg bg-black/40 p-4 font-mono text-sm text-slate-200 border border-white/5">
              {transaction.recipient}
            </code>
          </div>

          {/* Token Contract (if applicable) */}
          {transaction.token && transaction.type === TXN_TYPE_TOKEN && (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <ShieldCheck className="h-3 w-3 text-purple-400" /> Token Contract
              </div>
              <code className="block rounded-lg bg-black/40 p-4 font-mono text-sm text-slate-200 border border-white/5">
                {transaction.token}
              </code>
            </div>
          )}

          {/* Transaction Hash */}
          {!transaction.cancelled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Hash className="h-3 w-3 text-blue-400" /> Transaction Hash
                </div>
                {hash && (
                  <button 
                    onClick={handleCopyHash}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {copiedHash ? "Copied!" : <><Copy className="h-3 w-3" /> Copy Hash</>}
                  </button>
                )}
              </div>
              <div className="rounded-xl bg-black/60 p-4 border border-white/5">
                {hash ? (
                  <code className="block font-mono text-xs text-blue-400/90 break-all leading-relaxed">
                    0x{hash}
                  </code>
                ) : (
                  <div className="h-8 animate-pulse rounded bg-white/5" />
                )}
              </div>
            </div>
          )}

          {/* Signature Progress */}
          {!transaction.cancelled && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> 
                  Authorization Progress
                </h3>
                <span className="text-[10px] font-black text-slate-500 uppercase">
                  Threshold: {threshold} of {signers.length}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <span>Signatures Collected</span>
                  <span>{transaction.executed ? threshold : signatureCount} / {threshold}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full bg-emerald-400 transition-all duration-1000 ${transaction.executed ? 'w-full shadow-[0_0_10px_rgba(52,211,153,0.5)]' : ''}`} 
                    style={{ width: transaction.executed ? '100%' : `${(signatureCount / threshold) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                {signers.map((signer) => {
                  const signed = transaction.executed || hasSigned(transaction.id, signer);
                  return (
                    <div key={signer} className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-transparent hover:border-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                          <User className="h-4 w-4" />
                        </div>
                        <code className="text-[11px] font-mono text-slate-300">{formatAddress(signer)}</code>
                        {wallet.address === signer && (
                          <span className="text-[9px] font-bold text-amber-500/50 uppercase">(You)</span>
                        )}
                      </div>
                      {signed ? (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-tighter">
                          <CheckCircle2 className="h-3 w-3" /> Signed
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                          <Clock className="h-3 w-3" /> Pending
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {transaction.cancelled && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <div>
                <h4 className="text-sm font-bold uppercase tracking-tight">Proposal Cancelled</h4>
                <p className="text-xs opacity-80">This transaction was revoked by a signer and can no longer be signed or executed.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/5 bg-white/5 px-8 py-6 flex items-center justify-between">
          <Link 
            href={transaction.executed ? `https://explorer.hiro.so/txid/${transaction.id}?chain=mainnet` : "#"}
            target={transaction.executed ? "_blank" : "_self"}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${transaction.executed ? 'text-primary hover:text-white' : 'text-slate-600 cursor-not-allowed'}`}
          >
            <ExternalLink className="h-4 w-4" /> View on Explorer
          </Link>
          
          <div className="flex gap-3">
            {canCancel && (
              <button 
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-all disabled:opacity-50"
              >
                {isCancelling ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                Cancel
              </button>
            )}
            
            {canSign && (
              <button 
                onClick={handleSign}
                disabled={isSigning}
                className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSigning ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <PenTool className="h-4 w-4" />
                )}
                Sign Transaction
              </button>
            )}

            {signatureCount >= threshold && !transaction.executed && !transaction.cancelled && (
              <button 
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isExecuting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Execute
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
