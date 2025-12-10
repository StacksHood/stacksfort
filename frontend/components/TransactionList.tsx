"use client";

import { useMemo, useState } from "react";
import { useMultisig, TXN_TYPE_STX, TXN_TYPE_TOKEN } from "@/hooks/useMultisig";
import type { Transaction } from "@/hooks/useMultisig";

type Props = {
  contractAddress: string;
  contractName?: string;
};

type FilterStatus = "all" | "pending" | "executed";

const ITEMS_PER_PAGE = 10;

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

const getTransactionTypeBadge = (type: number) => {
  if (type === TXN_TYPE_STX) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-200">
        <span>💰</span> STX Transfer
      </span>
    );
  }
  if (type === TXN_TYPE_TOKEN) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-400/15 px-3 py-1 text-xs font-semibold text-purple-200">
        <span>🪙</span> Token Transfer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-400/15 px-3 py-1 text-xs font-semibold text-slate-200">
      Unknown
    </span>
  );
};

const getStatusBadge = (executed: boolean) => {
  if (executed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Executed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">
      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
      Pending
    </span>
  );
};

export function TransactionList({ contractAddress, contractName = "multisig" }: Props) {
  const { transactions, isLoading, error } = useMultisig(contractAddress, contractName);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = [...transactions];
    
    if (filterStatus === "pending") {
      filtered = filtered.filter((txn) => !txn.executed);
    } else if (filterStatus === "executed") {
      filtered = filtered.filter((txn) => txn.executed);
    }
    
    // Sort by ID descending (newest first)
    return filtered.sort((a, b) => b.id - a.id);
  }, [transactions, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
          <div className="flex gap-2">
            <div className="h-10 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-10 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-10 w-20 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-white/5 bg-white/5 p-4"
            >
              <div className="h-6 w-3/4 rounded bg-white/10" />
              <div className="mt-3 h-4 w-1/2 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-200">Failed to load transactions</p>
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Transactions</h2>
          <p className="text-sm text-slate-400">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
            {filterStatus !== "all" && ` (${filterStatus})`}
          </p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 ${
              filterStatus === "all"
                ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/30"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("pending")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 ${
              filterStatus === "pending"
                ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/30"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("executed")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 ${
              filterStatus === "executed"
                ? "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/30"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            Executed
          </button>
        </div>
      </div>

      {/* Transaction List */}
      {paginatedTransactions.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-700/30">
            <span className="text-4xl">📭</span>
          </div>
          <p className="mt-4 text-lg font-semibold text-white">No transactions found</p>
          <p className="mt-2 text-sm text-slate-400">
            {filterStatus === "all"
              ? "This multisig has no transactions yet."
              : `No ${filterStatus} transactions.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedTransactions.map((txn) => (
            <div
              key={txn.id}
              className="group rounded-xl border border-white/5 bg-gradient-to-r from-white/5 to-white/0 p-5 transition-all duration-150 hover:border-white/10 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/20 to-amber-600/20 font-semibold text-amber-200">
                      #{txn.id}
                    </span>
                    <div>
                      {getTransactionTypeBadge(txn.type)}
                      <p className="mt-1 text-sm text-slate-400">
                        Transaction ID: {txn.id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                        Amount
                      </p>
                      <p className="mt-1 font-mono text-lg font-semibold text-white">
                        {formatAmount(txn.amount)}{" "}
                        <span className="text-sm text-slate-400">
                          {txn.type === TXN_TYPE_STX ? "STX" : "tokens"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                        Recipient
                      </p>
                      <code className="mt-1 block font-mono text-sm text-white">
                        {formatAddress(txn.recipient)}
                      </code>
                    </div>
                  </div>

                  {txn.token && txn.type === TXN_TYPE_TOKEN && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                        Token Contract
                      </p>
                      <code className="mt-1 block font-mono text-xs text-slate-300">
                        {formatAddress(txn.token)}
                      </code>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(txn.executed)}
                  <button
                    type="button"
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 opacity-0 transition-all duration-150 hover:border-amber-300 hover:text-amber-200 group-hover:opacity-100"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
          <p className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:border-amber-300 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-slate-200"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:border-amber-300 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-slate-200"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
