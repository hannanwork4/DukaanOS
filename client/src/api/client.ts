const isDev = import.meta.env.DEV;
const envApiUrl = import.meta.env.VITE_API_URL;
// In production or on Vercel, when VITE_API_URL is omitted or points to localhost, use relative path '' so requests hit the live Vercel API endpoint.
const API_BASE = (envApiUrl && !envApiUrl.includes('localhost') ? envApiUrl : (isDev ? 'http://localhost:4000' : '')).replace(/\/$/, '');

export const DEFAULT_BUSINESS_ID = 'b0000000-0000-0000-0000-000000000001';

export function getActiveBusinessId(): string {
  return localStorage.getItem('dukaanos_business_id') || DEFAULT_BUSINESS_ID;
}

export function setActiveBusinessId(id: string) {
  localStorage.setItem('dukaanos_business_id', id);
}

// ----------------------------------------------------
// Resilient Offline Local Fallback Catalog
// ----------------------------------------------------
const FALLBACK_BUSINESS = {
  id: DEFAULT_BUSINESS_ID,
  name: 'Sharma General Store',
  owner_name: 'Abdul Hannan',
  phone: '9848022338',
  address: 'Shop No. 4, Main Market, Lajpat Nagar, New Delhi',
  currency: 'INR'
};

const FALLBACK_PRODUCTS: any[] = [];
const FALLBACK_SUPPLIERS: any[] = [];

const FALLBACK_DASHBOARD = {
  shop_summary: {
    today_sales: 0,
    today_purchases: 0,
    today_expenses: 0,
    estimated_gross_profit: 0,
    supplier_dues: 0,
    low_stock_count: 0,
    inventory_items: 0,
    total_inventory_value: 0
  },
  recent_sales: [],
  recent_purchases: []
};

function handleOfflineFallback<T>(endpoint: string, options: RequestInit = {}): T | undefined {
  const method = (options.method || 'GET').toUpperCase();

  // Auth / Login fallback
  if (endpoint === '/api/auth/login' && method === 'POST') {
    try {
      const body = JSON.parse(options.body as string || '{}');
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password;
      if (email === 'hannan@volopay.co') {
        if (password !== 'Hannan_Volopay') {
          throw new Error('Incorrect password for demo account. Please use: Hannan_Volopay');
        }
        const offlineToken = 'offline_token_demo_hannan_' + Date.now();
        localStorage.setItem('dukaanos_token', offlineToken);
        localStorage.setItem('dukaanos_business_id', DEFAULT_BUSINESS_ID);
        return {
          token: offlineToken,
          user: { id: 'u-volopay-hannan-demo', email: 'hannan@volopay.co', name: 'Abdul Hannan', phone: '9848022338', business_id: DEFAULT_BUSINESS_ID },
          business: FALLBACK_BUSINESS
        } as T;
      }
    } catch (e: any) {
      if (e.message?.includes('Incorrect password')) throw e;
    }
  }

  // Demo Login
  if (endpoint === '/api/auth/demo-login' && method === 'POST') {
    const offlineToken = 'offline_token_demo_hannan_' + Date.now();
    localStorage.setItem('dukaanos_token', offlineToken);
    localStorage.setItem('dukaanos_business_id', DEFAULT_BUSINESS_ID);
    return {
      token: offlineToken,
      user: { id: 'u-volopay-hannan-demo', email: 'hannan@volopay.co', name: 'Abdul Hannan', phone: '9848022338', business_id: DEFAULT_BUSINESS_ID },
      business: FALLBACK_BUSINESS
    } as T;
  }

  // Auth Me
  if (endpoint === '/api/auth/me') {
    return {
      user: { id: 'u-volopay-hannan-demo', email: 'hannan@volopay.co', name: 'Abdul Hannan', phone: '9848022338', business_id: DEFAULT_BUSINESS_ID },
      business: FALLBACK_BUSINESS
    } as T;
  }

  // Business Profile
  if (endpoint === '/api/business/profile') {
    return FALLBACK_BUSINESS as T;
  }

  // Dashboard summary
  if (endpoint === '/api/ledger/dashboard-summary') {
    return FALLBACK_DASHBOARD as T;
  }

  // Products
  if (endpoint === '/api/products') {
    return FALLBACK_PRODUCTS as T;
  }
  if (endpoint === '/api/products/low-stock') {
    return FALLBACK_PRODUCTS.filter(p => p.current_stock <= p.min_stock_alert) as T;
  }

  // Suppliers
  if (endpoint === '/api/suppliers') {
    return FALLBACK_SUPPLIERS as T;
  }

  // Purchases / Sales / Expenses / Transactions / Insights
  if (endpoint === '/api/purchases') return [] as T;
  if (endpoint === '/api/sales') return [] as T;
  if (endpoint === '/api/expenses') return [] as T;
  if (endpoint === '/api/ledger/transactions') return [] as T;
  if (endpoint === '/api/insights') {
    return [
      { id: 'ins-01', title: 'Restock Required: Fortune Sunlite Refined Oil', type: 'inventory', impact: 'high', description: 'Stock has fallen to 4 units (below min threshold of 8). Reorder from Sunil Gupta today.' },
      { id: 'ins-02', title: 'Pending Supplier Due: Ramesh Traders', type: 'finance', impact: 'medium', description: 'Outstanding balance of ₹4,000 is due for invoice #P-1001.' }
    ] as T;
  }

  return undefined;
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const businessId = getActiveBusinessId();
  const token = localStorage.getItem('dukaanos_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-business-id': businessId,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const json = await response.json() as any;

    if (!response.ok || json.success === false) {
      throw new Error(json.error || `Error ${response.status}: Failed to perform request`);
    }

    return json.data !== undefined ? json.data : json;
  } catch (err: any) {
    const isNetworkError = err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('Load failed') ||
      err?.name === 'TypeError';

    if (isNetworkError) {
      const fallbackResult = handleOfflineFallback<T>(endpoint, options);
      if (fallbackResult !== undefined) {
        return fallbackResult;
      }
    }
    throw err;
  }
}

export const api = {
  // Auth & Onboarding
  sendOtp: (data: { email: string; store_name?: string }) =>
    fetchJson<{ success: boolean; message: string; devOtp?: string }>('/api/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data: { email: string; otp: string }) =>
    fetchJson<{ success: boolean; message: string }>('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data: any) =>
    fetchJson<any>('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) =>
    fetchJson<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  demoLogin: () =>
    fetchJson<any>('/api/auth/demo-login', { method: 'POST' }),
  getAuthMe: () =>
    fetchJson<any>('/api/auth/me'),

  // Business Profile
  getBusiness: () => fetchJson<any>('/api/business/profile'),
  updateBusiness: (data: any) => fetchJson<any>('/api/business/profile', { method: 'PUT', body: JSON.stringify(data) }),
  seedDemoData: () => fetchJson<any>('/api/business/seed', { method: 'POST' }),
  autoConfigureClaude: () => fetchJson<{ configuredOnDisk: boolean; configPath: string; config: any; message: string }>('/api/business/claude-auto-configure', { method: 'POST' }),
  deleteAccount: (businessId?: string) => fetchJson<{ success: boolean; message: string }>('/api/business/account', { method: 'DELETE', body: JSON.stringify({ business_id: businessId }) }),

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
