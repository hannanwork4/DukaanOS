import React from 'react';
import { Printer, X, MessageCircle } from 'lucide-react';
import { Sale, Business } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface ReceiptModalProps {
  sale: Sale | null;
  business: Business | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, business, onClose }) => {
  const { t } = useTranslation();
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

  const handleWhatsAppShare = () => {
    const shopName = business?.name || 'Sri Venkateshwara Store';
    const lines = (sale.items || []).map(it => `• ${it.quantity}x ${it.product_name} - ₹${it.total_price}`).join('\n');
    const msg = `🧾 *${shopName}*\nBill: ${invoiceNumber}\nDate: ${formattedDate}\nCustomer: ${sale.customer_name || 'Cash Customer'}\n\n*Items:*\n${lines}\n\n*Total Bill: ₹${sale.total_amount}*\nAmount Paid: ₹${sale.amount_received}${sale.outstanding_amount > 0 ? `\n*Khata Balance Due: ₹${sale.outstanding_amount}*` : ''}\n\nThank you for your visit! 🙏`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-black overflow-hidden z-10 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black bg-zinc-50 print:hidden">
          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">{t('cashMemoTitle')}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              title="Share Bill via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t('shareWhatsAppBtn')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-black rounded-xl hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printBtn')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-black rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 overflow-y-auto font-sans text-black printable-area">
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-dashed border-zinc-300">
            <h2 className="text-xl font-extrabold tracking-tight text-black uppercase">
              {business?.name || 'Sri Venkateshwara Store'}
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5 font-medium">Kirana & Daily Provisions Store</p>
            {business?.address && (
              <p className="text-xs text-zinc-500 mt-0.5">{business.address}</p>
            )}
            {business?.phone && (
              <p className="text-xs text-zinc-600 font-mono mt-0.5">Ph: {business.phone}</p>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="py-3.5 border-b border-dashed border-zinc-300 text-xs flex justify-between">
            <div>
              <div className="text-zinc-500 text-xs font-semibold">INVOICE NO:</div>
              <div className="font-bold text-sm text-black font-mono">{invoiceNumber}</div>
              <div className="text-zinc-600 text-xs mt-1">
                Cust: <span className="font-semibold text-black">{sale.customer_name || 'Walk-in Cash Customer'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-zinc-500 text-xs font-semibold">DATE & TIME:</div>
              <div className="text-zinc-800 text-xs">{formattedDate}</div>
              <div className="mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-zinc-100 text-black border border-zinc-200">
                  {sale.payment_method}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-3.5 border-b border-dashed border-zinc-300">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase font-semibold border-b border-zinc-200 pb-1">
                  <th className="text-left pb-1.5 font-semibold">ITEM</th>
                  <th className="text-center pb-1.5 font-semibold">QTY</th>
                  <th className="text-right pb-1.5 font-semibold">RATE</th>
                  <th className="text-right pb-1.5 font-semibold">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(sale.items || []).map((it, idx) => (
                  <tr key={idx} className="text-xs sm:text-sm">
                    <td className="py-2 font-semibold text-black pr-2">
                      {it.product_name}
                    </td>
                    <td className="py-2 text-center tabular-nums text-zinc-700">
                      {it.quantity}
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-700">
                      ₹{Number(it.unit_price).toFixed(2)}
                    </td>
                    <td className="py-2 text-right tabular-nums font-bold text-black">
                      ₹{Number(it.total_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-3.5 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Total Items:</span>
              <span className="font-semibold text-black">{(sale.items || []).length} items</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-black pt-1.5 border-t border-zinc-200">
              <span>Grand Total:</span>
              <span className="tabular-nums text-lg font-bold">₹{Number(sale.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-zinc-700 font-medium">
              <span>Amount Received:</span>
              <span className="text-black font-bold tabular-nums">₹{Number(sale.amount_received).toFixed(2)}</span>
            </div>
            {sale.outstanding_amount > 0 && (
              <div className="flex justify-between text-xs sm:text-sm text-rose-600 font-bold">
                <span>Khata Balance Due:</span>
                <span className="tabular-nums underline">₹{Number(sale.outstanding_amount).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-3 border-t border-dashed border-zinc-300 text-center text-xs text-zinc-500">
            <p>Thank you for shopping with us! Please visit again.</p>
            <p className="mt-0.5 text-[11px] text-zinc-400 font-mono">DukaanOS • Digital Store Ledger</p>
          </div>
        </div>
      </div>
    </div>
  );
};
