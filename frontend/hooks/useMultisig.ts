"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCallReadOnlyFunction,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  Cl,
  ClarityValue,
  cvToValue,
  principalCV,
  uintCV,
  listCV,
  bufferCV,
  someCV,
  noneCV,
} from "@stacks/transactions";
import { StacksNetwork } from "@stacks/network";
import { useStacksWallet } from "./useStacksWallet";
import { CONTRACT_ADDRESS, CONTRACT_NAME } from "../lib/constants";

// Contract configuration
// const CONTRACT_ADDRESS = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
// const CONTRACT_NAME = "multisig";

// Transaction types
export const TXN_TYPE_STX = 0;
export const TXN_TYPE_TOKEN = 1;

// Transaction interface
export interface Transaction {
  id: number;
  type: number;
  amount: bigint;
  recipient: string;
  token: string | null;
  executed: boolean;
}

// Multisig state interface
export interface MultisigState {
  initialized: boolean;
  signers: string[];
  threshold: number;
  nextTxnId: number;
}

export function useMultisig(contractAddress?: string, contractName?: string) {
  const wallet = useStacksWallet();
  const [multisigState, setMultisigState] = useState<MultisigState | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = contractAddress || CONTRACT_ADDRESS;
  const name = contractName || CONTRACT_NAME;

  // Get network based on wallet connection
  const getNetwork = useCallback((): StacksNetwork => {
    // Return appropriate network configuration
    // This is a simplified version to fix build errors
    return {
        version: wallet.network === "mainnet" ? 1 : 2147483648,
        chainId: wallet.network === "mainnet" ? 1 : 2147483648,
        bnsLookupUrl: "https://api.hiro.so",
        broadcastEndpoint: "/v2/transactions",
        transferEndpoint: "/v2/transfer",
        getAbiApiUrl: () => "https://api.hiro.so",
        getAccountApiUrl: () => "https://api.hiro.so",
        getBlockTimeApiUrl: () => "https://api.hiro.so",
        getBroadcastApiUrl: () => "https://api.hiro.so",
        getContractApiUrl: () => "https://api.hiro.so",
        getFeeApiUrl: () => "https://api.hiro.so",
        getInfoApiUrl: () => "https://api.hiro.so",
        getNameApiUrl: () => "https://api.hiro.so",
        getPoxApiUrl: () => "https://api.hiro.so",
        getReadOnlyApiUrl: () => "https://api.hiro.so",
        getTokenApiUrl: () => "https://api.hiro.so",
        getTransactionApiUrl: () => "https://api.hiro.so",
        isMainnet: () => wallet.network === "mainnet",
        coreApiUrl: wallet.network === "mainnet" ? "https://api.hiro.so" : "https://api.testnet.hiro.so"
    } as unknown as StacksNetwork;
  }, [wallet.network]);

  // ============================================
  // Read-only Functions
  // ============================================

  /**
   * Get transaction hash for signing
   */
  const getTransactionHash = useCallback(
    async (txnId: number): Promise<string | null> => {
      try {
        const result = await fetchCallReadOnlyFunction({
          network: getNetwork(),
          contractAddress: address,
          contractName: name,
          functionName: "hash-txn",
          functionArgs: [uintCV(txnId)],
          senderAddress: wallet.address || address,
        });

        if (result.type === "ok") {
          const hashBuffer = cvToValue(result.value);
          return Buffer.from(hashBuffer).toString("hex");
        }
        return null;
      } catch (err) {
        console.error("Error getting transaction hash:", err);
        setError(err instanceof Error ? err.message : "Failed to get transaction hash");
        return null;
      }
    },
    [address, name, wallet.address, getNetwork]
  );

  /**
   * Extract signer from signature
   */
  const extractSigner = useCallback(
    async (hash: string, signature: string): Promise<string | null> => {
      try {
        const result = await fetchCallReadOnlyFunction({
          network: getNetwork(),
          contractAddress: address,
          contractName: name,
          functionName: "extract-signer",
          functionArgs: [
            bufferCV(Buffer.from(hash, "hex")),
            bufferCV(Buffer.from(signature, "hex")),
          ],
          senderAddress: wallet.address || address,
        });

        if (result.type === "ok") {
          return cvToValue(result.value);
        }
        return null;
      } catch (err) {
        console.error("Error extracting signer:", err);
        return null;
      }
    },
    [address, name, wallet.address, getNetwork]
  );

  /**
   * Get transaction by ID
   */
  const getTransaction = useCallback(
    async (txnId: number): Promise<Transaction | null> => {
      try {
        const result = await fetchCallReadOnlyFunction({
          network: getNetwork(),
          contractAddress: address,
          contractName: name,
          functionName: "get-transaction",
          functionArgs: [uintCV(txnId)],
          senderAddress: wallet.address || address,
        });

        if (result.type === "some") {
          const txnData = cvToValue(result.value);
          return {
            id: txnId,
            type: Number(txnData.type),
            amount: BigInt(txnData.amount),
            recipient: txnData.recipient,
            token: txnData.token || null,
            executed: txnData.executed,
          };
        }
        return null;
      } catch (err) {
        console.error("Error getting transaction:", err);
        return null;
      }
    },
    [address, name, wallet.address, getNetwork]
  );

  // ============================================
  // Public Functions (Contract Calls)
  // ============================================

  /**
   * Initialize multisig with signers and threshold
   */
  const initialize = useCallback(
    async (signers: string[], threshold: number) => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const signerCVs = signers.map((signer) => principalCV(signer));

        const txOptions = {
          network: getNetwork(),
          anchorMode: AnchorMode.Any,
          contractAddress: address,
          contractName: name,
          functionName: "initialize",
          functionArgs: [listCV(signerCVs), uintCV(threshold)],
          senderKey: wallet.address, // This will be handled by Stacks Connect
          postConditionMode: PostConditionMode.Deny,
        };

        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({
          transaction,
          network: getNetwork(),
        });

        return broadcastResponse.txid;
      } catch (err) {
        console.error("Error initializing multisig:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize multisig");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  /**
   * Submit a transaction
   */
  const submitTransaction = useCallback(
    async (
      type: number,
      amount: number,
      recipient: string,
      token?: string,
      expiration?: number
    ): Promise<string | null> => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const tokenCV = token
          ? someCV(principalCV(token))
          : noneCV();
        
        const expirationCV = expiration
          ? someCV(uintCV(expiration))
          : noneCV();

        const txOptions = {
          network: getNetwork(),
          anchorMode: AnchorMode.Any,
          contractAddress: address,
          contractName: name,
          functionName: "submit-txn",
          functionArgs: [
            uintCV(type),
            uintCV(amount),
            principalCV(recipient),
            tokenCV,
            expirationCV,
          ],
          senderKey: wallet.address,
          postConditionMode: PostConditionMode.Deny,
        };

        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({
          transaction,
          network: getNetwork(),
        });

        return broadcastResponse.txid;
      } catch (err) {
        console.error("Error submitting transaction:", err);
        setError(err instanceof Error ? err.message : "Failed to submit transaction");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  /**
   * Execute STX transfer transaction
   */
  const executeStxTransfer = useCallback(
    async (txnId: number, signatures: string[]): Promise<string | null> => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const signatureCVs = signatures.map((sig) =>
          bufferCV(Buffer.from(sig, "hex"))
        );

        const txOptions = {
          network: getNetwork(),
          anchorMode: AnchorMode.Any,
          contractAddress: address,
          contractName: name,
          functionName: "execute-stx-transfer-txn",
          functionArgs: [uintCV(txnId), listCV(signatureCVs)],
          senderKey: wallet.address,
          postConditionMode: PostConditionMode.Deny,
        };

        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({
          transaction,
          network: getNetwork(),
        });

        return broadcastResponse.txid;
      } catch (err) {
        console.error("Error executing STX transfer:", err);
        setError(err instanceof Error ? err.message : "Failed to execute STX transfer");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  /**
   * Execute token transfer transaction
   */
  const executeTokenTransfer = useCallback(
    async (
      txnId: number,
      signatures: string[],
      tokenContract: string
    ): Promise<string | null> => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const signatureCVs = signatures.map((sig) =>
          bufferCV(Buffer.from(sig, "hex"))
        );

        const txOptions = {
          network: getNetwork(),
          anchorMode: AnchorMode.Any,
          contractAddress: address,
          contractName: name,
          functionName: "execute-token-transfer-txn",
          functionArgs: [
            uintCV(txnId),
            listCV(signatureCVs),
            principalCV(tokenContract),
          ],
          senderKey: wallet.address,
          postConditionMode: PostConditionMode.Deny,
        };

        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({
          transaction,
          network: getNetwork(),
        });

        return broadcastResponse.txid;
      } catch (err) {
        console.error("Error executing token transfer:", err);
        setError(err instanceof Error ? err.message : "Failed to execute token transfer");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  /**
   * Submit a configuration change transaction
   */
  const submitConfigTransaction = useCallback(
    async (
      newSigners: string[],
      newThreshold: number,
      expiration?: number
    ): Promise<string | null> => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const expirationCV = expiration
          ? someCV(uintCV(expiration))
          : noneCV();

        const signerCVs = newSigners.map((signer) => principalCV(signer));

        const txOptions = {
          network: getNetwork(),
          anchorMode: AnchorMode.Any,
          contractAddress: address,
          contractName: name,
          functionName: "submit-config-txn",
          functionArgs: [
            listCV(signerCVs),
            uintCV(newThreshold),
            expirationCV,
          ],
          senderKey: wallet.address,
          postConditionMode: PostConditionMode.Deny,
        };

        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({
          transaction,
          network: getNetwork(),
        });

        return broadcastResponse.txid;
      } catch (err) {
        console.error("Error submitting config transaction:", err);
        setError(err instanceof Error ? err.message : "Failed to submit config transaction");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  /**
   * Execute configuration change transaction
   */
  const executeConfigTransaction = useCallback(
    async (txnId: number, signatures: string[]): Promise<string | null> => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const signatureCVs = signatures.map((sig) =>
          bufferCV(Buffer.from(sig, "hex"))
        );

        const txOptions = {
          network: getNetwork(),
          anchorMode: AnchorMode.Any,
          contractAddress: address,
          contractName: name,
          functionName: "execute-config-txn",
          functionArgs: [uintCV(txnId), listCV(signatureCVs)],
          senderKey: wallet.address,
          postConditionMode: PostConditionMode.Deny,
        };

        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({
          transaction,
          network: getNetwork(),
        });

        return broadcastResponse.txid;
      } catch (err) {
        console.error("Error executing config transaction:", err);
        setError(err instanceof Error ? err.message : "Failed to execute config transaction");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  // ============================================
  // Helper Functions
  // ============================================

  /**
   * Check if user is a signer
   */
  const isSigner = useCallback(
    (address: string): boolean => {
      if (!multisigState) return false;
      return multisigState.signers.includes(address);
    },
    [multisigState]
  );

  /**
   * Check if user is the current wallet signer
   */
  const isCurrentUserSigner = useCallback((): boolean => {
    if (!wallet.address || !multisigState) return false;
    return multisigState.signers.includes(wallet.address);
  }, [wallet.address, multisigState]);

  /**
   * Get transaction status
   */
  const getTransactionStatus = useCallback(
    (transaction: Transaction, signatureCount: number): string => {
      if (transaction.executed) return "executed";
      if (!multisigState) return "unknown";
      if (signatureCount >= multisigState.threshold) return "ready-to-execute";
      if (signatureCount > 0) return "collecting-signatures";
      return "pending";
    },
    [multisigState]
  );

  /**
   * Fetch multisig state from contract
   */
  const fetchMultisigState = useCallback(async () => {
    try {
      // This would need to be implemented based on contract read-only functions
      // For now, returning a placeholder
      // In a real implementation, you'd call contract read-only functions to get:
      // - initialized status
      // - signers list
      // - threshold
      // - next transaction ID
      
      setMultisigState({
        initialized: true,
        signers: [],
        threshold: 2,
        nextTxnId: 0,
      });
    } catch (err) {
      console.error("Error fetching multisig state:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch multisig state");
    }
  }, []);

  /**
   * Fetch transactions from contract
   */
  const fetchTransactions = useCallback(async () => {
    try {
      // This would fetch all transactions from the contract
      // For now, returning empty array
      setTransactions([]);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
    }
  }, []);

  // Auto-fetch state when wallet connects
  useEffect(() => {
    if (wallet.isSignedIn) {
      fetchMultisigState();
      fetchTransactions();
    }
  }, [wallet.isSignedIn, fetchMultisigState, fetchTransactions]);

  return {
    // State
    state: multisigState,
    transactions,
    balance,
    isLoading: loading,
    error,

    // Read-only functions
    getTransactionHash,
    extractSigner,
    getTransaction,

    // Public functions
    initialize,
    submitTransaction,
    submitConfigTransaction,
    executeStxTransfer,
    executeTokenTransfer,
    executeConfigTransaction,

    // Helper functions
    isSigner,
    isCurrentUserSigner,
    getTransactionStatus,
    fetchMultisigState,
    fetchTransactions,
  };
}
