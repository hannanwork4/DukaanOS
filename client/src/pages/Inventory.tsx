import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  History,
  SlidersHorizontal,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Product, StockMovement } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../api/client';

interface InventoryProps {
  products: Product[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onRefresh, showToast }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('packets');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [minThreshold, setMinThreshold] = useState('5');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);

  // Stock Adjustment Modal State
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [newStockVal, setNewStockVal] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Stock Movements Drawer State
  const [movementTarget, setMovementTarget] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || (p.current_stock <= p.min_stock_threshold);
    return matchesSearch && matchesCat && matchesLowStock;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('General');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setUnit('packets');
    setSellingPrice('');
    setPurchasePrice('');
    setInitialStock('0');
    setMinThreshold('5');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setSku(p.sku || '');
    setUnit(p.unit);
    setSellingPrice(p.selling_price.toString());
    setPurchasePrice(p.purchase_price.toString());
    setInitialStock(p.current_stock.toString());
    setMinThreshold(p.min_stock_threshold.toString());
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    const sellP = parseFloat(sellingPrice);
    if (isNaN(sellP) || sellP <= 0) {
      setFormError('Selling price must be greater than zero.');
      return;
    }
    const purP = parseFloat(purchasePrice) || 0;
    const minT = parseFloat(minThreshold) || 0;

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: name.trim(),
          category: category.trim(),
          sku: sku.trim(),
          unit: unit.trim(),
          selling_price: sellP,
          purchase_price: purP,
          min_stock_threshold: minT
        });
        showToast('success', `Product "${name}" updated.`);
      } else {
        const initStock = parseFloat(initialStock) || 0;
        await api.createProduct({
          name: name.trim(),
          category: category.trim(),
          sku: sku.trim(),
          unit: unit.trim(),
          selling_price: sellP,
          purchase_price: purP,
          initial_stock: initStock,
          min_stock_threshold: minT
        });
        showToast('success', `Product "${name}" added to inventory.`);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    try {
      await api.deleteProduct(deleteProductTarget.id);
      showToast('success', `Product "${deleteProductTarget.name}" archived.`);
      setDeleteProductTarget(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete product');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const stockVal = parseFloat(newStockVal);
    if (isNaN(stockVal) || stockVal < 0) {
      showToast('error', 'Stock value cannot be negative.');
      return;
    }
    try {
      await api.adjustStock(adjustTarget.id, stockVal, adjustReason || 'Physical inventory audit');
      showToast('success', `Stock for "${adjustTarget.name}" updated to ${stockVal} ${adjustTarget.unit}.`);
      setAdjustTarget(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to adjust stock');
    }
  };

  const openMovementsDrawer = async (p: Product) => {
    setMovementTarget(p);
    setLoadingMovements(true);
    try {
      const data = await api.getProductMovements(p.id);
      setMovements(data);
    } catch (err: any) {
      showToast('error', 'Failed to load stock movements');
    } finally {
      setLoadingMovements(false);
    }
  };

  const totalInventoryVal = filteredProducts.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {products.length} products total • Current inventory valuation: ₹{Math.round(totalInventoryVal).toLocaleString('en-IN')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>Category: {c}</option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border transition-colors ${
              filterLowStockOnly
                ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${filterLowStockOnly ? 'text-red-600' : 'text-slate-400'}`} />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No products match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-medium">Product / SKU</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium text-right">Cost Price</th>
                  <th className="px-3 py-3 font-medium text-right">Selling Price</th>
                  <th className="px-3 py-3 font-medium text-right">Stock</th>
                  <th className="px-3 py-3 font-medium text-right">Stock Value</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.current_stock <= p.min_stock_threshold;
                  const stockValue = p.current_stock * p.purchase_price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        {p.sku && <div className="text-[10px] font-mono text-slate-400">{p.sku}</div>}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        ₹{p.purchase_price.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-medium text-slate-900">
                        ₹{p.selling_price.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                          {p.current_stock}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{p.unit}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        ₹{stockValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Low (min {p.min_stock_threshold})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setAdjustTarget(p);
                              setNewStockVal(p.current_stock.toString());
                              setAdjustReason('');
                            }}
                            title="Adjust physical stock count"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openMovementsDrawer(p)}
                            title="View stock movement history"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit product"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteProductTarget(p)}
                            title="Archive product"
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Manage product catalog and inventory safety limits"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {formError && (
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cooking Oil 1L, Fortune Sunflower Oil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Edible Oils, Staples"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
              >
                <option value="packets">packets</option>
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="bags">bags</option>
                <option value="pieces">pieces</option>
                <option value="boxes">boxes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="130"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cost / Purchase Price (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="100"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!editingProduct && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Opening Stock</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Min. Stock Alert Threshold</label>
              <input
                type="number"
                step="1"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">SKU / Code (optional)</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
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
              {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={Boolean(adjustTarget)}
        onClose={() => setAdjustTarget(null)}
        title={`Adjust Stock: ${adjustTarget?.name}`}
        subtitle="Supported physical stock adjustment with logged audit reason"
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
            <div className="text-slate-500">Current Recorded Stock:</div>
            <div className="text-base font-bold text-slate-900">
              {adjustTarget?.current_stock} {adjustTarget?.unit}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">New Physical Stock Count *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={newStockVal}
              onChange={(e) => setNewStockVal(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Adjustment</label>
            <input
              type="text"
              placeholder="e.g. Physical inventory count, damaged item, shelf audit"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-slate-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustTarget(null)}
              className="px-3 py-1.5 text-xs text-slate-700 border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800"
            >
              Update Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Movements History Modal */}
      <Modal
        isOpen={Boolean(movementTarget)}
        onClose={() => setMovementTarget(null)}
        title={`Stock Movements: ${movementTarget?.name}`}
        subtitle="Complete audit trail of stock inflows and outflows"
        maxWidth="max-w-2xl"
      >
        {loadingMovements ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading stock audit log...</div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No stock movements recorded for this item.</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {movements.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
                      m.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {m.type}
                    </span>
                    <span>{m.notes || 'Movement'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(m.created_at).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold ${m.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {movementTarget?.unit}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {m.stock_before} → {m.stock_after}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Archive / Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProduct}
        title="Archive Product"
        message={`Are you sure you want to archive "${deleteProductTarget?.name}"? Its historical transaction records will remain intact in the ledger.`}
        confirmText="Archive Product"
      />
    </div>
  );
};
