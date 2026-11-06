import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

const candidateEnvPaths = [
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  'C:\\Users\\DELL\\Desktop\\DukaanOS\\.env'
];
for (const envPath of candidateEnvPaths) {
  try {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
  } catch {}
}
dotenv.config();

export class DukaanApiClient {
  private businessId?: string;

  constructor(businessId?: string) {
    this.businessId = businessId;
  }

  private get baseUrl(): string {
    return (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
  }

  private get activeBusinessId(): string {
    return this.businessId || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-business-id': this.activeBusinessId,
      ...(options.headers as Record<string, string> || {})
    };

    const res = await fetch(url, { ...options, headers });
    const data = await res.json() as any;

    if (!res.ok || data.success === false) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data.data !== undefined ? data.data : data;
  }

  // Products
  async getProducts() {
    return this.request<any[]>('/api/products');
  }

  async getLowStockProducts() {
    return this.request<any[]>('/api/products/low-stock');
  }

  async createProduct(data: any) {
    return this.request<any>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request<any>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Suppliers
  async getSuppliers() {
    return this.request<any[]>('/api/suppliers');
  }

  async createSupplier(data: any) {
    return this.request<any>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSupplierBalance(id: string) {
    return this.request<any>(`/api/suppliers/${id}/balance`);
  }

  async recordSupplierPayment(supplierId: string, data: any) {
    return this.request<any>(`/api/suppliers/${supplierId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Purchases
  async getPurchases() {
    return this.request<any[]>('/api/purchases');
  }

  async recordPurchase(data: any) {
    return this.request<any>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePurchase(id: string, data: any) {
    return this.request<any>(`/api/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Sales
  async getSales() {
    return this.request<any[]>('/api/sales');
  }

  async recordSale(data: any) {
    return this.request<any>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSale(id: string, data: any) {
    return this.request<any>(`/api/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Expenses
  async getExpenses() {
    return this.request<any[]>('/api/expenses');
  }

  async recordExpense(data: any) {
    return this.request<any>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Ledger & Dashboard
  async getDashboardSummary() {
    return this.request<any>('/api/ledger/dashboard-summary');
  }

  async getTransactions() {
    return this.request<any[]>('/api/ledger/transactions');
  }

  // Business
  async getBusiness() {
    return this.request<any>('/api/business/profile');
  }

  // Insights
  async getBusinessInsights() {
    return this.request<any[]>('/api/insights');
  }
}

export const apiClient = new DukaanApiClient();

