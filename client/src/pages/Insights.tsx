import React from 'react';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { BusinessInsight } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface InsightsProps {
  insights: BusinessInsight[];
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
}

export const Insights: React.FC<InsightsProps> = ({ insights, onNavigate }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-200/80">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
          {t('insightsTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          {t('insightsSub')}
        </p>
      </div>

      {/* Deterministic Banner */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-xs sm:text-sm text-zinc-600 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-black flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4.5 h-4.5 text-black" />
        </div>
        <div>
          <span className="font-bold text-black">{t('deterministicBadge')} </span>
          <span className="text-zinc-600 leading-relaxed">{t('deterministicDesc')}</span>
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="p-12 text-center text-sm text-zinc-400 bg-white rounded-3xl border border-black shadow-card-3d">
          {t('noInsights')}
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
                className="bg-white p-5 sm:p-6 rounded-2xl border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-card-3d hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-black text-black flex items-center justify-center shrink-0">
                        {isAlert && <AlertTriangle className="w-4 h-4 text-black" />}
                        {isWarning && <AlertTriangle className="w-4 h-4 text-black" />}
                        {isPositive && <TrendingUp className="w-4 h-4 text-black" />}
                        {!isAlert && !isWarning && !isPositive && <BarChart3 className="w-4 h-4 text-black" />}
                      </div>
                      <h3 className="font-bold text-sm text-black leading-snug">{ins.title}</h3>
                    </div>

                    {ins.metric && (
                      <span className="font-mono text-xs font-bold text-black bg-zinc-100 px-2.5 py-1 rounded-xl border border-black whitespace-nowrap">
                        {ins.metric}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                    {ins.message}
                  </p>
                </div>

                {ins.action_suggested && (
                  <div className="mt-4 pt-3.5 border-t border-black flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-zinc-50/80 p-3 rounded-xl border border-black">
                    <div className="flex items-center gap-1.5 font-bold text-black shrink-0">
                      <Zap className="w-3.5 h-3.5 text-black" />
                      <span>{t('recommendationLabel')}:</span>
                    </div>
                    <span className="text-zinc-700 font-medium leading-relaxed">{ins.action_suggested}</span>
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
