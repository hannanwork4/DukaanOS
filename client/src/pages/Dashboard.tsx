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
  HelpCircle,
  Mic,
  Camera,
  Coins
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
        <div className="h-8 bg-amber-100 rounded w-48"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-amber-50/50 rounded-xl border border-amber-200"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-200/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              दुकान Overview <span className="text-sm font-normal text-amber-800">/ Shop Summary</span>
            </h1>
          </div>
          <p className="text-xs text-amber-900/70 mt-0.5">
            आज की बिक्री, स्टॉक और उधारी का लाइव हिसाब-किताब
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenQuickPurchase}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-xl hover:bg-amber-100 transition-all shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
            + सप्लायर खरीद (Purchase)
          </button>
          <button
            onClick={onOpenQuickSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-orange-500/25 active:scale-98"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + नया बिल (New Sale)
          </button>
        </div>
      </div>

      {/* Claude Voice & Photo Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-white shadow-warm">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300/30 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shrink-0 border border-white/30 text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">📸 फोटो या 🎙️ बोलकर तुरंत एंट्री करें (Zero Manual Typing)</span>
                <span className="bg-yellow-300 text-amber-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Claude AI Voice & Scan
                </span>
              </div>
              <p className="text-xs text-amber-50/90 mt-1 leading-relaxed max-w-2xl">
                होलसेल पर्चे का फोटो खींचकर Claude में डालें या सीधे बोलें: <span className="font-semibold bg-white/15 px-1.5 py-0.5 rounded">"रमेश ट्रेडर्स से ₹2000 का तेल लिया, ₹1000 नकद दिया, ₹1000 बाकी"</span> — DukaanOS स्टॉक और उधारी अपने-आप अपडेट कर देगा।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-[11px] font-semibold border border-white/30">
              <Mic className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
              Hindi / Hinglish / English
            </span>
          </div>
        </div>
      </div>

      {/* Onboarding Guide if shop is empty */}
      {isBrandNewShop && (
        <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">दुकान में आपका स्वागत है! (Welcome to DukaanOS)</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              आपकी दुकान का खाता तैयार है। आप स्क्रीन से सीधे नया बिल बना सकते हैं या Claude से कह सकते हैं:
              <br />
              <span className="italic font-mono text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1.5 inline-block">
                "I bought 20 oil packets from Ramesh Traders for ₹2,000. I paid ₹1,000 and ₹1,000 is pending."
              </span>
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs font-semibold text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                डेमो किराना डेटा लोड करें (Load Kirana Sample Data) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Today's Sales */}
        <div className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-warm hover:shadow-warm-hover transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex items-center justify-between text-slate-600">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">आज की बिक्री</span>
              <span className="text-[11px] font-medium text-slate-500">Today's Sales</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            ₹{summary.today_sales.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium">
            {summary.sales_growth_percent !== undefined && summary.sales_growth_percent !== null ? (
              <span className={`inline-flex items-center gap-0.5 font-semibold ${
                summary.sales_growth_percent >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {summary.sales_growth_percent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownLeft className="w-3 h-3" />
                )}
                {summary.sales_growth_percent > 0 ? `+${summary.sales_growth_percent}%` : `${summary.sales_growth_percent}%`} vs कल
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                लाइव गल्ला (Revenue)
              </span>
            )}
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-warm hover:shadow-warm-hover transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
          <div className="flex items-center justify-between text-slate-600">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">आज की खरीद</span>
              <span className="text-[11px] font-medium text-slate-500">Purchases</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            ₹{summary.today_purchases.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-medium text-amber-800">
            नया माल गोदाम में
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-warm hover:shadow-warm-hover transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-400" />
          <div className="flex items-center justify-between text-slate-600">
            <div>
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">दुकान खर्चे</span>
              <span className="text-[11px] font-medium text-slate-500">Shop Expenses</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            ₹{summary.today_expenses.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-medium text-rose-700">
            किराया, बिजली, चाय-नाश्ता
          </div>
        </div>

        {/* Outstanding Supplier Dues */}
        <div className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-warm hover:shadow-warm-hover transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
          <div className="flex items-center justify-between text-slate-600">
            <div>
              <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">सप्लायर उधारी</span>
              <span className="text-[11px] font-medium text-slate-500">Supplier Dues</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-orange-900">
            ₹{summary.outstanding_supplier_payments.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-orange-700 font-semibold">
            व्यापारियों को देना बाकी
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-warm hover:shadow-warm-hover transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-400" />
          <div className="flex items-center justify-between text-slate-600">
            <div>
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">गोदाम माल मूल्य</span>
              <span className="text-[11px] font-medium text-slate-500">Stock Value</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            ₹{summary.total_inventory_value.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] font-medium text-indigo-700">
            खरीद लागत पर कुल माल
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => onNavigate('inventory')}
          className={`p-4 bg-white rounded-xl border shadow-warm hover:shadow-warm-hover transition-all cursor-pointer relative overflow-hidden group ${
            summary.low_stock_count > 0 ? 'border-red-300 bg-red-50/30' : 'border-amber-200/80'
          }`}
        >
          <div className={`absolute top-0 left-0 right-0 h-1 ${summary.low_stock_count > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
          <div className="flex items-center justify-between text-slate-600">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${summary.low_stock_count > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                कम स्टॉक चेतावनी
              </span>
              <span className="text-[11px] font-medium text-slate-500">Low Stock</span>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${summary.low_stock_count > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-xl font-extrabold ${summary.low_stock_count > 0 ? 'text-red-700' : 'text-emerald-800'}`}>
            {summary.low_stock_count} {summary.low_stock_count === 1 ? 'सामान' : 'सामान'}
          </div>
          <div className="mt-1 text-[11px] font-semibold">
            {summary.low_stock_count > 0 ? (
              <span className="text-red-700">माल खत्म होने वाला है!</span>
            ) : (
              <span className="text-emerald-700">पर्याप्त स्टॉक मौजूद</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-amber-200/80 shadow-warm p-5">
          <div className="flex items-center justify-between pb-4 border-b border-amber-100">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <h2 className="text-sm font-bold text-slate-900">7 दिन की बिक्री का ग्राफ (Weekly Sales Trend)</h2>
              </div>
              <p className="text-xs text-amber-900/70 mt-0.5">पिछले 7 दिनों में दुकान की दैनिक आमदनी</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-orange-700 hover:text-orange-900 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              पूरी बिक्री बही देखें →
            </button>
          </div>
          <div className="pt-4">
            <TrendChart data={summary.sales_trend} />
          </div>
        </div>

        {/* Quick Insights Highlights (1 column) */}
        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-warm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Sparkles className="w-4 h-4 text-orange-500" />
                दुकान की तरक्की (Insights)
              </div>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs font-semibold text-orange-700 hover:text-orange-900"
              >
                सभी देखें →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {summary.low_stock_count > 0 ? (
                <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/60 text-xs">
                  <div className="font-bold text-red-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    कम स्टॉक की सूचना
                  </div>
                  <div className="text-red-800 mt-1 leading-snug">
                    <span className="font-semibold">{summary.low_stock_count}</span> सामान अपनी न्यूनतम सीमा पर पहुंच चुके हैं। आज ही सप्लायर को ऑर्डर दें।
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="text-emerald-600">✓</span>
                    स्टॉक सुरक्षित है
                  </div>
                  <div className="text-emerald-800 mt-1 leading-snug">
                    दुकान में सभी मुख्य सामान का पर्याप्त स्टॉक मौजूद है।
                  </div>
                </div>
              )}

              {summary.outstanding_supplier_payments > 0 ? (
                <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/60 text-xs">
                  <div className="font-bold text-orange-950 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-orange-600" />
                    सप्लायर उधारी बाकी
                  </div>
                  <div className="text-orange-900 mt-1 leading-snug">
                    कुल <span className="font-bold text-orange-950 font-mono">₹{summary.outstanding_supplier_payments.toLocaleString('en-IN')}</span> व्यापारियों को चुकाने बाकी हैं।
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs text-amber-900">
                  <div className="font-bold text-amber-950">कोई उधारी बाकी नहीं</div>
                  <div className="text-amber-800 mt-1">सभी व्यापारियों का हिसाब चुकता है।</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100 text-[11px] text-amber-900/60 flex items-center justify-between">
            <span>DukaanOS शुद्ध लेजर रिकॉर्ड्स</span>
            <span className="font-medium text-amber-800">100% सटीक हिसाब</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-warm overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between bg-amber-50/30">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-bold text-slate-900">हाल के लेन-देन (Recent Transactions)</h2>
            </div>
            <p className="text-xs text-amber-900/70 mt-0.5">दुकान के गल्ले और खाते की ताज़ा एंट्रीज</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-orange-700 hover:text-orange-900 bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs hover:bg-amber-50 transition-colors"
          >
            पूरा रोज़नामचा (Khata) →
          </button>
        </div>

        {summary.recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            अभी तक कोई लेन-देन दर्ज नहीं हुआ है। नया बिल बनाएं या सामान खरीदें।
          </div>
        ) : (
          <div className="divide-y divide-amber-100/70">
            {summary.recent_transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-amber-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    tx.type === 'sale'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : tx.type === 'purchase'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : tx.type === 'expense'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {tx.type === 'sale' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-amber-800" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
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
                        <span className="bg-amber-100/80 text-amber-900 font-medium px-1.5 py-0.2 rounded text-[10px]">
                          {tx.payment_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-extrabold font-mono ${
                    tx.type === 'sale' ? 'text-emerald-700' : 'text-slate-900'
                  }`}>
                    {tx.type === 'sale' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    tx.type === 'sale'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : tx.type === 'purchase'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : tx.type === 'expense'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
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
