export interface Business {
  id: string;
  name: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  currency: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  category: string;
  sku?: string;
  unit: string;
  current_stock: number;
  min_stock_threshold: number;
  purchase_price: number;
  selling_price: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  business_name?: string;
  phone?: string;
  address?: string;
  total_purchases: number;
  amount_paid: number;
  outstanding_balance: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Purchase {
  id: string;
  business_id: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_date: string;
  total_amount: number;
  amount_paid: number;
  outstanding_amount: number;
  payment_method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit' | 'Pending';
  notes?: string;
  status: 'completed' | 'cancelled';
  items?: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_cost: number;
}

export interface Sale {
  id: string;
  business_id: string;
  sale_date: string;
  total_amount: number;
  amount_received: number;
  outstanding_amount: number;
  payment_method: 'Cash' | 'UPI' | 'Credit';
  estimated_profit: number;
  customer_name?: string;
  notes?: string;
  status: 'completed' | 'cancelled';
  items?: SaleItem[];
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  business_id: string;
  description: string;
  category: 'Electricity' | 'Rent' | 'Transport' | 'Wages' | 'Maintenance' | 'Miscellaneous';
  amount: number;
  date: string;
  payment_method: 'Cash' | 'UPI' | 'Bank Transfer';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  business_id: string;
  product_id: string;
  product_name?: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'purchase_reversal' | 'sale_reversal';
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  business_id: string;
  type: 'purchase' | 'sale' | 'expense' | 'supplier_payment' | 'stock_adjustment';
  amount: number;
  date: string;
  description: string;
  reference_id?: string;
  payment_method?: string;
  status: string;
  created_at: string;
}

export interface DashboardSummary {
  today_sales: number;
  today_purchases: number;
  today_expenses: number;
  outstanding_supplier_payments: number;
  total_inventory_value: number;
  low_stock_count: number;
  recent_transactions: TransactionRecord[];
  sales_trend: { date: string; sales: number; count: number }[];
}

export interface BusinessInsight {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'alert' | 'positive';
  metric?: string | number;
  action_suggested?: string;
}
