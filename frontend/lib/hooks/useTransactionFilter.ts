"use client";

import { useState, useMemo, useCallback } from "react";

export type TransactionType = "all" | "stx" | "token";
export type TransactionStatusFilter = "all" | "pending" | "signed" | "ready-to-execute" | "executed" | "cancelled";

export interface FilterOptions {
  type: TransactionType;
  status: TransactionStatusFilter;
  searchQuery: string;
}

export interface Transaction {
  id: number;
  type: "stx" | "token";
  amount: string;
  recipient: string;
  status: "pending" | "signed" | "ready-to-execute" | "executed" | "cancelled";
  executed: boolean;
  cancelled: boolean;
}

export function useTransactionFilter(transactions: Transaction[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    status: "all",
    searchQuery: "",
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.type !== "all" && tx.type !== filters.type) {
        return false;
      }

      if (filters.status !== "all" && tx.status !== filters.status) {
        return false;
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesId = tx.id.toString().includes(query);
        const matchesRecipient = tx.recipient.toLowerCase().includes(query);

        if (!matchesId && !matchesRecipient) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  const setTypeFilter = useCallback((type: TransactionType) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const setStatusFilter = useCallback((status: TransactionStatusFilter) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      type: "all",
      status: "all",
      searchQuery: "",
    });
  }, []);

  const counts = useMemo(() => {
    return {
      all: transactions.length,
      stx: transactions.filter((tx) => tx.type === "stx").length,
      token: transactions.filter((tx) => tx.type === "token").length,
      pending: transactions.filter((tx) => tx.status === "pending").length,
      signed: transactions.filter((tx) => tx.status === "signed").length,
      readyToExecute: transactions.filter((tx) => tx.status === "ready-to-execute").length,
      executed: transactions.filter((tx) => tx.status === "executed").length,
      cancelled: transactions.filter((tx) => tx.status === "cancelled").length,
    };
  }, [transactions]);

  return {
    filters,
    filteredTransactions,
    counts,
    setTypeFilter,
    setStatusFilter,
    setSearchQuery,
    resetFilters,
  };
}