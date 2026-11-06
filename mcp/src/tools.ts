import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiClient } from './apiClient.js';

// Fuzzy Product Resolution Helper to prevent duplicate items from LLM naming variations
function findBestProductMatch(products: any[], query: string): any | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // 1. Exact Name or SKU Match
  let match = products.find(p => p.name.toLowerCase() === q || (p.sku && p.sku.toLowerCase() === q));
  if (match) return match;

  // 2. Substring Match (e.g. "cooking oil" in "Refined Cooking Oil 1L")
  match = products.find(p => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()));
  if (match) return match;

  // 3. Word Token Intersection Match
  const queryWords = q.split(/\s+/).filter(w => w.length > 2);
  let bestScore = 0;
  let bestProduct: any = null;

  for (const p of products) {
    const pWords = p.name.toLowerCase().split(/\s+/);
    let score = 0;
    for (const qw of queryWords) {
      if (pWords.some((pw: string) => pw.includes(qw) || qw.includes(pw))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestProduct = p;
    }
  }

  return bestScore >= 1 ? bestProduct : null;
}

export function registerTools(server: McpServer) {
  // 1. add_product
  server.tool(
    'add_product',
    'Add a new product to inventory with name, selling price, unit, category, and minimum stock threshold.',
    {
      name: z.string().describe('Product display name (e.g. "Fortune Sunlite Refined 1L", "Tata Salt 1kg")'),
      selling_price: z.number().positive().describe('Selling price per unit in ₹'),
      purchase_price: z.number().min(0).default(0).describe('Purchase cost per unit in ₹ (default: 0)'),
      unit: z.string().default('packets').describe('Packaging unit: "packets", "kg", "liters", "bags", "pieces", "boxes"'),
      category: z.string().default('General').describe('Category (e.g. "Edible Oils", "Staples", "Dairy", "Spices")'),
      initial_stock: z.number().min(0).default(0).describe('Initial opening stock count (default: 0)'),
      min_stock_threshold: z.number().min(0).default(5).describe('Minimum stock alert threshold (default: 5)'),
      sku: z.string().optional().describe('Optional SKU or barcode')
    },
    async (args) => {
      try {
        const product = await apiClient.createProduct(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Product "${product.name}" added successfully to DukaanOS.`,
              product: {
                id: product.id,
                name: product.name,
                category: product.category,
                unit: product.unit,
                current_stock: product.current_stock,
                min_stock_threshold: product.min_stock_threshold,
                purchase_price: `₹${product.purchase_price}`,
                selling_price: `₹${product.selling_price}`
              }
            }, null, 2)
          }]
        };
      } catch (err: any) {
        if (err.message && err.message.includes('already exists')) {
          const allProds = await apiClient.getProducts();
          const existing = findBestProductMatch(allProds, args.name);
          if (existing) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  message: `Product "${existing.name}" is already in inventory.`,
                  product: {
                    id: existing.id,
                    name: existing.name,
                    category: existing.category,
                    unit: existing.unit,
                    current_stock: existing.current_stock,
                    min_stock_threshold: existing.min_stock_threshold,
                    purchase_price: `₹${existing.purchase_price}`,
                    selling_price: `₹${existing.selling_price}`
                  }
                }, null, 2)
              }]
            };
          }
        }
        return {
          isError: true,
          content: [{ type: 'text', text: `Error adding product: ${err.message}` }]
        };
      }
    }
  );

  // 2. list_products
  server.tool(
    'list_products',
    'List all active inventory products with stock levels, purchase & selling prices, and categories.',
    {
      category: z.string().optional().describe('Filter by category name'),
      search: z.string().optional().describe('Search query for product name or SKU')
    },
    async (args) => {
      try {
        let products = await apiClient.getProducts();
        if (args.category) {
          products = products.filter(p => p.category.toLowerCase() === args.category!.toLowerCase());
        }
        if (args.search) {
          const s = args.search.toLowerCase();
          products = products.filter(p => p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)));
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total_count: products.length,
              products: products.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                stock: `${p.current_stock} ${p.unit}`,
                min_threshold: p.min_stock_threshold,
                is_low_stock: p.current_stock <= p.min_stock_threshold,
                purchase_price: `₹${p.purchase_price}`,
                selling_price: `₹${p.selling_price}`,
                stock_value: `₹${p.current_stock * p.purchase_price}`
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing products: ${err.message}` }]
        };
      }
    }
  );

  // 3. update_product
  server.tool(
    'update_product',
    'Update product details such as selling price, purchase price, name, or minimum stock threshold.',
    {
      product_id: z.string().optional().describe('Product UUID'),
      product_name: z.string().optional().describe('Product name to look up if ID is not available'),
      selling_price: z.number().positive().optional().describe('New selling price in ₹'),
      purchase_price: z.number().min(0).optional().describe('New purchase price in ₹'),
      min_stock_threshold: z.number().min(0).optional().describe('New minimum threshold'),
      name: z.string().optional().describe('New product display name')
    },
    async (args) => {
      try {
        let targetId = args.product_id;
        if (!targetId && args.product_name) {
          const products = await apiClient.getProducts();
          const match = findBestProductMatch(products, args.product_name);
          if (!match) throw new Error(`Product "${args.product_name}" not found.`);
          targetId = match.id;
        }

        if (!targetId) throw new Error('Either product_id or product_name is required.');

        const updates: any = {};
        if (args.selling_price !== undefined) updates.selling_price = args.selling_price;
        if (args.purchase_price !== undefined) updates.purchase_price = args.purchase_price;
        if (args.min_stock_threshold !== undefined) updates.min_stock_threshold = args.min_stock_threshold;
        if (args.name) updates.name = args.name;

        const updated = await apiClient.updateProduct(targetId, updates);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Product "${updated.name}" updated successfully.`,
              product: updated
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error updating product: ${err.message}` }]
        };
      }
    }
  );

  // 4. get_low_stock_products
  server.tool(
    'get_low_stock_products',
    'Get all products where current stock has reached or dropped below the minimum threshold.',
    {},
    async () => {
      try {
        const lowStock = await apiClient.getLowStockProducts();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: lowStock.length,
              status: lowStock.length > 0 ? 'ALERT_REQUIRED' : 'HEALTHY',
              low_stock_products: lowStock.map(p => ({
                id: p.id,
                name: p.name,
                current_stock: `${p.current_stock} ${p.unit}`,
                min_threshold: `${p.min_stock_threshold} ${p.unit}`,
                shortage: `${p.min_stock_threshold - p.current_stock} ${p.unit}`,
                purchase_price: `₹${p.purchase_price}`
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error checking low stock: ${err.message}` }]
        };
      }
    }
  );

  // 5. add_supplier
  server.tool(
    'add_supplier',
    'Add a new supplier to DukaanOS with name, business name, phone, and address.',
    {
      name: z.string().describe('Supplier primary contact or business name (e.g. "Ramesh Traders", "Sunil Gupta")'),
      business_name: z.string().optional().describe('Commercial or firm name (optional)'),
      phone: z.string().optional().describe('Phone number (e.g. "+91 98112 34567")'),
      address: z.string().optional().describe('Supplier warehouse or shop address')
    },
    async (args) => {
      try {
        const supplier = await apiClient.createSupplier(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Supplier "${supplier.name}" added successfully.`,
              supplier: {
                id: supplier.id,
                name: supplier.name,
                business_name: supplier.business_name,
                phone: supplier.phone,
                outstanding_balance: `₹${supplier.outstanding_balance}`
              }
            }, null, 2)
          }]
        };
      } catch (err: any) {
        if (err.message && err.message.includes('already exists')) {
          const allSups = await apiClient.getSuppliers();
          const existing = allSups.find(s => s.name.toLowerCase() === args.name.toLowerCase());
          if (existing) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  message: `Supplier "${existing.name}" is already registered.`,
                  supplier: {
                    id: existing.id,
                    name: existing.name,
                    business_name: existing.business_name,
                    phone: existing.phone,
                    outstanding_balance: `₹${existing.outstanding_balance}`
                  }
                }, null, 2)
              }]
            };
          }
        }
        return {
          isError: true,
          content: [{ type: 'text', text: `Error adding supplier: ${err.message}` }]
        };
      }
    }
  );

  // 6. list_suppliers
  server.tool(
    'list_suppliers',
    'List all registered suppliers along with their total purchases, amount paid, and outstanding balances.',
    {
      search: z.string().optional().describe('Filter by supplier name or phone')
    },
    async (args) => {
      try {
        let suppliers = await apiClient.getSuppliers();
        if (args.search) {
          const s = args.search.toLowerCase();
          suppliers = suppliers.filter(sup => sup.name.toLowerCase().includes(s) || (sup.phone && sup.phone.includes(s)));
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total_suppliers: suppliers.length,
              suppliers: suppliers.map(sup => ({
                id: sup.id,
                name: sup.name,
                business_name: sup.business_name,
                phone: sup.phone,
                total_purchases: `₹${sup.total_purchases}`,
                amount_paid: `₹${sup.amount_paid}`,
                outstanding_balance: `₹${sup.outstanding_balance}`
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing suppliers: ${err.message}` }]
        };
      }
    }
  );

  // 7. get_supplier_balance
  server.tool(
    'get_supplier_balance',
    'Get the current balance and transaction status for a specific supplier.',
    {
      supplier_id: z.string().optional().describe('Supplier UUID'),
      supplier_name: z.string().optional().describe('Supplier name (e.g. "Ramesh Traders")')
    },
    async (args) => {
      try {
        let targetId = args.supplier_id;
        if (!targetId && args.supplier_name) {
          const suppliers = await apiClient.getSuppliers();
          const match = suppliers.find(s => s.name.toLowerCase() === args.supplier_name!.toLowerCase());
          if (!match) throw new Error(`Supplier "${args.supplier_name}" not found.`);
          targetId = match.id;
        }

        if (!targetId) throw new Error('Either supplier_id or supplier_name must be provided.');

        const balance = await apiClient.getSupplierBalance(targetId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              supplier_id: balance.supplier.id,
              supplier_name: balance.supplier.name,
              total_purchases: `₹${balance.total_purchases}`,
              amount_paid: `₹${balance.amount_paid}`,
              outstanding_balance: `₹${balance.outstanding_balance}`,
              status: balance.outstanding_balance > 0 ? 'PAYMENT_PENDING' : 'CLEARED'
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching supplier balance: ${err.message}` }]
        };
      }
    }
  );

  // 8. record_purchase
  server.tool(
    'record_purchase',
    'Record a purchase of inventory goods from a supplier. Automatically updates stock, supplier balance, cash flow, and cost records.',
    {
      supplier_id: z.string().optional().describe('Supplier UUID'),
      supplier_name: z.string().optional().describe('Supplier name (auto-created if not exists, e.g. "Ramesh Traders")'),
      items: z.array(z.object({
        product_id: z.string().optional().describe('Product UUID'),
        product_name: z.string().optional().describe('Product name (auto-matched or created, e.g. "Cooking Oil")'),
        quantity: z.number().positive().describe('Quantity purchased'),
        unit_price: z.number().min(0).describe('Purchase cost per unit in ₹')
      })).min(1).describe('List of items purchased'),
      amount_paid: z.number().min(0).default(0).describe('Amount paid upfront in ₹ (e.g. 1000)'),
      payment_method: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Credit', 'Pending']).default('Cash').describe('Payment method for upfront payment'),
      purchase_date: z.string().optional().describe('Optional ISO date string'),
      notes: z.string().optional().describe('Notes for this purchase')
    },
    async (args) => {
      try {
        const result = await apiClient.recordPurchase(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              purchase_id: result.purchase.id,
              supplier: result.purchase.supplier_name,
              purchase_amount: `₹${result.purchase.total_amount}`,
              amount_paid: `₹${result.purchase.amount_paid}`,
              outstanding_amount: `₹${result.purchase.outstanding_amount}`,
              payment_method: result.purchase.payment_method,
              products_added: result.updated_products.map((p: any) => ({
                product_id: p.id,
                product_name: p.name,
                updated_stock: p.new_stock,
                cost_price: `₹${p.purchase_price}`
              })),
              supplier_updated_balance: {
                total_purchases: `₹${result.supplier_balance.total_purchases}`,
                amount_paid: `₹${result.supplier_balance.amount_paid}`,
                outstanding_balance: `₹${result.supplier_balance.outstanding_balance}`
              }
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error recording purchase: ${err.message}` }]
        };
      }
    }
  );

  // 9. record_sale
  server.tool(
    'record_sale',
    'Record a customer sale. Decrements stock, calculates profit margin from purchase cost, and logs sales transaction.',
    {
      items: z.array(z.object({
        product_id: z.string().optional().describe('Product UUID'),
        product_name: z.string().optional().describe('Product name (auto-fuzzy matched, e.g. "Cooking Oil")'),
        quantity: z.number().positive().describe('Quantity sold'),
        unit_price: z.number().min(0).optional().describe('Selling price per unit in ₹')
      })).min(1).describe('List of items sold'),
      payment_method: z.enum(['Cash', 'UPI', 'Credit']).default('Cash').describe('Payment method ("Cash", "UPI", "Credit")'),
      amount_received: z.number().min(0).optional().describe('Amount received (defaults to total amount for Cash/UPI)'),
      customer_name: z.string().optional().describe('Customer name for credit or invoice'),
      notes: z.string().optional()
    },
    async (args) => {
      try {
        // Apply fuzzy matching to any item missing product_id
        const products = await apiClient.getProducts();
        const resolvedItems = args.items.map(item => {
          if (!item.product_id && item.product_name) {
            const match = findBestProductMatch(products, item.product_name);
            if (match) {
              return {
                ...item,
                product_id: match.id,
                product_name: match.name,
                unit_price: item.unit_price || match.selling_price
              };
            }
          }
          return item;
        });

        const result = await apiClient.recordSale({ ...args, items: resolvedItems });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              sale_id: result.sale.id,
              total_sale_amount: `₹${result.sale.total_amount}`,
              amount_received: `₹${result.sale.amount_received}`,
              outstanding_amount: `₹${result.sale.outstanding_amount}`,
              payment_method: result.sale.payment_method,
              estimated_gross_profit: `₹${result.profit}`,
              remaining_stock: result.updated_products.map((p: any) => ({
                product_id: p.id,
                product_name: p.name,
                remaining_stock: p.remaining_stock
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error recording sale: ${err.message}` }]
        };
      }
    }
  );

  // 10. record_expense
  server.tool(
    'record_expense',
    'Record an operating shop expense such as Electricity, Rent, Transport, Wages, Maintenance, or Miscellaneous.',
    {
      description: z.string().describe('Description of the expense (e.g. "Shop Electricity Bill", "Tempo Transport")'),
      category: z.enum(['Electricity', 'Rent', 'Transport', 'Wages', 'Maintenance', 'Miscellaneous']).describe('Category of expense'),
      amount: z.number().positive().describe('Expense amount in ₹'),
      payment_method: z.enum(['Cash', 'UPI', 'Bank Transfer']).default('Cash').describe('Payment method used'),
      date: z.string().optional().describe('Optional ISO date'),
      notes: z.string().optional()
    },
    async (args) => {
      try {
        const expense = await apiClient.recordExpense(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              expense_id: expense.id,
              description: expense.description,
              category: expense.category,
              amount: `₹${expense.amount}`,
              payment_method: expense.payment_method,
              date: expense.date
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error recording expense: ${err.message}` }]
        };
      }
    }
  );

  // 11. record_supplier_payment
  server.tool(
    'record_supplier_payment',
    'Record a payment made to clear a supplier\'s outstanding balance without creating a duplicate expense.',
    {
      supplier_id: z.string().optional().describe('Supplier UUID'),
      supplier_name: z.string().optional().describe('Supplier name (e.g. "Ramesh Traders")'),
      amount: z.number().positive().describe('Payment amount in ₹'),
      payment_method: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Cheque']).default('Cash').describe('Payment method'),
      payment_date: z.string().optional().describe('Optional ISO date'),
      notes: z.string().optional()
    },
    async (args) => {
      try {
        let targetId = args.supplier_id;
        if (!targetId && args.supplier_name) {
          const suppliers = await apiClient.getSuppliers();
          const match = suppliers.find(s => s.name.toLowerCase() === args.supplier_name!.toLowerCase());
          if (!match) throw new Error(`Supplier "${args.supplier_name}" not found.`);
          targetId = match.id;
        }

        if (!targetId) throw new Error('Either supplier_id or supplier_name must be provided.');

        const result = await apiClient.recordSupplierPayment(targetId, {
          amount: args.amount,
          payment_method: args.payment_method,
          payment_date: args.payment_date,
          notes: args.notes
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              payment_id: result.payment.id,
              supplier_name: result.supplier.name,
              amount_paid_now: `₹${result.payment.amount}`,
              payment_method: result.payment.payment_method,
              remaining_outstanding_balance: `₹${result.supplier.outstanding_balance}`,
              total_purchases_to_date: `₹${result.supplier.total_purchases}`,
              total_amount_paid_to_date: `₹${result.supplier.amount_paid}`
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error recording supplier payment: ${err.message}` }]
        };
      }
    }
  );

  // 12. get_dashboard_summary
  server.tool(
    'get_dashboard_summary',
    'Get comprehensive overview of the shop: Today\'s sales, purchases, expenses, outstanding dues, total stock valuation, and low stock alerts.',
    {},
    async () => {
      try {
        const summary = await apiClient.getDashboardSummary();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              shop_summary: {
                today_sales: `₹${summary.today_sales}`,
                today_purchases: `₹${summary.today_purchases}`,
                today_expenses: `₹${summary.today_expenses}`,
                outstanding_supplier_dues: `₹${summary.outstanding_supplier_payments}`,
                total_inventory_value: `₹${summary.total_inventory_value}`,
                low_stock_products_count: summary.low_stock_count
              },
              recent_transactions_count: summary.recent_transactions.length
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching dashboard summary: ${err.message}` }]
        };
      }
    }
  );

  // 13. get_business_insights
  server.tool(
    'get_business_insights',
    'Get deterministic business insights: Low stock alerts, top sellers, dead stock, supplier liabilities, and expense trends.',
    {},
    async () => {
      try {
        const insights = await apiClient.getBusinessInsights();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              insights_count: insights.length,
              insights: insights.map(ins => ({
                category: ins.type,
                title: ins.title,
                message: ins.message,
                severity: ins.severity,
                metric: ins.metric,
                recommendation: ins.action_suggested
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching business insights: ${err.message}` }]
        };
      }
    }
  );

  // 14. get_business_pulse (THE MORNING BRIEFING TOOL)
  server.tool(
    'get_business_pulse',
    'Get executive morning briefing for the store owner. Summarizes overnight activity, pending supplier dues, depleted stock, and cash position so Claude can brief the owner conversationally.',
    {},
    async () => {
      try {
        const [summary, lowStock, suppliers, insights] = await Promise.all([
          apiClient.getDashboardSummary(),
          apiClient.getLowStockProducts(),
          apiClient.getSuppliers(),
          apiClient.getBusinessInsights()
        ]);

        const pendingSuppliers = suppliers.filter(s => Number(s.outstanding_balance) > 0);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              briefing_for_claude: 'Provide a warm, executive morning briefing to the store owner in bullet points. Highlight urgent stock alerts, pending dues, and revenue performance.',
              store_pulse: {
                today_revenue: `₹${summary.today_sales}`,
                sales_growth_vs_yesterday: summary.sales_growth_percent !== null ? `${summary.sales_growth_percent}%` : 'N/A',
                today_purchases: `₹${summary.today_purchases}`,
                today_expenses: `₹${summary.today_expenses}`,
                total_inventory_valuation: `₹${summary.total_inventory_value}`
              },
              urgent_attention: {
                low_stock_count: lowStock.length,
                low_stock_items: lowStock.slice(0, 5).map(p => `${p.name} (Only ${p.current_stock} ${p.unit} remaining, min: ${p.min_stock_threshold})`),
                pending_supplier_dues: `₹${summary.outstanding_supplier_payments}`,
                suppliers_waiting_payment: pendingSuppliers.map(s => `${s.name}: ₹${s.outstanding_balance}`)
              },
              key_recommendations: insights.slice(0, 3).map(i => i.message)
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error generating business pulse: ${err.message}` }]
        };
      }
    }
  );

  // 15. record_bulk_invoice (KACCHA PARCHI & HANDWRITTEN SLIP INGESTION)
  server.tool(
    'record_bulk_invoice',
    'Ingest an entire wholesale purchase bill or handwritten supplier slip in one atomic call. Auto-matches items, creates missing products, updates stock, and records supplier balance.',
    {
      supplier_name: z.string().describe('Supplier or distributor name (e.g. "Ramesh Traders", "Gupta Wholesalers")'),
      invoice_number: z.string().optional().describe('Supplier bill / parchi invoice number (optional)'),
      items: z.array(z.object({
        name: z.string().describe('Product name extracted from bill'),
        quantity: z.number().positive().describe('Quantity delivered'),
        unit_price: z.number().min(0).describe('Wholesale purchase cost per unit in ₹'),
        selling_price: z.number().positive().optional().describe('Retail selling price to customer (optional)'),
        unit: z.string().default('packets').describe('Unit: "packets", "kg", "liters", "boxes"')
      })).min(1).describe('Array of items parsed from the bill'),
      amount_paid: z.number().min(0).default(0).describe('Amount paid upfront in cash or UPI'),
      payment_method: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Credit', 'Pending']).default('Credit'),
      notes: z.string().optional().describe('Notes (e.g. "Parsed from handwritten parchi photo")')
    },
    async (args) => {
      try {
        const existingProducts = await apiClient.getProducts();
        const purchaseItems: any[] = [];

        // For each item, check if product already exists via fuzzy match, otherwise auto-create it
        for (const it of args.items) {
          let matched = findBestProductMatch(existingProducts, it.name);

          if (!matched) {
            // Auto create new product
            matched = await apiClient.createProduct({
              name: it.name.trim(),
              selling_price: it.selling_price || Math.round(it.unit_price * 1.15), // Default 15% retail markup if omitted
              purchase_price: it.unit_price,
              unit: it.unit || 'packets',
              category: 'General',
              initial_stock: 0,
              min_stock_threshold: 5
            });
          }

          purchaseItems.push({
            product_id: matched.id,
            product_name: matched.name,
            quantity: it.quantity,
            unit_price: it.unit_price
          });
        }

        // Record atomic purchase
        const result = await apiClient.recordPurchase({
          supplier_name: args.supplier_name.trim(),
          items: purchaseItems,
          amount_paid: args.amount_paid,
          payment_method: args.payment_method,
          notes: args.notes || (args.invoice_number ? `Invoice #${args.invoice_number}` : 'Bulk Wholesale Ingestion')
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Wholesale bill from "${args.supplier_name}" successfully ingested into DukaanOS.`,
              purchase_id: result.purchase.id,
              total_bill_amount: `₹${result.purchase.total_amount}`,
              amount_paid: `₹${result.purchase.amount_paid}`,
              balance_added_to_supplier: `₹${result.purchase.outstanding_amount}`,
              items_stocked: result.updated_products.map((p: any) => ({
                product: p.name,
                new_total_stock: p.new_stock,
                cost_price: `₹${p.purchase_price}`
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error ingesting bulk invoice: ${err.message}` }]
        };
      }
    }
  );

  // 16. record_customer_credit (CUSTOMER KHATA / UDHAR LEDGER)
  server.tool(
    'record_customer_credit',
    'Record credit (udhar) given to a customer for goods purchased. Deducts inventory stock and logs the credit obligation under customer\'s name.',
    {
      customer_name: z.string().describe('Customer full name (e.g. "Ramesh Sharma", "Pooja Verma")'),
      amount: z.number().positive().describe('Credit amount in ₹ (e.g. 450)'),
      phone: z.string().optional().describe('Customer phone number for WhatsApp reminders'),
      items_summary: z.string().optional().describe('Summary of items taken (e.g. "2 packets oil, 1kg sugar")'),
      notes: z.string().optional()
    },
    async (args) => {
      try {
        // Record as credit sale transaction
        const saleRecord = await apiClient.recordSale({
          items: [{
            product_name: args.items_summary || 'Store Items on Credit',
            quantity: 1,
            unit_price: args.amount
          }],
          payment_method: 'Credit',
          amount_received: 0,
          customer_name: args.customer_name.trim(),
          notes: `Customer Khata Udhar: ${args.items_summary || ''}${args.phone ? ` • Ph: ${args.phone}` : ''}`
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Recorded ₹${args.amount} udhar credit for ${args.customer_name}.`,
              customer: args.customer_name,
              amount_owed: `₹${args.amount}`,
              transaction_id: saleRecord.sale.id,
              whatsapp_reminder_template: `Namaste ${args.customer_name}, your balance of ₹${args.amount} at the store has been recorded. Thank you!`
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error recording customer credit: ${err.message}` }]
        };
      }
    }
  );

  // 17. record_customer_payment (CLEARING CUSTOMER KHATA UDHAR)
  server.tool(
    'record_customer_payment',
    'Record payment received from a customer settling their khata / udhar credit balance.',
    {
      customer_name: z.string().describe('Customer name settling their credit balance'),
      amount: z.number().positive().describe('Amount received in ₹ (e.g. 500)'),
      payment_method: z.enum(['Cash', 'UPI', 'Bank Transfer']).default('Cash')
    },
    async (args) => {
      try {
        const sales = await apiClient.getSales();
        const customerCreditSales = sales.filter((s: any) =>
          s.payment_method === 'Credit' &&
          s.customer_name?.toLowerCase().includes(args.customer_name.toLowerCase()) &&
          Number(s.outstanding_amount) > 0
        );

        let remainingToApply = args.amount;
        let clearedCount = 0;

        for (const s of customerCreditSales) {
          if (remainingToApply <= 0) break;
          const due = Number(s.outstanding_amount);
          const pay = Math.min(due, remainingToApply);
          await apiClient.updateSale(s.id, {
            amount_received: Number(s.amount_received) + pay,
            outstanding_amount: due - pay,
            payment_method: due - pay === 0 ? args.payment_method : 'Credit'
          });
          remainingToApply -= pay;
          clearedCount++;
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Received ₹${args.amount} from ${args.customer_name} via ${args.payment_method}.`,
              amount_settled: `₹${args.amount}`,
              cleared_bills_count: clearedCount
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error recording customer payment: ${err.message}` }]
        };
      }
    }
  );

  // 18. generate_whatsapp_reminder (Polite Khata Debt Collection)
  server.tool(
    'generate_whatsapp_reminder',
    'Generate a polite WhatsApp payment reminder message and 1-click link for a customer with pending udhar credit.',
    {
      customer_name: z.string().describe('Customer name (e.g. "Ramesh Kumar")'),
      amount: z.number().positive().describe('Pending credit amount in ₹ (e.g. 450)'),
      phone: z.string().optional().describe('Optional customer phone number (e.g. "9876543210")'),
      language: z.enum(['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Gujarati', 'Bengali']).default('Hindi')
    },
    async (args) => {
      try {
        const business = await apiClient.getBusiness();
        const storeName = business.name || 'Apna Kirana Store';

        let msg = '';
        if (args.language === 'Hindi') {
          msg = `नमस्ते ${args.customer_name} जी, ${storeName} की तरफ से सादर प्रणाम। आपकी पुरानी दुकान उधारी राशि ₹${args.amount} बकाया है। कृपया सुविधानुसार भुगतान कर दें। धन्यवाद! 🙏`;
        } else if (args.language === 'Telugu') {
          msg = `నమస్కారం ${args.customer_name} గారు, ${storeName} నుండి. మీ దుకాణం బకాయి ₹${args.amount} ఉంది. దయచేసి చెల్లించగలరు. ధన్యవాదాలు! 🙏`;
        } else {
          msg = `Dear ${args.customer_name}, warm regards from ${storeName}. A gentle reminder regarding your store pending balance of ₹${args.amount}. Kindly clear at your earliest convenience. Thank you! 🙏`;
        }

        const phoneDigits = (args.phone || '').replace(/\D/g, '');
        const phoneParam = phoneDigits.length >= 10 ? (phoneDigits.startsWith('91') ? phoneDigits : `91${phoneDigits}`) : '';
        const whatsappUrl = `https://api.whatsapp.com/send?${phoneParam ? `phone=${phoneParam}&` : ''}text=${encodeURIComponent(msg)}`;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              customer: args.customer_name,
              amount_due: `₹${args.amount}`,
              reminder_text: msg,
              whatsapp_link: whatsappUrl,
              action: 'Click the link or share with the customer on WhatsApp'
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error generating reminder: ${err.message}` }]
        };
      }
    }
  );

  // 19. draft_supplier_restock_order (Low Stock Restock Slip for Wholesalers)
  server.tool(
    'draft_supplier_restock_order',
    'Generate a WhatsApp purchase order draft for wholesale suppliers to restock all depleted inventory items.',
    {
      supplier_name: z.string().optional().describe('Optional specific supplier name to filter items for'),
      supplier_phone: z.string().optional().describe('Optional supplier WhatsApp number')
    },
    async (args) => {
      try {
        const [products, business] = await Promise.all([
          apiClient.getProducts(),
          apiClient.getBusiness()
        ]);

        const lowStock = products.filter((p: any) => Number(p.current_stock) <= Number(p.min_stock_threshold));

        if (lowStock.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'All product inventory levels are currently above minimum safety thresholds. No urgent restock required.'
            }]
          };
        }

        const storeName = business.name || 'Sri Venkateshwara Store';
        const lines = lowStock.map((p: any) => {
          const reorderQty = Math.max(10, (p.min_stock_threshold || 5) * 3 - p.current_stock);
          return `• ${p.name}: ${reorderQty} ${p.unit || 'packets'} (Current stock: ${p.current_stock})`;
        }).join('\n');

        const orderText = `📦 *RESTOCK PURCHASE ORDER*\nFrom: *${storeName}*\nDate: ${new Date().toLocaleDateString('en-IN')}\n\n*Required Items:*\n${lines}\n\nPlease dispatch at the earliest. Thank you!`;

        const phoneDigits = (args.supplier_phone || '').replace(/\D/g, '');
        const phoneParam = phoneDigits.length >= 10 ? (phoneDigits.startsWith('91') ? phoneDigits : `91${phoneDigits}`) : '';
        const whatsappUrl = `https://api.whatsapp.com/send?${phoneParam ? `phone=${phoneParam}&` : ''}text=${encodeURIComponent(orderText)}`;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              low_stock_items_count: lowStock.length,
              order_message: orderText,
              whatsapp_link: whatsappUrl
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error drafting restock order: ${err.message}` }]
        };
      }
    }
  );
}
