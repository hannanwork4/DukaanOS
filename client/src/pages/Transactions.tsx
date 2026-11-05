import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Search
} from 'lucide-react';
import { TransactionRecord } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface TransactionsProps {
  transactions: TransactionRecord[];
  onRefresh: () => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions }) => {
  const { t } = useTranslation();
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
        <h1 className="text-2xl font-bold tracking-tight text-black">
          {t('ledgerTitle')}
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {t('ledgerSub')}
        </p>
      </div>

      {/* 3D Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-panel p-4 rounded-2xl border border-black shadow-card-3d">
        <div className="flex-1 relative">
          <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={t('searchTxPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-black rounded-xl focus:outline-hidden focus:ring-1 focus:ring-black focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-sm bg-white border border-black rounded-xl px-3.5 py-2.5 font-semibold text-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-black"
          >
            <option value="All">{t('allEntryTypes')}</option>
            <option value="sale">{t('salesOnly')}</option>
            <option value="purchase">{t('purchasesOnly')}</option>
            <option value="expense">{t('expensesOnly')}</option>
            <option value="supplier_payment">{t('supplierPaymentsOnly')}</option>
          </select>
        </div>
      </div>

      {/* 3D Glass Table */}
      <div className="glass-panel rounded-3xl border border-black shadow-card-3d overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-400">
            {t('noTxFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/80 border-b border-black text-zinc-800 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-4 font-bold">{t('dateTimeCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('typeCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('descCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('paymentModeCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('amountCol')}</th>
                  <th className="px-5 py-4 font-bold text-center">{t('statusCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filtered.map((tx) => {
                  const isSale = tx.type === 'sale';

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-4 text-zinc-500 text-sm whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-zinc-100 text-zinc-900 border border-black">
                          {tx.type === 'sale' ? (
                            <ArrowUpRight className="w-4 h-4 text-black" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-black" />
                          )}
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-bold text-black text-sm">
                        {tx.description}
                      </td>

                      <td className="px-4 py-4 text-zinc-700">
                        <span className="bg-white px-2.5 py-1 rounded-full font-medium border border-black text-xs text-black">
                          {tx.payment_method || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right tabular-nums font-bold whitespace-nowrap text-black text-sm">
                        {isSale ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-black">
                          {t('recordedStatus')}
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
