import React from 'react';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Truck,
  Receipt,
  ShieldCheck,
  ChevronRight
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
      <div className="pb-3 border-b border-amber-200/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            दुकान विश्लेषण <span className="text-sm font-bold text-slate-600">/ Store Analytics</span>
          </h1>
        </div>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          दुकान के वास्तविक लेजर और स्टॉक डेटा पर आधारित 100% सटीक विश्लेषण
        </p>
      </div>

      {/* 3D Glass Banner */}
      <div className="p-4 glass-panel rounded-2xl border border-white/80 shadow-card-3d text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-black text-slate-900">100% शुद्ध गणितीय हिसाब: </span>
          नीचे दिए गए सभी आंकड़े और सुझाव दुकान की असली खरीद, बिक्री, खर्चे और स्टॉक के आधार पर गिने गए हैं — बिना किसी अंदाज़े के।
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-3xl border border-white/80 shadow-card-3d">
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
                className={`p-5 rounded-3xl border shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all flex flex-col justify-between ${
                  isAlert || isWarning
                    ? 'border-amber-300 bg-amber-50/70'
                    : 'glass-panel border-white/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-2xl shadow-2xs ${
                        isAlert || isWarning
                          ? 'bg-amber-200 text-amber-950 font-black'
                          : 'bg-slate-100 text-slate-900 font-bold'
                      }`}>
                        {isAlert && <AlertTriangle className="w-4 h-4" />}
                        {isWarning && <AlertTriangle className="w-4 h-4" />}
                        {isPositive && <TrendingUp className="w-4 h-4" />}
                        {!isAlert && !isWarning && !isPositive && <BarChart3 className="w-4 h-4" />}
                      </div>
                      <h3 className="font-black text-xs text-slate-900">{ins.title}</h3>
                    </div>

                    {ins.metric && (
                      <span className="font-mono text-xs font-black text-slate-900 bg-white/90 px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                        {ins.metric}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-slate-700 leading-relaxed font-medium">
                    {ins.message}
                  </p>
                </div>

                {ins.action_suggested && (
                  <div className="mt-4 pt-3 border-t border-amber-200/40 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">सुझाव:</span>
                    <span className="text-slate-900 font-black">{ins.action_suggested}</span>
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
