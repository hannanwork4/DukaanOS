import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  PackageX,
  Truck,
  Receipt,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { BusinessInsight } from '../types';

interface InsightsProps {
  insights: BusinessInsight[];
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
}

export const Insights: React.FC<InsightsProps> = ({ insights, onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-amber-200/70">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            दुकान की तरक्की व विश्लेषण <span className="text-sm font-normal text-amber-800">/ Store Insights</span>
          </h1>
        </div>
        <p className="text-xs text-amber-900/70 mt-0.5">
          दुकान के वास्तविक लेजर और इन्वेंट्री डेटा पर आधारित 100% सटीक विश्लेषण
        </p>
      </div>

      {/* Explanatory Banner */}
      <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5 shadow-warm">
        <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950">100% शुद्ध गणितीय हिसाब (Deterministic Intelligence): </span>
          नीचे दिए गए सभी आंकड़े और सुझाव दुकान की असली खरीद, बिक्री, खर्चे और स्टॉक के आधार पर गिने गए हैं — बिना किसी अंदाज़े या बाहरी AI निर्भरता के।
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-amber-200 shadow-warm">
          अभी तक कोई इनसाइट नहीं बनी है। दुकान में खरीद और बिक्री दर्ज करें।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((ins) => {
            const isAlert = ins.severity === 'alert';
            const isWarning = ins.severity === 'warning';
            const isPositive = ins.severity === 'positive';

            return (
              <div
                key={ins.id}
                className={`p-5 rounded-2xl border shadow-warm bg-white flex flex-col justify-between transition-all hover:shadow-warm-hover ${
                  isAlert
                    ? 'border-red-300 bg-red-50/30'
                    : isWarning
                    ? 'border-amber-300 bg-amber-50/30'
                    : isPositive
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${
                        isAlert
                          ? 'bg-red-100 text-red-700'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : isPositive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {isAlert && <AlertTriangle className="w-4 h-4" />}
                        {isWarning && <AlertTriangle className="w-4 h-4" />}
                        {isPositive && <TrendingUp className="w-4 h-4" />}
                        {!isAlert && !isWarning && !isPositive && <Sparkles className="w-4 h-4" />}
                      </div>
                      <h3 className="font-bold text-xs text-slate-900">{ins.title}</h3>
                    </div>

                    {ins.metric && (
                      <span className="font-mono text-xs font-extrabold text-amber-950 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">
                        {ins.metric}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-slate-700 leading-relaxed font-normal">
                    {ins.message}
                  </p>
                </div>

                {ins.action_suggested && (
                  <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-[11px]">
                    <span className="text-amber-900/70 font-semibold">सुझाव (Tip):</span>
                    <span className="text-amber-950 font-bold">{ins.action_suggested}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
