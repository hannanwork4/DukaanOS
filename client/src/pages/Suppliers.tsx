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
import { useTranslation } from '../i18n/LanguageContext';

interface SuppliersProps {
  suppliers: Supplier[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onRefresh, showToast }) => {
  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold tracking-tight text-black">
            {t('suppliersTitle')}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {suppliers.length} {t('suppliers')} • {t('supplierDues')}: <span className="font-bold text-black tabular-nums">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          {t('addSupplierBtn')}
        </button>
      </div>

      {/* 3D Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-black shadow-card-3d flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={t('searchSuppliersPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-black rounded-xl focus:outline-hidden focus:ring-1 focus:ring-black focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 3D Glass Supplier Table */}
      <div className="glass-panel rounded-3xl border border-black shadow-card-3d overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-400">
            {t('noPendingDues')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/80 border-b border-black text-zinc-800 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-4 font-bold">{t('supplierCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('supplierPhoneLabel')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('totalPurchasesCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('amountPaidCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('dueBalanceCol')}</th>
                  <th className="px-4 py-4 font-bold text-center">{t('statusCol')}</th>
                  <th className="px-5 py-4 font-bold text-right">{t('actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filteredSuppliers.map((s) => {
                  const hasDue = s.outstanding_balance > 0;

                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm text-black">{s.name}</div>
                        {s.business_name && (
                          <div className="text-xs font-medium text-zinc-500">{s.business_name}</div>
                        )}
                        {s.address && (
                          <div className="text-xs text-zinc-400 truncate max-w-xs">{s.address}</div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-zinc-600 text-sm">
                        {s.phone || '—'}
                      </td>

                      <td className="px-4 py-4 text-right tabular-nums text-sm text-zinc-700">
                        ₹{s.total_purchases.toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-right tabular-nums text-sm text-zinc-700">
                        ₹{s.amount_paid.toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-right tabular-nums text-sm">
                        <span className={`font-bold ${hasDue ? 'text-black underline' : 'text-zinc-400'}`}>
                          ₹{s.outstanding_balance.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {hasDue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 text-white border border-black">
                            {t('paymentDueBadge')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-black">
                            {t('settledBadge')}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasDue && (
                            <button
                              onClick={() => {
                                setPaymentTarget(s);
                                setPayAmount(s.outstanding_balance.toString());
                                setPayNotes('');
                              }}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 border border-black rounded-xl shadow-btn-3d hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5"
                              title={`Quick settle balance for ${s.name}`}
                            >
                              <span>{t('payDueBtn')}: ₹{s.outstanding_balance.toLocaleString('en-IN')}</span>
                            </button>
                          )}
                          <button
                            onClick={() => openHistoryModal(s)}
                            title="Payment history"
                            className="p-2 rounded-xl text-black hover:bg-zinc-100 border border-black transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            title="Edit details"
                            className="p-2 rounded-xl text-black hover:bg-zinc-100 border border-black transition-colors"
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
        title={editingSupplier ? t('editSupplierModal') : t('addSupplierModal')}
        subtitle={t('supplierModalSub')}
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('supplierNameLabel')} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Traders, Sunil Gupta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('firmNameLabel')}</label>
              <input
                type="text"
                placeholder="e.g. Gupta Wholesale Dist."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('supplierPhoneLabel')}</label>
              <input
                type="text"
                placeholder="e.g. +91 98112 34567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('warehouseAddrLabel')}</label>
            <textarea
              rows={2}
              placeholder="e.g. Warehouse 12, Grain Market, Narela"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
              {isSubmitting ? t('savingBtn') : editingSupplier ? t('saveChangesBtn') : t('createSupplierBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Supplier Payment Modal */}
      <Modal
        isOpen={Boolean(paymentTarget)}
        onClose={() => setPaymentTarget(null)}
        title={`${t('recordPaymentTitle')}: ${paymentTarget?.name}`}
        subtitle={t('recordPaymentSub')}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm space-y-1">
            <div className="text-zinc-600">{t('pendingLiability')}:</div>
            <div className="text-lg font-bold text-black font-mono">
              ₹{paymentTarget?.outstanding_balance.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('paymentAmountLabel')} *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={paymentTarget?.outstanding_balance}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black font-mono"
              />
              {paymentTarget && paymentTarget.outstanding_balance > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setPayAmount(paymentTarget.outstanding_balance.toString())}
                    className="px-2 py-0.5 text-[11px] font-bold bg-zinc-900 text-white rounded-lg hover:bg-black transition-colors"
                  >
                    {t('fullDueBtn')}: ₹{paymentTarget.outstanding_balance.toLocaleString('en-IN')}
                  </button>
                  {paymentTarget.outstanding_balance > 100 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(Math.round(paymentTarget.outstanding_balance / 2).toString())}
                      className="px-2 py-0.5 text-[11px] font-medium bg-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-300 transition-colors"
                    >
                      50%: ₹{Math.round(paymentTarget.outstanding_balance / 2).toLocaleString('en-IN')}
                    </button>
                  )}
                  {[500, 1000, 2000, 5000].filter(val => val < paymentTarget.outstanding_balance).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPayAmount(val.toString())}
                      className="px-2 py-0.5 text-[11px] font-medium bg-zinc-100 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      ₹{val.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('paymentMethodLabel')}</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('paymentDateLabel')}</label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('notesRefLabel')}</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #492193812, Cleared October balance"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setPaymentTarget(null)}
              className="px-4 py-2 text-sm font-semibold text-zinc-700 border border-zinc-300 rounded-xl hover:bg-zinc-50"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-zinc-800 shadow-btn-3d"
            >
              {t('confirmPaymentBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Payment History Modal */}
      <Modal
        isOpen={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        title={`${t('paymentHistoryTitle')}: ${historyTarget?.name}`}
        subtitle={t('settlementsSub')}
        maxWidth="max-w-md"
      >
        {loadingHistory ? (
          <div className="p-8 text-center text-sm text-zinc-400">{t('loadingRecords')}</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">{t('noPaymentRecords')}</div>
        ) : (
          <div className="divide-y divide-zinc-200 max-h-80 overflow-y-auto">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold text-black">
                    ₹{p.amount.toFixed(2)}
                    <span className="ml-2 font-semibold text-zinc-600 text-xs uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                      {p.payment_method}
                    </span>
                  </div>
                  {p.notes && <div className="text-xs text-zinc-500 mt-0.5">{p.notes}</div>}
                </div>
                <div className="text-xs text-zinc-400">
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

