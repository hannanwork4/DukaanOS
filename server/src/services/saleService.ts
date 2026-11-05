import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { Sale, SaleItem, StockMovement, TransactionRecord } from '../types.js';
import { inventoryService } from './inventoryService.js';

export interface SaleItemInput {
  product_id?: string;
  product_name?: string;
  quantity: number;
  unit_price?: number; // optional, defaults to product.selling_price
}

export interface RecordSaleInput {
  sale_date?: string;
  items: SaleItemInput[];
  payment_method?: 'Cash' | 'UPI' | 'Credit';
  amount_received?: number;
  customer_name?: string;
  notes?: string;
}

export class SaleService {
  async getSales(businessId: string): Promise<Sale[]> {
    return db.getSales(businessId);
  }

  async getSaleById(businessId: string, id: string): Promise<Sale | null> {
    return db.getSaleById(businessId, id);
  }

  async recordSale(businessId: string, input: RecordSaleInput): Promise<{
    sale: Sale;
    updated_products: { id: string; name: string; remaining_stock: number }[];
    profit: number;
  }> {
    if (!input.items || input.items.length === 0) {
      throw new Error('Sale must contain at least one item.');
    }

    const saleId = uuidv4();
    const now = input.sale_date || new Date().toISOString();
    let totalAmount = 0;
    let totalProfit = 0;
    const resolvedItems: SaleItem[] = [];
    const productsToUpdate: { product: any; newStock: number; qty: number; unitPrice: number; unitCost: number }[] = [];

    // 1. Validate all products and stock availability FIRST before making changes
    for (const it of input.items) {
      const qty = Number(it.quantity);
      if (qty <= 0) throw new Error(`Quantity must be greater than zero`);

      let product = it.product_id ? await inventoryService.getProductById(businessId, it.product_id) : null;
      if (!product && it.product_name) {
        product = await inventoryService.getProductByName(businessId, it.product_name);
      }

      if (!product) {
        throw new Error(`Product not found: ${it.product_name || it.product_id}`);
      }

      if (product.current_stock < qty) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.current_stock} ${product.unit}, requested: ${qty} ${product.unit}.`
        );
      }

      const unitPrice = it.unit_price !== undefined ? Number(it.unit_price) : product.selling_price;
      const unitCost = product.purchase_price;
      const itemTotal = qty * unitPrice;
      const itemProfit = qty * (unitPrice - unitCost);

      totalAmount += itemTotal;
      totalProfit += itemProfit;

      const newStock = product.current_stock - qty;

      productsToUpdate.push({
        product,
        newStock,
        qty,
        unitPrice,
        unitCost
      });

      resolvedItems.push({
        id: uuidv4(),
        sale_id: saleId,
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: itemTotal,
        unit_cost: unitCost
      });
    }

    const paymentMethod = input.payment_method || 'Cash';
    const amountReceived = input.amount_received !== undefined
      ? Number(input.amount_received)
      : (paymentMethod === 'Credit' ? 0 : totalAmount);
    const outstandingAmount = Math.max(0, totalAmount - amountReceived);

    // 2. Create Sale Record
    const sale: Sale = {
      id: saleId,
      business_id: businessId,
      sale_date: now,
      total_amount: totalAmount,
      amount_received: amountReceived,
      outstanding_amount: outstandingAmount,
      payment_method: paymentMethod,
      estimated_profit: totalProfit,
      customer_name: input.customer_name,
      notes: input.notes,
      status: 'completed',
      created_at: now,
      updated_at: now
    };

    const savedSale = await db.createSale(sale, resolvedItems);

    // 3. Deduct stock and record stock movements
    const updatedProducts: { id: string; name: string; remaining_stock: number }[] = [];
    for (const update of productsToUpdate) {
      await inventoryService.updateProduct(businessId, update.product.id, {
        current_stock: update.newStock
      });

      await db.createStockMovement({
        id: uuidv4(),
        business_id: businessId,
        product_id: update.product.id,
        product_name: update.product.name,
        type: 'sale',
        quantity: -update.qty,
        stock_before: update.product.current_stock,
        stock_after: update.newStock,
        reference_id: savedSale.id,
        notes: `Sale (${paymentMethod}) - Sale ID: ${savedSale.id.slice(0, 8)}`,
        created_at: now
      });

      updatedProducts.push({
        id: update.product.id,
        name: update.product.name,
        remaining_stock: update.newStock
      });
    }

    // 4. Create Ledger Transaction
    const itemSummary = resolvedItems.map(i => `${i.quantity}x ${i.product_name}`).join(', ');
    await db.createTransaction({
      id: uuidv4(),
      business_id: businessId,
      type: 'sale',
      amount: totalAmount,
      date: now,
      description: `Sale [${itemSummary}] - Mode: ${paymentMethod}${input.customer_name ? ` (Cust: ${input.customer_name})` : ''}`,
      reference_id: savedSale.id,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: now
    });

    return {
      sale: savedSale,
      updated_products: updatedProducts,
      profit: totalProfit
    };
  }

  async updateSale(businessId: string, saleId: string, input: RecordSaleInput): Promise<{
    sale: Sale;
    updated_products: { id: string; name: string; remaining_stock: number }[];
  }> {
    const existing = await db.getSaleById(businessId, saleId);
    if (!existing) throw new Error(`Sale not found: ${saleId}`);

    const existingItems = existing.items || [];

    // 1. REVERSAL: restore stock from old items
    for (const oldItem of existingItems) {
      const product = await inventoryService.getProductById(businessId, oldItem.product_id);
      if (product) {
        const stockBefore = product.current_stock;
        const stockAfter = stockBefore + oldItem.quantity;

        await inventoryService.updateProduct(businessId, product.id, {
          current_stock: stockAfter
        });

        await db.createStockMovement({
          id: uuidv4(),
          business_id: businessId,
          product_id: product.id,
          product_name: product.name,
          type: 'sale_reversal',
          quantity: oldItem.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_id: saleId,
          notes: `Reversal for edited sale ${saleId.slice(0, 8)}`,
          created_at: new Date().toISOString()
        });
      }
    }

    // 2. VALIDATE NEW ITEMS & CHECK STOCK
    let totalAmount = 0;
    let totalProfit = 0;
    const resolvedItems: SaleItem[] = [];
    const productsToUpdate: { product: any; newStock: number; qty: number; unitPrice: number; unitCost: number }[] = [];

    for (const it of input.items) {
      const qty = Number(it.quantity);
      if (qty <= 0) throw new Error('Quantity must be greater than zero');

      let product = it.product_id ? await inventoryService.getProductById(businessId, it.product_id) : null;
      if (!product && it.product_name) {
        product = await inventoryService.getProductByName(businessId, it.product_name);
      }
      if (!product) throw new Error(`Product not found: ${it.product_name || it.product_id}`);

      if (product.current_stock < qty) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.current_stock}, requested: ${qty}.`);
      }

      const unitPrice = it.unit_price !== undefined ? Number(it.unit_price) : product.selling_price;
      const unitCost = product.purchase_price;
      const itemTotal = qty * unitPrice;
      const itemProfit = qty * (unitPrice - unitCost);

      totalAmount += itemTotal;
      totalProfit += itemProfit;

      productsToUpdate.push({
        product,
        newStock: product.current_stock - qty,
        qty,
        unitPrice,
        unitCost
      });

      resolvedItems.push({
        id: uuidv4(),
        sale_id: saleId,
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: itemTotal,
        unit_cost: unitCost
      });
    }

    const paymentMethod = input.payment_method || existing.payment_method;
    const amountReceived = input.amount_received !== undefined ? Number(input.amount_received) : totalAmount;
    const outstandingAmount = Math.max(0, totalAmount - amountReceived);

    // 3. APPLY STOCK REDUCTION
    const updatedProducts: { id: string; name: string; remaining_stock: number }[] = [];
    for (const update of productsToUpdate) {
      await inventoryService.updateProduct(businessId, update.product.id, {
        current_stock: update.newStock
      });

      await db.createStockMovement({
        id: uuidv4(),
        business_id: businessId,
        product_id: update.product.id,
        product_name: update.product.name,
        type: 'sale',
        quantity: -update.qty,
        stock_before: update.product.current_stock,
        stock_after: update.newStock,
        reference_id: saleId,
        notes: `Updated sale - Sale ID: ${saleId.slice(0, 8)}`,
        created_at: new Date().toISOString()
      });

      updatedProducts.push({
        id: update.product.id,
        name: update.product.name,
        remaining_stock: update.newStock
      });
    }

    const updatedSale: Sale = {
      id: saleId,
      business_id: businessId,
      sale_date: input.sale_date || existing.sale_date,
      total_amount: totalAmount,
      amount_received: amountReceived,
      outstanding_amount: outstandingAmount,
      payment_method: paymentMethod,
      estimated_profit: totalProfit,
      customer_name: input.customer_name ?? existing.customer_name,
      notes: input.notes ?? existing.notes,
      status: 'completed',
      created_at: existing.created_at,
      updated_at: new Date().toISOString()
    };

    const saved = await db.updateSale(updatedSale, resolvedItems);

    return {
      sale: saved,
      updated_products: updatedProducts
    };
  }
}

export const saleService = new SaleService();
