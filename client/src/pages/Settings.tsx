import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Code2,
  RefreshCcw,
  ShieldCheck,
  FileText,
  Lock,
  LogOut,
  Trash2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Business } from '../types';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { TechnicalDetails } from './TechnicalDetails';
import { useTranslation } from '../i18n/LanguageContext';

interface SettingsProps {
  business: Business | null;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  business,
  onRefresh,
  showToast,
  onNavigate,
  onLogout
}) => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<'main' | 'tech'>('main');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isConfiguringClaude, setIsConfiguringClaude] = useState(false);
  const [claudeConnected, setClaudeConnected] = useState(false);

  // DPDP Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleAutoConfigureClaude = async () => {
    setIsConfiguringClaude(true);
    try {
      const res = await api.autoConfigureClaude();
      setClaudeConnected(true);
      if (res.configuredOnDisk) {
        showToast('success', res.message || 'Connected directly to Claude Desktop! Restart Claude to begin.');
      } else {
        // Trigger browser download of claude_desktop_config.json for remote users
        const blob = new Blob([JSON.stringify(res.config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'claude_desktop_config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('success', 'claude_desktop_config.json downloaded! Place it in your Claude configuration folder.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to connect Claude.');
    } finally {
      setIsConfiguringClaude(false);
    }
  };

  const handleSeedData = async () => {
    setIsResetting(true);
    try {
      await api.seedDemoData();
      showToast('success', 'Demo Kirana store data successfully seeded.');
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to seed demo data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      showToast('error', 'Please type DELETE to confirm permanent account erasure.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await api.deleteAccount(business?.id);
      showToast('success', res.message || 'Your store account and records have been permanently erased under the DPDP Act 2023.');
      setIsDeleteModalOpen(false);
      localStorage.removeItem('dukaanos_token');
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete store account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // If user opened the technical page, render TechnicalDetails component
  if (currentView === 'tech') {
    return (
      <TechnicalDetails
        business={business}
        onBack={() => setCurrentView('main')}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="pb-3 border-b border-black">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          {t('aiPlugTitle')}
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {t('aiPlugSubtitle')}
        </p>
      </div>

      {/* SHOPKEEPER-FRIENDLY CLAUDE CONNECTION CARD */}
      <div className="bg-[#0e0f11] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-black space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-white border border-zinc-700">
              <Bot className="w-3.5 h-3.5 text-white" />
              <span>{t('zeroAiArchitecture')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {t('claudeBrainHeading')}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {t('claudeBrainDesc')}
            </p>
          </div>

          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 items-center justify-center shrink-0">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* 1-CLICK CONNECT CLAUDE BUTTON */}
        <div className="p-5 bg-[#17181c] rounded-2xl border border-black flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Automatic Claude Integration</span>
              {claudeConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Configured
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              No manual JSON editing needed. Click below to automatically connect DukaanOS to your Claude Desktop.
            </p>
          </div>

          <button
            onClick={handleAutoConfigureClaude}
            disabled={isConfiguringClaude}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-sm font-extrabold shadow-btn-3d border-2 border-black hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>
              {isConfiguringClaude
                ? (t('connectingBtn') || 'Connecting...')
                : 'Click here to connect with Claude'}
            </span>
          </button>
        </div>
      </div>

      {/* DEVELOPER & TECHNICAL DETAILS TITLE CARD */}
      <div
        onClick={() => setCurrentView('tech')}
        className="glass-panel p-5 sm:p-6 rounded-3xl border border-black shadow-card-3d bg-white hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-black flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
            <Code2 className="w-6 h-6 text-black group-hover:text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-black flex items-center gap-2">
              Developer & Technical Integration Details
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Click to view raw JSON configurations, remote Claude MCP SSE endpoints, and active tool specifications.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-black group-hover:translate-x-1 transition-transform">
          <span>View Specs</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* SAMPLE STORE DATA RESET CARD */}
      <div className="glass-panel rounded-3xl p-6 border border-black shadow-card-3d bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-black flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-black" />
              <span>{t('demoStoreData') || 'Sample Store Catalog'}</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {t('demoStoreDataSub') || 'Restore standard Kirana store baseline products, inventory, and supplier records for testing.'}
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 border border-black rounded-xl transition-all cursor-pointer"
          >
            {isResetting ? (t('resettingBtn') || 'Resetting...') : (t('resetDemoDataBtn') || 'Restore Sample Data')}
          </button>
        </div>
      </div>

      {/* DPDP ACT 2023, PRIVACY & ACCOUNT CONTROLS */}
      <div className="glass-panel rounded-3xl p-6 border border-black shadow-card-3d bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-black pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-black" />
            <div>
              <h3 className="text-sm font-bold text-black">Data Privacy & Account Controls</h3>
              <p className="text-xs text-zinc-500">Digital Personal Data Protection (DPDP) Act, 2023 Compliance</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-black border border-black">
            DPDP Compliant
          </span>
        </div>

        {/* Legal Documents Navigation Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate ? onNavigate('terms') : setCurrentView('tech')}
            className="p-3.5 rounded-2xl bg-zinc-50 border border-black hover:bg-zinc-100 transition-colors flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-black" />
              <div>
                <div className="text-xs font-bold text-black">Terms & Conditions</div>
                <div className="text-[11px] text-zinc-500">Store ownership & retail terms</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={() => onNavigate ? onNavigate('privacy') : setCurrentView('tech')}
            className="p-3.5 rounded-2xl bg-zinc-50 border border-black hover:bg-zinc-100 transition-colors flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-black" />
              <div>
                <div className="text-xs font-bold text-black">Privacy Policy</div>
                <div className="text-[11px] text-zinc-500">Your rights under DPDP Act 2023</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>

        {/* Sign Out & Account Erasure Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 border border-black rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-black" />
              <span>Sign Out of Store Account</span>
            </button>
          )}

          <button
            onClick={() => {
              setDeleteConfirmationText('');
              setIsDeleteModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-black rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-700" />
            <span>Permanently Delete Store Account</span>
          </button>
        </div>
      </div>

      {/* Reset Demo Data Confirm Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title={t('confirmResetTitle')}
        message={t('confirmResetMsg')}
        confirmText={t('resetBtn')}
        cancelText={t('cancelBtn')}
        isDestructive={true}
        onConfirm={handleSeedData}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* DPDP ACT ACCOUNT DELETION CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete Store Account"
        subtitle="Digital Personal Data Protection Act, 2023 — Right to Erasure"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-black rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-rose-900">Irreversible Action:</strong>
              Under Section 12 of the DPDP Act 2023, confirming erasure will permanently delete your store 
              profile, product inventories, counter sales, supplier dues, and customer ledgers from active storage.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-black">
              Type <span className="font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-black rounded-xl font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 border border-black rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteConfirmationText !== 'DELETE' || isDeletingAccount}
              onClick={handleDeleteAccount}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 border border-black rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingAccount ? 'Erasing...' : 'Confirm Erasure'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
