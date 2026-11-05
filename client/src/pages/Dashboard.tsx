import React, { useState } from 'react';
import {
  BarChart3,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { DashboardSummary, Product, Supplier, BusinessInsight, TransactionRecord } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface DashboardProps {
  summary: DashboardSummary | null;
  products?: Product[];
  suppliers?: Supplier[];
  transactions?: TransactionRecord[];
  insights?: BusinessInsight[];
  onNavigate: (tab: string) => void;
  onOpenQuickSale: () => void;
  onOpenQuickPurchase: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  products = [],
  suppliers = [],
  transactions = [],
  insights = [],
  onNavigate,
  onOpenQuickSale,
  onOpenQuickPurchase
}) => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');

  if (!summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-zinc-200 rounded-xl w-60"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-zinc-100"></div>
          ))}
        </div>
      </div>
    );
  }

  // Currency formatting
  const formatINR = (val: number) => {
    return Number(val || 0).toLocaleString('en-IN');
  };

  const formatTxTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      if (isToday) {
        return `Today, ${timeStr}`;
      }
      return `${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  // 1. Live Metrics strictly from Real State
  const pendingSuppliersList = suppliers.filter(s => Number(s.outstanding_balance) > 0);
  const pendingSuppliersCount = pendingSuppliersList.length;

  const lowStockProducts = products.filter(p => Number(p.current_stock) <= Number(p.min_stock_threshold));
  const lowStockCount = summary.low_stock_count !== undefined ? summary.low_stock_count : lowStockProducts.length;
  const lowStockNames = lowStockProducts.map(p => p.name).slice(0, 3).join(', ');

  const totalItemsCount = products.reduce((acc, p) => acc + Number(p.current_stock || 0), 0);

  // 2. Sales Trend strictly from API or real dates
  const trendData: { date: string; sales: number; count: number }[] = [];
  if (summary.sales_trend && summary.sales_trend.length > 0) {
    trendData.push(...summary.sales_trend);
  } else {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const salesVal = i === 0 ? summary.today_sales : 0;
      trendData.push({ date: dateStr, sales: salesVal, count: i === 0 && salesVal > 0 ? 1 : 0 });
    }
  }

  const maxSaleValue = Math.max(...trendData.map(d => d.sales), summary.today_sales || 0, 1000);
  const ceiling = Math.ceil(maxSaleValue / 5000) * 5000 || 5000;
  const yTicks = [
    ceiling,
    Math.round((ceiling * 2) / 3),
    Math.round(ceiling / 3),
    0
  ];

  // 3. Recent Transactions strictly from Real State
  const displayTransactions = (transactions && transactions.length > 0)
    ? transactions.slice(0, 5)
    : (summary.recent_transactions && summary.recent_transactions.length > 0)
    ? summary.recent_transactions.slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111214] tracking-tight">
            {t('storeOverview')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1">
            {t('storeOverviewSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenQuickSale}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-semibold text-xs sm:text-sm shadow-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-zinc-700" />
            <span>{t('recordSaleBtn')}</span>
          </button>
          
          <button
            onClick={onOpenQuickPurchase}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111214] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <Package className="w-4 h-4 text-white" />
            <span>{t('restockPurchaseBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metrics Strip (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Today's Sales */}
        <div className="bg-white rounded-2xl p-4 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/60 text-black flex items-center justify-center mb-3">
              <BarChart3 className="w-4 h-4 text-black" />
            </div>
            <span className="text-[13px] font-medium text-zinc-500 block">{t('todaySales')}</span>
            <div className="text-xl font-bold text-zinc-900 tracking-tight mt-0.5 tabular-nums">
              ₹{formatINR(summary.today_sales)}
            </div>
          </div>
          <div className="text-xs font-medium text-zinc-600 mt-2 flex items-center gap-0.5">
            {summary.sales_growth_percent !== null && summary.sales_growth_percent !== undefined ? (
              <>
                <span>{summary.sales_growth_percent >= 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(summary.sales_growth_percent)}% {t('vsYesterday')}</span>
              </>
            ) : (
              <span>{t('liveLedger')}</span>
            )}
          </div>
        </div>

        {/* Card 2: Today's Purchases */}
        <div className="bg-white rounded-2xl p-4 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/60 text-black flex items-center justify-center mb-3">
              <ShoppingCart className="w-4 h-4 text-black" />
            </div>
            <span className="text-[13px] font-medium text-zinc-500 block">{t('todayPurchases')}</span>
            <div className="text-xl font-bold text-zinc-900 tracking-tight mt-0.5 tabular-nums">
              ₹{formatINR(summary.today_purchases)}
            </div>
          </div>
          <div className="text-xs font-medium text-zinc-500 mt-2">
            {t('stockAcquired')}
          </div>
        </div>

        {/* Card 3: Today's Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/60 text-black flex items-center justify-center mb-3">
              <Receipt className="w-4 h-4 text-black" />
            </div>
            <span className="text-[13px] font-medium text-zinc-500 block">{t('todayExpenses')}</span>
            <div className="text-xl font-bold text-zinc-900 tracking-tight mt-0.5 tabular-nums">
              ₹{formatINR(summary.today_expenses)}
            </div>
          </div>
          <div className="text-xs font-medium text-zinc-500 mt-2">
            {t('storeOverheads')}
          </div>
        </div>

        {/* Card 4: Supplier Dues */}
        <div className="bg-white rounded-2xl p-4 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/60 text-black flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-black" />
            </div>
            <span className="text-[13px] font-medium text-zinc-500 block">{t('supplierDues')}</span>
            <div className="text-xl font-bold text-zinc-900 tracking-tight mt-0.5 tabular-nums">
              ₹{formatINR(summary.outstanding_supplier_payments)}
            </div>
          </div>
          <div className="text-xs font-medium text-zinc-500 mt-2">
            {pendingSuppliersCount} {pendingSuppliersCount === 1 ? t('supplierPending') : t('suppliersPending')}
          </div>
        </div>

        {/* Card 5: Inventory Value */}
        <div className="bg-white rounded-2xl p-4 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/60 text-black flex items-center justify-center mb-3">
              <Package className="w-4 h-4 text-black" />
            </div>
            <span className="text-[13px] font-medium text-zinc-500 block">{t('inventoryValue')}</span>
            <div className="text-xl font-bold text-zinc-900 tracking-tight mt-0.5 tabular-nums">
              ₹{formatINR(summary.total_inventory_value)}
            </div>
          </div>
          <div className="text-xs font-medium text-zinc-500 mt-2">
            ≈ {totalItemsCount.toLocaleString('en-IN')} {t('unitsValuation')}
          </div>
        </div>

        {/* Card 6: Low Stock Items */}
        <div className="bg-white rounded-2xl p-4 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/60 text-black flex items-center justify-center mb-3">
              <AlertTriangle className="w-4 h-4 text-black" />
            </div>
            <span className="text-[13px] font-medium text-zinc-500 block">{t('lowStockItems')}</span>
            <div className="text-xl font-bold text-zinc-900 tracking-tight mt-0.5 tabular-nums">
              {lowStockCount}
            </div>
          </div>
          <div className={`text-xs font-medium mt-2 ${lowStockCount > 0 ? 'text-zinc-900 font-bold' : 'text-zinc-500'}`}>
            {lowStockCount > 0 ? t('needsAttention') : t('optimalLevels')}
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Sales Overview Bar Chart & Things to Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (8 cols): Sales Overview Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-bold text-zinc-900">{t('salesOverview')}</h2>
            <div className="relative">
              <button
                onClick={() => setTimeRange(timeRange === '7days' ? '30days' : '7days')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black bg-white text-xs font-medium text-zinc-600 hover:text-black transition-all cursor-pointer"
              >
                <span>{timeRange === '7days' ? t('last7Days') : t('last30Days')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="pt-2 pb-1">
            <div className="flex items-stretch h-52">
              {/* Y-axis Labels */}
              <div className="flex flex-col justify-between pr-3 text-[11px] font-medium text-zinc-400 shrink-0 w-8 select-none">
                {yTicks.map((tick, idx) => (
                  <span key={idx} className="tabular-nums leading-none">
                    {tick >= 1000 ? `${Math.round(tick / 1000)}k` : tick}
                  </span>
                ))}
              </div>

              {/* Chart Grid & Bars */}
              <div className="relative flex-1 flex flex-col justify-between">
                {/* Dashed Horizontal Guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-dashed border-zinc-100 w-full h-0"></div>
                  <div className="border-b border-dashed border-zinc-100 w-full h-0"></div>
                  <div className="border-b border-dashed border-zinc-100 w-full h-0"></div>
                  <div className="border-b border-zinc-200/60 w-full h-0"></div>
                </div>

                {/* Bars Container */}
                <div className="relative z-10 flex-1 grid grid-cols-7 gap-2 sm:gap-4 items-end pb-1 px-2">
                  {trendData.slice(-7).map((item, idx) => {
                    const isLast = idx === trendData.slice(-7).length - 1;
                    const dayLabel = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
                    const barHeightPct = ceiling > 0
                      ? Math.min(100, Math.max(item.sales > 0 ? 12 : 4, Math.round((item.sales / ceiling) * 100)))
                      : 6;

                    return (
                      <div key={item.date || idx} className="flex flex-col items-center justify-end h-full group relative">
                        {/* Tooltip on Active/Today's Bar */}
                        {isLast && summary.today_sales > 0 && (
                          <div className="absolute -top-7 mb-1 z-20 flex flex-col items-center animate-fade-in">
                            <div className="bg-[#111214] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md whitespace-nowrap tabular-nums">
                              ₹{formatINR(item.sales)}
                            </div>
                            <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#111214]"></div>
                          </div>
                        )}

                        {/* Bar */}
                        <div
                          style={{ height: `${barHeightPct}%` }}
                          className={`w-full max-w-[48px] rounded-t-sm transition-all duration-300 ${
                            isLast
                              ? 'bg-[#111214] shadow-xs'
                              : 'bg-[#e2e6ed] hover:bg-zinc-300'
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-axis Day Labels */}
            <div className="flex items-center pl-8 pr-2 pt-2.5">
              <div className="flex-1 grid grid-cols-7 gap-2 sm:gap-4 text-center">
                {trendData.slice(-7).map((item, idx) => {
                  const dayLabel = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <span key={idx} className="text-xs font-medium text-zinc-400">
                      {dayLabel}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right (4 cols): Things to Review (100% Real Live State) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-base font-bold text-zinc-900">{t('thingsToReview')}</h2>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs font-semibold text-zinc-700 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{t('viewAll')}</span>
                <span>→</span>
              </button>
            </div>

            <div className="space-y-3 mt-1">
              {/* Review 1: Low Stock */}
              <div
                onClick={() => onNavigate('inventory')}
                className="p-3.5 rounded-xl border border-black hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-between gap-3 bg-white"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-zinc-100 border border-zinc-200/60 text-black">
                    {lowStockCount > 0 ? <AlertCircle className="w-4 h-4 text-black" /> : <CheckCircle2 className="w-4 h-4 text-black" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 leading-snug truncate">
                      {lowStockCount > 0
                        ? `${lowStockCount} ${lowStockCount === 1 ? t('productBelowMin') : t('productsBelowMin')}`
                        : t('allInventoryHealthy')}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {lowStockCount > 0 ? lowStockNames : t('noItemsBelowThreshold')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
              </div>

              {/* Review 2: Supplier Dues */}
              <div
                onClick={() => onNavigate('suppliers')}
                className="p-3.5 rounded-xl border border-black hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-between gap-3 bg-white"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-zinc-100 border border-zinc-200/60 text-black">
                    {summary.outstanding_supplier_payments > 0 ? <Info className="w-4 h-4 text-black" /> : <CheckCircle2 className="w-4 h-4 text-black" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 leading-snug truncate">
                      {summary.outstanding_supplier_payments > 0
                        ? `₹${formatINR(summary.outstanding_supplier_payments)} ${t('pendingWithSuppliers')}`
                        : t('noPendingDues')}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {summary.outstanding_supplier_payments > 0
                        ? `${pendingSuppliersCount} ${pendingSuppliersCount === 1 ? t('supplierPending') : t('suppliersPending')}`
                        : t('allVendorDuesCleared')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
              </div>

              {/* Review 3: Sales Trend / Growth */}
              <div
                onClick={() => onNavigate('insights')}
                className="p-3.5 rounded-xl border border-black hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-between gap-3 bg-white"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200/60 text-black flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-black" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 leading-snug truncate">
                      {summary.today_sales > 0
                        ? `₹${formatINR(summary.today_sales)} ${t('salesRecordedToday')}`
                        : t('readyToProcessSales')}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {summary.sales_growth_percent !== null && summary.sales_growth_percent !== undefined
                        ? `${summary.sales_growth_percent >= 0 ? '+' : ''}${summary.sales_growth_percent}% ${t('comparedToYesterday')}`
                        : t('deterministicLedger')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Recent Transactions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (8 cols): Recent Transactions */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-bold text-zinc-900">{t('recentTransactions')}</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-zinc-700 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{t('viewAll')}</span>
              <span>→</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {displayTransactions.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center mb-2.5">
                  <Receipt className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="text-xs font-bold text-zinc-800">{t('noTransactionsYet')}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 max-w-sm mx-auto">
                  {t('noTransactionsSub')}
                </div>
                <div className="mt-3.5 flex items-center justify-center gap-2">
                  <button
                    onClick={onOpenQuickSale}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {t('recordFirstSale')}
                  </button>
                  <button
                    onClick={onOpenQuickPurchase}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {t('restockStock')}
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-zinc-100">
                  {displayTransactions.map((tx: any, idx: number) => {
                    const type = tx.type?.toLowerCase() || 'sale';
                    const isSale = type === 'sale';
                    const isPurchase = type === 'purchase';
                    const isExpense = type === 'expense';

                    return (
                      <tr key={tx.id || idx} className="hover:bg-zinc-50/60 transition-colors">
                        {/* Badge Pill */}
                        <td className="py-3 pr-3 w-24">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              isSale
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                            }`}
                          >
                            {isSale ? t('typeSale') : isPurchase ? t('typePurchase') : isExpense ? t('typeExpense') : t('typePayment')}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-3 px-3 font-medium text-zinc-800 truncate max-w-[200px] sm:max-w-none">
                          {tx.description || (isSale ? 'Store Sale' : 'Inventory')}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 font-bold text-zinc-900 tabular-nums whitespace-nowrap">
                          ₹{formatINR(tx.amount)}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3 px-3 text-zinc-500 whitespace-nowrap text-center">
                          {tx.payment_method || 'Cash'}
                        </td>

                        {/* Time */}
                        <td className="py-3 pl-3 text-zinc-400 whitespace-nowrap text-right">
                          {formatTxTime(tx.date || tx.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right (4 cols): Quick Actions */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 pb-3">{t('quickActions')}</h2>
            
            {/* 5 Tiles Grid */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              <button
                onClick={() => onNavigate('inventory')}
                className="aspect-square rounded-xl border border-black hover:bg-zinc-50 p-2 flex flex-col items-center justify-center text-center transition-all bg-white group cursor-pointer"
              >
                <Package className="w-5 h-5 text-black transition-colors" />
                <span className="text-[11px] font-medium text-black mt-1.5 leading-tight text-center">
                  {t('addProduct')}
                </span>
              </button>

              <button
                onClick={() => onNavigate('suppliers')}
                className="aspect-square rounded-xl border border-black hover:bg-zinc-50 p-2 flex flex-col items-center justify-center text-center transition-all bg-white group cursor-pointer"
              >
                <Users className="w-5 h-5 text-black transition-colors" />
                <span className="text-[11px] font-medium text-black mt-1.5 leading-tight text-center">
                  {t('addSupplier')}
                </span>
              </button>

              <button
                onClick={onOpenQuickPurchase}
                className="aspect-square rounded-xl border border-black hover:bg-zinc-50 p-2 flex flex-col items-center justify-center text-center transition-all bg-white group cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5 text-black transition-colors" />
                <span className="text-[11px] font-medium text-black mt-1.5 leading-tight text-center">
                  {t('recordPurchase')}
                </span>
              </button>

              <button
                onClick={onOpenQuickSale}
                className="aspect-square rounded-xl border border-black hover:bg-zinc-50 p-2 flex flex-col items-center justify-center text-center transition-all bg-white group cursor-pointer"
              >
                <Tag className="w-5 h-5 text-black transition-colors" />
                <span className="text-[11px] font-medium text-black mt-1.5 leading-tight text-center">
                  {t('recordSale')}
                </span>
              </button>

              <button
                onClick={() => onNavigate('expenses')}
                className="aspect-square rounded-xl border border-black hover:bg-zinc-50 p-2 flex flex-col items-center justify-center text-center transition-all bg-white group cursor-pointer"
              >
                <Receipt className="w-5 h-5 text-black transition-colors" />
                <span className="text-[11px] font-medium text-black mt-1.5 leading-tight text-center">
                  {t('addExpense')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
