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
  TransactionRecord,
  User
} from '../types.js';

export interface IDatabase {
  // Business
  getBusiness(id: string): Promise<Business | null>;
  createBusiness(business: Business): Promise<Business>;
  updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null>;
  deleteBusiness(id: string): Promise<boolean>;

  // Users & Auth
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  saveOtp(email: string, otp: string, ttlMs?: number): Promise<void>;
  verifyOtp(email: string, otp: string): Promise<boolean>;

  // Products
  getProducts(businessId: string): Promise<Product[]>;
  getProductById(businessId: string, id: string): Promise<Product | null>;
  getProductByName(businessId: string, name: string): Promise<Product | null>;
  createProduct(product: Product): Promise<Product>;
  updateProduct(businessId: string, id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(businessId: string, id: string): Promise<boolean>;

  // Suppliers
  getSuppliers(businessId: string): Promise<Supplier[]>;
  getSupplierById(businessId: string, id: string): Promise<Supplier | null>;
  getSupplierByName(businessId: string, name: string): Promise<Supplier | null>;
  createSupplier(supplier: Supplier): Promise<Supplier>;
  updateSupplier(businessId: string, id: string, updates: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(businessId: string, id: string): Promise<boolean>;

  // Purchases
  getPurchases(businessId: string): Promise<Purchase[]>;
  getPurchaseById(businessId: string, id: string): Promise<Purchase | null>;
  createPurchase(purchase: Purchase, items: PurchaseItem[]): Promise<Purchase>;
  updatePurchase(purchase: Purchase, items: PurchaseItem[]): Promise<Purchase>;

  // Sales
  getSales(businessId: string): Promise<Sale[]>;
  getSaleById(businessId: string, id: string): Promise<Sale | null>;
  createSale(sale: Sale, items: SaleItem[]): Promise<Sale>;
  updateSale(sale: Sale, items: SaleItem[]): Promise<Sale>;

  // Expenses
  getExpenses(businessId: string): Promise<Expense[]>;
  getExpenseById(businessId: string, id: string): Promise<Expense | null>;
  createExpense(expense: Expense): Promise<Expense>;
  updateExpense(businessId: string, id: string, updates: Partial<Expense>): Promise<Expense>;
  deleteExpense(businessId: string, id: string): Promise<boolean>;

  // Supplier Payments
  getSupplierPayments(businessId: string, supplierId?: string): Promise<SupplierPayment[]>;
  createSupplierPayment(payment: SupplierPayment): Promise<SupplierPayment>;

  // Stock Movements
  getStockMovements(businessId: string, productId?: string): Promise<StockMovement[]>;
  createStockMovement(movement: StockMovement): Promise<StockMovement>;

  // Transactions (Ledger)
  getTransactions(businessId: string): Promise<TransactionRecord[]>;
  createTransaction(record: TransactionRecord): Promise<TransactionRecord>;

  // Seed & Reset
  seedInitialData(businessId: string): Promise<void>;
}

