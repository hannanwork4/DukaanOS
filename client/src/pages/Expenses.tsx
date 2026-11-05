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

interface ExpensesProps {
  expenses: Expense[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const CATEGORIES = ['Electricity', 'Rent', 'Transport', 'Wages', 'Maintenance', 'Miscellaneous'] as const;

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onRefresh, showToast }) => {
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
          <h1 className="text-xl font-bold tracking-tight text-black">
            Operating Expenses
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Record shop overheads: electricity, rent, freight, wages, and maintenance.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Add Expense
        </button>
      </div>

      {/* 3D Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-panel p-4 rounded-2xl border border-zinc-200 shadow-card-3d">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by expense description or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 font-semibold text-zinc-800 focus:outline-hidden focus:border-black"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="text-xs font-mono font-bold text-black bg-zinc-100 px-3.5 py-2 rounded-xl border border-zinc-200">
            Total: ₹{totalExpenseVal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 3D Glass Expenses Table */}
      <div className="glass-panel rounded-3xl border border-zinc-200 shadow-card-3d overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No expenses recorded for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Date</th>
                  <th className="px-4 py-3.5 font-bold">Description</th>
                  <th className="px-4 py-3.5 font-bold">Category</th>
                  <th className="px-4 py-3.5 font-bold">Payment Mode</th>
                  <th className="px-4 py-3.5 font-bold text-right">Amount</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-500 font-mono text-[11px]">
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-black">
                      <div>{exp.description}</div>
                      {exp.notes && <div className="text-[10px] text-zinc-400 font-normal">{exp.notes}</div>}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-700">
                      {exp.payment_method}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-black">
                      ₹{exp.amount.toFixed(2)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(exp)}
                          title="Edit expense"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          title="Delete expense"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
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
        title={editingExpense ? 'Edit Expense' : 'Record Operating Expense'}
        subtitle="Manage daily shop operating overheads"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Shop Electricity Bill October, Tempo freight"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="2450"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Voucher Details (optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid online, receipt attached"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-700 border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete expense "${deleteTarget?.description}" of ₹${deleteTarget?.amount}?`}
        confirmText="Delete Expense"
      />
    </div>
  );
};

