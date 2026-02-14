"use client";

import { useState, useEffect } from "react";
import {
  getThreshold,
  getSigners,
  getNextTxnId,
  getTransaction,
} from "@/lib/multisig-contract";
import {
  TransactionStatus,
  getTransactionStatus,
  formatAddress,
  formatAmount,
} from "@/lib/transaction-helpers";

export interface Transaction {
  id: number;
  type: "stx" | "token";
  amount: string;
  recipient: string;
  status: TransactionStatus;
  executed: boolean;
  cancelled: boolean;
}

export function useMultisigTransactions(
  contractAddress: string,
  contractName: string,
  senderAddress: string | null
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!senderAddress) {
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextId = await getNextTxnId(
          senderAddress,
          contractAddress,
          contractName
        );
        const txList: Transaction[] = [];

        for (let i = 0; i < nextId && i < 20; i++) {
          const tx = await getTransaction(
            i,
            senderAddress,
            contractAddress,
            contractName
          );

          if (tx) {
            const threshold = await getThreshold(
              senderAddress,
              contractAddress,
              contractName
            );

            txList.push({
              id: tx.id,
              type: tx.type,
              amount: tx.amount,
              recipient: tx.recipient,
              status: getTransactionStatus(tx.executed, tx.cancelled, 0, threshold),
              executed: tx.executed,
              cancelled: tx.cancelled,
            });
          }
        }

        setTransactions(txList.reverse());
      } catch (err) {
        setError("Failed to fetch transactions");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [contractAddress, contractName, senderAddress]);

  const refresh = () => {
    if (senderAddress) {
      setIsLoading(true);
    }
  };

  return { transactions, isLoading, error, refresh };
}

export function useMultisigInfo(
  contractAddress: string,
  contractName: string,
  senderAddress: string | null
) {
  const [threshold, setThreshold] = useState<number>(0);
  const [signers, setSigners] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!senderAddress) {
      setThreshold(0);
      setSigners([]);
      return;
    }

    const fetchInfo = async () => {
      setIsLoading(true);
      try {
        const [thresholdValue, signersList] = await Promise.all([
          getThreshold(senderAddress, contractAddress, contractName),
          getSigners(senderAddress, contractAddress, contractName),
        ]);

        setThreshold(thresholdValue);
        setSigners(signersList);
      } catch (err) {
        console.error("Error fetching multisig info:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfo();
  }, [contractAddress, contractName, senderAddress]);

  const isSigner = (address: string): boolean => {
    return signers.includes(address);
  };

  return { threshold, signers, isLoading, isSigner };
}