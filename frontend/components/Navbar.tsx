"use client";

import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { NetworkBadge } from "@/components/NetworkBadge";
import { WalletButton } from "@/components/WalletButton";
import { useStacksWallet } from "@/hooks/useStacksWallet";

export function Navbar() {
  const wallet = useStacksWallet();

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-gradient-to-r from-[#0b1221]/90 via-[#0c1427]/80 to-[#0b1221]/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <NavLinks />
        </div>
        <div className="flex items-center gap-3">
          <NetworkBadge network={wallet.network} />
          <WalletButton wallet={wallet} />
        </div>
      </div>
    </header>
  );
}
