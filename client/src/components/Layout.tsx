import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Boxes,
  ShoppingCart,
  Tag,
  Users,
  Receipt,
  BookOpen,
  BarChart3,
  Settings,
  Store,
  ChevronDown,
  Search,
  Bell,
  RefreshCw,
  User as UserIcon,
  LogOut,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  X,
  MoreHorizontal
} from 'lucide-react';
import { Business, Product, Supplier, TransactionRecord } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface LayoutProps {
  business: Business | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  isDemo?: boolean;
  lowStockItems?: { id: string; name: string; current_stock: number }[];
  pendingSuppliers?: { id: string; name: string; outstanding_balance: number }[];
  products?: Product[];
  suppliers?: Supplier[];
  transactions?: TransactionRecord[];
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  business,
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  onOpenAuth,
  onLogout,
  isDemo = false,
  lowStockItems = [],
  pendingSuppliers = [],
  products = [],
  suppliers = [],
  transactions = [],
  children
}) => {
  const { t } = useTranslation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchTrimmed = globalSearch.trim().toLowerCase();

  const matchedProducts = searchTrimmed
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchTrimmed) ||
            (p.sku && p.sku.toLowerCase().includes(searchTrimmed)) ||
            (p.category && p.category.toLowerCase().includes(searchTrimmed))
        )
        .slice(0, 4)
    : [];

  const matchedSuppliers = searchTrimmed
    ? suppliers
        .filter(
          (s) =>
            s.name.toLowerCase().includes(searchTrimmed) ||
            (s.business_name && s.business_name.toLowerCase().includes(searchTrimmed)) ||
            (s.phone && s.phone.includes(searchTrimmed))
        )
        .slice(0, 3)
    : [];

  const matchedTransactions = searchTrimmed
    ? transactions
        .filter(
          (tx) =>
            tx.description.toLowerCase().includes(searchTrimmed) ||
            tx.type.toLowerCase().includes(searchTrimmed) ||
            (tx.payment_method && tx.payment_method.toLowerCase().includes(searchTrimmed))
        )
        .slice(0, 3)
    : [];

  const hasSearchResults =
    matchedProducts.length > 0 || matchedSuppliers.length > 0 || matchedTransactions.length > 0;

  const navItems = [
    { id: 'dashboard', label: t('overview'), icon: Home },
    { id: 'inventory', label: t('inventory'), icon: Boxes },
    { id: 'purchases', label: t('purchases'), icon: ShoppingCart },
    { id: 'sales', label: t('sales'), icon: Tag },
    { id: 'suppliers', label: t('suppliers'), icon: Users },
    { id: 'expenses', label: t('expenses'), icon: Receipt },
    { id: 'transactions', label: t('ledger'), icon: BookOpen },
    { id: 'insights', label: t('analytics'), icon: BarChart3 },
    { id: 'profile', label: t('profile'), icon: UserIcon },
    { id: 'settings', label: t('settings'), icon: Settings }
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'AS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const totalNotifications = lowStockItems.length + pendingSuppliers.length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8f9fa] text-zinc-900 font-sans">
      {/* Desktop Sidebar (Dark Charcoal/Black #0e0f11) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0e0f11] text-white shrink-0 h-screen sticky top-0 z-30 border-r border-zinc-800/80 justify-between select-none">
        <div className="p-4 flex flex-col min-h-0">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-1 pb-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center border border-zinc-700">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white leading-none">
                DukaanOS
              </div>
              <div className="text-[11px] text-zinc-400 font-medium mt-1">
                {t('dukaanOS_tagline')}
              </div>
            </div>
          </div>

          {/* Store Selector Dropdown Card (Clickable to open Profile) */}
          <div
            onClick={() => onTabChange('profile')}
            className="bg-[#17181c] border border-zinc-800 rounded-xl p-3 my-2 flex items-center justify-between cursor-pointer hover:border-zinc-700 hover:bg-[#1c1d22] transition-all"
            title="Click to view & edit Store Details"
          >
            <div className="min-w-0 pr-2">
              <div className="font-bold text-xs text-white truncate">
                {business?.name || 'Sri Venkateshwara Store'}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>{business?.address?.split(',')[0] || 'Visakhapatnam'}</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
          </div>

          {/* Navigation Items */}
          <nav className="mt-3 space-y-1 overflow-y-auto flex-1 pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all cursor-pointer font-medium ${
                    isActive
                      ? 'bg-[#1a1b1f] text-white font-semibold border-l-2 border-emerald-500 shadow-xs'
                      : 'text-zinc-400 hover:text-white hover:bg-[#151619]'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span className="tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer (Interactive Dropdown Menu) */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#0e0f11] relative" ref={profileMenuRef}>
          {isDemo ? (
            <div className="space-y-2">
              <div className="px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">Demo Store View</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{business?.name || 'Sri Venkateshwara Store'}</p>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full py-2.5 px-3 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs rounded-xl transition-all shadow-btn-3d flex items-center justify-center gap-2 cursor-pointer border border-black hover:-translate-y-0.5 active:translate-y-0"
              >
                <Store className="w-3.5 h-3.5 text-black" />
                <span>Sign In / Create Store</span>
              </button>
            </div>
          ) : (
            <>
              {isProfileMenuOpen && (
                <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#17181c] border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 text-white animate-fade-in">
                  <div className="px-3 py-2 border-b border-zinc-800/80">
                    <div className="text-xs font-bold text-white truncate">{business?.owner_name || 'Store Owner'}</div>
                    <div className="text-[11px] text-zinc-400 truncate">{business?.name || 'DukaanOS'}</div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onTabChange('profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>{t('storeOwnerProfile')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onTabChange('settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{t('storeSettings')}</span>
                    </button>

                    {onOpenAuth && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>{t('switchStore')}</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('logOut')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#17181c] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(business?.owner_name || 'Abdul Hannan')}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate">
                      {business?.owner_name || 'Abdul Hannan'}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex flex-col bg-[#0e0f11] text-white sticky top-0 z-40 border-b border-zinc-800">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('profile')}>
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="font-bold text-xs text-white">DukaanOS</div>
              <div className="text-[10px] text-zinc-400 truncate max-w-[110px]">
                {business?.name || 'Store'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isDemo && onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-black font-extrabold text-[11px] rounded-lg border border-black cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            )}

            {/* Mobile Search Toggle */}
            <button
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                setIsNotificationsOpen(false);
              }}
              className={`p-1.5 rounded-xl transition-colors ${
                isMobileSearchOpen ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mobile Notification Bell */}
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsMobileSearchOpen(false);
              }}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl relative"
              title="Alerts"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 border-2 border-[#0e0f11]"></span>
              )}
            </button>

            {/* Mobile Language Selector */}
            <LanguageSelector isDark={true} />

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/60 rounded-xl"
              title="Refresh records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Search Input Dropdown Bar */}
        {isMobileSearchOpen && (
          <div className="px-3.5 pb-2.5 pt-0.5 animate-fade-in relative">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                autoFocus
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#17181c] border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Search Results */}
            {searchTrimmed.length > 0 && (
              <div className="absolute left-3.5 right-3.5 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-black overflow-hidden z-50 text-zinc-900 max-h-80 overflow-y-auto">
                {!hasSearchResults ? (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    No matching records found.
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
                    {/* Products */}
                    {matchedProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onTabChange('inventory');
                          setIsMobileSearchOpen(false);
                          setGlobalSearch('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-zinc-900">{p.name}</div>
                          <div className="text-[10px] text-zinc-500">{p.current_stock} in stock</div>
                        </div>
                        <div className="font-bold font-mono">₹{p.selling_price.toFixed(2)}</div>
                      </div>
                    ))}

                    {/* Suppliers */}
                    {matchedSuppliers.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onTabChange('suppliers');
                          setIsMobileSearchOpen(false);
                          setGlobalSearch('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 flex items-center justify-between text-xs cursor-pointer border-t border-zinc-100"
                      >
                        <div>
                          <div className="font-bold text-zinc-900">{s.name}</div>
                          <div className="text-[10px] text-zinc-500">{s.phone || 'Supplier'}</div>
                        </div>
                        <div
                          className={`font-bold font-mono text-[11px] ${
                            s.outstanding_balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {s.outstanding_balance > 0 ? `Due: ₹${s.outstanding_balance}` : 'Settled'}
                        </div>
                      </div>
                    ))}

                    {/* Transactions */}
                    {matchedTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => {
                          onTabChange('transactions');
                          setIsMobileSearchOpen(false);
                          setGlobalSearch('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 flex items-center justify-between text-xs cursor-pointer border-t border-zinc-100"
                      >
                        <div className="truncate max-w-[180px]">
                          <div className="font-medium text-zinc-900 truncate">{tx.description}</div>
                          <div className="text-[10px] text-zinc-500">{tx.payment_method}</div>
                        </div>
                        <div
                          className={`font-bold font-mono ${
                            tx.type === 'sale' ? 'text-emerald-600' : 'text-zinc-900'
                          }`}
                        >
                          {tx.type === 'sale' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8">
        {/* Top Header Search, Language & Notifications Bar (Black Background) */}
        <div className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3.5 bg-[#0e0f11] border-b border-zinc-800/90 sticky top-0 z-20">
          <div className="relative w-full max-w-md" ref={searchContainerRef}>
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              ref={searchInputRef}
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-16 py-2 bg-[#17181c] hover:bg-[#1e1f25] focus:bg-[#1e1f25] text-xs border border-zinc-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-zinc-600 transition-all text-white placeholder-zinc-500 font-medium"
            />
            <div className="absolute right-3 top-2.5 flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800/90 rounded border border-zinc-700 select-none">
                Ctrl K
              </kbd>
            </div>

            {/* Instant Search Results Dropdown */}
            {isSearchOpen && searchTrimmed.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-black overflow-hidden z-50 animate-fade-in text-zinc-900 max-h-96 overflow-y-auto">
                {!hasSearchResults ? (
                  <div className="p-6 text-center text-xs text-zinc-400">
                    No matching products, suppliers, or transactions found.
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {/* Products */}
                    {matchedProducts.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Boxes className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Products</span>
                        </div>
                        <div className="space-y-0.5">
                          {matchedProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                onTabChange('inventory');
                                setIsSearchOpen(false);
                                setGlobalSearch('');
                              }}
                              className="px-3 py-2 rounded-xl hover:bg-zinc-100 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div>
                                <div className="text-xs font-bold text-zinc-900">{p.name}</div>
                                <div className="text-[11px] text-zinc-500">
                                  {p.category || 'General'} • SKU: {p.sku}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-black font-mono">₹{p.selling_price.toFixed(2)}</div>
                                <div className="text-[11px] text-zinc-500">{p.current_stock} in stock</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suppliers */}
                    {matchedSuppliers.length > 0 && (
                      <div className="pt-1 border-t border-zinc-100">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Suppliers</span>
                        </div>
                        <div className="space-y-0.5">
                          {matchedSuppliers.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                onTabChange('suppliers');
                                setIsSearchOpen(false);
                                setGlobalSearch('');
                              }}
                              className="px-3 py-2 rounded-xl hover:bg-zinc-100 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div>
                                <div className="text-xs font-bold text-zinc-900">{s.name}</div>
                                <div className="text-[11px] text-zinc-500">{s.business_name || s.phone || 'Supplier'}</div>
                              </div>
                              <div className="text-right">
                                {s.outstanding_balance > 0 ? (
                                  <div className="text-xs font-bold text-rose-600 font-mono">
                                    Due: ₹{s.outstanding_balance.toFixed(2)}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-emerald-600 font-semibold">Settled</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ledger Transactions */}
                    {matchedTransactions.length > 0 && (
                      <div className="pt-1 border-t border-zinc-100">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Ledger Transactions</span>
                        </div>
                        <div className="space-y-0.5">
                          {matchedTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              onClick={() => {
                                onTabChange('transactions');
                                setIsSearchOpen(false);
                                setGlobalSearch('');
                              }}
                              className="px-3 py-2 rounded-xl hover:bg-zinc-100 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div className="max-w-[240px] truncate">
                                <div className="text-xs font-semibold text-zinc-900 truncate">{tx.description}</div>
                                <div className="text-[11px] text-zinc-500">{new Date(tx.date).toLocaleDateString()} • {tx.payment_method}</div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xs font-bold font-mono ${tx.type === 'sale' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                                  {tx.type === 'sale' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isDemo && onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-100 text-black font-extrabold text-xs rounded-xl border border-black shadow-btn-3d transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                <Store className="w-3.5 h-3.5 text-black" />
                <span>Sign In to Store</span>
              </button>
            )}

            {/* Desktop Language Selector Dropdown */}
            <LanguageSelector isDark={true} />

            <button
              onClick={onRefresh}
              title="Refresh store records"
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Notification Bell with Real Popover */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                title="Notifications"
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {totalNotifications > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 border-2 border-[#0e0f11]"></span>
                )}
              </button>

              {/* Real Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-black overflow-hidden z-50 animate-fade-in text-zinc-900">
                  <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <div className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                      <span>{t('liveAlerts')}</span>
                      {totalNotifications > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black text-white font-mono">
                          {totalNotifications}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                    {totalNotifications === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        <CheckCircle2 className="w-8 h-8 text-black mx-auto mb-2" />
                        <div>{t('allClear')}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{t('allClearSub')}</div>
                      </div>
                    ) : (
                      <>
                        {/* Real Low Stock Notifications */}
                        {lowStockItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              onTabChange('inventory');
                            }}
                            className="p-3 hover:bg-zinc-50 transition-colors cursor-pointer flex items-start gap-2.5"
                          >
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-zinc-900 truncate">
                                {t('lowStockLabel')}: {item.name}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {item.current_stock} {t('unitsLeft')}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Real Supplier Dues Notifications */}
                        {pendingSuppliers.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              onTabChange('suppliers');
                            }}
                            className="p-3 hover:bg-zinc-50 transition-colors cursor-pointer flex items-start gap-2.5"
                          >
                            <CreditCard className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-zinc-900 truncate">
                                {t('duePendingLabel')}: {s.name}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                ₹{Number(s.outstanding_balance).toLocaleString('en-IN')} {t('outstanding')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0e0f11] text-white border-t border-zinc-800 z-40 flex items-center justify-around py-1.5 px-1 shadow-lg">
        <button
          onClick={() => {
            setIsMobileMoreOpen(false);
            onTabChange('dashboard');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[11px] font-semibold transition-all ${
            activeTab === 'dashboard' ? 'text-white font-bold scale-105' : 'text-zinc-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{t('overview')}</span>
        </button>

        <button
          onClick={() => {
            setIsMobileMoreOpen(false);
            onTabChange('sales');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[11px] font-semibold transition-all ${
            activeTab === 'sales' ? 'text-white font-bold scale-105' : 'text-zinc-400'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>{t('sales')}</span>
        </button>

        <button
          onClick={() => {
            setIsMobileMoreOpen(false);
            onTabChange('inventory');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[11px] font-semibold transition-all ${
            activeTab === 'inventory' ? 'text-white font-bold scale-105' : 'text-zinc-400'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>{t('inventory')}</span>
        </button>

        <button
          onClick={() => {
            setIsMobileMoreOpen(false);
            onTabChange('purchases');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[11px] font-semibold transition-all ${
            activeTab === 'purchases' ? 'text-white font-bold scale-105' : 'text-zinc-400'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t('purchases')}</span>
        </button>

        <button
          onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[11px] font-semibold transition-all ${
            isMobileMoreOpen || ['suppliers', 'expenses', 'transactions', 'insights', 'profile', 'settings'].includes(activeTab)
              ? 'text-white font-bold scale-105'
              : 'text-zinc-400'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>{t('more')}</span>
        </button>
      </nav>

      {/* Mobile "More" Slide-up Drawer */}
      {isMobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="fixed inset-0" onClick={() => setIsMobileMoreOpen(false)} />
          <div className="relative bg-[#17181c] text-white rounded-t-3xl border-t border-zinc-800 p-5 space-y-3 z-10 animate-slide-up max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">All Modules & Settings</span>
              <button onClick={() => setIsMobileMoreOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'suppliers', label: t('suppliers'), icon: Users },
                { id: 'expenses', label: t('expenses'), icon: Receipt },
                { id: 'transactions', label: t('ledger'), icon: BookOpen },
                { id: 'insights', label: t('analytics'), icon: BarChart3 },
                { id: 'profile', label: t('profile'), icon: UserIcon },
                { id: 'settings', label: t('settings'), icon: Settings }
              ].map((m) => {
                const Icon = m.icon;
                const isCur = activeTab === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setIsMobileMoreOpen(false);
                      onTabChange(m.id);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold border transition-all text-left ${
                      isCur
                        ? 'bg-white text-black border-white'
                        : 'bg-[#1f2026] text-zinc-200 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {(onOpenAuth || onLogout) && (
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                {onOpenAuth && (
                  <button
                    onClick={() => {
                      setIsMobileMoreOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-emerald-400"
                  >
                    <Store className="w-4 h-4" />
                    <span>{t('switchStore')}</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={() => {
                      setIsMobileMoreOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-rose-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logOut')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
