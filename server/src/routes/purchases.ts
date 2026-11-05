import { Router, Request, Response } from 'express';
import { purchaseService } from '../services/purchaseService.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const purchases = await purchaseService.getPurchases(businessId);
    res.json({ success: true, data: purchases });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const purchase = await purchaseService.getPurchaseById(businessId, req.params.id);
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
    res.json({ success: true, data: purchase });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const result = await purchaseService.recordPurchase(businessId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const result = await purchaseService.updatePurchase(businessId, req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;

