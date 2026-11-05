import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Purchases } from './pages/Purchases';
import { Sales } from './pages/Sales';
import { Suppliers } from './pages/Suppliers';
import { Expenses } from './pages/Expenses';
import { Transactions } from './pages/Transactions';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { ToastContainer, ToastMessage } from './components/Toast';
import { api } from './api/client';
import {
  Business,
  Product,
  Supplier,
  Purchase,
  Sale,
  Expense,
  TransactionRecord,
  DashboardSummary,
  BusinessInsight
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Core Data States
  const [business, setBusiness] = useState<Business | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadAllData = useCallback(async (isInitial = false) => {
    setIsRefreshing(true);
    try {
      const [
        bizData,
        sumData,
        prodData,
        supData,
        purData,
        salData,
        expData,
        txData,
        insData
      ] = await Promise.all([
        api.getBusiness(),
        api.getDashboardSummary(),
        api.getProducts(),
        api.getSuppliers(),
        api.getPurchases(),
        api.getSales(),
        api.getExpenses(),
        api.getTransactions(),
        api.getBusinessInsights()
      ]);

      setBusiness(bizData);
      setSummary(sumData);
      setProducts(prodData);
      setSuppliers(supData);
      setPurchases(purData);
      setSales(salData);
      setExpenses(expData);
      setTransactions(txData);
      setInsights(insData);

      if (!isInitial) {
        showToast('info', 'Database records refreshed.');
      }
    } catch (err: any) {
      console.error('Error fetching DukaanOS data:', err);
      showToast('error', `Failed to load data: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllData(true);
  }, [loadAllData]);

  return (
    <Layout
      business={business}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={() => loadAllData(false)}
      isRefreshing={isRefreshing}
    >
      {activeTab === 'dashboard' && (
        <Dashboard
          summary={summary}
          onNavigate={setActiveTab}
          onOpenQuickPurchase={() => setActiveTab('purchases')}
          onOpenQuickSale={() => setActiveTab('sales')}
        />
      )}

      {activeTab === 'inventory' && (
        <Inventory
          products={products}
          onRefresh={() => loadAllData(false)}
          showToast={showToast}
        />
      )}

      {activeTab === 'purchases' && (
        <Purchases
          purchases={purchases}
          suppliers={suppliers}
          products={products}
          onRefresh={() => loadAllData(false)}
          showToast={showToast}
        />
      )}

      {activeTab === 'sales' && (
        <Sales
          sales={sales}
          products={products}
          onRefresh={() => loadAllData(false)}
          showToast={showToast}
        />
      )}

      {activeTab === 'suppliers' && (
        <Suppliers
          suppliers={suppliers}
          onRefresh={() => loadAllData(false)}
          showToast={showToast}
        />
      )}

      {activeTab === 'expenses' && (
        <Expenses
          expenses={expenses}
          onRefresh={() => loadAllData(false)}
          showToast={showToast}
        />
      )}

      {activeTab === 'transactions' && (
        <Transactions
          transactions={transactions}
          onRefresh={() => loadAllData(false)}
        />
      )}

      {activeTab === 'insights' && (
        <Insights
          insights={insights}
          onRefresh={() => loadAllData(false)}
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'settings' && (
        <Settings
          business={business}
          onRefresh={() => loadAllData(false)}
          showToast={showToast}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </Layout>
  );
}

export default App;
