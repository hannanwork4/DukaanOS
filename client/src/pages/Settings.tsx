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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleAutoConfigureClaude = async () => {
    setIsConfiguringClaude(true);
    try {
      const res = await api.autoConfigureClaude();
      setClaudeConnected(true);
      if (res.configuredOnDisk) {
        showToast('success', 'Claude is connected directly! Open Claude to begin speaking with your store.');
      } else {
        const batScript = `@echo off
title DukaanOS - 1-Click Claude Setup
echo ========================================================
echo        DukaanOS - 1-Click Claude Integration
echo ========================================================
echo.
echo Connecting DukaanOS Store to Claude Desktop...

set "CLAUDE_DIR=%APPDATA%\\Claude"
if not exist "%CLAUDE_DIR%" mkdir "%CLAUDE_DIR%"

powershell -Command "$cfg = @{ mcpServers = @{ dukaanos = @{ command = 'node'; args = @('C:\\Users\\DELL\\Desktop\\DukaanOS\\mcp\\dist\\stdio.js'); env = @{ API_URL = 'https://dukaanos-plum.vercel.app'; DEFAULT_BUSINESS_ID = '${business?.id || 'b0000000-0000-0000-0000-000000000001'}' } } } } | ConvertTo-Json -Depth 5; Set-Content -Path \\"$env:APPDATA\\Claude\\claude_desktop_config.json\\" -Value $cfg"

echo.
echo [SUCCESS] Claude is now directly connected to your DukaanOS Store!
echo Launch Claude Desktop, and your Kirana store tools will be active with the hammer icon.
echo ========================================================
pause
`;
        const blob = new Blob([batScript], { type: 'application/bat' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Connect-Claude.bat';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('success', 'Connect-Claude.bat downloaded! Click it once to instantly configure Claude Desktop.');
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
      showToast('success', 'Sample Kirana store catalog restored successfully.');
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to restore sample store data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await api.deleteAccount(business?.id);
      showToast('success', res.message || 'Your store account and records have been permanently erased under the DPDP Act 2023.');
      setIsDeleteModalOpen(false);
      localStorage.removeItem('dukaanos_token');
      localStorage.removeItem('dukaanos_business_id');
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
              <span>1-Click Claude Integration</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instantly connect Claude Desktop directly to DukaanOS. No JSON editing needed.
            </p>
          </div>

          <button
            onClick={handleAutoConfigureClaude}
            disabled={isConfiguringClaude}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-sm font-extrabold shadow-btn-3d border-2 border-black hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>
              {isConfiguringClaude ? 'Configuring Claude...' : 'Connect to Claude Desktop'}
            </span>
          </button>
        </div>

        {/* VOICE PROMPTS FOR CLAUDE */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="text-xs font-semibold text-zinc-400">
            What you can speak or ask Claude once connected:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              "\"What are today's sales and low stock items?\"",
              "\"Add 10 packets of Fortune Oil purchased from Ramesh\"",
              "\"How much outstanding money do I owe suppliers?\""
            ].map((prompt, idx) => (
              <div
                key={idx}
                onClick={() => {
                  navigator.clipboard.writeText(prompt.replace(/"/g, ''));
                  showToast('info', 'Prompt copied to clipboard! Paste it in Claude.');
                }}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-xs text-zinc-300 transition-all cursor-pointer hover:border-zinc-700"
              >
                {prompt}
              </div>
            ))}
          </div>
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
              Developer & Technical Specs
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              View MCP SSE endpoints, raw server tools (19 active tools), and JSON specifications.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-black group-hover:translate-x-1 transition-transform">
          <span>View Specs</span>
          <ArrowRight className="w-4 h-4" />
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
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-black rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-700" />
            <span>Permanently Delete Store Account</span>
          </button>
        </div>
      </div>

      {/* Restore Sample Data Confirm Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title={t('confirmResetTitle') || 'Restore Sample Catalog'}
        message={t('confirmResetMsg') || 'Are you sure you want to restore the sample Kirana store catalog and records?'}
        confirmText={t('resetBtn') || 'Restore Sample Catalog'}
        cancelText={t('cancelBtn') || 'Cancel'}
        isDestructive={false}
        onConfirm={handleSeedData}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* DPDP ACT ACCOUNT DELETION CONFIRMATION DIALOG (YES / NO) */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Permanently Delete Store Account?"
        message="Are you sure you want to permanently delete your store and all associated records under the DPDP Act 2023? This will erase all products, counter sales, supplier dues, and customer ledgers. This action cannot be undone."
        confirmText={isDeletingAccount ? "Erasing..." : "Yes, Delete Store"}
        cancelText="No, Keep Store"
        isDestructive={true}
      />
    </div>
  );
};
