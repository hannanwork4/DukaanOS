import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Search,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { Sale, Product, Business } from '../types';
import { Modal } from '../components/Modal';
import { ReceiptModal } from '../components/ReceiptModal';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  business?: Business | null;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface SaleLineItem {
  product_id: string;
  quantity: string;
  unit_price: string;
}

export const Sales: React.FC<SalesProps> = ({
  sales,
  products,
  business,
  onRefresh,
  showToast
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<Sale | null>(null);

  // Form State
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Credit'>('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleLineItem[]>([
    { product_id: products[0]?.id || '', quantity: '1', unit_price: products[0]?.selling_price?.toString() || '0' }
  ]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSales = sales.filter(s => 
    (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    (s.items && s.items.some(it => it.product_name?.toLowerCase().includes(search.toLowerCase())))
  );

  const calculateTotal = () => {
    return items.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.unit_price) || 0;
      return sum + (q * p);
    }, 0);
  };

  const calculateEstimatedProfit = () => {
    return items.reduce((sum, it) => {
      const prod = products.find(p => p.id === it.product_id);
      const cost = prod ? prod.purchase_price : 0;
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.unit_price) || 0;
      return sum + (q * (p - cost));
    }, 0);
  };

  const handleProductChange = (index: number, prodId: string) => {
    const selected = products.find(p => p.id === prodId);
    const updated = [...items];
    updated[index].product_id = prodId;
    if (selected) {
      updated[index].unit_price = selected.selling_price.toString();
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof SaleLineItem, val: string) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const addItemRow = () => {
    const firstProd = products.find(p => p.current_stock > 0) || products[0];
    setItems([
      ...items,
      {
        product_id: firstProd?.id || '',
        quantity: '1',
        unit_price: firstProd?.selling_price?.toString() || '0'
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const openAddModal = () => {
    setEditingSale(null);
    setSaleDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('Cash');
    setCustomerName('');
    setNotes('');
    const firstProd = products.find(p => p.current_stock > 0) || products[0];
    const initialItems: SaleLineItem[] = [
      { product_id: firstProd?.id || '', quantity: '1', unit_price: firstProd?.selling_price?.toString() || '0' }
    ];
    setItems(initialItems);
    setAmountReceived((firstProd?.selling_price || 0).toString());
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Sale) => {
    setEditingSale(s);
    setSaleDate(s.sale_date.slice(0, 10));
    setPaymentMethod(s.payment_method);
    setAmountReceived(s.amount_received.toString());
    setCustomerName(s.customer_name || '');
    setNotes(s.notes || '');

    const lineItems: SaleLineItem[] = (s.items || []).map(it => ({
      product_id: it.product_id,
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

    if (items.length === 0) {
      setFormError('Please add at least one item.');
      return;
    }

    for (const it of items) {
      const q = parseFloat(it.quantity);
      const pr = parseFloat(it.unit_price);
      if (isNaN(q) || q <= 0) {
        setFormError('Quantity must be greater than zero.');
        return;
      }
      if (isNaN(pr) || pr < 0) {
        setFormError('Price must be positive.');
        return;
      }

      // Check stock availability (for new sale)
      const prod = products.find(p => p.id === it.product_id);
      if (!editingSale && prod && prod.current_stock < q) {
        setFormError(`Insufficient stock for "${prod.name}". Available: ${prod.current_stock} ${prod.unit}, requested: ${q}.`);
        return;
      }
    }

    const total = calculateTotal();
    const received = paymentMethod === 'Credit' 
      ? (parseFloat(amountReceived) || 0)
      : total;

    setIsSubmitting(true);
    try {
      const payload = {
        sale_date: new Date(saleDate).toISOString(),
        payment_method: paymentMethod,
        amount_received: received,
        customer_name: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map(it => ({
          product_id: it.product_id,
          quantity: parseFloat(it.quantity),
          unit_price: parseFloat(it.unit_price)
        }))
      };

      if (editingSale) {
        await api.updateSale(editingSale.id, payload);
        showToast('success', `Sale ${editingSale.id.slice(0, 8)} updated with automatic stock recalculation.`);
      } else {
        await api.recordSale(payload);
        showToast('success', 'Sale recorded. Inventory reduced and gross profit updated.');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTotal = calculateTotal();
  const currentEstProfit = calculateEstimatedProfit();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            {t('salesTitle')}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {t('salesSubtitle')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          {t('newSaleBtn')}
        </button>
      </div>

      {/* 3D Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-black shadow-card-3d flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={t('searchSalesPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-black rounded-xl focus:outline-hidden focus:ring-1 focus:ring-black focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 3D Glass Sales List Table */}
      <div className="glass-panel rounded-3xl border border-black shadow-card-3d overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-400">
            {t('noTransactionsYet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/80 border-b border-black text-zinc-800 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-4 font-bold">{t('dateCol')} / {t('invoiceCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('customerCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('itemsCountCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('amountCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('profitCol')}</th>
                  <th className="px-4 py-4 font-bold text-center">{t('paymentMethodCol')}</th>
                  <th className="px-5 py-4 font-bold text-right">{t('actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-black">
                        {new Date(s.sale_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs font-mono text-zinc-400">
                        #{s.id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold text-sm text-black">
                      {s.customer_name || 'Walk-in Customer'}
                    </td>

                    <td className="px-4 py-4 text-zinc-700">
                      <div className="max-w-xs space-y-0.5">
                        {(s.items || []).map((it, idx) => (
                          <div key={idx} className="text-xs sm:text-sm truncate">
                            <span className="font-bold text-black">{it.quantity}x</span> {it.product_name}
                            <span className="text-zinc-500 tabular-nums ml-1">(@ ₹{it.unit_price})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums font-bold text-sm text-black">
                      ₹{s.total_amount.toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full font-semibold text-xs text-black bg-zinc-100 border border-black">
                        +₹{s.estimated_profit.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-black">
                        {s.payment_method}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setReceiptTarget(s)}
                          title="Print cash receipt"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-black bg-white border border-black rounded-xl hover:bg-zinc-50 transition-all shadow-xs cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-black" />
                          Receipt
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit sale"
                          className="p-2 rounded-xl text-black hover:bg-zinc-100 border border-black transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
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

      {/* Record / Edit Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSale ? t('editProduct') : t('newSaleModalTitle')}
        subtitle={t('salesSubtitle')}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('dateCol')} *</label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('paymentMethodLabel')} *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit">Credit (Khata / Udhar)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('customerNameLabel')}</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Bhai"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black bg-white"
              />
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-black pb-1">
              <span>Products Sold</span>
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
              {items.map((item, idx) => {
                const prod = products.find(p => p.id === item.product_id);
                const currentQty = parseFloat(item.quantity) || 1;
                return (
                  <div key={idx} className="flex gap-2.5 items-center bg-white p-2.5 rounded-xl border border-zinc-200 text-sm">
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full p-2 text-xs sm:text-sm border border-zinc-200 rounded-lg focus:outline-hidden truncate"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.current_stock <= 0 && !editingSale}>
                            {p.name} (Stock: {p.current_stock} {p.unit} • ₹{p.selling_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity with - / + Stepper */}
                    <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleItemChange(idx, 'quantity', Math.max(1, currentQty - 1).toString())}
                        className="px-2 py-1 text-zinc-600 hover:bg-zinc-200 font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max={prod ? prod.current_stock : undefined}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-12 p-1 text-xs text-center font-bold bg-white focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleItemChange(idx, 'quantity', (currentQty + 1).toString())}
                        className="px-2 py-1 text-zinc-600 hover:bg-zinc-200 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="₹ Price"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="w-full p-1.5 text-xs sm:text-sm border border-zinc-200 rounded-lg focus:outline-hidden text-right font-mono"
                      />
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-black text-xs sm:text-sm pr-1">
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
                );
              })}
            </div>

            {/* Total & Profit Preview */}
            <div className="pt-2.5 border-t border-zinc-200 flex justify-between items-center text-sm px-1">
              <div>
                <span className="text-zinc-500">Est. Gross Margin: </span>
                <span className="font-bold text-black font-mono">+₹{currentEstProfit.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 mr-2">Total Bill:</span>
                <span className="text-lg font-bold text-black font-mono">₹{currentTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Cash Return Calculator */}
          <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                Amount Received / Cash Tendered
              </label>
              
              {/* Quick Cash Denomination Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAmountReceived(currentTotal.toString())}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 text-zinc-900 shadow-xs cursor-pointer"
                >
                  Exact (₹{currentTotal.toFixed(0)})
                </button>
                {[100, 200, 500].filter(n => n >= currentTotal).map((cashNote) => (
                  <button
                    key={cashNote}
                    type="button"
                    onClick={() => setAmountReceived(cashNote.toString())}
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 text-zinc-800 shadow-xs cursor-pointer"
                  >
                    ₹{cashNote} Note
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={`₹${currentTotal.toFixed(2)}`}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black font-mono font-bold bg-white"
              />
            </div>

            {/* Change Return Indicator */}
            {parseFloat(amountReceived) > currentTotal && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800 animate-fade-in">
                <span>💵 {t('returnChangeLabel')}:</span>
                <span className="text-base font-mono">₹{(parseFloat(amountReceived) - currentTotal).toFixed(2)}</span>
              </div>
            )}

            {paymentMethod === 'Credit' && parseFloat(amountReceived || '0') < currentTotal && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-semibold text-amber-800 animate-fade-in">
                <span>📒 {t('khataNotice')} {customerName || 'Customer'}:</span>
                <span className="font-mono font-bold">₹{(currentTotal - (parseFloat(amountReceived) || 0)).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('notesLabel')} (optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid via PhonePe UPI, home delivery"
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
              {isSubmitting ? '...' : editingSale ? t('saveChangesBtn') : t('completeSaleBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Bill / Receipt Modal */}
      <ReceiptModal
        sale={receiptTarget}
        business={business || null}
        onClose={() => setReceiptTarget(null)}
      />
    </div>
  );
};

