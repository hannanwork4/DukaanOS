import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface TermsAndConditionsProps {
  onBack: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between pb-4 border-b border-black">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 border border-black rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-black" />
          <span>{t('backBtn') || 'Back'}</span>
        </button>
        <span className="text-xs font-mono text-zinc-500">Last updated: November 2026</span>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-black shadow-card-3d bg-white space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">Terms & Conditions</h1>
            <p className="text-xs text-zinc-500">DukaanOS Operating System for Retailers & Kirana Stores</p>
          </div>
        </div>

        <div className="space-y-5 text-sm text-zinc-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              1. Acceptance of Terms
            </h2>
            <p>
              By signing up for, accessing, or using DukaanOS (referred to herein as "the Platform", "we", "us"), 
              you ("Merchant", "Store Owner", "User") agree to be bound by these Terms and Conditions. If you do 
              not agree to all terms, please discontinue use immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              2. Nature of Service & Zero-AI Liability
            </h2>
            <p>
              DukaanOS provides a local-first inventory, counter billing, supplier ledger, and retail operating system. 
              DukaanOS utilizes the open Model Context Protocol (MCP) to allow Merchants to connect their own Claude AI 
              assistant using the Merchant's own account. 
            </p>
            <p className="bg-zinc-50 p-3.5 rounded-xl border border-black text-xs text-zinc-800">
              <strong>Notice on AI Operations:</strong> DukaanOS charges no AI subscription fees and does not host generative AI models. 
              Calculations, summaries, and automated invoice parsing executed via third-party AI assistants are advisory; the Merchant 
              remains solely responsible for confirming final billing totals, customer credit balances (Udhar), and tax/GST filings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              3. Store Account & Security
            </h2>
            <p>
              Merchants are responsible for maintaining the confidentiality of their credentials and one-time passwords (OTP). 
              Any activities carried out under your registered business profile are your sole responsibility. You agree to notify 
              us immediately of any unauthorized access to your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              4. Merchant Data & Intellectual Property
            </h2>
            <p>
              You retain 100% ownership of your store data, including product listings, supplier directories, transactions, 
              and customer khata logs. DukaanOS does not sell, rent, or monetize your store's customer purchase histories or financial figures.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              5. Termination & Data Erasure
            </h2>
            <p>
              You may terminate your store account at any time via the Settings panel. In accordance with the Digital Personal 
              Data Protection (DPDP) Act, 2023, selecting "Delete Account" immediately and irrevocably erases all associated store 
              ledgers, supplier balances, customer logs, and products from active database storage.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              6. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising 
              hereunder shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-black flex items-center justify-between">
          <span className="text-xs text-zinc-500">DukaanOS Legal Department</span>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Close & Return
          </button>
        </div>
      </div>
    </div>
  );
};

