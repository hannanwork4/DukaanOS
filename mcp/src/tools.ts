import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiClient } from './apiClient.js';

export function registerTools(server: McpServer) {
  // 1. add_product
  server.tool(
    'add_product',
    'Add a new product to inventory with name, selling price, unit, category, and minimum stock threshold.',
    {
      name: z.string().describe('Product display name (e.g. "Cooking Oil 1L", "Fortune Sunlite Refined 1L")'),
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
          const match = products.find(p => p.name.toLowerCase() === args.product_name!.toLowerCase());
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

  // 9. list_purchases
  server.tool(
    'list_purchases',
    'List purchase records showing date, supplier, items, amounts, and pending dues.',
    {
      limit: z.number().optional().describe('Number of recent purchases to return')
    },
    async (args) => {
      try {
        let purchases = await apiClient.getPurchases();
        if (args.limit) {
          purchases = purchases.slice(0, args.limit);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: purchases.length,
              purchases: purchases.map(p => ({
                id: p.id,
                date: p.purchase_date,
                supplier: p.supplier_name,
                total_amount: `₹${p.total_amount}`,
                amount_paid: `₹${p.amount_paid}`,
                outstanding: `₹${p.outstanding_amount}`,
                payment_method: p.payment_method,
                items: (p.items || []).map((it: any) => `${it.quantity}x ${it.product_name} @ ₹${it.unit_price}`)
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing purchases: ${err.message}` }]
        };
      }
    }
  );

  // 10. update_purchase
  server.tool(
    'update_purchase',
    'Edit an existing purchase record. Safely reverses previously applied stock and supplier balances, then applies revised details.',
    {
      purchase_id: z.string().describe('Existing Purchase UUID'),
      supplier_name: z.string().optional(),
      items: z.array(z.object({
        product_id: z.string().optional(),
        product_name: z.string().optional(),
        quantity: z.number().positive(),
        unit_price: z.number().min(0)
      })).min(1).describe('Updated list of items'),
      amount_paid: z.number().min(0).optional().describe('Updated amount paid'),
      payment_method: z.string().optional(),
      notes: z.string().optional()
    },
    async (args) => {
      try {
        const { purchase_id, ...data } = args;
        const result = await apiClient.updatePurchase(purchase_id, data);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Purchase ${purchase_id.slice(0, 8)} updated successfully with full reversal and recalculation.`,
              purchase: {
                id: result.purchase.id,
                supplier: result.purchase.supplier_name,
                total_amount: `₹${result.purchase.total_amount}`,
                amount_paid: `₹${result.purchase.amount_paid}`,
                outstanding_amount: `₹${result.purchase.outstanding_amount}`
              },
              updated_products: result.updated_products
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error updating purchase: ${err.message}` }]
        };
      }
    }
  );

  // 11. record_sale
  server.tool(
    'record_sale',
    'Record a customer sale. Decrements stock, calculates profit margin from purchase cost, and logs sales transaction.',
    {
      items: z.array(z.object({
        product_id: z.string().optional().describe('Product UUID'),
        product_name: z.string().optional().describe('Product name (e.g. "Cooking Oil")'),
        quantity: z.number().positive().describe('Quantity sold'),
        unit_price: z.number().min(0).optional().describe('Selling price per unit in ₹ (defaults to product selling price)')
      })).min(1).describe('List of items sold'),
      payment_method: z.enum(['Cash', 'UPI', 'Credit']).default('Cash').describe('Payment method ("Cash", "UPI", "Credit")'),
      amount_received: z.number().min(0).optional().describe('Amount received (defaults to total amount for Cash/UPI)'),
      customer_name: z.string().optional().describe('Customer name for credit or invoice'),
      notes: z.string().optional()
    },
    async (args) => {
      try {
        const result = await apiClient.recordSale(args);
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

  // 12. list_sales
  server.tool(
    'list_sales',
    'List recent sales transactions with items sold, revenue, payment mode, and estimated profit.',
    {
      limit: z.number().optional().describe('Number of recent sales to return')
    },
    async (args) => {
      try {
        let sales = await apiClient.getSales();
        if (args.limit) {
          sales = sales.slice(0, args.limit);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: sales.length,
              sales: sales.map(s => ({
                id: s.id,
                date: s.sale_date,
                total_amount: `₹${s.total_amount}`,
                payment_method: s.payment_method,
                profit: `₹${s.estimated_profit}`,
                items: (s.items || []).map((it: any) => `${it.quantity}x ${it.product_name} @ ₹${it.unit_price}`)
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing sales: ${err.message}` }]
        };
      }
    }
  );

  // 13. record_expense
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

  // 14. list_expenses
  server.tool(
    'list_expenses',
    'List recorded shop operating expenses filtered by category or recent limit.',
    {
      category: z.string().optional().describe('Filter by category name'),
      limit: z.number().optional().describe('Number of records to return')
    },
    async (args) => {
      try {
        let expenses = await apiClient.getExpenses();
        if (args.category) {
          expenses = expenses.filter(e => e.category.toLowerCase() === args.category!.toLowerCase());
        }
        if (args.limit) {
          expenses = expenses.slice(0, args.limit);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: expenses.length,
              total_amount: `₹${expenses.reduce((sum, e) => sum + Number(e.amount), 0)}`,
              expenses: expenses.map(e => ({
                id: e.id,
                date: e.date,
                description: e.description,
                category: e.category,
                amount: `₹${e.amount}`,
                payment_method: e.payment_method
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing expenses: ${err.message}` }]
        };
      }
    }
  );

  // 15. record_supplier_payment
  server.tool(
    'record_supplier_payment',
    'Record a payment made to clear a supplier\'s outstanding balance without creating a duplicate expense.',
    {
      supplier_id: z.string().optional().describe('Supplier UUID'),
      supplier_name: z.string().optional().describe('Supplier name (e.g. "Ramesh Traders")'),
      amount: z.number().positive().describe('Payment amount in ₹ (e.g. 1000)'),
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

  // 16. get_dashboard_summary
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

  // 17. get_business_insights
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

  // 18. get_inventory_summary
  server.tool(
    'get_inventory_summary',
    'Get inventory summary report with total SKU count, total units, total inventory value, and category-wise breakdown.',
    {},
    async () => {
      try {
        const products = await apiClient.getProducts();
        const categoryMap: Record<string, { count: number; value: number }> = {};
        let totalValuation = 0;
        let totalUnits = 0;

        for (const p of products) {
          const val = Number(p.current_stock) * Number(p.purchase_price);
          totalValuation += val;
          totalUnits += Number(p.current_stock);

          if (!categoryMap[p.category]) {
            categoryMap[p.category] = { count: 0, value: 0 };
          }
          categoryMap[p.category].count += 1;
          categoryMap[p.category].value += val;
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total_skus: products.length,
              total_stock_units: totalUnits,
              total_inventory_valuation: `₹${Math.round(totalValuation * 100) / 100}`,
              categories: Object.entries(categoryMap).map(([name, stat]) => ({
                category: name,
                product_count: stat.count,
                inventory_value: `₹${Math.round(stat.value * 100) / 100}`
              }))
            }, null, 2)
          }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error generating inventory summary: ${err.message}` }]
        };
      }
    }
  );
}
