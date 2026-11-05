import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

interface SchemaData {
  businesses: Business[];
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  purchase_items: PurchaseItem[];
  sales: Sale[];
  sale_items: SaleItem[];
  expenses: Expense[];
  supplier_payments: SupplierPayment[];
  stock_movements: StockMovement[];
  transactions: TransactionRecord[];
}

export class LocalStore implements IDatabase {
  private filePath: string;
  private data: SchemaData;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      this.filePath = path.join(dataDir, 'dukaanos.json');
    }

    this.data = this.loadData();
  }

  private loadData(): SchemaData {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error reading local db file, initializing fresh:', e);
      }
    }
    const fresh: SchemaData = {
      businesses: [],
      products: [],
      suppliers: [],
      purchases: [],
      purchase_items: [],
      sales: [],
      sale_items: [],
      expenses: [],
      supplier_payments: [],
      stock_movements: [],
      transactions: []
    };
    this.saveData(fresh);
    return fresh;
  }

  private saveData(dataToSave?: SchemaData) {
    const toWrite = dataToSave || this.data;
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(toWrite, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.filePath);
  }

  async getBusiness(id: string): Promise<Business | null> {
    return this.data.businesses.find(b => b.id === id) || null;
  }

  async createBusiness(business: Business): Promise<Business> {
    const existing = this.data.businesses.findIndex(b => b.id === business.id);
    if (existing >= 0) {
      this.data.businesses[existing] = business;
    } else {
      this.data.businesses.push(business);
    }
    this.saveData();
    return business;
  }

  async getProducts(businessId: string): Promise<Product[]> {
    return this.data.products
      .filter(p => p.business_id === businessId && !p.is_archived)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProductById(businessId: string, id: string): Promise<Product | null> {
    return this.data.products.find(p => p.business_id === businessId && p.id === id) || null;
  }

  async getProductByName(businessId: string, name: string): Promise<Product | null> {
    const normalized = name.trim().toLowerCase();
    return this.data.products.find(p => 
      p.business_id === businessId && 
      !p.is_archived && 
      p.name.toLowerCase() === normalized
    ) || null;
  }

  async createProduct(product: Product): Promise<Product> {
    this.data.products.push(product);
    this.saveData();
    return product;
  }

  async updateProduct(businessId: string, id: string, updates: Partial<Product>): Promise<Product> {
    const index = this.data.products.findIndex(p => p.business_id === businessId && p.id === id);
    if (index === -1) throw new Error(`Product not found: ${id}`);
    this.data.products[index] = {
      ...this.data.products[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return this.data.products[index];
  }

  async deleteProduct(businessId: string, id: string): Promise<boolean> {
    const index = this.data.products.findIndex(p => p.business_id === businessId && p.id === id);
    if (index === -1) return false;
    // Soft delete / archive to maintain transaction & stock integrity
    this.data.products[index].is_archived = true;
    this.data.products[index].updated_at = new Date().toISOString();
    this.saveData();
    return true;
  }

  async getSuppliers(businessId: string): Promise<Supplier[]> {
    return this.data.suppliers
      .filter(s => s.business_id === businessId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getSupplierById(businessId: string, id: string): Promise<Supplier | null> {
    return this.data.suppliers.find(s => s.business_id === businessId && s.id === id) || null;
  }

  async getSupplierByName(businessId: string, name: string): Promise<Supplier | null> {
    const normalized = name.trim().toLowerCase();
    return this.data.suppliers.find(s => 
      s.business_id === businessId && 
      (s.name.toLowerCase() === normalized || (s.business_name && s.business_name.toLowerCase() === normalized))
    ) || null;
  }

  async createSupplier(supplier: Supplier): Promise<Supplier> {
    this.data.suppliers.push(supplier);
    this.saveData();
    return supplier;
  }

  async updateSupplier(businessId: string, id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const index = this.data.suppliers.findIndex(s => s.business_id === businessId && s.id === id);
    if (index === -1) throw new Error(`Supplier not found: ${id}`);
    this.data.suppliers[index] = {
      ...this.data.suppliers[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return this.data.suppliers[index];
  }

  async deleteSupplier(businessId: string, id: string): Promise<boolean> {
    const index = this.data.suppliers.findIndex(s => s.business_id === businessId && s.id === id);
    if (index === -1) return false;
    this.data.suppliers.splice(index, 1);
    this.saveData();
    return true;
  }

  async getPurchases(businessId: string): Promise<Purchase[]> {
    const purchases = this.data.purchases
      .filter(p => p.business_id === businessId)
      .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());

    return purchases.map(p => {
      const items = this.data.purchase_items.filter(item => item.purchase_id === p.id);
      const supplier = this.data.suppliers.find(s => s.id === p.supplier_id);
      return {
        ...p,
        supplier_name: supplier ? supplier.name : 'Unknown Supplier',
        items: items.map(it => {
          const prod = this.data.products.find(pr => pr.id === it.product_id);
          return { ...it, product_name: prod ? prod.name : 'Unknown Product' };
        })
      };
    });
  }

  async getPurchaseById(businessId: string, id: string): Promise<Purchase | null> {
    const p = this.data.purchases.find(item => item.business_id === businessId && item.id === id);
    if (!p) return null;
    const items = this.data.purchase_items.filter(item => item.purchase_id === p.id);
    const supplier = this.data.suppliers.find(s => s.id === p.supplier_id);
    return {
      ...p,
      supplier_name: supplier ? supplier.name : 'Unknown Supplier',
      items: items.map(it => {
        const prod = this.data.products.find(pr => pr.id === it.product_id);
        return { ...it, product_name: prod ? prod.name : 'Unknown Product' };
      })
    };
  }

  async createPurchase(purchase: Purchase, items: PurchaseItem[]): Promise<Purchase> {
    this.data.purchases.push(purchase);
    for (const item of items) {
      this.data.purchase_items.push(item);
    }
    this.saveData();
    return this.getPurchaseById(purchase.business_id, purchase.id) as Promise<Purchase>;
  }

  async updatePurchase(purchase: Purchase, items: PurchaseItem[]): Promise<Purchase> {
    const index = this.data.purchases.findIndex(p => p.business_id === purchase.business_id && p.id === purchase.id);
    if (index === -1) throw new Error(`Purchase not found: ${purchase.id}`);
    
    this.data.purchases[index] = {
      ...purchase,
      updated_at: new Date().toISOString()
    };

    // Replace items
    this.data.purchase_items = this.data.purchase_items.filter(it => it.purchase_id !== purchase.id);
    for (const item of items) {
      this.data.purchase_items.push(item);
    }

    this.saveData();
    return this.getPurchaseById(purchase.business_id, purchase.id) as Promise<Purchase>;
  }

  async getSales(businessId: string): Promise<Sale[]> {
    const sales = this.data.sales
      .filter(s => s.business_id === businessId)
      .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

    return sales.map(s => {
      const items = this.data.sale_items.filter(item => item.sale_id === s.id);
      return {
        ...s,
        items: items.map(it => {
          const prod = this.data.products.find(pr => pr.id === it.product_id);
          return { ...it, product_name: prod ? prod.name : 'Unknown Product' };
        })
      };
    });
  }

  async getSaleById(businessId: string, id: string): Promise<Sale | null> {
    const s = this.data.sales.find(item => item.business_id === businessId && item.id === id);
    if (!s) return null;
    const items = this.data.sale_items.filter(item => item.sale_id === s.id);
    return {
      ...s,
      items: items.map(it => {
        const prod = this.data.products.find(pr => pr.id === it.product_id);
        return { ...it, product_name: prod ? prod.name : 'Unknown Product' };
      })
    };
  }

  async createSale(sale: Sale, items: SaleItem[]): Promise<Sale> {
    this.data.sales.push(sale);
    for (const item of items) {
      this.data.sale_items.push(item);
    }
    this.saveData();
    return this.getSaleById(sale.business_id, sale.id) as Promise<Sale>;
  }

  async updateSale(sale: Sale, items: SaleItem[]): Promise<Sale> {
    const index = this.data.sales.findIndex(s => s.business_id === sale.business_id && s.id === sale.id);
    if (index === -1) throw new Error(`Sale not found: ${sale.id}`);

    this.data.sales[index] = {
      ...sale,
      updated_at: new Date().toISOString()
    };

    // Replace items
    this.data.sale_items = this.data.sale_items.filter(it => it.sale_id !== sale.id);
    for (const item of items) {
      this.data.sale_items.push(item);
    }

    this.saveData();
    return this.getSaleById(sale.business_id, sale.id) as Promise<Sale>;
  }

  async getExpenses(businessId: string): Promise<Expense[]> {
    return this.data.expenses
      .filter(e => e.business_id === businessId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpenseById(businessId: string, id: string): Promise<Expense | null> {
    return this.data.expenses.find(e => e.business_id === businessId && e.id === id) || null;
  }

  async createExpense(expense: Expense): Promise<Expense> {
    this.data.expenses.push(expense);
    this.saveData();
    return expense;
  }

  async updateExpense(businessId: string, id: string, updates: Partial<Expense>): Promise<Expense> {
    const index = this.data.expenses.findIndex(e => e.business_id === businessId && e.id === id);
    if (index === -1) throw new Error(`Expense not found: ${id}`);
    this.data.expenses[index] = {
      ...this.data.expenses[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return this.data.expenses[index];
  }

  async deleteExpense(businessId: string, id: string): Promise<boolean> {
    const index = this.data.expenses.findIndex(e => e.business_id === businessId && e.id === id);
    if (index === -1) return false;
    this.data.expenses.splice(index, 1);
    this.saveData();
    return true;
  }

  async getSupplierPayments(businessId: string, supplierId?: string): Promise<SupplierPayment[]> {
    let payments = this.data.supplier_payments.filter(p => p.business_id === businessId);
    if (supplierId) {
      payments = payments.filter(p => p.supplier_id === supplierId);
    }
    return payments
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .map(p => {
        const s = this.data.suppliers.find(sup => sup.id === p.supplier_id);
        return {
          ...p,
          supplier_name: s ? s.name : 'Unknown Supplier'
        };
      });
  }

  async createSupplierPayment(payment: SupplierPayment): Promise<SupplierPayment> {
    this.data.supplier_payments.push(payment);
    this.saveData();
    return payment;
  }

  async getStockMovements(businessId: string, productId?: string): Promise<StockMovement[]> {
    let movements = this.data.stock_movements.filter(m => m.business_id === businessId);
    if (productId) {
      movements = movements.filter(m => m.product_id === productId);
    }
    return movements
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(m => {
        const prod = this.data.products.find(p => p.id === m.product_id);
        return {
          ...m,
          product_name: prod ? prod.name : 'Unknown Product'
        };
      });
  }

  async createStockMovement(movement: StockMovement): Promise<StockMovement> {
    this.data.stock_movements.push(movement);
    this.saveData();
    return movement;
  }

  async getTransactions(businessId: string): Promise<TransactionRecord[]> {
    return this.data.transactions
      .filter(t => t.business_id === businessId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createTransaction(record: TransactionRecord): Promise<TransactionRecord> {
    this.data.transactions.push(record);
    this.saveData();
    return record;
  }

  async seedInitialData(businessId: string): Promise<void> {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

    const business: Business = {
      id: businessId,
      name: 'Sharma General Store',
      owner_name: 'Rajesh Sharma',
      phone: '+91 98765 43210',
      address: 'Shop No. 4, Main Market, Lajpat Nagar, New Delhi',
      currency: 'INR',
      created_at: twoDaysAgo,
      updated_at: now.toISOString()
    };

    const suppliers: Supplier[] = [
      {
        id: 's0000000-0000-0000-0000-000000000001',
        business_id: businessId,
        name: 'Ramesh Kumar',
        business_name: 'Ramesh Traders',
        phone: '+91 98112 34567',
        address: 'Warehouse 12, Grain Market, Narela, Delhi',
        total_purchases: 18500,
        amount_paid: 14500,
        outstanding_balance: 4000,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 's0000000-0000-0000-0000-000000000002',
        business_id: businessId,
        name: 'Sunil Gupta',
        business_name: 'Gupta Wholesale Dist.',
        phone: '+91 98223 45678',
        address: 'Block C, Khari Baoli, Old Delhi',
        total_purchases: 24000,
        amount_paid: 24000,
        outstanding_balance: 0,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 's0000000-0000-0000-0000-000000000003',
        business_id: businessId,
        name: 'Balaji Enterprises',
        business_name: 'Balaji Dairy & FMCG',
        phone: '+91 98334 56789',
        address: 'Sector 18, Noida',
        total_purchases: 12500,
        amount_paid: 10000,
        outstanding_balance: 2500,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      }
    ];

    const products: Product[] = [
      {
        id: 'p0000000-0000-0000-0000-000000000001',
        business_id: businessId,
        name: 'Fortune Sunlite Refined Sunflower Oil 1L',
        category: 'Edible Oils',
        sku: 'OIL-FORT-1L',
        unit: 'packets',
        current_stock: 25,
        min_stock_threshold: 10,
        purchase_price: 115,
        selling_price: 135,
        is_archived: false,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 'p0000000-0000-0000-0000-000000000002',
        business_id: businessId,
        name: 'Aashirvaad Shudh Chakki Atta 5kg',
        category: 'Flours & Grains',
        sku: 'ATTA-AASH-5KG',
        unit: 'bags',
        current_stock: 18,
        min_stock_threshold: 8,
        purchase_price: 215,
        selling_price: 250,
        is_archived: false,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 'p0000000-0000-0000-0000-000000000003',
        business_id: businessId,
        name: 'Tata Salt Vacuum Evaporated 1kg',
        category: 'Spices & Seasoning',
        sku: 'SALT-TATA-1KG',
        unit: 'packets',
        current_stock: 42,
        min_stock_threshold: 15,
        purchase_price: 22,
        selling_price: 28,
        is_archived: false,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 'p0000000-0000-0000-0000-000000000004',
        business_id: businessId,
        name: 'Madhur Pure & Hygienic Sugar 1kg',
        category: 'Staples',
        sku: 'SUG-MADH-1KG',
        unit: 'kg',
        current_stock: 35,
        min_stock_threshold: 20,
        purchase_price: 42,
        selling_price: 48,
        is_archived: false,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 'p0000000-0000-0000-0000-000000000005',
        business_id: businessId,
        name: 'Tata Sampann Unpolished Toor Dal 1kg',
        category: 'Pulses',
        sku: 'DAL-TOOR-1KG',
        unit: 'packets',
        current_stock: 4, // LOW STOCK
        min_stock_threshold: 10,
        purchase_price: 140,
        selling_price: 165,
        is_archived: false,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 'p0000000-0000-0000-0000-000000000006',
        business_id: businessId,
        name: 'Parle-G Gold Biscuits 100g',
        category: 'Snacks & Biscuits',
        sku: 'SNK-PARL-100G',
        unit: 'packets',
        current_stock: 3, // LOW STOCK
        min_stock_threshold: 12,
        purchase_price: 8.5,
        selling_price: 10,
        is_archived: false,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 'p0000000-0000-0000-0000-000000000007',
        business_id: businessId,
        name: 'Amul Taaza Homogenised Toned Milk 1L',
        category: 'Dairy',
        sku: 'DRY-AMUL-1L',
        unit: 'packets',
        current_stock: 14,
        min_stock_threshold: 6,
        purchase_price: 62,
        selling_price: 72,
        is_archived: false,
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      }
    ];

    const expenses: Expense[] = [
      {
        id: 'e0000000-0000-0000-0000-000000000001',
        business_id: businessId,
        description: 'Shop Electricity Bill October',
        category: 'Electricity',
        amount: 2450,
        date: twoDaysAgo,
        payment_method: 'UPI',
        notes: 'Paid via BSES online portal',
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      },
      {
        id: 'e0000000-0000-0000-0000-000000000002',
        business_id: businessId,
        description: 'Tempo Transport charges for grain sacks',
        category: 'Transport',
        amount: 600,
        date: oneDayAgo,
        payment_method: 'Cash',
        notes: 'Local tempo freight from mandi',
        created_at: oneDayAgo,
        updated_at: oneDayAgo
      }
    ];

    const transactions: TransactionRecord[] = [
      {
        id: 't0000000-0000-0000-0000-000000000001',
        business_id: businessId,
        type: 'expense',
        amount: 2450,
        date: twoDaysAgo,
        description: 'Shop Electricity Bill October (Electricity)',
        payment_method: 'UPI',
        status: 'completed',
        created_at: twoDaysAgo
      },
      {
        id: 't0000000-0000-0000-0000-000000000002',
        business_id: businessId,
        type: 'expense',
        amount: 600,
        date: oneDayAgo,
        description: 'Tempo Transport charges for grain sacks (Transport)',
        payment_method: 'Cash',
        status: 'completed',
        created_at: oneDayAgo
      }
    ];

    this.data.businesses = [business];
    this.data.suppliers = suppliers;
    this.data.products = products;
    this.data.expenses = expenses;
    this.data.purchases = [];
    this.data.purchase_items = [];
    this.data.sales = [];
    this.data.sale_items = [];
    this.data.supplier_payments = [];
    this.data.stock_movements = [];
    this.data.transactions = transactions;

    this.saveData();
  }
}

