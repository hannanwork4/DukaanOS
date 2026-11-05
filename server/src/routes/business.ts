import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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

router.put('/profile', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body.business_id as string) || (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    const { name, owner_name, phone, address, currency } = req.body;
    
    let business = await db.getBusiness(businessId);
    if (!business) {
      await db.seedInitialData(businessId);
    }
    
    const updated = await db.updateBusiness(businessId, {
      ...(name ? { name: name.trim() } : {}),
      ...(owner_name ? { owner_name: owner_name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(address !== undefined ? { address: address.trim() } : {}),
      ...(currency ? { currency: currency.trim() } : {})
    });

    res.json({ success: true, message: 'Store profile updated successfully', data: updated });
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

// 1-Click Auto Configure Claude Desktop
router.post('/claude-auto-configure', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';

    let claudeDir = '';
    if (process.platform === 'win32') {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      claudeDir = path.join(appData, 'Claude');
    } else if (process.platform === 'darwin') {
      claudeDir = path.join(os.homedir(), 'Library', 'Application Support', 'Claude');
    } else {
      claudeDir = path.join(os.homedir(), '.config', 'Claude');
    }
    const claudeConfigFile = claudeDir ? path.join(claudeDir, 'claude_desktop_config.json') : '';

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';
    const apiUrl = `${protocol}://${host}`;
    const sseUrl = `${protocol}://${req.hostname}:4001/sse`;

    // Locate stdio.js across possible runtime directories
    const candidatePaths = [
      path.resolve(process.cwd(), '../mcp/dist/stdio.js'),
      path.resolve(process.cwd(), 'mcp/dist/stdio.js'),
      path.resolve(process.cwd(), 'dist/stdio.js'),
      'c:\\Users\\DELL\\Desktop\\DukaanOS\\mcp\\dist\\stdio.js'
    ];
    const stdioScript = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];

    const dukaanosMcpConfig: any = fs.existsSync(stdioScript) ? {
      command: 'node',
      args: [stdioScript],
      env: {
        API_URL: apiUrl,
        DEFAULT_BUSINESS_ID: businessId
      }
    } : {
      url: sseUrl
    };

    let configuredOnDisk = false;

    if (claudeDir) {
      try {
        if (!fs.existsSync(claudeDir)) {
          fs.mkdirSync(claudeDir, { recursive: true });
        }

        let existingConfig: any = {};
        if (fs.existsSync(claudeConfigFile)) {
          try {
            const raw = fs.readFileSync(claudeConfigFile, 'utf-8');
            existingConfig = JSON.parse(raw);
          } catch {
            existingConfig = {};
          }
        }

        if (!existingConfig.mcpServers) {
          existingConfig.mcpServers = {};
        }

        existingConfig.mcpServers.dukaanos = dukaanosMcpConfig;
        fs.writeFileSync(claudeConfigFile, JSON.stringify(existingConfig, null, 2), 'utf-8');
        configuredOnDisk = true;
      } catch (e) {
        console.warn('[Claude Auto-Configure] Local disk write skipped:', e);
      }
    }

    res.json({
      success: true,
      configuredOnDisk,
      configPath: claudeConfigFile,
      config: {
        mcpServers: {
          dukaanos: dukaanosMcpConfig
        }
      },
      message: configuredOnDisk
        ? 'DukaanOS successfully plugged into your Claude Desktop! Simply restart Claude to begin.'
        : 'Generated Claude Desktop configuration.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DPDP Act 2023: Right to Erasure / Permanently Delete Account & Store Data
router.delete('/account', async (req: Request, res: Response) => {
  try {
    const businessId = (req.body?.business_id as string) || (req.query.business_id as string) || (req.headers['x-business-id'] as string) || process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    await db.deleteBusiness(businessId);
    res.json({
      success: true,
      message: 'Store account, inventory, customer ledger, and records have been permanently erased in compliance with the Digital Personal Data Protection (DPDP) Act, 2023.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

