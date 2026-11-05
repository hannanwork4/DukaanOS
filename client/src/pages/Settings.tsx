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
      <div className="pb-3 border-b border-amber-200/70">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            सेटिंग्स व Claude MCP कॉन्फ़िगरेशन <span className="text-sm font-normal text-amber-800">/ Settings</span>
          </h1>
        </div>
        <p className="text-xs text-amber-900/70 mt-0.5">
          Claude AI वॉइस व फोटो इंटीग्रेशन, दुकान विवरण और डेमो डेटा
        </p>
      </div>

      {/* Shop Profile Card */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-warm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">दुकान प्रोफाइल (Store Profile)</h2>
            <p className="text-xs text-amber-900/70">कैश मेमो व इनवॉइस पर छपने वाला विवरण</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
            ID: {business?.id.slice(0, 13)}...
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">दुकान का नाम (Store Name):</span>
            <span className="font-bold text-slate-900 text-sm">{business?.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">दुकानदार / मालिक (Proprietor):</span>
            <span className="font-bold text-slate-900 text-sm">{business?.owner_name || 'Rajesh Sharma'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">संपर्क नंबर (Phone):</span>
            <span className="font-bold text-slate-900 font-mono">{business?.phone || '+91 98765 43210'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">दुकान का पता (Address):</span>
            <span className="font-bold text-slate-900">{business?.address || 'Shop No. 4, Main Market, Lajpat Nagar'}</span>
          </div>
        </div>
      </div>

      {/* Claude MCP Integration Guide */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-warm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Claude AI MCP कनेक्टिविटी</h2>
              <p className="text-xs text-amber-900/70">बोलकर या बिल फोटो खींचकर दुकान चलाने के लिए Claude को जोड़ें</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Port 4001 • Ready ✓
          </span>
        </div>

        {/* Remote SSE Connection */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900">रिमोट MCP SSE URL:</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-amber-50/50 border border-amber-200 px-3 py-2 rounded-xl text-xs font-mono text-amber-950 select-all font-semibold">
              {mcpUrl}
            </code>
            <button
              onClick={copyMcpUrl}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition-colors border border-amber-300"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedUrl ? 'कॉपी हुआ' : 'Copy URL'}
            </button>
          </div>
        </div>

        {/* Claude Desktop Config JSON */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">Claude Desktop Config (claude_desktop_config.json):</div>
            <button
              onClick={copyConfig}
              className="inline-flex items-center gap-1 text-xs text-orange-700 hover:text-orange-900 font-bold"
            >
              {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedConfig ? 'क्लिपबोर्ड पर कॉपी हुआ!' : 'Copy JSON'}
            </button>
          </div>
          <pre className="bg-slate-900 text-amber-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-amber-900/40">
            {JSON.stringify(claudeDesktopConfig, null, 2)}
          </pre>
        </div>

        {/* Registered Tools List */}
        <div className="pt-3 border-t border-amber-100">
          <div className="text-xs font-bold text-slate-900 mb-2">रजिस्टर्ड MCP टूल्स (18 Tools Active):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {mcpToolsList.map((t) => (
              <div key={t.name} className="p-2.5 bg-amber-50/40 border border-amber-200/70 rounded-xl text-xs">
                <span className="font-mono font-bold text-amber-950">{t.name}</span>
                <p className="text-[10px] text-amber-900/80 mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-warm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">डेमो किराना डेटा (Sample Store Data)</h2>
            <p className="text-xs text-amber-900/70">
              दुकान का पूरा सैंपल डेटा (प्रोडक्ट्स, सप्लायर्स, खरीद-बिक्री) रीलोड करें।
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-xl hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'लोड हो रहा है...' : 'डेमो डेटा रीलोड करें'}
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

