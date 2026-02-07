"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deserializeCV,
  serializeCV,
  fetchCallReadOnlyFunction,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  cvToValue,
  principalCV,
  listCV,
  bufferCV,
  someCV,
  noneCV,
  FungibleConditionCode,
  createSTXPostCondition,
  createFTPostCondition,
} from "@stacks/transactions";
import { StacksNetwork } from "@stacks/network";
import { useStacksWallet } from "./useStacksWallet";
import { CONTRACT_ADDRESS, CONTRACT_NAME } from "../lib/constants";

// Transaction types
export const TXN_TYPE_STX = 0;
export const TXN_TYPE_TOKEN = 1;
export const TXN_TYPE_CONFIG = 2;

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

  const getNetwork = useCallback((): StacksNetwork => {
    return {
        version: 1,
        chainId: 1,
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
        isMainnet: () => true,
        coreApiUrl: "https://api.hiro.so"
    } as unknown as StacksNetwork;
  }, []);

  // ============================================
  // Read-only Functions
  // ============================================

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
        return null;
      }
    },
    [address, name, wallet.address, getNetwork]
  );

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
        setError(err instanceof Error ? err.message : "Failed to initialize multisig");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

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
        const tokenCV = token ? someCV(principalCV(token)) : noneCV();
        const expirationCV = expiration ? someCV(uintCV(expiration)) : noneCV();
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
        setError(err instanceof Error ? err.message : "Failed to submit transaction");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  const executeStxTransfer = useCallback(
    async (txnId: number, signatures: string[], amount: bigint): Promise<string | null> => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const signatureCVs = signatures.map((sig) => bufferCV(Buffer.from(sig, "hex")));
        
        const postConditions = [
          createSTXPostCondition(
            `${address}.${name}`,
            FungibleConditionCode.Equal,
            amount
          ),
        ];

        const txOptions = {
          network: getNetwork(),
          anchorMode: AnchorMode.Any,
          contractAddress: address,
          contractName: name,
          functionName: "execute-stx-transfer-txn",
          functionArgs: [uintCV(txnId), listCV(signatureCVs)],
          senderKey: wallet.address,
          postConditionMode: PostConditionMode.Deny,
          postConditions,
        };
        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({
          transaction,
          network: getNetwork(),
        });
        return broadcastResponse.txid;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to execute STX transfer");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  const executeTokenTransfer = useCallback(
    async (
      txnId: number,
      signatures: string[],
      tokenContract: string,
      amount: bigint
    ): Promise<string | null> => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const signatureCVs = signatures.map((sig) => bufferCV(Buffer.from(sig, "hex")));

        const postConditions = [
          createFTPostCondition(
            `${address}.${name}`,
            FungibleConditionCode.Equal,
            amount,
            tokenContract
          ),
        ];

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
          postConditions,
        };
        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({
          transaction,
          network: getNetwork(),
        });
        return broadcastResponse.txid;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to execute token transfer");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

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
        const expirationCV = expiration ? someCV(uintCV(expiration)) : noneCV();
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
        setError(err instanceof Error ? err.message : "Failed to submit config transaction");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet.address, address, name, getNetwork]
  );

  const executeConfigTransaction = useCallback(
    async (txnId: number, signatures: string[]): Promise<string | null> => {
      if (!wallet.address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const signatureCVs = signatures.map((sig) => bufferCV(Buffer.from(sig, "hex")));
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

  const isSigner = useCallback(
    (address: string): boolean => {
      if (!multisigState) return false;
      return multisigState.signers.includes(address);
    },
    [multisigState]
  );

  const isCurrentUserSigner = useCallback((): boolean => {
    if (!wallet.address || !multisigState) return false;
    return multisigState.signers.includes(wallet.address);
  }, [wallet.address, multisigState]);

  const getTransactionStatus = useCallback(
    (transaction: Transaction, signatureCount: number): string => {
      if (transaction.executed) return "executed";
      if (transaction.cancelled) return "cancelled";
      if (!multisigState) return "unknown";
      if (signatureCount >= multisigState.threshold) return "ready-to-execute";
      if (signatureCount > 0) return "collecting-signatures";
      return "pending";
    },
    [multisigState]
  );

  const fetchMultisigState = useCallback(async () => {
    try {
      // Use the local proxy for data-vars to avoid CORS issues
      const apiUrl = "/api/stacks-node";
      const fetchDataVar = async (varName: string) => {
        const url = `${apiUrl}/v2/contracts/data-var/${address}/${name}/${varName}`;
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return data.data; 
      };

      const [initializedHex, signersHex, thresholdHex, txnIdHex] = await Promise.all([
        fetchDataVar("initialized"),
        fetchDataVar("signers"),
        fetchDataVar("threshold"),
        fetchDataVar("txn-id"),
      ]);

      if (!initializedHex || !signersHex || !thresholdHex || !txnIdHex) {
          console.error("Missing multisig state components. Initialization might be incomplete.");
          setMultisigState({ initialized: false, signers: [], threshold: 0, nextTxnId: 0 });
          return;
      }

      const initialized = cvToValue(deserializeCV(initializedHex));
      const signers = cvToValue(deserializeCV(signersHex)).map((s: any) => s.value || s); 
      const threshold = Number(cvToValue(deserializeCV(thresholdHex)));
      const nextTxnId = Number(cvToValue(deserializeCV(txnIdHex)));

      setMultisigState({ initialized, signers, threshold, nextTxnId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch multisig state");
    }
  }, [address, name, getNetwork]);

  const fetchTransactions = useCallback(async () => {
    try {
      if (!multisigState) return;
      const apiUrl = "/api/stacks-node";
      const txs: Transaction[] = [];
      
      for (let i = multisigState.nextTxnId - 1; i >= 0; i--) {
        const key = uintCV(i);
        const keyHex = `0x${Buffer.from(serializeCV(key)).toString("hex")}`;
        const response = await fetch(`${apiUrl}/v2/map_entry/${address}/${name}/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(keyHex)
        });
        
        if (!response.ok) continue;

        const data = await response.json();
        if (data.data) {
            const txnVal = cvToValue(deserializeCV(data.data));
            txs.push({
                id: i,
                type: Number(txnVal.type),
                amount: BigInt(txnVal.amount),
                recipient: txnVal.recipient,
                token: txnVal.token ? txnVal.token.value : null,
                executed: txnVal.executed,
            });
        }
      }
      setTransactions(txs);
    } catch (err) {}
  }, [address, name, getNetwork, multisigState]);


  useEffect(() => {
    if (wallet.isSignedIn) {
      fetchMultisigState();
      fetchTransactions();
    }
  }, [wallet.isSignedIn, fetchMultisigState, fetchTransactions]);

  return {
    state: multisigState,
    transactions,
    balance,
    isLoading: loading,
    error,
    getTransactionHash,
    extractSigner,
    getTransaction,
    initialize,
    submitTransaction,
    submitConfigTransaction,
    executeStxTransfer,
    executeTokenTransfer,
    executeConfigTransaction,
    isSigner,
    isCurrentUserSigner,
    getTransactionStatus,
    fetchMultisigState,
    fetchTransactions,
  };
}
