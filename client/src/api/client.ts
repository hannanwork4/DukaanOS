const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const DEFAULT_BUSINESS_ID = 'b0000000-0000-0000-0000-000000000001';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-business-id': DEFAULT_BUSINESS_ID,
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(url, { ...options, headers });
  const json = await response.json() as any;

  if (!response.ok || json.success === false) {
    throw new Error(json.error || `Error ${response.status}: Failed to perform request`);
  }

  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Business
  getBusiness: () => fetchJson<any>('/api/business/profile'),
  seedDemoData: () => fetchJson<any>('/api/business/seed', { method: 'POST' }),

  // Products
  getProducts: () => fetchJson<any[]>('/api/products'),
  getLowStockProducts: () => fetchJson<any[]>('/api/products/low-stock'),
  createProduct: (data: any) => fetchJson<any>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => fetchJson<any>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => fetchJson<any>(`/api/products/${id}`, { method: 'DELETE' }),
  adjustStock: (id: string, new_stock: number, reason: string) => 
    fetchJson<any>(`/api/products/${id}/adjust-stock`, { method: 'POST', body: JSON.stringify({ new_stock, reason }) }),
  getProductMovements: (id: string) => fetchJson<any[]>(`/api/products/${id}/movements`),

  // Suppliers
  getSuppliers: () => fetchJson<any[]>('/api/suppliers'),
  getSupplierById: (id: string) => fetchJson<any>(`/api/suppliers/${id}`),
  createSupplier: (data: any) => fetchJson<any>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: any) => fetchJson<any>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordSupplierPayment: (supplierId: string, data: any) => 
    fetchJson<any>(`/api/suppliers/${supplierId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  getSupplierPayments: (supplierId: string) => fetchJson<any[]>(`/api/suppliers/${supplierId}/payments`),

  // Purchases
  getPurchases: () => fetchJson<any[]>('/api/purchases'),
  getPurchaseById: (id: string) => fetchJson<any>(`/api/purchases/${id}`),
  recordPurchase: (data: any) => fetchJson<any>('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),
  updatePurchase: (id: string, data: any) => fetchJson<any>(`/api/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Sales
  getSales: () => fetchJson<any[]>('/api/sales'),
  getSaleById: (id: string) => fetchJson<any>(`/api/sales/${id}`),
  recordSale: (data: any) => fetchJson<any>('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
  updateSale: (id: string, data: any) => fetchJson<any>(`/api/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Expenses
  getExpenses: () => fetchJson<any[]>('/api/expenses'),
  recordExpense: (data: any) => fetchJson<any>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: any) => fetchJson<any>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: string) => fetchJson<any>(`/api/expenses/${id}`, { method: 'DELETE' }),

  // Ledger & Dashboard
  getDashboardSummary: () => fetchJson<any>('/api/ledger/dashboard-summary'),
  getTransactions: () => fetchJson<any[]>('/api/ledger/transactions'),

  // Insights
  getBusinessInsights: () => fetchJson<any[]>('/api/insights')
};
