import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Search
} from 'lucide-react';
import { TransactionRecord } from '../types';

interface TransactionsProps {
  transactions: TransactionRecord[];
  onRefresh: () => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions }) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.payment_method && t.payment_method.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === 'All' || t.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-200/80">
        <h1 className="text-xl font-bold tracking-tight text-black">
          Unified Business Ledger
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Complete chronological audit trail of all store sales, purchases, expenses, and settlements.
        </p>
      </div>

      {/* 3D Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-panel p-4 rounded-2xl border border-zinc-200 shadow-card-3d">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by transaction description, payment mode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 font-semibold text-zinc-800 focus:outline-hidden focus:border-black"
          >
            <option value="All">All Entry Types</option>
            <option value="sale">Sales Only</option>
            <option value="purchase">Purchases Only</option>
            <option value="expense">Expenses Only</option>
            <option value="supplier_payment">Supplier Payments Only</option>
          </select>
        </div>
      </div>

      {/* 3D Glass Table */}
      <div className="glass-panel rounded-3xl border border-zinc-200 shadow-card-3d overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Date & Time</th>
                  <th className="px-4 py-3.5 font-bold">Type</th>
                  <th className="px-4 py-3.5 font-bold">Description</th>
                  <th className="px-4 py-3.5 font-bold">Payment Mode</th>
                  <th className="px-4 py-3.5 font-bold text-right">Amount</th>
                  <th className="px-5 py-3.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filtered.map((tx) => {
                  const isSale = tx.type === 'sale';

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {tx.type === 'sale' ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-black" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-zinc-600" />
                          )}
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-black">
                        {tx.description}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-700">
                        <span className="bg-white px-2.5 py-0.5 rounded-full font-medium border border-zinc-200 text-[11px]">
                          {tx.payment_method || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold whitespace-nowrap text-black">
                        {isSale ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                          Recorded
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
