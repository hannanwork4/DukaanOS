import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  TrendingUp,
  Truck,
  Receipt,
  FileSpreadsheet,
  Lightbulb,
  Settings,
  Store,
  RefreshCw,
  Cpu,
  Sparkles,
  HeartHandshake
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
    { id: 'inventory', label: 'Inventory / सामान', icon: Package },
    { id: 'purchases', label: 'Purchases / खरीद', icon: ShoppingBag },
    { id: 'sales', label: 'Sales / बिक्री', icon: TrendingUp },
    { id: 'suppliers', label: 'Suppliers / व्यापारी', icon: Truck },
    { id: 'expenses', label: 'Expenses / खर्चे', icon: Receipt },
    { id: 'transactions', label: 'Khata / हिसाब-किताब', icon: FileSpreadsheet },
    { id: 'insights', label: 'Smart Insights', icon: Lightbulb },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-amber-200/60 bg-white/95 backdrop-blur-md shrink-0 h-screen sticky top-0 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-amber-100/80 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/25 border border-amber-300">
                द
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-800 via-orange-800 to-amber-900 bg-clip-text text-transparent flex items-center gap-1">
                  DukaanOS
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    Retail
                  </span>
                </div>
                <div className="text-[11px] font-medium text-amber-900/80 truncate max-w-[130px]">
                  {business?.name || 'Sharma General Store'}
                </div>
              </div>
            </div>
            <button
              onClick={onRefresh}
              title="Refresh database records"
              className="p-1.5 text-amber-700/60 hover:text-amber-900 hover:bg-amber-100/60 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>

          {/* Warm auspicious greeting */}
          <div className="mt-3.5 pt-2.5 border-t border-amber-200/50 flex items-center justify-between text-[11px]">
            <span className="text-amber-900 font-semibold flex items-center gap-1">
              <span className="text-orange-500">🙏</span> नमस्ते, {business?.owner_name || 'Rajesh'} ji!
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 translate-x-1'
                    : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-600/80'}`} />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Claude MCP Banner Footer */}
        <div className="p-3.5 m-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1.5 font-bold text-emerald-950">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              Claude AI Voice & Photo
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white shadow-xs">
              LIVE
            </span>
          </div>
          <p className="text-[10px] text-emerald-800 leading-snug">
            Speak in Hindi/English or photo bills to restock shelves automatically.
          </p>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-amber-200/80 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            द
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900">DukaanOS</div>
            <div className="text-[10px] text-amber-800 font-medium truncate max-w-[140px]">
              {business?.name || 'Sharma General Store'}
            </div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-amber-200 z-40 flex items-center justify-around py-2 px-1 shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-semibold transition-all ${
                isActive ? 'text-orange-600 font-bold scale-105' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split('/')[0].trim()}</span>
            </button>
          );
        })}
        <button
          onClick={() => onTabChange('insights')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-semibold transition-all ${
            activeTab === 'insights' ? 'text-orange-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
