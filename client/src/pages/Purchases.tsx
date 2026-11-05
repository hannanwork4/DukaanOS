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
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Purchase Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log inventory restocks from suppliers. Increases stock and tracks dues.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Record Purchase
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by supplier or purchased item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-slate-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {filteredPurchases.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No purchase records found. Record a purchase to restock inventory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-medium">Date / ID</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 font-medium">Items Purchased</th>
                  <th className="px-3 py-3 font-medium text-right">Total Amount</th>
                  <th className="px-3 py-3 font-medium text-right">Paid</th>
                  <th className="px-3 py-3 font-medium text-right">Outstanding</th>
                  <th className="px-3 py-3 font-medium text-center">Payment Mode</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {new Date(p.purchase_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        #{p.id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-900">
                      {p.supplier_name || 'Unknown Supplier'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <div className="max-w-xs space-y-0.5">
                        {(p.items || []).map((it, idx) => (
                          <div key={idx} className="text-[11px] truncate">
                            <span className="font-semibold text-slate-800">{it.quantity}x</span> {it.product_name}
                            <span className="text-slate-400 font-mono ml-1">(@ ₹{it.unit_price})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{p.total_amount.toFixed(2)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-emerald-700">
                      ₹{p.amount_paid.toFixed(2)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      {p.outstanding_amount > 0 ? (
                        <span className="font-bold text-amber-600">
                          ₹{p.outstanding_amount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {p.payment_method}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit purchase (reverses and recalculates inventory)"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
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
        title={editingPurchase ? 'Edit Purchase Record' : 'Record New Purchase'}
        subtitle={editingPurchase ? 'Editing will reverse previous inventory & supplier balances before applying updates' : 'Add inventory and track supplier payment'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Supplier *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.business_name ? `(${s.business_name})` : ''} — Due: ₹{s.outstanding_balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              />
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-1">
              <span>Purchased Products</span>
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
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border border-slate-200 text-xs">
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full p-1.5 text-xs border border-slate-200 rounded focus:outline-hidden"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.current_stock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
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
              ))}
            </div>

            {/* Total Row */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-900 px-1">
              <span>Total Purchase Value</span>
              <span className="text-sm font-mono">₹{currentTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Amount Paid Upfront (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={currentTotal}
                placeholder="Amount paid"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500 bg-white"
              />
              <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                <span>Remaining Pending:</span>
                <span className="font-mono font-bold text-amber-600">₹{currentOutstanding.toFixed(2)}</span>
              </div>
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
                <option value="Credit">Credit (Full Due)</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Bill Invoice No. (optional)</label>
            <input
              type="text"
              placeholder="e.g. Invoice #9821, Delivery received via tempo"
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
              {isSubmitting ? 'Saving...' : editingPurchase ? 'Update Purchase' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
