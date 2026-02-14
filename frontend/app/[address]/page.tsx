"use client";

import { useParams } from "next/navigation";
import { useStacksWallet } from "@/hooks/useStacksWallet";
import { MultisigDashboard } from "@/components/MultisigDashboard";
import { TransactionList } from "@/components/TransactionList";
import { CreateTransaction } from "@/components/CreateTransaction";
import { useState, useEffect } from "react";
import { isValidStacksAddress, abbreviateAddress } from "@/lib/stx-utils";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function MultisigPage() {
  const params = useParams();
  const address = params.address as string;
  const { isSignedIn, connect } = useStacksWallet();
  const [isValidAddress, setIsValidAddress] = useState(true);

  useEffect(() => {
    setIsValidAddress(isValidStacksAddress(address));
  }, [address]);

  if (!isValidAddress) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Invalid Address</h1>
          <p className="text-slate-400 mb-6">
            The address <span className="font-mono text-red-300">{abbreviateAddress(address)}</span> is not a valid Stacks address.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-white">
            Connect Wallet to View Multisig
          </h1>
          <p className="text-slate-400 max-w-md">
            View and manage the multisig vault at <span className="font-mono text-amber-400">{abbreviateAddress(address)}</span>
          </p>
          <button
            onClick={connect}
            className="rounded-full bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-3 font-bold text-zinc-950 hover:scale-105 transition-transform"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const [contractAddress, contractName] = address.includes(".")
    ? address.split(".")
    : [address, "stacksfort-multisig"];

  return (
    <div className="space-y-10 py-10">
      <header className="flex items-center gap-4">
        <Link
          href="/"
          className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">
            Multisig: {abbreviateAddress(address)}
          </h1>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Contract Address
          </p>
        </div>
      </header>

      <section>
        <MultisigDashboard contractAddress={contractAddress} contractName={contractName} />
      </section>

      <section>
        <TransactionList contractAddress={contractAddress} contractName={contractName} />
      </section>
    </div>
  );
}