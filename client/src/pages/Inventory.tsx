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
import { useTranslation } from '../i18n/LanguageContext';

interface InventoryProps {
  products: Product[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onRefresh, showToast }) => {
  const { t } = useTranslation();
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            {t('inventoryTitle')}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {products.length} {t('units')} • {t('inventoryValue')}: <span className="font-bold text-black tabular-nums">₹{Math.round(totalInventoryVal).toLocaleString('en-IN')}</span>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          {t('addNewProduct')}
        </button>
      </div>

      {/* 3D Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between glass-panel p-4 rounded-2xl border border-black shadow-card-3d">
        <div className="flex-1 relative">
          <Search className="w-4.5 h-4.5 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={t('searchProductPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-black rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm bg-white border border-black rounded-xl px-3.5 py-2.5 font-semibold text-zinc-800 focus:outline-hidden focus:border-black"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? t('allCategories') : c}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-black transition-all cursor-pointer font-semibold ${
              filterLowStockOnly
                ? 'bg-black text-white shadow-xs'
                : 'bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${filterLowStockOnly ? 'text-white' : 'text-zinc-400'}`} />
            {t('lowStockOnly')}
          </button>
        </div>
      </div>

      {/* 3D Glass Products Table */}
      <div className="glass-panel rounded-3xl border border-black shadow-card-3d overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-400">
            {t('noItemsBelowThreshold')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-4 font-bold">{t('productNameCol')}</th>
                  <th className="px-4 py-4 font-bold">{t('categoryCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('purchasePriceCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('sellingPriceCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('currentStockCol')}</th>
                  <th className="px-4 py-4 font-bold text-right">{t('inventoryValue')}</th>
                  <th className="px-4 py-4 font-bold text-center">{t('statusCol')}</th>
                  <th className="px-5 py-4 font-bold text-right">{t('actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {filteredProducts.map((p) => {
                  const isLow = p.current_stock <= p.min_stock_threshold;
                  const stockValue = p.current_stock * p.purchase_price;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm text-black">{p.name}</div>
                        {p.sku && <div className="text-xs font-mono text-zinc-400">{p.sku}</div>}
                      </td>
                      <td className="px-4 py-4 text-zinc-600">
                        <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 font-medium text-xs border border-zinc-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-sm text-zinc-500">
                        ₹{p.purchase_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums font-bold text-sm text-black">
                        ₹{p.selling_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums">
                        <span className={`font-bold text-sm ${isLow ? 'text-black underline' : 'text-black'}`}>
                          {p.current_stock}
                        </span>
                        <span className="text-xs text-zinc-500 ml-1">{p.unit}</span>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums font-semibold text-sm text-zinc-800">
                        ₹{stockValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 text-white">
                            {t('lowStockStatus')} (min {p.min_stock_threshold})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                            {t('inStockStatus')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustTarget(p);
                              setNewStockVal(p.current_stock.toString());
                              setAdjustReason('');
                            }}
                            title="Adjust physical stock"
                            className="p-2 rounded-xl text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                          >
                            <SlidersHorizontal className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => openMovementsDrawer(p)}
                            title="Movement history"
                            className="p-2 rounded-xl text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                          >
                            <History className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit product"
                            className="p-2 rounded-xl text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => setDeleteProductTarget(p)}
                            title="Archive product"
                            className="p-2 rounded-xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
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
        title={editingProduct ? t('editProduct') : t('addNewProduct')}
        subtitle={t('inventorySubtitle')}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('productNameLabel')} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cooking Oil 1L, Fortune Sunflower Oil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('categoryCol')}</label>
              <input
                type="text"
                placeholder="e.g. Edible Oils, Staples"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('unitLabel')}</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
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

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('sellingPriceCol')} (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="130"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('purchasePriceCol')} (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="100"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {!editingProduct && (
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('initialStockLabel')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black font-mono"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('minStockLabel')}</label>
              <input
                type="number"
                step="1"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">{t('skuLabel')}</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
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
              {isSubmitting ? '...' : editingProduct ? t('saveChangesBtn') : t('saveProductBtn')}
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
          <div className="p-3.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm space-y-1">
            <div className="text-zinc-500">Current Recorded Stock:</div>
            <div className="text-lg font-bold text-black font-mono">
              {adjustTarget?.current_stock} {adjustTarget?.unit}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">New Physical Stock Count *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={newStockVal}
              onChange={(e) => setNewStockVal(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Reason for Adjustment</label>
            <input
              type="text"
              placeholder="e.g. Physical inventory count, damaged item, shelf audit"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setAdjustTarget(null)}
              className="px-4 py-2 text-sm font-semibold text-zinc-700 border border-zinc-300 rounded-xl hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-zinc-800 shadow-btn-3d"
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
          <div className="p-8 text-center text-sm text-zinc-400">Loading stock audit log...</div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">No stock movements recorded for this item.</div>
        ) : (
          <div className="divide-y divide-zinc-200 max-h-96 overflow-y-auto">
            {movements.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold text-black flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs uppercase font-mono font-bold ${
                      m.quantity > 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                    }`}>
                      {m.type}
                    </span>
                    <span>{m.notes || 'Movement'}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {new Date(m.created_at).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold text-sm ${m.quantity > 0 ? 'text-black' : 'text-zinc-600'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {movementTarget?.unit}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">
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

