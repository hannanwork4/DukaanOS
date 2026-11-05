import React from 'react';
import { Printer, CheckCircle2, X } from 'lucide-react';
import { Sale, Business } from '../types';

interface ReceiptModalProps {
  sale: Sale | null;
  business: Business | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, business, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `BILL-${sale.id.slice(0, 8).toUpperCase()}`;
  const formattedDate = new Date(sale.sale_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
          <span className="text-xs font-semibold text-slate-700">Customer Bill / Cash Memo</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 overflow-y-auto font-sans text-slate-900 printable-area">
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-lg font-bold tracking-tight text-slate-950 uppercase">
              {business?.name || 'Sharma General Store'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Kirana & Daily Provisions Store</p>
            {business?.address && (
              <p className="text-[10px] text-slate-400 mt-0.5">{business.address}</p>
            )}
            {business?.phone && (
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Ph: {business.phone}</p>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="py-3 border-b border-dashed border-slate-300 text-xs flex justify-between">
            <div>
              <div className="text-slate-400 text-[10px]">INVOICE NO:</div>
              <div className="font-mono font-bold text-slate-900">{invoiceNumber}</div>
              <div className="text-slate-500 text-[10px] mt-1">
                Cust: <span className="font-medium text-slate-800">{sale.customer_name || 'Walk-in Cash Customer'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px]">DATE & TIME:</div>
              <div className="font-mono text-slate-700 text-[11px]">{formattedDate}</div>
              <div className="mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                  {sale.payment_method}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 text-[10px] border-b border-slate-100 pb-1">
                  <th className="text-left font-normal pb-1">ITEM</th>
                  <th className="text-center font-normal pb-1">QTY</th>
                  <th className="text-right font-normal pb-1">RATE</th>
                  <th className="text-right font-normal pb-1">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(sale.items || []).map((it, idx) => (
                  <tr key={idx} className="text-xs">
                    <td className="py-1.5 font-medium text-slate-800 pr-2">
                      {it.product_name}
                    </td>
                    <td className="py-1.5 text-center font-mono text-slate-600">
                      {it.quantity}
                    </td>
                    <td className="py-1.5 text-right font-mono text-slate-600">
                      ₹{Number(it.unit_price).toFixed(2)}
                    </td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                      ₹{Number(it.total_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Items:</span>
              <span className="font-mono">{(sale.items || []).length} items</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-950 pt-1 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="font-mono text-base">₹{Number(sale.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Amount Received:</span>
              <span className="font-mono text-emerald-700 font-bold">₹{Number(sale.amount_received).toFixed(2)}</span>
            </div>
            {sale.outstanding_amount > 0 && (
              <div className="flex justify-between text-xs text-amber-700 font-bold">
                <span>Khata Balance Due:</span>
                <span className="font-mono">₹{Number(sale.outstanding_amount).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400">
            <p>Thank you for shopping with us! Please visit again.</p>
            <p className="mt-0.5 font-mono text-[9px] text-slate-400">Computerized bill generated via DukaanOS</p>
          </div>
        </div>
      </div>
    </div>
  );
};
