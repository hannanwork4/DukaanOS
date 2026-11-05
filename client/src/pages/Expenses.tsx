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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-200/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              दुकान के खर्चे <span className="text-sm font-bold text-slate-600">/ Expense Management</span>
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            दुकान किराया, बिजली, चाय-नाश्ता, भाड़ा/पल्लेदारी और दैनिक खर्चे
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-btn-3d hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + नया खर्चा (Add Expense)
        </button>
      </div>

      {/* 3D Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-panel p-4 rounded-2xl border border-white/80 shadow-card-3d">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="खर्चे का विवरण या नोट खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs bg-white/70 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:outline-hidden focus:border-amber-400"
          >
            <option value="All">सभी खर्चे</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="text-xs font-mono font-black text-slate-900 bg-white/80 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            कुल: ₹{totalExpenseVal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 3D Glass Expenses Table */}
      <div className="glass-panel rounded-3xl border border-white/80 shadow-card-3d overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            कोई खर्चा दर्ज नहीं है। नया खर्चा जोड़ने के लिए ऊपर बटन दबाएं।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/60 border-b border-amber-200/50 text-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 font-black">दिनांक</th>
                  <th className="px-4 py-3.5 font-black">खर्चे का विवरण</th>
                  <th className="px-4 py-3.5 font-black">मद (Category)</th>
                  <th className="px-4 py-3.5 font-black">भुगतान माध्यम</th>
                  <th className="px-4 py-3.5 font-black text-right">रकम</th>
                  <th className="px-5 py-3.5 font-black text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/40">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div>{exp.description}</div>
                      {exp.notes && <div className="text-[10px] text-slate-400 font-normal">{exp.notes}</div>}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      {exp.payment_method}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900">
                      ₹{exp.amount.toFixed(2)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(exp)}
                          title="बदलें"
                          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          title="हटाएं"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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

