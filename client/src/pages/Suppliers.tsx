import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Phone,
  MapPin,
  Edit2,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  History
} from 'lucide-react';
import { Supplier } from '../types';
import { Modal } from '../components/Modal';
import { api } from '../api/client';

interface SuppliersProps {
  suppliers: Supplier[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onRefresh, showToast }) => {
  const [search, setSearch] = useState('');

  // Add / Edit Supplier Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Record Payment Modal
  const [paymentTarget, setPaymentTarget] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [payNotes, setPayNotes] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  // Payment History Drawer
  const [historyTarget, setHistoryTarget] = useState<Supplier | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.business_name && s.business_name.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.includes(search))
  );

  const openAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setBusinessName('');
    setPhone('');
    setAddress('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setBusinessName(s.business_name || '');
    setPhone(s.phone || '');
    setAddress(s.address || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Supplier name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, {
          name: name.trim(),
          business_name: businessName.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined
        });
        showToast('success', `Supplier "${name}" updated.`);
      } else {
        await api.createSupplier({
          name: name.trim(),
          business_name: businessName.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined
        });
        showToast('success', `Supplier "${name}" added.`);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Payment amount must be greater than zero.');
      return;
    }

    try {
      await api.recordSupplierPayment(paymentTarget.id, {
        amount: amt,
        payment_method: payMethod,
        payment_date: new Date(payDate).toISOString(),
        notes: payNotes.trim() || undefined
      });
      showToast('success', `Payment of ₹${amt.toFixed(2)} recorded for ${paymentTarget.name}. Outstanding balance reduced.`);
      setPaymentTarget(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to record supplier payment');
    }
  };

  const openHistoryModal = async (s: Supplier) => {
    setHistoryTarget(s);
    setLoadingHistory(true);
    try {
      const data = await api.getSupplierPayments(s.id);
      setPayments(data);
    } catch (err: any) {
      showToast('error', 'Failed to fetch payment history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const totalOutstanding = filteredSuppliers.reduce((sum, s) => sum + s.outstanding_balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Suppliers & Accounts Payable
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {suppliers.length} active suppliers • Total outstanding balance: <span className="font-bold text-black font-mono">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Add Supplier
        </button>
      </div>

      {/* 3D Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-zinc-200 shadow-card-3d flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by supplier name, company or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 3D Glass Supplier Table */}
      <div className="glass-panel rounded-3xl border border-zinc-200 shadow-card-3d overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No suppliers found. Add a supplier to begin tracking restocks and payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Supplier / Business</th>
                  <th className="px-4 py-3.5 font-bold">Contact Phone</th>
                  <th className="px-4 py-3.5 font-bold text-right">Total Purchases</th>
                  <th className="px-4 py-3.5 font-bold text-right">Amount Paid</th>
                  <th className="px-4 py-3.5 font-bold text-right">Outstanding Balance</th>
                  <th className="px-4 py-3.5 font-bold text-center">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filteredSuppliers.map((s) => {
                  const hasDue = s.outstanding_balance > 0;

                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-black">{s.name}</div>
                        {s.business_name && (
                          <div className="text-[11px] font-medium text-zinc-500">{s.business_name}</div>
                        )}
                        {s.address && (
                          <div className="text-[10px] text-zinc-400 truncate max-w-xs">{s.address}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-600 font-mono text-[11px]">
                        {s.phone || '—'}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                        ₹{s.total_purchases.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                        ₹{s.amount_paid.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono">
                        <span className={`font-bold ${hasDue ? 'text-black underline' : 'text-zinc-400'}`}>
                          ₹{s.outstanding_balance.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {hasDue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-white">
                            Payment Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                            Settled
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasDue && (
                            <button
                              onClick={() => {
                                setPaymentTarget(s);
                                setPayAmount(s.outstanding_balance.toString());
                                setPayNotes('');
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                            >
                              Settle Payment
                            </button>
                          )}
                          <button
                            onClick={() => openHistoryModal(s)}
                            title="Payment history"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            title="Edit details"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        subtitle="Manage supplier profile and contact credentials"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          {formError && (
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Supplier Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Traders, Sunil Gupta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company / Firm Name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Gupta Wholesale Dist."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +91 98112 34567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Warehouse Address (optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Warehouse 12, Grain Market, Narela"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
              {isSubmitting ? 'Saving...' : editingSupplier ? 'Save Changes' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Supplier Payment Modal */}
      <Modal
        isOpen={Boolean(paymentTarget)}
        onClose={() => setPaymentTarget(null)}
        title={`Record Payment to: ${paymentTarget?.name}`}
        subtitle="Clears pending balance without creating duplicate purchase expenses"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs space-y-1">
            <div className="text-amber-800">Current Pending Liability:</div>
            <div className="text-base font-bold text-amber-900 font-mono">
              ₹{paymentTarget?.outstanding_balance.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={paymentTarget?.outstanding_balance}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Transaction Reference</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #492193812, Cleared October balance"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPaymentTarget(null)}
              className="px-3 py-1.5 text-xs text-slate-700 border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Payment History Modal */}
      <Modal
        isOpen={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        title={`Payment History: ${historyTarget?.name}`}
        subtitle="Logged supplier settlements"
        maxWidth="max-w-md"
      >
        {loadingHistory ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading payment records...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No payment records logged for this supplier yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {payments.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">
                    ₹{p.amount.toFixed(2)}
                    <span className="ml-2 font-normal text-slate-400 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100">
                      {p.payment_method}
                    </span>
                  </div>
                  {p.notes && <div className="text-[11px] text-slate-500 mt-0.5">{p.notes}</div>}
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(p.payment_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

