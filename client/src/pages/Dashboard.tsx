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
  Coins,
  Store,
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
        <div className="h-8 bg-amber-200/50 rounded-xl w-48"></div>
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
      {/* 3D Glass Hero Banner with Handcrafted 3D Kirana Visual */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-7 border border-white/80 shadow-card-3d bg-gradient-to-r from-white/90 via-amber-50/70 to-white/80">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/70 text-amber-950 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
              भारतीय स्वतंत्र किराना एवं व्यापार मंच
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
              दुकान बहीखाता एवं स्टॉक
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              एक बार एंट्री करें — दुकान का गल्ला, गोदाम स्टॉक और व्यापारी उधारी अपने-आप 100% शुद्ध गणितीय हिसाब से अपडेट रहते हैं।
            </p>

            {/* Quick 3D Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenQuickSale}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-btn-3d hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                + नया ग्राहक बिल (New Sale)
              </button>
              <button
                onClick={onOpenQuickPurchase}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-slate-900 bg-white/90 border border-amber-200/80 rounded-2xl shadow-2xs hover:bg-amber-50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                + सप्लायर खरीद (Restock)
              </button>
            </div>
          </div>

          {/* Handcrafted 3D Isometric Kirana Visual */}
          <div className="relative w-full max-w-[280px] lg:max-w-[320px] h-44 flex items-center justify-center self-center shrink-0">
            {/* 3D Background Halo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-orange-300/30 to-amber-200/10 rounded-3xl blur-xl -z-10" />

            <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-2xl select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
                <linearGradient id="counterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                  <stop offset="100%" stopColor="rgba(254,243,199,0.3)" />
                </linearGradient>
                <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
                </filter>
              </defs>

              {/* 3D Ground Platform */}
              <ellipse cx="160" cy="165" rx="140" ry="24" fill="#cbd5e1" opacity="0.3" />

              {/* 3D Shop Wall & Structure */}
              <rect x="70" y="70" width="180" height="95" rx="8" fill="url(#wallGrad)" stroke="#e2e8f0" strokeWidth="2" filter="url(#softShadow)" />

              {/* 3D Glass Door / Shelves */}
              <rect x="85" y="90" width="60" height="75" rx="4" fill="url(#glassGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="85" y1="115" x2="145" y2="115" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="85" y1="140" x2="145" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Little 3D Kirana items on shelf */}
              <rect x="92" y="102" width="10" height="13" rx="2" fill="#d97706" />
              <rect x="106" y="100" width="12" height="15" rx="2" fill="#0f172a" />
              <rect x="122" y="103" width="14" height="12" rx="2" fill="#f59e0b" />
              <rect x="93" y="127" width="14" height="13" rx="2" fill="#b45309" />
              <rect x="111" y="125" width="11" height="15" rx="2" fill="#d97706" />
              <rect x="126" y="128" width="12" height="12" rx="2" fill="#0f172a" />

              {/* 3D Cash Counter & Register */}
              <rect x="160" y="105" width="75" height="60" rx="6" fill="url(#counterGrad)" filter="url(#softShadow)" />
              <rect x="175" y="92" width="45" height="22" rx="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
              <text x="185" y="107" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold">₹₹₹</text>

              {/* 3D Saffron Awning Canopy (Chhappar) with Bevels */}
              <path d="M 50 68 L 270 68 L 255 42 L 65 42 Z" fill="url(#roofGrad)" filter="url(#softShadow)" />
              {/* Stripes on Canopy */}
              <path d="M 85 42 L 75 68 L 105 68 L 110 42 Z" fill="#ffffff" opacity="0.9" />
              <path d="M 140 42 L 135 68 L 165 68 L 165 42 Z" fill="#ffffff" opacity="0.9" />
              <path d="M 195 42 L 195 68 L 225 68 L 220 42 Z" fill="#ffffff" opacity="0.9" />

              {/* Store Signboard */}
              <rect x="110" y="24" width="100" height="24" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" filter="url(#softShadow)" />
              <text x="160" y="40" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="0.5">किराना STORE</text>

              {/* 3D Floating Gold Coin (Rupee) */}
              <g transform="translate(240, 75)">
                <circle cx="16" cy="16" r="16" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" filter="url(#softShadow)" />
                <circle cx="16" cy="16" r="13" fill="#d97706" />
                <text x="16" y="21" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">₹</text>
              </g>

              {/* 3D Floating Restock Box */}
              <g transform="translate(42, 115)">
                <polygon points="18,0 36,9 18,18 0,9" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
                <polygon points="0,9 18,18 18,36 0,27" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
                <polygon points="18,18 36,9 36,27 18,36" fill="#d97706" stroke="#b45309" strokeWidth="1" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Onboarding Guide if shop is empty */}
      {isBrandNewShop && (
        <div className="p-5 glass-panel rounded-2xl border border-amber-200/80 shadow-card-3d flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-2xl text-amber-900 shadow-inner">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">दुकान में आपका स्वागत है!</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              दुकान का खाता तैयार है। डेमो किराना डेटा लोड करने के लिए नीचे दिए गए बटन पर क्लिक करें।
            </p>
            <div className="mt-3">
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs font-bold text-amber-950 bg-amber-100/90 hover:bg-amber-200/90 px-3.5 py-1.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                डेमो किराना डेटा लोड करें →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 Key Metrics Grid (3D Glass Panels, Strict 2-Color Palette) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Today's Sales */}
        <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between text-slate-500">
            <div>
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">आज की बिक्री</span>
              <span className="text-[11px] font-medium text-slate-500">Today's Sales</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            ₹{summary.today_sales.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-900">
            {summary.sales_growth_percent !== undefined && summary.sales_growth_percent !== null ? (
              <span className="inline-flex items-center gap-0.5">
                {summary.sales_growth_percent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-amber-700" />
                ) : (
                  <ArrowDownLeft className="w-3 h-3 text-slate-600" />
                )}
                {summary.sales_growth_percent > 0 ? `+${summary.sales_growth_percent}%` : `${summary.sales_growth_percent}%`} vs कल
              </span>
            ) : (
              <span className="text-amber-800 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                लाइव गल्ला
              </span>
            )}
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between text-slate-500">
            <div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">आज की खरीद</span>
              <span className="text-[11px] font-medium text-slate-500">Purchases</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            ₹{summary.today_purchases.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-600">
            नया माल गोदाम में
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between text-slate-500">
            <div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">दुकान खर्चे</span>
              <span className="text-[11px] font-medium text-slate-500">Expenses</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            ₹{summary.today_expenses.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-600">
            बिजली, भाड़ा, चाय
          </div>
        </div>

        {/* Outstanding Supplier Dues */}
        <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between text-slate-500">
            <div>
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">व्यापारी उधारी</span>
              <span className="text-[11px] font-medium text-slate-500">Supplier Dues</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            ₹{summary.outstanding_supplier_payments.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-amber-800 font-bold">
            देना बाकी
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between text-slate-500">
            <div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">गोदाम माल</span>
              <span className="text-[11px] font-medium text-slate-500">Stock Value</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-2xs">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            ₹{summary.total_inventory_value.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-600">
            लागत मूल्यांकन
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => onNavigate('inventory')}
          className={`glass-panel p-4 rounded-2xl border shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all cursor-pointer ${
            summary.low_stock_count > 0 ? 'border-amber-400 bg-amber-50/50' : 'border-white/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <div>
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                कम स्टॉक
              </span>
              <span className="text-[11px] font-medium text-slate-500">Low Stock</span>
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${summary.low_stock_count > 0 ? 'bg-amber-200 text-amber-950 font-black' : 'bg-slate-100 text-slate-700'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {summary.low_stock_count} {summary.low_stock_count === 1 ? 'सामान' : 'सामान'}
          </div>
          <div className="mt-1 text-[11px] font-bold">
            {summary.low_stock_count > 0 ? (
              <span className="text-amber-900">रीऑर्डर करें</span>
            ) : (
              <span className="text-slate-600">पर्याप्त स्तर</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 columns) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/80 shadow-card-3d">
          <div className="flex items-center justify-between pb-4 border-b border-amber-200/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h2 className="text-sm font-black text-slate-900">7 दिन की बिक्री (Weekly Sales Trend)</h2>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">दैनिक गल्ला व बिक्री आमदनी का ग्राफ़</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-amber-950 hover:text-amber-800 flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200/80 shadow-2xs hover:bg-amber-50 transition-colors"
            >
              बिक्री बही →
            </button>
          </div>
          <div className="pt-5">
            <TrendChart data={summary.sales_trend} />
          </div>
        </div>

        {/* Quick Insights Highlights (1 column) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/80 shadow-card-3d flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/40">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Store className="w-4 h-4 text-amber-600" />
                दुकान स्थिति
              </div>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs font-bold text-amber-900 hover:text-amber-800"
              >
                पूरा विश्लेषण →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {summary.low_stock_count > 0 ? (
                <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/70 text-xs shadow-2xs">
                  <div className="font-black text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    कम स्टॉक सूचना
                  </div>
                  <div className="text-slate-700 mt-1 leading-snug font-medium">
                    <span className="font-bold text-slate-900">{summary.low_stock_count}</span> सामान अपनी न्यूनतम सीमा पर पहुंच चुके हैं।
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-slate-200 bg-white/80 text-xs shadow-2xs">
                  <div className="font-bold text-slate-900">पर्याप्त स्टॉक मौजूद</div>
                  <div className="text-slate-600 mt-1">सभी प्रमुख सामान पर्याप्त मात्रा में उपलब्ध हैं।</div>
                </div>
              )}

              {summary.outstanding_supplier_payments > 0 ? (
                <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/70 text-xs shadow-2xs">
                  <div className="font-black text-amber-950 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-700" />
                    व्यापारी उधारी बकाया
                  </div>
                  <div className="text-slate-700 mt-1 leading-snug font-medium">
                    कुल <span className="font-black text-slate-900 font-mono">₹{summary.outstanding_supplier_payments.toLocaleString('en-IN')}</span> व्यापारियों को चुकाने बाकी हैं।
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-slate-200 bg-white/80 text-xs shadow-2xs text-slate-700">
                  <div className="font-bold text-slate-900">कोई उधारी बाकी नहीं</div>
                  <div className="text-slate-500 mt-1">सभी व्यापारियों का हिसाब चुकता है।</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>शुद्ध बहीखाता लेजर</span>
            <span className="font-bold text-slate-800">100% सटीक हिसाब</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="glass-panel rounded-3xl border border-white/80 shadow-card-3d overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-200/40 flex items-center justify-between bg-white/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
              <h2 className="text-sm font-black text-slate-900">हाल के लेन-देन (Recent Transactions)</h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">दुकान के गल्ले और खाते की ताज़ा एंट्रीज</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-bold text-slate-900 hover:text-amber-900 bg-white/90 px-3.5 py-1.5 rounded-xl border border-amber-200/70 shadow-2xs hover:bg-amber-50 transition-colors"
          >
            पूरा रोज़नामचा →
          </button>
        </div>

        {summary.recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            अभी तक कोई लेन-देन दर्ज नहीं हुआ है।
          </div>
        ) : (
          <div className="divide-y divide-amber-100/50">
            {summary.recent_transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/60 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold shadow-2xs ${
                    tx.type === 'sale'
                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                      : 'bg-slate-100 text-slate-900 border border-slate-200'
                  }`}>
                    {tx.type === 'sale' ? (
                      <ArrowUpRight className="w-4 h-4 text-amber-800" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-slate-700" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 leading-snug">
                      {tx.description}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span>
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {tx.payment_method && (
                        <span className="bg-amber-100/80 text-amber-950 font-bold px-2 py-0.2 rounded-full text-[10px]">
                          {tx.payment_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-black font-mono ${
                    tx.type === 'sale' ? 'text-amber-900' : 'text-slate-900'
                  }`}>
                    {tx.type === 'sale' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    tx.type === 'sale'
                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}>
                    {tx.type === 'sale' ? 'बिक्री' : tx.type === 'purchase' ? 'खरीद' : tx.type === 'expense' ? 'खर्चा' : 'भुगतान'}
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
