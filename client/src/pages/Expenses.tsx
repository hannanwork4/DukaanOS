import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  Zap,
  Home,
  Truck,
  Users,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { Expense } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';

interface ExpensesProps {
  expenses: Expense[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const CATEGORIES = ['Electricity', 'Rent', 'Transport', 'Wages', 'Maintenance', 'Miscellaneous'] as const;

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onRefresh, showToast }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Electricity');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCat === 'All' || e.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const openAddModal = () => {
    setEditingExpense(null);
    setDescription('');
    setCategory('Electricity');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('Cash');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (e: Expense) => {
    setEditingExpense(e);
    setDescription(e.description);
    setCategory(e.category);
    setAmount(e.amount.toString());
    setDate(e.date.slice(0, 10));
    setPaymentMethod(e.payment_method);
    setNotes(e.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim()) {
      setFormError('Description is required.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, {
          description: description.trim(),
          category,
          amount: amt,
          date: new Date(date).toISOString(),
          payment_method: paymentMethod,
          notes: notes.trim() || undefined
        });
        showToast('success', 'Expense updated.');
      } else {
        await api.recordExpense({
          description: description.trim(),
          category,
          amount: amt,
          date: new Date(date).toISOString(),
          payment_method: paymentMethod,
          notes: notes.trim() || undefined
        });
        showToast('success', 'Expense recorded in ledger.');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteExpense(deleteTarget.id);
      showToast('success', 'Expense removed.');
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete expense');
    }
  };

  const totalExpenseVal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            {t('expensesTitle')}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {t('expensesSub')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          {t('addExpenseBtn')}
        </button>
      </div>

      {/* 3D Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-panel p-4 rounded-2xl border border-black shadow-card-3d">
        <div className="flex-1 relative">
          <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={t('searchExpensesPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-black rounded-xl focus:outline-hidden focus:ring-1 focus:ring-black focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-sm bg-white border border-black rounded-xl px-3.5 py-2.5 font-semibold text-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-black"
          >
            <option value="All">{t('allCategories')}</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="text-sm tabular-nums font-bold text-black bg-zinc-100 px-3.5 py-2 rounded-xl border border-black">
            {t('totalLabel')}: ₹{totalExpenseVal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 3D Glass Expenses Table */}
      <div className="glass-panel rounded-3xl border border-black shadow-card-3d overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-400">
            {t('noExpensesFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/80 border-b border-black text-zinc-800 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-4 font-bold">{t('dateCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('descriptionCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('categoryCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('paymentModeCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('amountCol')}</th>
                  <th className="px-5 py-4 font-bold text-right">{t('actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-4 text-zinc-500 tabular-nums text-sm">
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-4 py-4 font-bold text-black">
                      <div>{exp.description}</div>
                      {exp.notes && <div className="text-xs text-zinc-400 font-normal">{exp.notes}</div>}
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-900 border border-black">
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-zinc-700">
                      {exp.payment_method}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums font-bold text-black text-sm">
                      ₹{exp.amount.toFixed(2)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(exp)}
                          title="Edit expense"
                          className="p-2 rounded-xl text-black hover:bg-zinc-100 border border-black transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          title="Delete expense"
                          className="p-2 rounded-xl text-black hover:bg-zinc-100 border border-black transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? t('editExpenseModal') : t('recordExpenseModal')}
        subtitle={t('expenseModalSub')}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {formError}
            </div>
          )}

          {/* Quick Expense Preset Chips */}
          <div className="space-y-1.5 pb-1">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              {t('quickPresets')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: t('teaSnacksChip'), desc: 'Chai & Snacks for Staff', cat: 'Miscellaneous' },
                { label: t('freightChip'), desc: 'Tempo & Transport Freight', cat: 'Transport' },
                { label: t('cleaningChip'), desc: 'Shop Cleaning & Broom', cat: 'Maintenance' },
                { label: t('electricityChip'), desc: 'Monthly Electricity Bill', cat: 'Electricity' },
                { label: t('wagesChip'), desc: 'Helper Daily Wage', cat: 'Wages' },
                { label: t('carryBagsChip'), desc: 'Plastic & Paper Packing Bags', cat: 'Miscellaneous' }
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setDescription(chip.desc);
                    setCategory(chip.cat as any);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-black hover:text-white rounded-lg transition-colors border border-zinc-200 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('descLabel')} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Shop Electricity Bill October, Tempo freight"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('categoryCol')} *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('amountCol')} (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="2450"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('dateCol')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('paymentMethodLabel')}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('notesVoucherLabel')}</label>
            <input
              type="text"
              placeholder="e.g. Paid online, receipt attached"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-700 border border-zinc-300 rounded-xl hover:bg-zinc-50"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-zinc-800 disabled:opacity-50 shadow-btn-3d"
            >
              {isSubmitting ? t('savingBtn') : editingExpense ? t('saveChangesBtn') : t('recordExpenseBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('deleteExpenseTitle')}
        message={t('deleteExpenseConfirm')}
        confirmText={t('deleteExpenseTitle')}
      />
    </div>
  );
};

