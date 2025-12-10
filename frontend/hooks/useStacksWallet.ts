"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { showConnect } from "@stacks/connect";
import { appDetails, userSession } from "@/lib/stacks-session";

type StacksUserData = {
  profile?: {
    stxAddress?: {
      mainnet?: string;
      testnet?: string;
    };
  };
};

export type Network = "mainnet" | "testnet" | "disconnected";

const getAppIcon = () => {
  if (typeof window === "undefined") return appDetails.icon;
  try {
    return new URL(appDetails.icon, window.location.origin).toString();
  } catch {
    return appDetails.icon;
  }
};

export function useStacksWallet() {
  const [userData, setUserData] = useState<StacksUserData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function hydrateSession() {
      if (userSession.isSignInPending()) {
        const data = await userSession.handlePendingSignIn();
        if (!cancelled) setUserData(data);
      } else if (userSession.isUserSignedIn()) {
        setUserData(userSession.loadUserData());
      }
      if (!cancelled) setIsReady(true);
    }

    hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    showConnect({
      userSession,
      appDetails: { ...appDetails, icon: getAppIcon() },
      onFinish: () => {
        setUserData(userSession.loadUserData());
      },
    });
  }, []);

  const disconnect = useCallback(() => {
    userSession.signUserOut();
    setUserData(null);
  }, []);

  const network: Network = useMemo(() => {
    if (!userData?.profile?.stxAddress) return "disconnected";
    if (userData.profile.stxAddress.testnet) return "testnet";
    if (userData.profile.stxAddress.mainnet) return "mainnet";
    return "disconnected";
  }, [userData]);

  const address = useMemo(() => {
    if (!userData?.profile?.stxAddress) return null;
    return (
      userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet
    );
  }, [userData]);

  return {
    address,
    connect,
    disconnect,
    isReady,
    isSignedIn: !!userData,
    network,
  };
}
