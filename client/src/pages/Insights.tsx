import React from 'react';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
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
      <div className="pb-3 border-b border-zinc-200/80">
        <h1 className="text-xl font-bold tracking-tight text-black">
          Deterministic Store Intelligence
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Calculated strictly from actual recorded stock, sales, expenses, and supplier transactions.
        </p>
      </div>

      {/* 3D Glass Banner */}
      <div className="p-4 glass-panel rounded-2xl border border-zinc-200 shadow-card-3d text-xs text-zinc-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-black shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-black">100% Deterministic Arithmetic: </span>
          All metrics and recommendations shown below are evaluated directly against your ledger entries and inventory thresholds without external AI model speculation.
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-400 glass-panel rounded-3xl border border-zinc-200 shadow-card-3d">
          No insights generated yet. Record inventory restocks and sales to generate analytics.
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
                className="glass-panel p-5 rounded-3xl border border-zinc-200 shadow-card-3d hover:shadow-card-3d-hover hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-100 text-black">
                        {isAlert && <AlertTriangle className="w-4 h-4 text-black" />}
                        {isWarning && <AlertTriangle className="w-4 h-4 text-black" />}
                        {isPositive && <TrendingUp className="w-4 h-4 text-black" />}
                        {!isAlert && !isWarning && !isPositive && <BarChart3 className="w-4 h-4 text-black" />}
                      </div>
                      <h3 className="font-bold text-xs text-black">{ins.title}</h3>
                    </div>

                    {ins.metric && (
                      <span className="font-mono text-xs font-bold text-black bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200">
                        {ins.metric}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-zinc-600 leading-relaxed font-normal">
                    {ins.message}
                  </p>
                </div>

                {ins.action_suggested && (
                  <div className="mt-4 pt-3 border-t border-zinc-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-medium">Recommendation:</span>
                    <span className="text-black font-semibold">{ins.action_suggested}</span>
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
