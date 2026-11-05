import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { Purchase, PurchaseItem, StockMovement, TransactionRecord } from '../types.js';
import { inventoryService } from './inventoryService.js';
import { supplierService } from './supplierService.js';

export interface PurchaseItemInput {
  product_id?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
}

export interface RecordPurchaseInput {
  supplier_id?: string;
  supplier_name?: string;
  purchase_date?: string;
  items: PurchaseItemInput[];
  amount_paid?: number;
  payment_method?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit' | 'Pending';
  notes?: string;
}

export class PurchaseService {
  async getPurchases(businessId: string): Promise<Purchase[]> {
    return db.getPurchases(businessId);
  }

  async getPurchaseById(businessId: string, id: string): Promise<Purchase | null> {
    return db.getPurchaseById(businessId, id);
  }

  async recordPurchase(businessId: string, input: RecordPurchaseInput): Promise<{
    purchase: Purchase;
    updated_products: { id: string; name: string; new_stock: number; purchase_price: number }[];
    supplier_balance: { total_purchases: number; amount_paid: number; outstanding_balance: number };
  }> {
    // 1. Resolve Supplier
    let supplierId = input.supplier_id;
    if (!supplierId && input.supplier_name) {
      const existing = await supplierService.getSupplierByName(businessId, input.supplier_name);
      if (existing) {
        supplierId = existing.id;
      } else {
        const createdSupplier = await supplierService.createSupplier(businessId, {
          name: input.supplier_name
        });
        supplierId = createdSupplier.id;
      }
    }

    if (!supplierId) {
      throw new Error('Supplier is required to record a purchase.');
    }

    const supplier = await supplierService.getSupplierById(businessId, supplierId);
    if (!supplier) throw new Error(`Supplier not found with ID: ${supplierId}`);

    if (!input.items || input.items.length === 0) {
      throw new Error('Purchase must contain at least one item.');
    }

    // 2. Resolve Items and calculate total
    const purchaseId = uuidv4();
    const now = input.purchase_date || new Date().toISOString();
    let totalAmount = 0;
    const resolvedItems: PurchaseItem[] = [];
    const updatedProducts: { id: string; name: string; new_stock: number; purchase_price: number }[] = [];

    for (const it of input.items) {
      const qty = Number(it.quantity);
      const price = Number(it.unit_price);
      if (qty <= 0) throw new Error(`Invalid quantity ${qty} for item`);
      if (price < 0) throw new Error(`Invalid unit price ${price} for item`);

      let productId = it.product_id;
      let product = productId ? await inventoryService.getProductById(businessId, productId) : null;

      if (!product && it.product_name) {
        product = await inventoryService.getProductByName(businessId, it.product_name);
        if (!product) {
          // Auto create product if newly purchased
          product = await inventoryService.createProduct(businessId, {
            name: it.product_name,
            purchase_price: price,
            selling_price: Math.round(price * 1.2), // reasonable 20% margin default
            initial_stock: 0
          });
        }
        productId = product.id;
      }

      if (!product || !productId) {
        throw new Error(`Product not found or specified for item`);
      }

      const itemTotal = qty * price;
      totalAmount += itemTotal;

      resolvedItems.push({
        id: uuidv4(),
        purchase_id: purchaseId,
        product_id: productId,
        product_name: product.name,
        quantity: qty,
        unit_price: price,
        total_price: itemTotal
      });
    }

    const amountPaid = Math.min(totalAmount, Math.max(0, Number(input.amount_paid) || 0));
    const outstandingAmount = Math.max(0, totalAmount - amountPaid);
    const paymentMethod = input.payment_method || (amountPaid >= totalAmount ? 'Cash' : 'Credit');

    // 3. Create Purchase record
    const purchase: Purchase = {
      id: purchaseId,
      business_id: businessId,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      purchase_date: now,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      outstanding_amount: outstandingAmount,
      payment_method: paymentMethod,
      notes: input.notes,
      status: 'completed',
      created_at: now,
      updated_at: now
    };

    const savedPurchase = await db.createPurchase(purchase, resolvedItems);

    // 4. Update Stock and Product purchase price for each item
    for (const item of resolvedItems) {
      const product = (await inventoryService.getProductById(businessId, item.product_id))!;
      const stockBefore = product.current_stock;
      const stockAfter = stockBefore + item.quantity;

      await inventoryService.updateProduct(businessId, product.id, {
        current_stock: stockAfter,
        purchase_price: item.unit_price // update latest purchase cost
      });

      await db.createStockMovement({
        id: uuidv4(),
        business_id: businessId,
        product_id: product.id,
        product_name: product.name,
        type: 'purchase',
        quantity: item.quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_id: savedPurchase.id,
        notes: `Purchase from ${supplier.name} (${savedPurchase.id.slice(0, 8)})`,
        created_at: now
      });

      updatedProducts.push({
        id: product.id,
        name: product.name,
        new_stock: stockAfter,
        purchase_price: item.unit_price
      });
    }

    // 5. Update Supplier balance
    const newTotalPurchases = Number(supplier.total_purchases) + totalAmount;
    const newAmountPaid = Number(supplier.amount_paid) + amountPaid;
    const newOutstanding = Number(supplier.outstanding_balance) + outstandingAmount;

    const updatedSupplier = await db.updateSupplier(businessId, supplier.id, {
      total_purchases: newTotalPurchases,
      amount_paid: newAmountPaid,
      outstanding_balance: newOutstanding
    });

    // 6. Record Supplier Payment if partial or full payment was made at purchase time
    if (amountPaid > 0) {
      await db.createSupplierPayment({
        id: uuidv4(),
        business_id: businessId,
        supplier_id: supplier.id,
        purchase_id: savedPurchase.id,
        amount: amountPaid,
        payment_date: now,
        payment_method: paymentMethod as any,
        notes: `Paid at time of purchase ${savedPurchase.id.slice(0, 8)}`,
        created_at: now
      });
    }

    // 7. Add to unified ledger transaction
    const itemNames = resolvedItems.map(i => `${i.quantity}x ${i.product_name}`).join(', ');
    await db.createTransaction({
      id: uuidv4(),
      business_id: businessId,
      type: 'purchase',
      amount: totalAmount,
      date: now,
      description: `Purchase from ${supplier.name} [${itemNames}] - Paid: ₹${amountPaid}, Pending: ₹${outstandingAmount}`,
      reference_id: savedPurchase.id,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: now
    });

    return {
      purchase: savedPurchase,
      updated_products: updatedProducts,
      supplier_balance: {
        total_purchases: updatedSupplier.total_purchases,
        amount_paid: updatedSupplier.amount_paid,
        outstanding_balance: updatedSupplier.outstanding_balance
      }
    };
  }

  async updatePurchase(businessId: string, purchaseId: string, input: RecordPurchaseInput): Promise<{
    purchase: Purchase;
    updated_products: { id: string; name: string; new_stock: number }[];
  }> {
    // 1. Fetch current purchase with items
    const existing = await db.getPurchaseById(businessId, purchaseId);
    if (!existing) throw new Error(`Purchase not found: ${purchaseId}`);

    const existingItems = existing.items || [];
    const oldSupplier = await supplierService.getSupplierById(businessId, existing.supplier_id);

    // 2. Parse and resolve new items
    let supplierId = input.supplier_id || existing.supplier_id;
    if (!supplierId && input.supplier_name) {
      const s = await supplierService.getSupplierByName(businessId, input.supplier_name);
      supplierId = s ? s.id : (await supplierService.createSupplier(businessId, { name: input.supplier_name })).id;
    }
    const currentSupplier = (await supplierService.getSupplierById(businessId, supplierId))!;

    let newTotalAmount = 0;
    const newResolvedItems: PurchaseItem[] = [];
    const now = input.purchase_date || existing.purchase_date;

    for (const it of input.items) {
      const qty = Number(it.quantity);
      const price = Number(it.unit_price);
      if (qty <= 0) throw new Error(`Invalid quantity ${qty}`);

      let productId = it.product_id;
      let product = productId ? await inventoryService.getProductById(businessId, productId) : null;
      if (!product && it.product_name) {
        product = await inventoryService.getProductByName(businessId, it.product_name);
        if (!product) {
          product = await inventoryService.createProduct(businessId, {
            name: it.product_name,
            purchase_price: price,
            selling_price: Math.round(price * 1.2),
            initial_stock: 0
          });
        }
        productId = product.id;
      }
      if (!product || !productId) throw new Error(`Product missing for item`);

      const itemTotal = qty * price;
      newTotalAmount += itemTotal;

      newResolvedItems.push({
        id: uuidv4(),
        purchase_id: purchaseId,
        product_id: productId,
        product_name: product.name,
        quantity: qty,
        unit_price: price,
        total_price: itemTotal
      });
    }

    const newAmountPaid = Math.min(newTotalAmount, Math.max(0, Number(input.amount_paid ?? existing.amount_paid)));
    const newOutstanding = Math.max(0, newTotalAmount - newAmountPaid);
    const newPaymentMethod = input.payment_method || existing.payment_method;

    // 3. ATOMIC DELTA RECALCULATION FOR INVENTORY
    // Map existing quantities by product_id
    const oldQtyMap: Record<string, number> = {};
    for (const item of existingItems) {
      oldQtyMap[item.product_id] = (oldQtyMap[item.product_id] || 0) + Number(item.quantity);
    }

    // Map new quantities by product_id
    const newQtyMap: Record<string, { qty: number; unit_price: number }> = {};
    for (const item of newResolvedItems) {
      newQtyMap[item.product_id] = {
        qty: (newQtyMap[item.product_id]?.qty || 0) + Number(item.quantity),
        unit_price: Number(item.unit_price)
      };
    }

    const allProductIds = Array.from(new Set([...Object.keys(oldQtyMap), ...Object.keys(newQtyMap)]));
    const updatedProducts: { id: string; name: string; new_stock: number }[] = [];

    for (const pId of allProductIds) {
      const product = await inventoryService.getProductById(businessId, pId);
      if (product) {
        const oldQty = oldQtyMap[pId] || 0;
        const newInfo = newQtyMap[pId];
        const newQty = newInfo ? newInfo.qty : 0;
        const netChange = newQty - oldQty;

        const stockBefore = product.current_stock;
        const stockAfter = stockBefore + netChange;
        if (stockAfter < 0) {
          throw new Error(`Cannot update purchase: stock for "${product.name}" would become negative (${stockAfter}).`);
        }

        await inventoryService.updateProduct(businessId, product.id, {
          current_stock: stockAfter,
          ...(newInfo ? { purchase_price: newInfo.unit_price } : {})
        });

        await db.createStockMovement({
          id: uuidv4(),
          business_id: businessId,
          product_id: product.id,
          product_name: product.name,
          type: netChange >= 0 ? 'purchase' : 'purchase_reversal',
          quantity: netChange,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_id: purchaseId,
          notes: `Updated purchase edit adjustment (${purchaseId.slice(0, 8)})`,
          created_at: new Date().toISOString()
        });

        updatedProducts.push({
          id: product.id,
          name: product.name,
          new_stock: stockAfter
        });
      }
    }

    // 4. ATOMIC DELTA RECALCULATION FOR SUPPLIERS
    if (oldSupplier && oldSupplier.id === currentSupplier.id) {
      const netTotalChange = newTotalAmount - existing.total_amount;
      const netPaidChange = newAmountPaid - existing.amount_paid;
      const netOutstandingChange = newOutstanding - existing.outstanding_amount;

      await db.updateSupplier(businessId, currentSupplier.id, {
        total_purchases: Number(currentSupplier.total_purchases) + netTotalChange,
        amount_paid: Number(currentSupplier.amount_paid) + netPaidChange,
        outstanding_balance: Number(currentSupplier.outstanding_balance) + netOutstandingChange
      });
    } else {
      // Revert old supplier if supplier was changed
      if (oldSupplier) {
        await db.updateSupplier(businessId, oldSupplier.id, {
          total_purchases: Math.max(0, Number(oldSupplier.total_purchases) - existing.total_amount),
          amount_paid: Math.max(0, Number(oldSupplier.amount_paid) - existing.amount_paid),
          outstanding_balance: Math.max(0, Number(oldSupplier.outstanding_balance) - existing.outstanding_amount)
        });
      }
      // Apply to new supplier
      await db.updateSupplier(businessId, currentSupplier.id, {
        total_purchases: Number(currentSupplier.total_purchases) + newTotalAmount,
        amount_paid: Number(currentSupplier.amount_paid) + newAmountPaid,
        outstanding_balance: Number(currentSupplier.outstanding_balance) + newOutstanding
      });
    }

    const updatedPurchaseRecord: Purchase = {
      id: purchaseId,
      business_id: businessId,
      supplier_id: currentSupplier.id,
      supplier_name: currentSupplier.name,
      purchase_date: now,
      total_amount: newTotalAmount,
      amount_paid: newAmountPaid,
      outstanding_amount: newOutstanding,
      payment_method: newPaymentMethod,
      notes: input.notes ?? existing.notes,
      status: 'completed',
      created_at: existing.created_at,
      updated_at: new Date().toISOString()
    };

    const saved = await db.updatePurchase(updatedPurchaseRecord, newResolvedItems);

    return {
      purchase: saved,
      updated_products: updatedProducts
    };
  }
}

export const purchaseService = new PurchaseService();
