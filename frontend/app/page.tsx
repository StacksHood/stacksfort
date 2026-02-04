"use client";

import { useStacksWallet } from "@/hooks/useStacksWallet";
import { MultisigDashboard } from "@/components/MultisigDashboard";
import { TransactionList } from "@/components/TransactionList";
import { CreateTransaction } from "@/components/CreateTransaction";
import { CONTRACT_ADDRESS, CONTRACT_NAME } from "@/lib/constants";
import { ShieldCheck, Coins, Zap, Wallet, Plus } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { isSignedIn, connect } = useStacksWallet();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // If wallet is connected, show the actual dashboard with real data
  if (isSignedIn) {
    return (
      <div className="space-y-10 py-10">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white italic tracking-tight">Vault Terminal</h1>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Multisig Surveillance & Control</p>
          </div>
          
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-zinc-950 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            New Transaction
          </button>
        </header>

        <section id="overview">
          <MultisigDashboard contractAddress={CONTRACT_ADDRESS} contractName={CONTRACT_NAME} />
        </section>
        
        <section id="transactions">
          <TransactionList contractAddress={CONTRACT_ADDRESS} contractName={CONTRACT_NAME} />
        </section>

        {isCreateOpen && (
          <CreateTransaction 
            contractAddress={CONTRACT_ADDRESS}
            contractName={CONTRACT_NAME}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={(txid) => {
              console.log("Transaction submitted:", txid);
              setIsCreateOpen(false);
              // In a real app, we'd trigger a list refresh here
              // useMultisig hook should eventually handle this via polling or websocket
            }}
          />
        )}

        <section id="docs" className="rounded-2xl border border-white/5 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Project Resources</h2>
            <div className="flex gap-3">
              <a href="https://docs.stacks.co" target="_blank" rel="noreferrer" className="text-sm text-amber-300 hover:underline">Stacks Docs</a>
              <span className="text-slate-600">|</span>
              <a href="/issues.md" className="text-sm text-amber-300 hover:underline">Issues</a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If not connected, show the landing page (simplified)
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-10 text-center py-20">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl">
          Secure Your Assets with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">StacksFort</span>
        </h1>
        <p className="text-xl text-slate-300">
          The fortress for your Stacks (STX) and SIP-010 tokens. 
          Coordinate transactions, manage signers, and execute with confidence.
        </p>
      </div>

      <button
        onClick={connect}
        className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 px-8 py-4 text-lg font-bold text-zinc-950 shadow-xl shadow-amber-500/25 transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <span className="relative">Connect Wallet to Enter</span>
        <Wallet className="h-5 w-5" />
      </button>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-left mt-16 max-w-4xl w-full">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Multi-Signature</h3>
          <p className="text-slate-400 mt-2 text-sm">Secure assets with configurable m-of-n threshold requirements.</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <Coins className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Asset Support</h3>
          <p className="text-slate-400 mt-2 text-sm">Full support for native STX and SIP-010 fungible tokens.</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Live on Mainnet</h3>
          <p className="text-slate-400 mt-2 text-sm">Deployed and ready for production use on Stacks mainnet.</p>
        </div>
      </div>
    </div>
  );
}
