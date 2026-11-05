import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  TrendingUp,
  Truck,
  Receipt,
  FileSpreadsheet,
  BarChart3,
  Settings,
  RefreshCw,
  Store
} from 'lucide-react';
import { Business } from '../types';

interface LayoutProps {
  business: Business | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  business,
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  children
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'transactions', label: 'Store Ledger', icon: FileSpreadsheet },
    { id: 'insights', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 text-zinc-900 font-sans">
      {/* 3D Glass Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel shrink-0 h-screen sticky top-0 z-20 border-r border-zinc-200">
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-btn-3d border border-zinc-800">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight text-black flex items-center gap-1.5">
                  DukaanOS
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                    Retail
                  </span>
                </div>
                <div className="text-[11px] font-medium text-zinc-500 truncate max-w-[130px]">
                  {business?.name || 'Kirana Retail Store'}
                </div>
              </div>
            </div>
            <button
              onClick={onRefresh}
              title="Refresh records"
              className="p-2 text-zinc-500 hover:text-black bg-white hover:bg-zinc-100 rounded-xl transition-all shadow-xs border border-zinc-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-black' : ''}`} />
            </button>
          </div>

          {/* Store Status Indicator */}
          <div className="mt-3.5 pt-2.5 border-t border-zinc-200/60 flex items-center justify-between text-[11px]">
            <span className="text-zinc-600 font-medium">
              {business?.owner_name || 'Store Manager'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-black border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
              Store Active
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-btn-3d -translate-y-0.5'
                    : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-black'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Store Ledger Summary Footer */}
        <div className="p-3.5 m-3 rounded-2xl glass-panel border border-zinc-200">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold text-black">Audit Ledger</span>
            <span className="text-[10px] font-medium text-zinc-500">Live</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-snug">
            All inventory, sales and supplier dues are synchronized deterministically.
          </p>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 glass-panel sticky top-0 z-30 border-b border-zinc-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shadow-btn-3d">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-black">DukaanOS</div>
            <div className="text-[10px] text-zinc-500 font-medium truncate max-w-[140px]">
              {business?.name || 'Retail Store'}
            </div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-zinc-700 bg-white hover:bg-zinc-100 rounded-xl transition-colors border border-zinc-200 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-black' : ''}`} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-zinc-200 z-40 flex items-center justify-around py-2 px-1 shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-semibold transition-all ${
                isActive ? 'text-black font-bold scale-105' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => onTabChange('insights')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-semibold transition-all ${
            activeTab === 'insights' ? 'text-black font-bold' : 'text-zinc-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
