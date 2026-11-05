import { db } from '../db/index.js';
import { DashboardSummary, TransactionRecord } from '../types.js';

export class LedgerService {
  async getTransactions(businessId: string): Promise<TransactionRecord[]> {
    return db.getTransactions(businessId);
  }

  async getDashboardSummary(businessId: string): Promise<DashboardSummary> {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [products, suppliers, purchases, sales, expenses, transactions] = await Promise.all([
      db.getProducts(businessId),
      db.getSuppliers(businessId),
      db.getPurchases(businessId),
      db.getSales(businessId),
      db.getExpenses(businessId),
      db.getTransactions(businessId)
    ]);

    // 1. Today's Sales & Gross Profit
    const todaySalesRecords = sales.filter(s => s.sale_date.startsWith(todayStr));
    const todaySales = todaySalesRecords.reduce((sum, s) => sum + Number(s.total_amount), 0);
    const todayProfit = todaySalesRecords.reduce((sum, s) => sum + Number(s.estimated_profit || 0), 0);

    // Yesterday's Sales & Growth Percentage
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
    const yesterdaySales = sales
      .filter(s => s.sale_date.startsWith(yesterdayStr))
      .reduce((sum, s) => sum + Number(s.total_amount), 0);

    let salesGrowthPercent: number | null = null;
    if (yesterdaySales > 0) {
      salesGrowthPercent = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
    } else if (todaySales > 0) {
      salesGrowthPercent = 100;
    }

    // 2. Today's Purchases
    const todayPurchases = purchases
      .filter(p => p.purchase_date.startsWith(todayStr))
      .reduce((sum, p) => sum + Number(p.total_amount), 0);

    // 3. Today's Expenses & Net Profit
    const todayExpenses = expenses
      .filter(e => e.date.startsWith(todayStr))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const todayNetProfit = todayProfit - todayExpenses;

    // 4. Outstanding Supplier Payments
    const outstandingSupplierPayments = suppliers
      .reduce((sum, s) => sum + Number(s.outstanding_balance), 0);

    // 5. Total Inventory Value (Current Stock * Purchase Price)
    const totalInventoryValue = products
      .reduce((sum, p) => sum + (Number(p.current_stock) * Number(p.purchase_price)), 0);

    // 6. Number of Low-Stock Products
    const lowStockCount = products
      .filter(p => Number(p.current_stock) <= Number(p.min_stock_threshold)).length;

    // 7. Recent Transactions (latest 10)
    const recentTransactions = transactions.slice(0, 10);

    // 8. Sales Trend (last 7 days)
    const salesTrend: { date: string; sales: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const daySales = sales.filter(s => s.sale_date.startsWith(dayStr));
      const totalDaySales = daySales.reduce((sum, s) => sum + Number(s.total_amount), 0);

      salesTrend.push({
        date: dayStr,
        sales: totalDaySales,
        count: daySales.length
      });
    }

    return {
      today_sales: Math.round(todaySales * 100) / 100,
      yesterday_sales: Math.round(yesterdaySales * 100) / 100,
      sales_growth_percent: salesGrowthPercent,
      today_purchases: Math.round(todayPurchases * 100) / 100,
      today_expenses: Math.round(todayExpenses * 100) / 100,
      today_net_profit: Math.round(todayNetProfit * 100) / 100,
      outstanding_supplier_payments: Math.round(outstandingSupplierPayments * 100) / 100,
      total_inventory_value: Math.round(totalInventoryValue * 100) / 100,
      low_stock_count: lowStockCount,
      recent_transactions: recentTransactions,
      sales_trend: salesTrend
    };
  }
}

export const ledgerService = new LedgerService();

