import { db } from '../db/index.js';
import { BusinessInsight } from '../types.js';

export class InsightsService {
  async getBusinessInsights(businessId: string): Promise<BusinessInsight[]> {
    const [products, suppliers, sales, expenses] = await Promise.all([
      db.getProducts(businessId),
      db.getSuppliers(businessId),
      db.getSales(businessId),
      db.getExpenses(businessId)
    ]);

    const insights: BusinessInsight[] = [];

    // 1. Low Stock Products
    const lowStock = products.filter(p => p.current_stock <= p.min_stock_threshold);
    if (lowStock.length > 0) {
      const names = lowStock.slice(0, 3).map(p => `${p.name} (${p.current_stock} ${p.unit} remaining, min ${p.min_stock_threshold})`).join('; ');
      insights.push({
        id: 'low-stock-alert',
        type: 'low_stock',
        title: `${lowStock.length} Products Below Minimum Stock`,
        message: `Replenishment required: ${names}${lowStock.length > 3 ? ` and ${lowStock.length - 3} more` : ''}.`,
        severity: 'alert',
        metric: `${lowStock.length} items`,
        action_suggested: 'Create purchase orders with relevant suppliers before stocks run out.'
      });
    }

    // 2. High Inventory Value (Working Capital Tied Up)
    const productValues = products.map(p => ({
      name: p.name,
      value: p.current_stock * p.purchase_price,
      stock: p.current_stock,
      unit: p.unit
    })).sort((a, b) => b.value - a.value);

    if (productValues.length > 0 && productValues[0].value > 1500) {
      const topTied = productValues[0];
      insights.push({
        id: 'high-inventory-val',
        type: 'high_inventory_value',
        title: 'Capital Concentration in Inventory',
        message: `Highest value currently held in "${topTied.name}": ₹${topTied.value.toLocaleString('en-IN')} (${topTied.stock} ${topTied.unit}).`,
        severity: 'info',
        metric: `₹${topTied.value.toLocaleString('en-IN')}`,
        action_suggested: 'Monitor sales turnover to ensure funds do not remain illiquid.'
      });
    }

    // 3. Top Selling Products
    const salesVolumeMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        if (!salesVolumeMap[item.product_id]) {
          salesVolumeMap[item.product_id] = {
            name: item.product_name || 'Product',
            qty: 0,
            revenue: 0
          };
        }
        salesVolumeMap[item.product_id].qty += Number(item.quantity);
        salesVolumeMap[item.product_id].revenue += Number(item.total_price);
      }
    }

    const sortedTopSellers = Object.values(salesVolumeMap).sort((a, b) => b.revenue - a.revenue);
    if (sortedTopSellers.length > 0) {
      const top = sortedTopSellers[0];
      insights.push({
        id: 'top-seller',
        type: 'top_selling',
        title: 'Top Revenue Generating Product',
        message: `"${top.name}" has generated ₹${top.revenue.toLocaleString('en-IN')} across ${top.qty} units sold.`,
        severity: 'positive',
        metric: `₹${top.revenue.toLocaleString('en-IN')}`,
        action_suggested: 'Ensure priority restocking to prevent missed sales.'
      });
    }

    // 4. Products with No Recent Sales (Slow Moving)
    const activeProductIdsWithSales = new Set(Object.keys(salesVolumeMap));
    const noSalesProducts = products.filter(p => !activeProductIdsWithSales.has(p.id) && p.current_stock > 0);
    if (noSalesProducts.length > 0) {
      const sampleNames = noSalesProducts.slice(0, 3).map(p => p.name).join(', ');
      insights.push({
        id: 'no-recent-sales',
        type: 'no_recent_sales',
        title: `${noSalesProducts.length} Products with No Recorded Sales`,
        message: `Products currently holding stock without sales: ${sampleNames}${noSalesProducts.length > 3 ? '...' : ''}.`,
        severity: 'warning',
        metric: `${noSalesProducts.length} products`,
        action_suggested: 'Check shelf placement or review pricing competitiveness.'
      });
    }

    // 5. Suppliers with Outstanding Balances
    const suppliersWithPending = suppliers.filter(s => s.outstanding_balance > 0);
    if (suppliersWithPending.length > 0) {
      const totalDue = suppliersWithPending.reduce((sum, s) => sum + s.outstanding_balance, 0);
      const topDue = [...suppliersWithPending].sort((a, b) => b.outstanding_balance - a.outstanding_balance)[0];
      insights.push({
        id: 'supplier-due',
        type: 'supplier_outstanding',
        title: 'Supplier Dues Pending',
        message: `Total ₹${totalDue.toLocaleString('en-IN')} outstanding across ${suppliersWithPending.length} suppliers. Largest balance: ${topDue.name} (₹${topDue.outstanding_balance.toLocaleString('en-IN')}).`,
        severity: 'warning',
        metric: `₹${totalDue.toLocaleString('en-IN')}`,
        action_suggested: 'Plan upcoming supplier clearance to maintain reliable delivery credit.'
      });
    }

    // 6. Expense Trend
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const last7DaysExpenses = expenses
      .filter(e => e.date >= sevenDaysAgo)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const prior7DaysExpenses = expenses
      .filter(e => e.date >= fourteenDaysAgo && e.date < sevenDaysAgo)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (prior7DaysExpenses > 0) {
      const changePercent = Math.round(((last7DaysExpenses - prior7DaysExpenses) / prior7DaysExpenses) * 100);
      insights.push({
        id: 'expense-trend',
        type: 'expense_trend',
        title: 'Weekly Expense Comparison',
        message: `Expenses in the past 7 days (₹${last7DaysExpenses.toLocaleString('en-IN')}) are ${Math.abs(changePercent)}% ${changePercent >= 0 ? 'higher' : 'lower'} than the preceding week (₹${prior7DaysExpenses.toLocaleString('en-IN')}).`,
        severity: changePercent > 20 ? 'warning' : 'info',
        metric: `${changePercent > 0 ? '+' : ''}${changePercent}%`,
        action_suggested: changePercent > 20 ? 'Review recent transport or miscellaneous payments.' : 'Expense rate remains steady.'
      });
    } else {
      insights.push({
        id: 'expense-trend-insufficient',
        type: 'expense_trend',
        title: 'Expense Historical Trend',
        message: 'Insufficient historical data: At least 14 days of recorded operating expenses are required to calculate multi-week expense trends.',
        severity: 'info',
        metric: 'Data accumulating',
        action_suggested: 'Continue recording all daily expenses accurately.'
      });
    }

    // 7. Estimated Gross Profit Summary
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
    const totalProfit = sales.reduce((sum, s) => sum + Number(s.estimated_profit), 0);
    if (totalRevenue > 0) {
      const margin = Math.round((totalProfit / totalRevenue) * 100);
      insights.push({
        id: 'profit-summary',
        type: 'profit_summary',
        title: 'Gross Margin Performance',
        message: `Overall gross profit is ₹${totalProfit.toLocaleString('en-IN')} on ₹${totalRevenue.toLocaleString('en-IN')} in sales (${margin}% average margin across recorded sales).`,
        severity: 'positive',
        metric: `${margin}% margin`,
        action_suggested: 'Maintain healthy margins on high-volume staples.'
      });
    }

    return insights;
  }
}

export const insightsService = new InsightsService();

