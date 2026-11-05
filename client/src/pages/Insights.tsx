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
  ShieldCheck
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
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Deterministic Business Insights</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculated strictly from actual recorded stock, sales, expenses, and supplier transactions.
        </p>
      </div>

      {/* Explanatory Banner */}
      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">100% Deterministic Arithmetic: </span>
          All metrics and alerts shown below are evaluated directly against your ledger entries and inventory thresholds without external AI APIs or predictive speculation.
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200">
          No insights generated yet. Record inventory purchases and sales to generate shop analytics.
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
                className={`p-5 rounded-lg border shadow-xs bg-white flex flex-col justify-between transition-all ${
                  isAlert
                    ? 'border-red-200 bg-red-50/20'
                    : isWarning
                    ? 'border-amber-200 bg-amber-50/20'
                    : isPositive
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${
                        isAlert
                          ? 'bg-red-100 text-red-700'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700'
                          : isPositive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isAlert && <AlertTriangle className="w-4 h-4" />}
                        {isWarning && <AlertTriangle className="w-4 h-4" />}
                        {isPositive && <TrendingUp className="w-4 h-4" />}
                        {!isAlert && !isWarning && !isPositive && <Lightbulb className="w-4 h-4" />}
                      </div>
                      <h3 className="font-semibold text-xs text-slate-900">{ins.title}</h3>
                    </div>

                    {ins.metric && (
                      <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                        {ins.metric}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    {ins.message}
                  </p>
                </div>

                {ins.action_suggested && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Recommendation:</span>
                    <span className="text-slate-700 font-medium">{ins.action_suggested}</span>
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
