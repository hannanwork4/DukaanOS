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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              रोज़नामचा खाता <span className="text-sm font-normal text-amber-800">/ Unified Business Ledger</span>
            </h1>
          </div>
          <p className="text-xs text-amber-900/70 mt-0.5">
            खरीद, बिक्री, दुकान खर्चे और सप्लायर भुगतान का सम्मिलित बहीखाता (Complete Audit Trail)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-warm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="लेन-देन विवरण या पेमेंट मोड से खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-amber-50/40 border border-amber-200/80 rounded-xl focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-amber-50/40 border border-amber-200/80 rounded-xl px-3 py-2 font-medium text-amber-950 focus:outline-hidden focus:border-amber-400"
          >
            <option value="All">सभी एंट्रीज (All Types)</option>
            <option value="sale">केवल बिक्री (Sales)</option>
            <option value="purchase">केवल खरीद (Purchases)</option>
            <option value="expense">केवल खर्चे (Expenses)</option>
            <option value="supplier_payment">केवल सप्लायर भुगतान (Payments)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-warm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            चुने गए फ़िल्टर के लिए कोई लेन-देन नहीं मिला।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-amber-50/80 to-orange-50/40 border-b border-amber-200/70 text-amber-950 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-bold">दिनांक व समय</th>
                  <th className="px-3 py-3 font-bold">प्रकार (Type)</th>
                  <th className="px-4 py-3 font-bold">विवरण (Description)</th>
                  <th className="px-3 py-3 font-bold">पेमेंट माध्यम</th>
                  <th className="px-4 py-3 font-bold text-right">रकम (Amount)</th>
                  <th className="px-3 py-3 font-bold text-center">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/70">
                {filtered.map((tx) => {
                  const isSale = tx.type === 'sale';

                  return (
                    <tr key={tx.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          tx.type === 'sale'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : tx.type === 'purchase'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : tx.type === 'expense'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}>
                          {tx.type === 'sale' && <ArrowUpRight className="w-3 h-3 text-emerald-700" />}
                          {tx.type !== 'sale' && <ArrowDownLeft className="w-3 h-3 text-amber-800" />}
                          {tx.type === 'sale' ? 'बिक्री' : tx.type === 'purchase' ? 'खरीद' : tx.type === 'expense' ? 'खर्चा' : 'भुगतान'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900">
                        {tx.description}
                      </td>

                      <td className="px-3 py-3 text-slate-700">
                        <span className="bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200/60 text-[11px]">
                          {tx.payment_method || '—'}
                        </span>
                      </td>

                      <td className={`px-4 py-3 text-right font-mono font-extrabold whitespace-nowrap ${
                        isSale ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        {isSale ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          सफल ✓
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
