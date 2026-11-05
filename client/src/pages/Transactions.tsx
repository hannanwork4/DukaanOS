import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter
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
      <div className="pb-3 border-b border-amber-200/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            रोज़नामचा खाता <span className="text-sm font-bold text-slate-600">/ Unified Business Ledger</span>
          </h1>
        </div>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          दुकान के सभी लेन-देन (खरीद, बिक्री, खर्चे और सप्लायर भुगतान) का प्रमाणित बहीखाता
        </p>
      </div>

      {/* 3D Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-panel p-4 rounded-2xl border border-white/80 shadow-card-3d">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="लेन-देन विवरण या पेमेंट मोड से खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-white/70 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:outline-hidden focus:border-amber-400"
          >
            <option value="All">सभी एंट्रीज (All Types)</option>
            <option value="sale">केवल बिक्री (Sales)</option>
            <option value="purchase">केवल खरीद (Purchases)</option>
            <option value="expense">केवल खर्चे (Expenses)</option>
            <option value="supplier_payment">केवल सप्लायर भुगतान (Payments)</option>
          </select>
        </div>
      </div>

      {/* 3D Glass Table */}
      <div className="glass-panel rounded-3xl border border-white/80 shadow-card-3d overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            चुने गए फ़िल्टर के लिए कोई लेन-देन नहीं मिला।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/60 border-b border-amber-200/50 text-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 font-black">दिनांक व समय</th>
                  <th className="px-4 py-3.5 font-black">प्रकार (Type)</th>
                  <th className="px-4 py-3.5 font-black">विवरण</th>
                  <th className="px-4 py-3.5 font-black">पेमेंट माध्यम</th>
                  <th className="px-4 py-3.5 font-black text-right">रकम</th>
                  <th className="px-5 py-3.5 font-black text-center">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/40">
                {filtered.map((tx) => {
                  const isSale = tx.type === 'sale';

                  return (
                    <tr key={tx.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                          tx.type === 'sale'
                            ? 'bg-amber-100 text-amber-950 border border-amber-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {tx.type === 'sale' && <ArrowUpRight className="w-3.5 h-3.5 text-amber-800" />}
                          {tx.type !== 'sale' && <ArrowDownLeft className="w-3.5 h-3.5 text-slate-700" />}
                          {tx.type === 'sale' ? 'बिक्री' : tx.type === 'purchase' ? 'खरीद' : tx.type === 'expense' ? 'खर्चा' : 'भुगतान'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {tx.description}
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        <span className="bg-white/90 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200 text-[11px]">
                          {tx.payment_method || '—'}
                        </span>
                      </td>

                      <td className={`px-4 py-3.5 text-right font-mono font-black whitespace-nowrap ${
                        isSale ? 'text-amber-900' : 'text-slate-900'
                      }`}>
                        {isSale ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          दर्ज
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
