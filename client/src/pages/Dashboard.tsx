import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Truck,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { TrendChart } from '../components/TrendChart';

interface DashboardProps {
  summary: DashboardSummary | null;
  onNavigate: (tab: string) => void;
  onOpenQuickSale: () => void;
  onOpenQuickPurchase: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  onNavigate,
  onOpenQuickSale,
  onOpenQuickPurchase
}) => {
  if (!summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded-xl w-48"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 glass-panel rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const isBrandNewShop = 
    summary.today_sales === 0 &&
    summary.today_purchases === 0 &&
    summary.today_expenses === 0 &&
    summary.total_inventory_value === 0 &&
    summary.recent_transactions.length === 0;

  return (
    <div className="space-y-6">
      {/* 3D Glass Hero Banner (Monochrome Black & White) */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-zinc-200/80 shadow-card-3d bg-white/90">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
              Retail Operating System
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black leading-tight">
              Store Overview & Ledger
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
              Enter data once. Inventory, sales, supplier credit, and net cash flow are updated automatically with deterministic accounting precision.
            </p>

            {/* Quick 3D Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenQuickSale}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-black rounded-xl shadow-btn-3d hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                + Record Sale
              </button>
              <button
                onClick={onOpenQuickPurchase}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-black bg-white border border-zinc-300 rounded-xl shadow-btn-3d-white hover:bg-zinc-50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-zinc-700" />
                + Restock Purchase
              </button>
            </div>
          </div>

          {/* 3D Isometric Monochrome Kirana Store Visual */}
          <div className="relative w-full max-w-[280px] lg:max-w-[320px] h-44 flex items-center justify-center self-center shrink-0">
            <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-xl select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="monoWall" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f4f4f5" />
                </linearGradient>
                <linearGradient id="monoGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                  <stop offset="100%" stopColor="rgba(228,228,231,0.5)" />
                </linearGradient>
                <filter id="cleanShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.08" />
                </filter>
              </defs>

              {/* Ground Shadow */}
              <ellipse cx="160" cy="168" rx="130" ry="18" fill="#e4e4e7" opacity="0.6" />

              {/* Main Building Block */}
              <rect x="70" y="65" width="180" height="98" rx="8" fill="url(#monoWall)" stroke="#d4d4d8" strokeWidth="1.5" filter="url(#cleanShadow)" />

              {/* Store Signboard */}
              <rect x="100" y="22" width="120" height="26" rx="6" fill="#09090b" filter="url(#cleanShadow)" />
              <text x="160" y="39" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="1">RETAIL STORE</text>

              {/* Awning / Canopy (Black & White Striped) */}
              <path d="M 50 64 L 270 64 L 255 44 L 65 44 Z" fill="#18181b" filter="url(#cleanShadow)" />
              <path d="M 85 44 L 75 64 L 105 64 L 110 44 Z" fill="#ffffff" />
              <path d="M 140 44 L 135 64 L 165 64 L 165 44 Z" fill="#ffffff" />
              <path d="M 195 44 L 195 64 L 225 64 L 220 44 Z" fill="#ffffff" />

              {/* Glass Door / Display Showcase */}
              <rect x="85" y="85" width="60" height="78" rx="4" fill="url(#monoGlass)" stroke="#d4d4d8" strokeWidth="1.5" />
              <line x1="85" y1="110" x2="145" y2="110" stroke="#d4d4d8" strokeWidth="1" />
              <line x1="85" y1="135" x2="145" y2="135" stroke="#d4d4d8" strokeWidth="1" />

              {/* Shelf Items */}
              <rect x="92" y="96" width="12" height="14" rx="2" fill="#27272a" />
              <rect x="108" y="94" width="14" height="16" rx="2" fill="#71717a" />
              <rect x="126" y="97" width="12" height="13" rx="2" fill="#18181b" />
              <rect x="92" y="121" width="14" height="14" rx="2" fill="#71717a" />
              <rect x="110" y="119" width="12" height="16" rx="2" fill="#18181b" />
              <rect x="126" y="122" width="12" height="13" rx="2" fill="#27272a" />

              {/* Checkout Counter */}
              <rect x="160" y="100" width="75" height="63" rx="6" fill="#18181b" filter="url(#cleanShadow)" />
              <rect x="175" y="88" width="45" height="22" rx="4" fill="#ffffff" stroke="#09090b" strokeWidth="1.5" />
              <text x="185" y="103" fill="#09090b" fontSize="10" fontFamily="monospace" fontWeight="bold">₹0.00</text>

              {/* 3D Floating Coin (Rupee) */}
              <g transform="translate(245, 70)">
                <circle cx="16" cy="16" r="16" fill="#09090b" filter="url(#cleanShadow)" />
                <circle cx="16" cy="16" r="13" fill="#18181b" stroke="#ffffff" strokeWidth="1" />
                <text x="16" y="21" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">₹</text>
              </g>

              {/* 3D Crate Box */}
              <g transform="translate(40, 115)">
                <polygon points="18,0 36,9 18,18 0,9" fill="#f4f4f5" stroke="#71717a" strokeWidth="1" />
                <polygon points="0,9 18,18 18,36 0,27" fill="#e4e4e7" stroke="#71717a" strokeWidth="1" />
                <polygon points="18,18 36,9 36,27 18,36" fill="#27272a" stroke="#71717a" strokeWidth="1" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Onboarding Guide if shop is empty */}
      {isBrandNewShop && (
        <div className="p-5 glass-panel rounded-2xl border border-zinc-200 shadow-card-3d flex items-start gap-4">
          <div className="p-3 bg-zinc-100 rounded-xl text-black">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-black">Welcome to DukaanOS</h4>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              Your store ledger is fresh. You can seed sample retail store data to evaluate the application.
            </p>
            <div className="mt-3">
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs font-semibold text-black bg-zinc-100 hover:bg-zinc-200 px-3.5 py-1.5 rounded-lg transition-all"
              >
                Load Sample Store Data →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 Key Metrics Grid (Monochrome 3D Glass Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Today's Sales */}
        <div className="glass-panel p-4 rounded-2xl border border-zinc-200 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-black">
            ₹{summary.today_sales.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-zinc-600">
            {summary.sales_growth_percent !== undefined && summary.sales_growth_percent !== null ? (
              <span className="inline-flex items-center gap-0.5">
                {summary.sales_growth_percent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-black" />
                ) : (
                  <ArrowDownLeft className="w-3 h-3 text-zinc-400" />
                )}
                {summary.sales_growth_percent > 0 ? `+${summary.sales_growth_percent}%` : `${summary.sales_growth_percent}%`} vs yest.
              </span>
            ) : (
              <span className="text-zinc-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3 text-black" />
                Live Revenue
              </span>
            )}
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="glass-panel p-4 rounded-2xl border border-zinc-200 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Purchases</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-black">
            ₹{summary.today_purchases.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-500">
            Stock acquired
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="glass-panel p-4 rounded-2xl border border-zinc-200 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-black">
            ₹{summary.today_expenses.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-500">
            Store overheads
          </div>
        </div>

        {/* Outstanding Supplier Dues */}
        <div className="glass-panel p-4 rounded-2xl border border-zinc-200 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Supplier Dues</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-black">
            ₹{summary.outstanding_supplier_payments.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-zinc-700">
            Pending clearance
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="glass-panel p-4 rounded-2xl border border-zinc-200 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Inventory Value</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-black">
            ₹{summary.total_inventory_value.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-medium text-zinc-500">
            Cost valuation
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => onNavigate('inventory')}
          className={`glass-panel p-4 rounded-2xl border shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all cursor-pointer ${
            summary.low_stock_count > 0 ? 'border-zinc-400 bg-zinc-50' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-black">
            {summary.low_stock_count} {summary.low_stock_count === 1 ? 'item' : 'items'}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-zinc-700">
            {summary.low_stock_count > 0 ? 'Reorder needed' : 'Optimal levels'}
          </div>
        </div>
      </div>

      {/* Main Charts & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 columns) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-zinc-200 shadow-card-3d">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80">
            <div>
              <h2 className="text-sm font-bold text-black">7-Day Sales Trajectory</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Daily gross revenue trajectory from recorded transactions</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-black hover:text-zinc-600 flex items-center gap-1 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 transition-colors"
            >
              Sales Book →
            </button>
          </div>
          <div className="pt-5">
            <TrendChart data={summary.sales_trend} />
          </div>
        </div>

        {/* Quick Insights Highlights (1 column) */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 shadow-card-3d flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80">
              <h2 className="text-sm font-bold text-black">Deterministic Health</h2>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs font-semibold text-zinc-700 hover:text-black"
              >
                All Insights →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {summary.low_stock_count > 0 ? (
                <div className="p-4 rounded-2xl border border-zinc-300 bg-zinc-100/70 text-xs">
                  <div className="font-bold text-black flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-zinc-800" />
                    Low Stock Thresholds Reached
                  </div>
                  <div className="text-zinc-600 mt-1 leading-snug">
                    <span className="font-semibold text-black">{summary.low_stock_count}</span> products have hit or breached minimum thresholds.
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-zinc-200 bg-white text-xs">
                  <div className="font-bold text-black">Inventory Levels Healthy</div>
                  <div className="text-zinc-500 mt-1">All active catalog products have safe stock reserves.</div>
                </div>
              )}

              {summary.outstanding_supplier_payments > 0 ? (
                <div className="p-4 rounded-2xl border border-zinc-300 bg-zinc-100/70 text-xs">
                  <div className="font-bold text-black flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-zinc-800" />
                    Pending Supplier Payables
                  </div>
                  <div className="text-zinc-600 mt-1 leading-snug">
                    Total <span className="font-mono font-bold text-black">₹{summary.outstanding_supplier_payments.toLocaleString('en-IN')}</span> due across distributor balances.
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-zinc-200 bg-white text-xs text-zinc-600">
                  <div className="font-bold text-black">All Supplier Dues Settled</div>
                  <div className="text-zinc-500 mt-1">No outstanding credit amounts remaining.</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200/80 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Deterministic Records</span>
            <span className="font-semibold text-black">100% Balanced</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="glass-panel rounded-3xl border border-zinc-200 shadow-card-3d overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-white/70">
          <div>
            <h2 className="text-sm font-bold text-black">Recent Transactions</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Latest chronological entries in shop ledger</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-black hover:text-zinc-600 bg-zinc-100 px-3.5 py-1.5 rounded-xl border border-zinc-200 transition-colors"
          >
            Full Ledger →
          </button>
        </div>

        {summary.recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200/60">
            {summary.recent_transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50/70 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold bg-zinc-100 text-black border border-zinc-200">
                    {tx.type === 'sale' ? (
                      <ArrowUpRight className="w-4 h-4 text-black" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black leading-snug">
                      {tx.description}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                      <span>
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {tx.payment_method && (
                        <span className="bg-zinc-100 text-zinc-700 font-semibold px-2 py-0.2 rounded text-[10px]">
                          {tx.payment_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold font-mono text-black">
                    {tx.type === 'sale' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {tx.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
