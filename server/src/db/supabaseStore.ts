import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabase } from './interface.js';
import {
  Business,
  Product,
  Supplier,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Expense,
  SupplierPayment,
  StockMovement,
  TransactionRecord
} from '../types.js';

export class SupabaseStore implements IDatabase {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  async getBusiness(id: string): Promise<Business | null> {
    const { data, error } = await this.client
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as Business;
  }

  async createBusiness(business: Business): Promise<Business> {
    const { data, error } = await this.client
      .from('businesses')
      .upsert(business)
      .select()
      .single();
    if (error) throw new Error(`Supabase createBusiness error: ${error.message}`);
    return data as Business;
  }

  async getProducts(businessId: string): Promise<Product[]> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_archived', false)
      .order('name', { ascending: true });
    if (error) throw new Error(`Supabase getProducts error: ${error.message}`);
    return (data || []) as Product[];
  }

  async getProductById(businessId: string, id: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as Product;
  }

  async getProductByName(businessId: string, name: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_archived', false)
      .ilike('name', name.trim())
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as Product;
  }

  async createProduct(product: Product): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw new Error(`Supabase createProduct error: ${error.message}`);
    return data as Product;
  }

  async updateProduct(businessId: string, id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Supabase updateProduct error: ${error.message}`);
    return data as Product;
  }

  async deleteProduct(businessId: string, id: string): Promise<boolean> {
    const { error } = await this.client
      .from('products')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .eq('id', id);
    return !error;
  }

  async getSuppliers(businessId: string): Promise<Supplier[]> {
    const { data, error } = await this.client
      .from('suppliers')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });
    if (error) throw new Error(`Supabase getSuppliers error: ${error.message}`);
    return (data || []) as Supplier[];
  }

  async getSupplierById(businessId: string, id: string): Promise<Supplier | null> {
    const { data, error } = await this.client
      .from('suppliers')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as Supplier;
  }

  async getSupplierByName(businessId: string, name: string): Promise<Supplier | null> {
    const { data, error } = await this.client
      .from('suppliers')
      .select('*')
      .eq('business_id', businessId)
      .or(`name.ilike.${name.trim()},business_name.ilike.${name.trim()}`)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as Supplier;
  }

  async createSupplier(supplier: Supplier): Promise<Supplier> {
    const { data, error } = await this.client
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();
    if (error) throw new Error(`Supabase createSupplier error: ${error.message}`);
    return data as Supplier;
  }

  async updateSupplier(businessId: string, id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await this.client
      .from('suppliers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Supabase updateSupplier error: ${error.message}`);
    return data as Supplier;
  }

  async deleteSupplier(businessId: string, id: string): Promise<boolean> {
    const { error } = await this.client
      .from('suppliers')
      .delete()
      .eq('business_id', businessId)
      .eq('id', id);
    return !error;
  }

  async getPurchases(businessId: string): Promise<Purchase[]> {
    const { data: purchases, error: pError } = await this.client
      .from('purchases')
      .select(`
        *,
        suppliers (name),
        purchase_items (*, products (name))
      `)
      .eq('business_id', businessId)
      .order('purchase_date', { ascending: false });

    if (pError) throw new Error(`Supabase getPurchases error: ${pError.message}`);

    return (purchases || []).map((p: any) => ({
      ...p,
      supplier_name: p.suppliers?.name || 'Unknown Supplier',
      items: (p.purchase_items || []).map((item: any) => ({
        ...item,
        product_name: item.products?.name || 'Unknown Product'
      }))
    }));
  }

  async getPurchaseById(businessId: string, id: string): Promise<Purchase | null> {
    const { data: p, error } = await this.client
      .from('purchases')
      .select(`
        *,
        suppliers (name),
        purchase_items (*, products (name))
      `)
      .eq('business_id', businessId)
      .eq('id', id)
      .single();

    if (error || !p) return null;

    return {
      ...p,
      supplier_name: p.suppliers?.name || 'Unknown Supplier',
      items: (p.purchase_items || []).map((item: any) => ({
        ...item,
        product_name: item.products?.name || 'Unknown Product'
      }))
    };
  }

  async createPurchase(purchase: Purchase, items: PurchaseItem[]): Promise<Purchase> {
    const { supplier_name, items: _i, ...purchaseRow } = purchase as any;
    const { error: pErr } = await this.client.from('purchases').insert(purchaseRow);
    if (pErr) throw new Error(`Failed to insert purchase: ${pErr.message}`);

    if (items.length > 0) {
      const cleanItems = items.map(({ product_name, ...it }: any) => it);
      const { error: iErr } = await this.client.from('purchase_items').insert(cleanItems);
      if (iErr) throw new Error(`Failed to insert purchase items: ${iErr.message}`);
    }

    return this.getPurchaseById(purchase.business_id, purchase.id) as Promise<Purchase>;
  }

  async updatePurchase(purchase: Purchase, items: PurchaseItem[]): Promise<Purchase> {
    const { error: pErr } = await this.client
      .from('purchases')
      .update({
        supplier_id: purchase.supplier_id,
        purchase_date: purchase.purchase_date,
        total_amount: purchase.total_amount,
        amount_paid: purchase.amount_paid,
        outstanding_amount: purchase.outstanding_amount,
        payment_method: purchase.payment_method,
        notes: purchase.notes,
        status: purchase.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchase.id)
      .eq('business_id', purchase.business_id);
    if (pErr) throw new Error(`Failed to update purchase: ${pErr.message}`);

    // Delete existing items
    await this.client.from('purchase_items').delete().eq('purchase_id', purchase.id);

    // Insert new items
    if (items.length > 0) {
      const cleanItems = items.map(({ product_name, ...it }: any) => it);
      const { error: iErr } = await this.client.from('purchase_items').insert(cleanItems);
      if (iErr) throw new Error(`Failed to replace purchase items: ${iErr.message}`);
    }

    return this.getPurchaseById(purchase.business_id, purchase.id) as Promise<Purchase>;
  }

  async getSales(businessId: string): Promise<Sale[]> {
    const { data: sales, error: sError } = await this.client
      .from('sales')
      .select(`
        *,
        sale_items (*, products (name))
      `)
      .eq('business_id', businessId)
      .order('sale_date', { ascending: false });

    if (sError) throw new Error(`Supabase getSales error: ${sError.message}`);

    return (sales || []).map((s: any) => ({
      ...s,
      items: (s.sale_items || []).map((item: any) => ({
        ...item,
        product_name: item.products?.name || 'Unknown Product'
      }))
    }));
  }

  async getSaleById(businessId: string, id: string): Promise<Sale | null> {
    const { data: s, error } = await this.client
      .from('sales')
      .select(`
        *,
        sale_items (*, products (name))
      `)
      .eq('business_id', businessId)
      .eq('id', id)
      .single();

    if (error || !s) return null;

    return {
      ...s,
      items: (s.sale_items || []).map((item: any) => ({
        ...item,
        product_name: item.products?.name || 'Unknown Product'
      }))
    };
  }

  async createSale(sale: Sale, items: SaleItem[]): Promise<Sale> {
    const { items: _i, ...saleRow } = sale as any;
    const { error: sErr } = await this.client.from('sales').insert(saleRow);
    if (sErr) throw new Error(`Failed to insert sale: ${sErr.message}`);

    if (items.length > 0) {
      const cleanItems = items.map(({ product_name, ...it }: any) => it);
      const { error: iErr } = await this.client.from('sale_items').insert(cleanItems);
      if (iErr) throw new Error(`Failed to insert sale items: ${iErr.message}`);
    }

    return this.getSaleById(sale.business_id, sale.id) as Promise<Sale>;
  }

  async updateSale(sale: Sale, items: SaleItem[]): Promise<Sale> {
    const { error: sErr } = await this.client
      .from('sales')
      .update({
        sale_date: sale.sale_date,
        total_amount: sale.total_amount,
        amount_received: sale.amount_received,
        outstanding_amount: sale.outstanding_amount,
        payment_method: sale.payment_method,
        estimated_profit: sale.estimated_profit,
        customer_name: sale.customer_name,
        notes: sale.notes,
        status: sale.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sale.id)
      .eq('business_id', sale.business_id);
    if (sErr) throw new Error(`Failed to update sale: ${sErr.message}`);

    // Delete existing items
    await this.client.from('sale_items').delete().eq('sale_id', sale.id);

    // Insert new items
    if (items.length > 0) {
      const cleanItems = items.map(({ product_name, ...it }: any) => it);
      const { error: iErr } = await this.client.from('sale_items').insert(cleanItems);
      if (iErr) throw new Error(`Failed to replace sale items: ${iErr.message}`);
    }

    return this.getSaleById(sale.business_id, sale.id) as Promise<Sale>;
  }

  async getExpenses(businessId: string): Promise<Expense[]> {
    const { data, error } = await this.client
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });
    if (error) throw new Error(`Supabase getExpenses error: ${error.message}`);
    return (data || []) as Expense[];
  }

  async getExpenseById(businessId: string, id: string): Promise<Expense | null> {
    const { data, error } = await this.client
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as Expense;
  }

  async createExpense(expense: Expense): Promise<Expense> {
    const { data, error } = await this.client
      .from('expenses')
      .insert(expense)
      .select()
      .single();
    if (error) throw new Error(`Supabase createExpense error: ${error.message}`);
    return data as Expense;
  }

  async updateExpense(businessId: string, id: string, updates: Partial<Expense>): Promise<Expense> {
    const { data, error } = await this.client
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Supabase updateExpense error: ${error.message}`);
    return data as Expense;
  }

  async deleteExpense(businessId: string, id: string): Promise<boolean> {
    const { error } = await this.client
      .from('expenses')
      .delete()
      .eq('business_id', businessId)
      .eq('id', id);
    return !error;
  }

  async getSupplierPayments(businessId: string, supplierId?: string): Promise<SupplierPayment[]> {
    let query = this.client
      .from('supplier_payments')
      .select(`
        *,
        suppliers (name)
      `)
      .eq('business_id', businessId)
      .order('payment_date', { ascending: false });

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase getSupplierPayments error: ${error.message}`);

    return (data || []).map((p: any) => ({
      ...p,
      supplier_name: p.suppliers?.name || 'Unknown Supplier'
    }));
  }

  async createSupplierPayment(payment: SupplierPayment): Promise<SupplierPayment> {
    const { supplier_name, ...paymentRow } = payment as any;
    const { data, error } = await this.client
      .from('supplier_payments')
      .insert(paymentRow)
      .select()
      .single();
    if (error) throw new Error(`Supabase createSupplierPayment error: ${error.message}`);
    return data as SupplierPayment;
  }

  async getStockMovements(businessId: string, productId?: string): Promise<StockMovement[]> {
    let query = this.client
      .from('stock_movements')
      .select(`
        *,
        products (name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase getStockMovements error: ${error.message}`);

    return (data || []).map((m: any) => ({
      ...m,
      product_name: m.products?.name || 'Unknown Product'
    }));
  }

  async createStockMovement(movement: StockMovement): Promise<StockMovement> {
    const { product_name, ...movementRow } = movement as any;
    const { data, error } = await this.client
      .from('stock_movements')
      .insert(movementRow)
      .select()
      .single();
    if (error) throw new Error(`Supabase createStockMovement error: ${error.message}`);
    return data as StockMovement;
  }

  async getTransactions(businessId: string): Promise<TransactionRecord[]> {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });
    if (error) throw new Error(`Supabase getTransactions error: ${error.message}`);
    return (data || []) as TransactionRecord[];
  }

  async createTransaction(record: TransactionRecord): Promise<TransactionRecord> {
    const { data, error } = await this.client
      .from('transactions')
      .insert(record)
      .select()
      .single();
    if (error) throw new Error(`Supabase createTransaction error: ${error.message}`);
    return data as TransactionRecord;
  }

  async seedInitialData(businessId: string): Promise<void> {
    // In Supabase, the seed data is usually loaded via SQL migration or initial upsert
    console.log(`Supabase seed requested for business: ${businessId}`);
  }
}

