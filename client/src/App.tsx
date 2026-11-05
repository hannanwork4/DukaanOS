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
import { Profile } from './pages/Profile';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AuthModal } from './components/AuthModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ToastContainer, ToastMessage } from './components/Toast';
import { api, setActiveBusinessId } from './api/client';
import {
  Business,
  Product,
  Supplier,
  Purchase,
  Sale,
  Expense,
  TransactionRecord,
  DashboardSummary,
  BusinessInsight,
  User
} from './types';

const getTabFromLocation = (): string => {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  const validTabs = [
    'dashboard',
    'inventory',
    'purchases',
    'sales',
    'suppliers',
    'expenses',
    'transactions',
    'insights',
    'profile',
    'settings',
    'terms',
    'privacy'
  ];
  return validTabs.includes(hash) ? hash : 'dashboard';
};

export function App() {
  const [activeTab, setActiveTab] = useState<string>(getTabFromLocation);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync state with browser History API so browser Back / Forward buttons work
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    const targetHash = `#${newTab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ tab: newTab }, '', targetHash);
    }
  }, []);

  useEffect(() => {
    // Initial history entry setup if not present
    const initial = getTabFromLocation();
    setActiveTab(initial);
    if (!window.location.hash || window.location.hash === '#') {
      window.history.replaceState({ tab: initial }, '', `#${initial}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      const tabFromState = event.state?.tab;
      const targetTab = tabFromState || getTabFromLocation();
      setActiveTab(targetTab);
    };

    const handleHashChange = () => {
      setActiveTab(getTabFromLocation());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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

  // Auth States
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('dukaanos_token') : null;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

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

  const executeLogout = useCallback(() => {
    localStorage.removeItem('dukaanos_token');
    localStorage.removeItem('dukaanos_business_id');
    setAuthToken(null);
    setCurrentUser(null);
    setBusiness(null);
    setProducts([]);
    setSuppliers([]);
    setPurchases([]);
    setSales([]);
    setExpenses([]);
    setTransactions([]);
    setInsights([]);
    setActiveTab('overview');
    showToast('info', 'Logged out of store. Sign in required to access DukaanOS.');
  }, [showToast]);

  const handleLogout = useCallback(() => {
    setIsLogoutConfirmOpen(true);
  }, []);

  // Initial Authentication Verification
  useEffect(() => {
    const token = localStorage.getItem('dukaanos_token');
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    api.getAuthMe()
      .then((res: any) => {
        if (res?.user) {
          setCurrentUser(res.user);
          setBusiness(res.business);
          setAuthToken(token);
          loadAllData(false);
        } else {
          localStorage.removeItem('dukaanos_token');
          setAuthToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('dukaanos_token');
        setAuthToken(null);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [loadAllData]);

  // Derived notification items
  const lowStockItems = products
    .filter(p => Number(p.current_stock) <= Number(p.min_stock_threshold))
    .map(p => ({ id: p.id, name: p.name, current_stock: p.current_stock }));

  const pendingSuppliersList = suppliers
    .filter(s => Number(s.outstanding_balance) > 0)
    .map(s => ({ id: s.id, name: s.name, outstanding_balance: s.outstanding_balance }));

  // 1. Initial Auth Verification Loader
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0e0f11] flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 rounded-2xl bg-white text-black font-extrabold text-xl flex items-center justify-center shadow-2xl border-2 border-black animate-pulse mb-3">
          D
        </div>
        <div className="text-base font-bold text-white tracking-tight">DukaanOS</div>
        <div className="text-xs text-zinc-500 mt-1">Verifying store session...</div>
      </div>
    );
  }

  // 2. Authentication Gate: Required to log in before web opens
  if (!authToken || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0e0f11] flex flex-col items-center justify-center p-4 text-white relative">
        <AuthModal
          isOpen={true}
          isGate={true}
          initialMode="login"
          onClose={() => {}}
          onSuccess={(user, biz) => {
            setCurrentUser(user);
            setBusiness(biz);
            setAuthToken(localStorage.getItem('dukaanos_token'));
            loadAllData(false);
          }}
          showToast={showToast}
          onOpenDoc={(doc) => {
            handleTabChange(doc);
          }}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <Layout
      business={business}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={() => loadAllData(false)}
      isRefreshing={isRefreshing}
      onOpenAuth={() => setIsAuthOpen(true)}
      onLogout={handleLogout}
      lowStockItems={lowStockItems}
      pendingSuppliers={pendingSuppliersList}
      products={products}
      suppliers={suppliers}
      transactions={transactions}
    >
      {activeTab === 'dashboard' && (
        <Dashboard
          summary={summary}
          products={products}
          suppliers={suppliers}
          transactions={transactions}
          insights={insights}
          onNavigate={handleTabChange}
          onOpenQuickPurchase={() => handleTabChange('purchases')}
          onOpenQuickSale={() => handleTabChange('sales')}
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
          business={business}
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
          onNavigate={handleTabChange}
        />
      )}

      {activeTab === 'profile' && (
        <Profile
          business={business}
          user={currentUser}
          onRefresh={() => loadAllData(false)}
          showToast={showToast}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {activeTab === 'settings' && (
        <Settings
          business={business}
          onRefresh={() => loadAllData(false)}
          showToast={showToast}
          onNavigate={handleTabChange}
          onLogout={handleLogout}
        />
      )}

      {activeTab === 'terms' && (
        <TermsAndConditions
          onBack={() => handleTabChange('settings')}
        />
      )}

      {activeTab === 'privacy' && (
        <PrivacyPolicy
          onBack={() => handleTabChange('settings')}
        />
      )}

      {/* Authentication Modal (Login & Conversational Step-by-Step Onboarding) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user, biz) => {
          setCurrentUser(user);
          setBusiness(biz);
          setAuthToken(localStorage.getItem('dukaanos_token'));
          setIsAuthOpen(false);
          loadAllData(false);
        }}
        showToast={showToast}
        onOpenDoc={(doc) => {
          handleTabChange(doc);
          setIsAuthOpen(false);
        }}
      />

      {/* Logout Confirmation Dialog (Yes/No) */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={executeLogout}
        title="Confirm Logout"
        message="Do you want to log out?"
        confirmText="Yes"
        cancelText="No"
        isDestructive={true}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </Layout>
  );
}

export default App;
