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
    { id: 'dashboard', label: 'दुकान Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'सामान (Inventory)', icon: Package },
    { id: 'purchases', label: 'खरीद (Purchases)', icon: ShoppingBag },
    { id: 'sales', label: 'बिक्री (Sales)', icon: TrendingUp },
    { id: 'suppliers', label: 'व्यापारी (Suppliers)', icon: Truck },
    { id: 'expenses', label: 'खर्चे (Expenses)', icon: Receipt },
    { id: 'transactions', label: 'रोज़नामचा (Khata)', icon: FileSpreadsheet },
    { id: 'insights', label: 'दुकान विश्लेषण (Analytics)', icon: BarChart3 },
    { id: 'settings', label: 'सेटिंग्स (Settings)', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-amber-50/60 via-slate-50 to-amber-100/30 text-slate-900 font-sans">
      {/* 3D Glass Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel shrink-0 h-screen sticky top-0 z-20 border-r border-white/60">
        {/* Brand Header */}
        <div className="p-5 border-b border-amber-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-xl shadow-btn-3d border border-amber-300/40">
                द
              </div>
              <div>
                <div className="font-black text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                  DukaanOS
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60">
                    किराना
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-600 truncate max-w-[130px]">
                  {business?.name || 'Sharma General Store'}
                </div>
              </div>
            </div>
            <button
              onClick={onRefresh}
              title="Refresh ledger records"
              className="p-2 text-slate-600 hover:text-amber-800 bg-white/70 hover:bg-amber-100/70 rounded-xl transition-all shadow-xs border border-white/70"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>

          {/* Clean Greeting */}
          <div className="mt-3.5 pt-2.5 border-t border-amber-200/40 flex items-center justify-between text-[11px]">
            <span className="text-slate-800 font-bold flex items-center gap-1">
              नमस्ते, {business?.owner_name || 'Rajesh'} ji
            </span>
            <span className="text-[10px] font-bold text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/60 shadow-2xs">
              दुकान खुली है
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-btn-3d -translate-y-0.5'
                    : 'text-slate-700 hover:bg-amber-50/70 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-700'}`} />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 3D Store Summary Footer (No AI symbols) */}
        <div className="p-3.5 m-3 rounded-2xl glass-panel border border-amber-200/60">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1.5 font-bold text-slate-900">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              दुकान बहीखाता
            </span>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.2 rounded-full border border-amber-300/60">
              सक्रिय
            </span>
          </div>
          <p className="text-[10px] text-slate-600 leading-snug">
            सभी लेन-देन और स्टॉक तुरंत सुरक्षित खाते में दर्ज होते हैं।
          </p>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 glass-panel sticky top-0 z-30 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-sm shadow-btn-3d">
            द
          </div>
          <div>
            <div className="font-black text-sm text-slate-900">DukaanOS</div>
            <div className="text-[10px] text-slate-600 font-medium truncate max-w-[140px]">
              {business?.name || 'Sharma General Store'}
            </div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-slate-700 bg-white/80 hover:bg-amber-50 rounded-xl transition-colors border border-amber-200/60 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/60 z-40 flex items-center justify-around py-2 px-1 shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-all ${
                isActive ? 'text-amber-700 font-black scale-105' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split('(')[0].trim()}</span>
            </button>
          );
        })}
        <button
          onClick={() => onTabChange('insights')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-all ${
            activeTab === 'insights' ? 'text-amber-700 font-black' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
