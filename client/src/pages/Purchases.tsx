import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Truck,
  CheckCircle2,
  Search
} from 'lucide-react';
import { Purchase, Supplier, Product } from '../types';
import { Modal } from '../components/Modal';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';

interface PurchasesProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onOpenAddSupplier?: () => void;
}

interface LineItem {
  product_id: string;
  product_name?: string;
  quantity: string;
  unit_price: string;
}

export const Purchases: React.FC<PurchasesProps> = ({
  purchases,
  suppliers,
  products,
  onRefresh,
  showToast
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Credit' | 'Pending'>('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { product_id: products[0]?.id || '', quantity: '1', unit_price: products[0]?.purchase_price?.toString() || '0' }
  ]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPurchases = purchases.filter(p => 
    p.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    (p.items && p.items.some(it => it.product_name?.toLowerCase().includes(search.toLowerCase())))
  );

  const calculateTotal = () => {
    return items.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.unit_price) || 0;
      return sum + (q * p);
    }, 0);
  };

  const handleProductChange = (index: number, prodId: string) => {
    const selected = products.find(p => p.id === prodId);
    const updated = [...items];
    updated[index].product_id = prodId;
    if (selected) {
      updated[index].unit_price = selected.purchase_price.toString();
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: string) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const addItemRow = () => {
    const firstProd = products[0];
    setItems([
      ...items,
      {
        product_id: firstProd?.id || '',
        quantity: '1',
        unit_price: firstProd?.purchase_price?.toString() || '0'
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const openAddModal = () => {
    setEditingPurchase(null);
    setSupplierId(suppliers[0]?.id || '');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('Cash');
    setNotes('');
    const firstProd = products[0];
    const initialItems: LineItem[] = [
      { product_id: firstProd?.id || '', quantity: '1', unit_price: firstProd?.purchase_price?.toString() || '0' }
    ];
    setItems(initialItems);
    setAmountPaid((firstProd?.purchase_price || 0).toString());
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Purchase) => {
    setEditingPurchase(p);
    setSupplierId(p.supplier_id);
    setPurchaseDate(p.purchase_date.slice(0, 10));
    setPaymentMethod(p.payment_method);
    setAmountPaid(p.amount_paid.toString());
    setNotes(p.notes || '');

    const lineItems: LineItem[] = (p.items || []).map(it => ({
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity.toString(),
      unit_price: it.unit_price.toString()
    }));
    setItems(lineItems.length > 0 ? lineItems : [
      { product_id: products[0]?.id || '', quantity: '1', unit_price: '0' }
    ]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!supplierId) {
      setFormError('Please select a supplier.');
      return;
    }

    if (items.length === 0) {
      setFormError('Add at least one product.');
      return;
    }

    for (const it of items) {
      const q = parseFloat(it.quantity);
      const pr = parseFloat(it.unit_price);
      if (isNaN(q) || q <= 0) {
        setFormError('Quantity for all items must be greater than zero.');
        return;
      }
      if (isNaN(pr) || pr < 0) {
        setFormError('Unit price must be zero or positive.');
        return;
      }
    }

    const total = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;

    setIsSubmitting(true);
    try {
      const payload = {
        supplier_id: supplierId,
        purchase_date: new Date(purchaseDate).toISOString(),
        payment_method: paymentMethod,
        amount_paid: paid,
        notes: notes.trim(),
        items: items.map(it => ({
          product_id: it.product_id,
          quantity: parseFloat(it.quantity),
          unit_price: parseFloat(it.unit_price)
        }))
      };

      if (editingPurchase) {
        await api.updatePurchase(editingPurchase.id, payload);
        showToast('success', `Purchase ${editingPurchase.id.slice(0, 8)} updated with automatic stock and supplier recalculation.`);
      } else {
        await api.recordPurchase(payload);
        showToast('success', 'Purchase recorded. Stock increased and supplier balance updated.');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTotal = calculateTotal();
  const currentPaid = parseFloat(amountPaid) || 0;
  const currentOutstanding = Math.max(0, currentTotal - currentPaid);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            {t('purchasesTitle')}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {t('purchasesSubtitle')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          {t('newPurchaseBtn')}
        </button>
      </div>

      {/* 3D Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-black shadow-card-3d flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4.5 h-4.5 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={t('searchPurchasesPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-black rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 3D Glass Purchases Table */}
      <div className="glass-panel rounded-3xl border border-black shadow-card-3d overflow-hidden">
        {filteredPurchases.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-400">
            {t('noTransactionsYet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-4 font-bold">{t('dateCol')} / {t('invoiceCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('supplierCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('itemsCountCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('amountCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('amountPaidCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('dueBalanceCol')}</th>
                  <th className="px-4 py-4 font-bold text-center">{t('paymentMethodCol')}</th>
                  <th className="px-5 py-4 font-bold text-right">{t('actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-black">
                        {new Date(p.purchase_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs font-mono text-zinc-400">
                        #{p.id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold text-sm text-black">
                      {p.supplier_name || 'Wholesale Supplier'}
                    </td>

                    <td className="px-4 py-4 text-zinc-700">
                      <div className="max-w-xs space-y-0.5">
                        {(p.items || []).map((it, idx) => (
                          <div key={idx} className="text-xs sm:text-sm truncate">
                            <span className="font-bold text-black">{it.quantity}x</span> {it.product_name}
                            <span className="text-zinc-500 tabular-nums ml-1">(@ ₹{it.unit_price})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums font-bold text-sm text-black">
                      ₹{p.total_amount.toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums text-sm text-zinc-600">
                      ₹{p.amount_paid.toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums text-sm">
                      {p.outstanding_amount > 0 ? (
                        <span className="font-bold text-black underline">
                          ₹{p.outstanding_amount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">Settled</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {p.payment_method}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit purchase"
                        className="p-2 rounded-xl text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record / Edit Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPurchase ? t('editProduct') : t('recordPurchaseModalTitle')}
        subtitle={t('purchasesSubtitle')}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('supplierCol')} *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              >
                <option value="">{t('selectSupplier')}...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.business_name ? `(${s.business_name})` : ''} — Due: ₹{s.outstanding_balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('dateCol')} *</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              />
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-black pb-1">
              <span>Purchased Products</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-sm text-black font-semibold hover:underline flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2.5 items-center bg-white p-2.5 rounded-xl border border-zinc-200 text-sm">
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:outline-hidden"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.current_stock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:outline-hidden text-right font-mono"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="₹ Price"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:outline-hidden text-right font-mono"
                    />
                  </div>

                  <div className="w-28 text-right font-mono font-bold text-black pr-1">
                    ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1.5 text-zinc-400 hover:text-black rounded-lg hover:bg-zinc-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Row */}
            <div className="pt-2.5 border-t border-zinc-200 flex justify-between items-center text-sm font-bold text-black px-1">
              <span>Total Purchase Value</span>
              <span className="text-base font-mono">₹{currentTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Amount Paid Upfront (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={currentTotal}
                placeholder="Amount paid"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white font-mono"
              />
              <div className="mt-1 text-xs text-zinc-500 flex justify-between">
                <span>Remaining Pending:</span>
                <span className="font-mono font-bold text-black">₹{currentOutstanding.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit">Credit (Full Due)</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Notes / Bill Invoice No. (optional)</label>
            <input
              type="text"
              placeholder="e.g. Invoice #9821, Delivery received via tempo"
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
              {isSubmitting ? '...' : editingPurchase ? t('saveChangesBtn') : t('completePurchaseBtn')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

