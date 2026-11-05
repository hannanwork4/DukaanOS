import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { Expense } from '../types.js';

export interface RecordExpenseInput {
  description: string;
  category: 'Electricity' | 'Rent' | 'Transport' | 'Wages' | 'Maintenance' | 'Miscellaneous';
  amount: number;
  date?: string;
  payment_method?: 'Cash' | 'UPI' | 'Bank Transfer';
  notes?: string;
}

export class ExpenseService {
  async getExpenses(businessId: string): Promise<Expense[]> {
    return db.getExpenses(businessId);
  }

  async getExpenseById(businessId: string, id: string): Promise<Expense | null> {
    return db.getExpenseById(businessId, id);
  }

  async recordExpense(businessId: string, input: RecordExpenseInput): Promise<Expense> {
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new Error('Description is required.');
    }

    const validCategories = ['Electricity', 'Rent', 'Transport', 'Wages', 'Maintenance', 'Miscellaneous'];
    if (!validCategories.includes(input.category)) {
      throw new Error(`Invalid expense category: ${input.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    const now = input.date || new Date().toISOString();
    const paymentMethod = input.payment_method || 'Cash';

    const expense: Expense = {
      id: uuidv4(),
      business_id: businessId,
      description: input.description.trim(),
      category: input.category,
      amount,
      date: now,
      payment_method: paymentMethod,
      notes: input.notes?.trim(),
      created_at: now,
      updated_at: now
    };

    const created = await db.createExpense(expense);

    // Ledger transaction
    await db.createTransaction({
      id: uuidv4(),
      business_id: businessId,
      type: 'expense',
      amount,
      date: now,
      description: `${input.description.trim()} (${input.category})`,
      reference_id: created.id,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: now
    });

    return created;
  }

  async updateExpense(businessId: string, id: string, updates: Partial<Expense>): Promise<Expense> {
    return db.updateExpense(businessId, id, updates);
  }

  async deleteExpense(businessId: string, id: string): Promise<boolean> {
    return db.deleteExpense(businessId, id);
  }
}

export const expenseService = new ExpenseService();

