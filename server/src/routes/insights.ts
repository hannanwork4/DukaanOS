import { Router, Request, Response } from 'express';
import { insightsService } from '../services/insightsService.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const insights = await insightsService.getBusinessInsights(businessId);
    res.json({ success: true, data: insights });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

