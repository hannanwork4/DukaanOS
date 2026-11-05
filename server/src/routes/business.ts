import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    let business = await db.getBusiness(businessId);
    if (!business) {
      // Auto seed/init default business
      await db.seedInitialData(businessId);
      business = await db.getBusiness(businessId);
    }
    res.json({ success: true, data: business });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/seed', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    await db.seedInitialData(businessId);
    const business = await db.getBusiness(businessId);
    res.json({ success: true, message: 'Demo data seeded successfully', data: business });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

