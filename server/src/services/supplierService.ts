import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { Supplier, SupplierPayment, TransactionRecord } from '../types.js';

export class SupplierService {
  async getSuppliers(businessId: string): Promise<Supplier[]> {
    return db.getSuppliers(businessId);
  }

  async getSupplierById(businessId: string, id: string): Promise<Supplier | null> {
    return db.getSupplierById(businessId, id);
  }

  async getSupplierByName(businessId: string, name: string): Promise<Supplier | null> {
    return db.getSupplierByName(businessId, name);
  }

  async createSupplier(businessId: string, data: {
    name: string;
    business_name?: string;
    phone?: string;
    address?: string;
  }): Promise<Supplier> {
    const existing = await db.getSupplierByName(businessId, data.name);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const supplier: Supplier = {
      id: uuidv4(),
      business_id: businessId,
      name: data.name.trim(),
      business_name: data.business_name?.trim(),
      phone: data.phone?.trim(),
      address: data.address?.trim(),
      total_purchases: 0,
      amount_paid: 0,
      outstanding_balance: 0,
      created_at: now,
      updated_at: now
    };

    return db.createSupplier(supplier);
  }

  async updateSupplier(businessId: string, id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const supplier = await db.getSupplierById(businessId, id);
    if (!supplier) throw new Error(`Supplier not found: ${id}`);
    return db.updateSupplier(businessId, id, updates);
  }

  async recordSupplierPayment(businessId: string, data: {
    supplier_id: string;
    purchase_id?: string;
    amount: number;
    payment_method?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
    payment_date?: string;
    notes?: string;
  }): Promise<{ payment: SupplierPayment; supplier: Supplier }> {
    const supplier = await db.getSupplierById(businessId, data.supplier_id);
    if (!supplier) throw new Error(`Supplier not found: ${data.supplier_id}`);

    const payAmount = Number(data.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const now = data.payment_date || new Date().toISOString();
    const paymentMethod = data.payment_method || 'Cash';

    // Update supplier balances:
    // Amount paid increases, outstanding balance decreases
    const newPaid = Number(supplier.amount_paid) + payAmount;
    const newOutstanding = Math.max(0, Number(supplier.outstanding_balance) - payAmount);

    const updatedSupplier = await db.updateSupplier(businessId, supplier.id, {
      amount_paid: newPaid,
      outstanding_balance: newOutstanding
    });

    const payment: SupplierPayment = {
      id: uuidv4(),
      business_id: businessId,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      purchase_id: data.purchase_id,
      amount: payAmount,
      payment_date: now,
      payment_method: paymentMethod,
      notes: data.notes,
      created_at: now
    };

    const savedPayment = await db.createSupplierPayment(payment);

    // Create ledger transaction for audit
    // Crucial rule: Does not count as an expense, marked as type 'supplier_payment'
    await db.createTransaction({
      id: uuidv4(),
      business_id: businessId,
      type: 'supplier_payment',
      amount: payAmount,
      date: now,
      description: `Payment to ${supplier.name} (${paymentMethod})${data.notes ? ` - ${data.notes}` : ''}`,
      reference_id: savedPayment.id,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: now
    });

    return { payment: savedPayment, supplier: updatedSupplier };
  }

  async getSupplierPayments(businessId: string, supplierId?: string): Promise<SupplierPayment[]> {
    return db.getSupplierPayments(businessId, supplierId);
  }

  async getSupplierBalance(businessId: string, supplierId: string): Promise<{
    supplier: Supplier;
    total_purchases: number;
    amount_paid: number;
    outstanding_balance: number;
  }> {
    const supplier = await db.getSupplierById(businessId, supplierId);
    if (!supplier) throw new Error(`Supplier not found: ${supplierId}`);

    return {
      supplier,
      total_purchases: supplier.total_purchases,
      amount_paid: supplier.amount_paid,
      outstanding_balance: supplier.outstanding_balance
    };
  }
}

export const supplierService = new SupplierService();
