"use client";

import { useMemo } from "react";
import { useStacksWallet } from "@/hooks/useStacksWallet";

type WalletState = ReturnType<typeof useStacksWallet>;

const formatAddress = (address: string | null) => {
  if (!address) return "Connect Wallet";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

type Props = {
  wallet?: WalletState;
};

export function WalletButton({ wallet }: Props) {
  const walletState = wallet ?? useStacksWallet();
  const { address, connect, disconnect, isReady, isSignedIn } = walletState;

  const label = useMemo(
    () => formatAddress(address),
    [address],
  );

  const handleClick = isSignedIn ? disconnect : connect;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isReady}
      className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/25 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <span className="relative">{label}</span>
      {isSignedIn && (
        <span className="relative rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-zinc-900">
          Disconnect
        </span>
      )}
    </button>
  );
}
