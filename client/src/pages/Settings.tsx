import React, { useState } from 'react';
import {
  Server,
  Copy,
  Check,
  RefreshCcw
} from 'lucide-react';
import { Business } from '../types';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface SettingsProps {
  business: Business | null;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ business, onRefresh, showToast }) => {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const mcpUrl = 'http://localhost:4001/sse';

  const claudeDesktopConfig = {
    mcpServers: {
      dukaanos: {
        command: "node",
        args: [
          "C:\\Users\\DELL\\Desktop\\DukaanOS\\mcp\\dist\\stdio.js"
        ]
      }
    }
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(claudeDesktopConfig, null, 2));
    setCopiedConfig(true);
    showToast('success', 'Claude Desktop configuration copied to clipboard.');
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const copyMcpUrl = () => {
    navigator.clipboard.writeText(mcpUrl);
    setCopiedUrl(true);
    showToast('success', 'Remote MCP SSE URL copied to clipboard.');
    setTimeout(() => setCopiedUrl(false), 2000);
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

  const mcpToolsList = [
    { name: 'add_product', desc: 'Add new product with unit price and safety threshold' },
    { name: 'list_products', desc: 'List active inventory items with real-time stock levels' },
    { name: 'update_product', desc: 'Update prices or minimum stock threshold' },
    { name: 'get_low_stock_products', desc: 'Get items below minimum safety threshold' },
    { name: 'add_supplier', desc: 'Register supplier contact and business profile' },
    { name: 'list_suppliers', desc: 'List suppliers with total purchases and outstanding dues' },
    { name: 'get_supplier_balance', desc: 'Check current balance and settlement history' },
    { name: 'record_purchase', desc: 'Log restock: auto-increments stock and tracks supplier dues' },
    { name: 'list_purchases', desc: 'List purchase receipts with line items' },
    { name: 'update_purchase', desc: 'Safely reverse and recalculate edited purchases' },
    { name: 'record_sale', desc: 'Record counter sale: deducts stock & computes gross profit' },
    { name: 'list_sales', desc: 'List sales history with profit breakdown' },
    { name: 'record_expense', desc: 'Log shop operating costs: electricity, rent, freight' },
    { name: 'list_expenses', desc: 'List shop overheads' },
    { name: 'record_supplier_payment', desc: 'Clear supplier dues without creating double expense' },
    { name: 'get_dashboard_summary', desc: 'Real-time overview of sales, stock valuation and dues' },
    { name: 'get_business_insights', desc: 'Deterministic insights on low stock and dead stock' },
    { name: 'get_inventory_summary', desc: 'Inventory valuation and category breakdown' }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-200/80">
        <h1 className="text-xl font-bold tracking-tight text-black">
          Settings & MCP Connectivity
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Store profile, MCP connection endpoints, and evaluation seed data.
        </p>
      </div>

      {/* Shop Profile Card */}
      <div className="glass-panel rounded-3xl border border-zinc-200 shadow-card-3d p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60">
          <div>
            <h2 className="text-sm font-bold text-black">Store Profile</h2>
            <p className="text-xs text-zinc-500">Business details appearing on cash memos and audit records</p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
            ID: {business?.id.slice(0, 13)}...
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 font-medium block">Store Name:</span>
            <span className="font-bold text-black text-sm">{business?.name}</span>
          </div>
          <div>
            <span className="text-zinc-500 font-medium block">Proprietor / Owner:</span>
            <span className="font-bold text-black text-sm">{business?.owner_name || 'Rajesh Sharma'}</span>
          </div>
          <div>
            <span className="text-zinc-500 font-medium block">Contact Phone:</span>
            <span className="font-bold text-black font-mono">{business?.phone || '+91 98765 43210'}</span>
          </div>
          <div>
            <span className="text-zinc-500 font-medium block">Address:</span>
            <span className="font-bold text-black">{business?.address || 'Shop No. 4, Main Market'}</span>
          </div>
        </div>
      </div>

      {/* MCP Integration Guide */}
      <div className="glass-panel rounded-3xl border border-zinc-200 shadow-card-3d p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-black" />
            <div>
              <h2 className="text-sm font-bold text-black">Model Context Protocol (MCP)</h2>
              <p className="text-xs text-zinc-500">Connect external voice or vision agents to DukaanOS tools</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-black border border-zinc-200">
            Port 4001 • Ready
          </span>
        </div>

        {/* Remote SSE Connection */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-black">Remote MCP SSE URL:</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-zinc-200 px-3.5 py-2.5 rounded-xl text-xs font-mono text-black select-all font-bold">
              {mcpUrl}
            </code>
            <button
              onClick={copyMcpUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-black text-white rounded-xl shadow-btn-3d hover:bg-zinc-800 transition-all cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedUrl ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        </div>

        {/* Claude Desktop Config JSON */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-black">Claude Desktop Configuration (claude_desktop_config.json):</div>
            <button
              onClick={copyConfig}
              className="inline-flex items-center gap-1 text-xs text-black hover:text-zinc-600 font-bold cursor-pointer"
            >
              {copiedConfig ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedConfig ? 'Copied to Clipboard' : 'Copy JSON'}
            </button>
          </div>
          <pre className="bg-black text-white p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-zinc-800">
            {JSON.stringify(claudeDesktopConfig, null, 2)}
          </pre>
        </div>

        {/* Registered Tools List */}
        <div className="pt-3 border-t border-zinc-200/60">
          <div className="text-xs font-bold text-black mb-2">Registered MCP Tools (18 Tools Active):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {mcpToolsList.map((t) => (
              <div key={t.name} className="p-3 bg-white border border-zinc-200 rounded-xl text-xs">
                <span className="font-mono font-bold text-black">{t.name}</span>
                <p className="text-[10px] text-zinc-500 mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="glass-panel rounded-3xl border border-zinc-200 shadow-card-3d p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-black">Demo Environment Seed Data</h2>
            <p className="text-xs text-zinc-500">
              Reset catalog products, suppliers, and transactions back to sample retail baseline.
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={isResetting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-black bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-all shadow-btn-3d-white cursor-pointer"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting...' : 'Reload Demo Data'}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleSeedData}
        title="Reload Demo Seed Data"
        message="This will reset products, suppliers, and recent transactions back to the clean demonstration dataset. Continue?"
        confirmText="Reload Seed Data"
        isDestructive={false}
      />
    </div>
  );
};
