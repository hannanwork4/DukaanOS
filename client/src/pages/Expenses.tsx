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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              दुकान के खर्चे <span className="text-sm font-normal text-amber-800">/ Expense Management</span>
            </h1>
          </div>
          <p className="text-xs text-amber-900/70 mt-0.5">
            दुकान किराया, बिजली, चाय-नाश्ता, भाड़ा/पल्लेदारी और स्टाफ वेतन
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-orange-500/25 active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          + नया खर्चा दर्ज करें (Add Expense)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-warm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="खर्चे का विवरण या नोट खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-amber-50/40 border border-amber-200/80 rounded-xl focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs bg-amber-50/40 border border-amber-200/80 rounded-xl px-3 py-2 font-medium text-amber-950 focus:outline-hidden focus:border-amber-400"
          >
            <option value="All">सभी खर्चे (All Categories)</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="text-xs font-mono font-extrabold text-rose-900 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
            कुल: ₹{totalExpenseVal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-warm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            कोई खर्चा दर्ज नहीं है। नया खर्चा जोड़ने के लिए ऊपर बटन दबाएं।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-amber-50/80 to-orange-50/40 border-b border-amber-200/70 text-amber-950 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-bold">दिनांक</th>
                  <th className="px-4 py-3 font-bold">खर्चे का विवरण (Description)</th>
                  <th className="px-3 py-3 font-bold">मद (Category)</th>
                  <th className="px-3 py-3 font-bold">भुगतान माध्यम</th>
                  <th className="px-3 py-3 font-bold text-right">रकम (Amount)</th>
                  <th className="px-4 py-3 font-bold text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/70">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>{exp.description}</div>
                      {exp.notes && <div className="text-[10px] text-slate-400 font-normal">{exp.notes}</div>}
                    </td>

                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-slate-700">
                      {exp.payment_method}
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-extrabold text-rose-700">
                      ₹{exp.amount.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(exp)}
                          title="खर्चा बदलें (Edit)"
                          className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          title="हटाएं (Delete)"
                          className="p-1.5 rounded-lg text-amber-700 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

