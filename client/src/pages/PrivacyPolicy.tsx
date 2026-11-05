import React from 'react';
import { ArrowLeft, Shield, Lock, Trash2, Eye, FileCheck, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
        <span className="text-xs font-mono text-zinc-500">DPDP Act (India) 2023 Compliant</span>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-black shadow-card-3d bg-white space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">Privacy Policy & Data Protection</h1>
            <p className="text-xs text-zinc-500">Notice under the Digital Personal Data Protection (DPDP) Act, 2023</p>
          </div>
        </div>

        {/* DPDP Act Key Rights Banner */}
        <div className="bg-zinc-50 p-4 rounded-2xl border border-black space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-black" />
            Your Statutory Rights Under Indian Law
          </div>
          <p className="text-xs text-zinc-600">
            As a Data Principal under the Digital Personal Data Protection Act, 2023, you hold absolute rights 
            to access, correct, update, and request complete erasure of your digital personal data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-black text-xs">
              <span className="font-bold text-black block">1. Right to Access</span>
              <span className="text-zinc-500 text-[11px]">View all store records & profile data at any time.</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-black text-xs">
              <span className="font-bold text-black block">2. Right to Correction</span>
              <span className="text-zinc-500 text-[11px]">Update your name, store address, phone or inventory.</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-black text-xs">
              <span className="font-bold text-black block">3. Right to Erasure</span>
              <span className="text-zinc-500 text-[11px]">Instant 1-click permanent deletion of your account.</span>
            </div>
          </div>
        </div>

        <div className="space-y-5 text-sm text-zinc-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              1. What Data We Process
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-700">
              <li><strong>Merchant Identity:</strong> Store name, owner name, verified email address, phone number, and physical store locality.</li>
              <li><strong>Commercial Records:</strong> Product inventory counts, purchase invoices, daily counter sales receipts, and operating expenses.</li>
              <li><strong>Customer & Supplier Ledger:</strong> Supplier balances and customer credit records (Khata/Udhar) entered by you to track receivables.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              2. Purpose of Processing (Lawful Grounds)
            </h2>
            <p>
              Under Section 4 and Section 7 of the DPDP Act 2023, personal data is collected and processed exclusively for 
              specified lawful purposes based on your explicit consent:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-700">
              <li>Generating point-of-sale customer receipts and inventory depletion registers.</li>
              <li>Allowing your personal Claude AI assistant to interact with store data via the local Model Context Protocol (MCP).</li>
              <li>Authenticating store sign-in sessions and preventing unauthorized account takeover.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              3. Zero Third-Party Advertising & No Data Selling
            </h2>
            <p>
              DukaanOS does <strong>not</strong> sell, license, share, or broker your store transactions or customer phone 
              numbers to advertisers, market researchers, or commercial aggregators. Your data remains strictly between you 
              and your store ledger.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              4. Exercise of Right to Erasure (Delete Account)
            </h2>
            <p>
              In accordance with Section 12(3) of the DPDP Act 2023, you can permanently erase your entire digital record at 
              any time. Simply navigate to <strong>Settings → Account Privacy & DPDP Act → Delete Store Account</strong>. 
              Once confirmed, our system executes a permanent database purge:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-700">
              <li>All store profile records, phone numbers, and emails are wiped.</li>
              <li>All product inventories, sales history, supplier accounts, and ledger entries are deleted immediately.</li>
              <li>No backup retention or shadow copies are preserved following confirmed erasure.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              5. Grievance Redressal
            </h2>
            <p className="text-xs">
              If you have any questions, concerns, or requests regarding your personal data rights under the DPDP Act 2023, 
              you may contact our designated Grievance Redressal Officer at: <code className="bg-zinc-100 px-2 py-0.5 rounded border border-black text-black font-mono">privacy@dukaanos.local</code>.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-black flex items-center justify-between">
          <span className="text-xs text-zinc-500">Compliant with DPDP Act, 2023</span>
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

