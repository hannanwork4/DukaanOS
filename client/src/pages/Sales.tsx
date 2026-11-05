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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              बिक्री बही <span className="text-sm font-normal text-amber-800">/ Sales Register</span>
            </h1>
          </div>
          <p className="text-xs text-amber-900/70 mt-0.5">
            ग्राहक बिक्री, स्टॉक कटौती और तुरंत ग्रॉस मुनाफा (Gross Profit) हिसाब
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-orange-500/25 active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          + नया ग्राहक बिल (New Sale)
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-warm flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="ग्राहक का नाम या बेचे गए सामान से खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-amber-50/40 border border-amber-200/80 rounded-xl focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Sales List Table */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-warm overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            अभी तक कोई बिक्री दर्ज नहीं हुई है। नया बिल बनाने के लिए ऊपर बटन दबाएं।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-amber-50/80 to-orange-50/40 border-b border-amber-200/70 text-amber-950 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-bold">दिनांक / ID</th>
                  <th className="px-4 py-3 font-bold">ग्राहक (Customer)</th>
                  <th className="px-4 py-3 font-bold">बिका हुआ सामान</th>
                  <th className="px-3 py-3 font-bold text-right">कुल बिल (Total)</th>
                  <th className="px-3 py-3 font-bold text-right">मुनाफा (Gross Margin)</th>
                  <th className="px-3 py-3 font-bold text-center">पेमेंट माध्यम</th>
                  <th className="px-4 py-3 font-bold text-right">रसीद व कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/70">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">
                        {new Date(s.sale_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-[10px] font-mono text-amber-900/60">
                        #{s.id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-900">
                      {s.customer_name || 'दुकान ग्राहक (Walk-in)'}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-xs space-y-0.5">
                        {(s.items || []).map((it, idx) => (
                          <div key={idx} className="text-[11px] truncate">
                            <span className="font-bold text-amber-950">{it.quantity}x</span> {it.product_name}
                            <span className="text-slate-500 font-mono ml-1">(@ ₹{it.unit_price})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-extrabold text-slate-900">
                      ₹{s.total_amount.toFixed(2)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                        +₹{s.estimated_profit.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.payment_method === 'UPI'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : s.payment_method === 'Cash'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {s.payment_method === 'UPI' ? 'UPI (PhonePe)' : s.payment_method === 'Cash' ? 'नकद (Cash)' : 'उधारी (Khata)'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptTarget(s)}
                          title="पक्का बिल प्रिंट करें (Print Kirana Cash Memo)"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-amber-700" />
                          पर्चा प्रिंट
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          title="बिक्री सुधारें (Edit sale)"
                          className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
        title={editingSale ? 'Edit Sale Record' : 'Record New Sale'}
        subtitle="Reduce stock and calculate estimated gross margins automatically"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sale Date *</label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit">Credit (Khata / Pending)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Bhai"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              />
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-1">
              <span>Products Sold</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-slate-900 font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const prod = products.find(p => p.id === item.product_id);
                return (
                  <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border border-slate-200 text-xs">
                    <div className="flex-1">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-200 rounded focus:outline-hidden"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.current_stock <= 0 && !editingSale}>
                            {p.name} (Available: {p.current_stock} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={prod ? prod.current_stock : undefined}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-200 rounded focus:outline-hidden text-right"
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="₹ Price"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-200 rounded focus:outline-hidden text-right"
                      />
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-slate-900 pr-1">
                      ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total & Profit Preview */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs px-1">
              <div>
                <span className="text-slate-500">Est. Gross Margin: </span>
                <span className="font-bold text-emerald-700 font-mono">+₹{currentEstProfit.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 mr-2">Total Sale:</span>
                <span className="text-sm font-bold text-slate-900 font-mono">₹{currentTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid via PhonePe UPI, home delivery"
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
              {isSubmitting ? 'Saving...' : editingSale ? 'Update Sale' : 'Complete Sale'}
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

