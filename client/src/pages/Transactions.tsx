import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle2
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Unified Business Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all purchases, sales, expenses, settlements, and adjustments.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by transaction description, payment mode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-hidden"
          >
            <option value="All">All Types</option>
            <option value="sale">Sales Only</option>
            <option value="purchase">Purchases Only</option>
            <option value="expense">Expenses Only</option>
            <option value="supplier_payment">Supplier Payments Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-medium">Date & Time</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Payment Mode</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-3 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => {
                  const isSale = tx.type === 'sale';
                  const isSupplierPayment = tx.type === 'supplier_payment';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase font-mono ${
                          tx.type === 'sale'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.type === 'purchase'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : tx.type === 'expense'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {tx.type === 'sale' && <ArrowUpRight className="w-3 h-3" />}
                          {tx.type !== 'sale' && <ArrowDownLeft className="w-3 h-3" />}
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-900">
                        {tx.description}
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {tx.payment_method || '—'}
                      </td>

                      <td className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                        isSale ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        {isSale ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-50 text-slate-600 border border-slate-200">
                          {tx.status}
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
