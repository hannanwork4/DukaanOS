import { Router, Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const products = await inventoryService.getProducts(businessId);
    res.json({ success: true, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const lowStock = await inventoryService.getLowStockProducts(businessId);
    res.json({ success: true, data: lowStock });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const product = await inventoryService.getProductById(businessId, req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const product = await inventoryService.createProduct(businessId, req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const updated = await inventoryService.updateProduct(businessId, req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const deleted = await inventoryService.deleteProduct(businessId, req.params.id);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/:id/adjust-stock', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const { new_stock, reason } = req.body;
    const adjusted = await inventoryService.adjustStock(businessId, req.params.id, Number(new_stock), reason);
    res.json({ success: true, data: adjusted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/:id/movements', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const movements = await inventoryService.getStockMovements(businessId, req.params.id);
    res.json({ success: true, data: movements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

