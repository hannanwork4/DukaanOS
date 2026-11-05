import React, { useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Copy,
  Check,
  Code2,
  Sparkles,
  Terminal,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { Business } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface TechnicalDetailsProps {
  business: Business | null;
  onBack: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const TechnicalDetails: React.FC<TechnicalDetailsProps> = ({
  business,
  onBack,
  showToast
}) => {
  const { t } = useTranslation();
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const mcpUrl = 'http://localhost:4001/sse';
  const businessId = business?.id || 'b0000000-0000-0000-0000-000000000001';

  const claudeDesktopConfig = {
    mcpServers: {
      dukaanos: {
        command: "node",
        args: [
          "C:\\Users\\DELL\\Desktop\\DukaanOS\\mcp\\dist\\stdio.js"
        ],
        env: {
          DEFAULT_BUSINESS_ID: businessId
        }
      }
    }
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(claudeDesktopConfig, null, 2));
    setCopiedConfig(true);
    showToast('success', 'Claude Desktop JSON configuration copied to clipboard.');
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const copyMcpUrl = () => {
    navigator.clipboard.writeText(mcpUrl);
    setCopiedUrl(true);
    showToast('success', 'Remote Claude MCP SSE URL copied to clipboard.');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const mcpToolsList = [
    { name: 'get_business_pulse', desc: 'Executive morning briefing: overnight activity, revenue, dues, and urgent restock' },
    { name: 'record_bulk_invoice', desc: 'Parses handwritten slips & kaccha parchis: auto-matches products and updates stock' },
    { name: 'record_customer_credit', desc: 'Customer Khata (Udhar): logs customer credit book and creates WhatsApp reminder' },
    { name: 'record_customer_payment', desc: 'Settles customer udhar balance and updates cash book' },
    { name: 'generate_whatsapp_reminder', desc: 'Drafts polite WhatsApp payment reminder in Hindi/English/Telugu with 1-click link' },
    { name: 'draft_supplier_restock_order', desc: 'Drafts wholesale purchase restock WhatsApp order for depleted inventory items' },
    { name: 'record_sale', desc: 'Record counter sale: fuzzy product matching, deducts stock & computes profit' },
    { name: 'record_purchase', desc: 'Log restock: auto-increments stock and tracks supplier dues' },
    { name: 'get_low_stock_products', desc: 'Get items below minimum safety threshold' },
    { name: 'get_supplier_balance', desc: 'Check supplier outstanding dues and settlement history' },
    { name: 'record_supplier_payment', desc: 'Clear supplier dues without creating double expense' },
    { name: 'record_expense', desc: 'Log shop operating costs: electricity, rent, wages, freight' },
    { name: 'add_product', desc: 'Add new product with unit price and safety threshold' },
    { name: 'list_products', desc: 'List active inventory items with real-time stock levels' },
    { name: 'update_product', desc: 'Update prices or minimum stock threshold with fuzzy lookup' },
    { name: 'add_supplier', desc: 'Register supplier contact and business profile' },
    { name: 'list_suppliers', desc: 'List suppliers with total purchases and outstanding dues' },
    { name: 'list_sales', desc: 'List sales history with profit breakdown' },
    { name: 'list_purchases', desc: 'List purchase receipts with line items' },
    { name: 'get_dashboard_summary', desc: 'Real-time overview of sales, stock valuation and dues' },
    { name: 'get_business_insights', desc: 'Deterministic insights on low stock and dead stock' },
    { name: 'get_inventory_summary', desc: 'Inventory valuation and category breakdown' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-black">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 border border-black rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-black" />
          <span>{t('backBtn') || 'Back to Store Settings'}</span>
        </button>
        <span className="text-xs font-mono text-zinc-500">Claude Integration & MCP Hub</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black flex items-center gap-2.5">
          <Code2 className="w-6 h-6 text-black" />
          Claude MCP Technical Specifications
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Complete JSON configuration, Model Context Protocol (MCP) endpoints, and tool specifications for Claude.
        </p>
      </div>

      {/* Claude Desktop Stdio & Remote SSE Configuration */}
      <div className="bg-[#0e0f11] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-black space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-white border border-zinc-700">
              <Bot className="w-3.5 h-3.5 text-white" />
              <span>Model Context Protocol (MCP) for Claude</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-2">
              Claude Desktop Configuration File
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-800 text-emerald-400 border border-zinc-700 self-start sm:self-auto">
            stdio & SSE protocol
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">
                Windows Path: <code className="text-emerald-400 font-mono">%APPDATA%\Claude\claude_desktop_config.json</code>
              </span>
              <button
                onClick={copyConfig}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 border border-black transition-colors cursor-pointer"
              >
                {copiedConfig ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedConfig ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="bg-[#17181c] text-zinc-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto border border-black leading-relaxed">
              {JSON.stringify(claudeDesktopConfig, null, 2)}
            </pre>
          </div>

          {/* Remote SSE Endpoint */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white">Remote Claude MCP SSE Endpoint</div>
              <div className="text-[11px] text-zinc-400">For connecting Claude to a remote server or tunnel</div>
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-[#17181c] border border-black px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-300">
                {mcpUrl}
              </code>
              <button
                onClick={copyMcpUrl}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-black transition-colors cursor-pointer"
              >
                {copiedUrl ? 'Copied' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active MCP Tools Catalog */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-black shadow-card-3d bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-black pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">Active MCP Tools for Claude</h3>
              <p className="text-xs text-zinc-500">{mcpToolsList.length} tools exposed to Claude</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-black border border-black">
            Claude MCP v1.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {mcpToolsList.map((tool, idx) => (
            <div key={idx} className="p-3.5 bg-zinc-50 rounded-2xl border border-black flex flex-col justify-between">
              <div>
                <div className="font-mono font-bold text-xs text-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                  {tool.name}
                </div>
                <div className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                  {tool.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
