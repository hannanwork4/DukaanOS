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
  Sparkles,
  HelpCircle
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
        <div className="h-8 bg-slate-200 rounded w-48"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-lg border border-slate-200"></div>
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Shop Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business summary from live ledger and inventory records.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickPurchase}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            + New Purchase
          </button>
          <button
            onClick={onOpenQuickSale}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + New Sale
          </button>
        </div>
      </div>

      {/* Onboarding Guide if shop is empty */}
      {isBrandNewShop && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs flex items-start gap-3.5">
          <div className="p-2 bg-slate-100 rounded-md text-slate-700">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Welcome to DukaanOS!</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your store ledger is fresh. You can record records directly in the app or tell Claude:
              <br />
              <span className="italic font-mono text-[11px] text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                "I bought 20 oil packets from Ramesh Traders for ₹2,000. I paid ₹1,000 and ₹1,000 is pending."
              </span>
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs font-medium text-slate-900 underline hover:text-slate-700"
              >
                Load Kirana Sample Demo Data →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Today's Sales */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            ₹{summary.today_sales.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium">
            {summary.sales_growth_percent !== undefined && summary.sales_growth_percent !== null ? (
              <span className={`inline-flex items-center gap-0.5 ${
                summary.sales_growth_percent >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}>
                {summary.sales_growth_percent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownLeft className="w-3 h-3" />
                )}
                {summary.sales_growth_percent > 0 ? `+${summary.sales_growth_percent}%` : `${summary.sales_growth_percent}%`} vs yest.
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                Live Revenue
              </span>
            )}
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Today's Purchases</span>
            <ShoppingBag className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            ₹{summary.today_purchases.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Stock acquired
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Today's Expenses</span>
            <Receipt className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            ₹{summary.today_expenses.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Shop operational
          </div>
        </div>

        {/* Outstanding Supplier Dues */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Supplier Dues</span>
            <Truck className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            ₹{summary.outstanding_supplier_payments.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-medium">
            Pending clearance
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Inventory Value</span>
            <Boxes className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            ₹{summary.total_inventory_value.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Cost valuation
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => onNavigate('inventory')}
          className={`p-4 bg-white rounded-lg border shadow-xs cursor-pointer hover:border-slate-300 transition-colors ${
            summary.low_stock_count > 0 ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className={`w-4 h-4 ${summary.low_stock_count > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div className={`mt-2 text-xl font-bold ${summary.low_stock_count > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {summary.low_stock_count} {summary.low_stock_count === 1 ? 'item' : 'items'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {summary.low_stock_count > 0 ? 'Reorder needed' : 'Optimal levels'}
          </div>
        </div>
      </div>

      {/* Main Charts & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">7-Day Sales Trend</h2>
              <p className="text-xs text-slate-500">Daily gross revenue trajectory</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              View Sales Book →
            </button>
          </div>
          <div className="pt-4">
            <TrendChart data={summary.sales_trend} />
          </div>
        </div>

        {/* Quick Insights Highlights (1 column) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-900">
                <Sparkles className="w-4 h-4 text-slate-700" />
                Key Insights
              </div>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                All Insights →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {summary.low_stock_count > 0 ? (
                <div className="p-3 rounded border border-red-100 bg-red-50/40 text-xs">
                  <div className="font-semibold text-red-900">Low Stock Warning</div>
                  <div className="text-red-700 mt-0.5">
                    {summary.low_stock_count} products have reached or breached their minimum stock threshold.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded border border-emerald-100 bg-emerald-50/40 text-xs">
                  <div className="font-semibold text-emerald-900">Inventory Levels Healthy</div>
                  <div className="text-emerald-700 mt-0.5">
                    All listed products are above minimum safety thresholds.
                  </div>
                </div>
              )}

              {summary.outstanding_supplier_payments > 0 ? (
                <div className="p-3 rounded border border-amber-100 bg-amber-50/40 text-xs">
                  <div className="font-semibold text-amber-900">Supplier Balance Pending</div>
                  <div className="text-amber-800 mt-0.5">
                    ₹{summary.outstanding_supplier_payments.toLocaleString('en-IN')} pending across suppliers.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded border border-slate-100 bg-slate-50 text-xs text-slate-600">
                  <div className="font-semibold text-slate-900">No Supplier Dues</div>
                  <div className="text-slate-500 mt-0.5">All supplier accounts are settled.</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Deterministic business intelligence computed strictly from database records.
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Latest entries in shop ledger</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            Full Ledger →
          </button>
        </div>

        {summary.recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary.recent_transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'sale'
                      ? 'bg-emerald-50 text-emerald-700'
                      : tx.type === 'purchase'
                      ? 'bg-blue-50 text-blue-700'
                      : tx.type === 'expense'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {tx.type === 'sale' ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-900 leading-snug">
                      {tx.description}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {tx.payment_method && ` • ${tx.payment_method}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-semibold ${
                    tx.type === 'sale' ? 'text-emerald-700' : 'text-slate-900'
                  }`}>
                    {tx.type === 'sale' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {tx.type}
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

