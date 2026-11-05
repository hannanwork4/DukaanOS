import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { Product, StockMovement } from '../types.js';

export class InventoryService {
  async getProducts(businessId: string): Promise<Product[]> {
    return db.getProducts(businessId);
  }

  async getProductById(businessId: string, id: string): Promise<Product | null> {
    return db.getProductById(businessId, id);
  }

  async getProductByName(businessId: string, name: string): Promise<Product | null> {
    return db.getProductByName(businessId, name);
  }

  async createProduct(businessId: string, data: {
    name: string;
    category?: string;
    sku?: string;
    unit?: string;
    initial_stock?: number;
    min_stock_threshold?: number;
    purchase_price: number;
    selling_price: number;
  }): Promise<Product> {
    const existing = await db.getProductByName(businessId, data.name);
    if (existing) {
      throw new Error(`Product with name "${data.name}" already exists.`);
    }

    const currentStock = Math.max(0, Number(data.initial_stock) || 0);
    const purchasePrice = Math.max(0, Number(data.purchase_price) || 0);
    const sellingPrice = Math.max(0, Number(data.selling_price) || 0);
    const minStock = Math.max(0, Number(data.min_stock_threshold) || 0);

    const now = new Date().toISOString();
    const product: Product = {
      id: uuidv4(),
      business_id: businessId,
      name: data.name.trim(),
      category: data.category?.trim() || 'General',
      sku: data.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      unit: data.unit?.trim() || 'packets',
      current_stock: currentStock,
      min_stock_threshold: minStock,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      is_archived: false,
      created_at: now,
      updated_at: now
    };

    const created = await db.createProduct(product);

    if (currentStock > 0) {
      await db.createStockMovement({
        id: uuidv4(),
        business_id: businessId,
        product_id: created.id,
        product_name: created.name,
        type: 'adjustment',
        quantity: currentStock,
        stock_before: 0,
        stock_after: currentStock,
        notes: 'Initial opening stock',
        created_at: now
      });
    }

    return created;
  }

  async updateProduct(businessId: string, id: string, updates: Partial<Product>): Promise<Product> {
    const existing = await db.getProductById(businessId, id);
    if (!existing) {
      throw new Error(`Product not found: ${id}`);
    }

    return db.updateProduct(businessId, id, updates);
  }

  async deleteProduct(businessId: string, id: string): Promise<boolean> {
    return db.deleteProduct(businessId, id);
  }

  async getLowStockProducts(businessId: string): Promise<Product[]> {
    const products = await db.getProducts(businessId);
    return products.filter(p => p.current_stock <= p.min_stock_threshold);
  }

  async adjustStock(businessId: string, productId: string, newStock: number, reason: string): Promise<Product> {
    const product = await db.getProductById(businessId, productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    if (newStock < 0) {
      throw new Error('Stock cannot be negative.');
    }

    const stockBefore = product.current_stock;
    const difference = newStock - stockBefore;
    const now = new Date().toISOString();

    const updated = await db.updateProduct(businessId, productId, { current_stock: newStock });

    await db.createStockMovement({
      id: uuidv4(),
      business_id: businessId,
      product_id: productId,
      product_name: product.name,
      type: 'adjustment',
      quantity: difference,
      stock_before: stockBefore,
      stock_after: newStock,
      notes: reason || 'Manual stock adjustment',
      created_at: now
    });

    return updated;
  }

  async getStockMovements(businessId: string, productId?: string): Promise<StockMovement[]> {
    return db.getStockMovements(businessId, productId);
  }
}

export const inventoryService = new InventoryService();

