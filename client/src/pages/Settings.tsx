import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Copy,
  Check,
  RefreshCcw,
  ExternalLink,
  ShieldAlert,
  Server
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
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Settings & MCP Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Claude connectivity, shop credentials, and demonstration reset.
        </p>
      </div>

      {/* Shop Profile Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Store Profile</h2>
            <p className="text-xs text-slate-500">Business details for invoice headers and audit</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700">
            ID: {business?.id.slice(0, 13)}...
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Store Name:</span>
            <span className="font-semibold text-slate-900">{business?.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Owner / Proprietor:</span>
            <span className="font-semibold text-slate-900">{business?.owner_name || 'Rajesh Sharma'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Contact Phone:</span>
            <span className="font-semibold text-slate-900 font-mono">{business?.phone || '+91 98765 43210'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Address:</span>
            <span className="font-semibold text-slate-900">{business?.address || 'Shop No. 4, Main Market, Lajpat Nagar'}</span>
          </div>
        </div>
      </div>

      {/* Claude MCP Integration Guide */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Claude MCP Integration</h2>
              <p className="text-xs text-slate-500">Connect Claude to operate DukaanOS via natural voice or text</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Port 4001 • Ready
          </span>
        </div>

        {/* Remote SSE Connection */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-800">Remote MCP Endpoint (Streamable HTTP / SSE):</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded text-xs font-mono text-slate-800 select-all">
              {mcpUrl}
            </code>
            <button
              onClick={copyMcpUrl}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedUrl ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        </div>

        {/* Claude Desktop Config JSON */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-800">Claude Desktop Config (claude_desktop_config.json):</div>
            <button
              onClick={copyConfig}
              className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-medium"
            >
              {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedConfig ? 'Copied to Clipboard' : 'Copy JSON'}
            </button>
          </div>
          <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
            {JSON.stringify(claudeDesktopConfig, null, 2)}
          </pre>
        </div>

        {/* Registered Tools List */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-800 mb-2">Registered MCP Tools (18 Tools):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {mcpToolsList.map((t) => (
              <div key={t.name} className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                <span className="font-mono font-bold text-slate-900">{t.name}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Demo Environment & Seed Data</h2>
            <p className="text-xs text-slate-500">
              Reset store data to clean seed state for 5-minute evaluation demonstration.
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-xs"
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
        message="This will reset products, suppliers, and recent transactions back to the clean demonstration Kirana dataset. Continue?"
        confirmText="Reload Seed Data"
        isDestructive={false}
      />
    </div>
  );
};

