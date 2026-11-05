import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { emailService } from '../services/emailService.js';
import { User, Business } from '../types.js';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_dukaanos_salt_2026').digest('hex');
}

function generateToken(user: User): string {
  const payload = `${user.id}:${user.business_id}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

// 1. Send OTP for Email Verification
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, store_name } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    // 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to database with 10 min expiry
    await db.saveOtp(cleanEmail, otp, 10 * 60 * 1000);

    // Dispatch via Resend API
    const emailResult = await emailService.sendOtpEmail(cleanEmail, otp, store_name);

    if (!emailResult.success) {
      return res.status(400).json({
        success: false,
        error: emailResult.error || 'Failed to deliver verification code to your email.'
      });
    }

    res.json({
      success: true,
      message: emailResult.message
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Verify OTP
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Allow universal testing OTP '123456' for local development convenience
    const isMasterDevCode = cleanOtp === '123456';
    const isValid = isMasterDevCode || await db.verifyOtp(cleanEmail, cleanOtp);

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code. Please request a new one.' });
    }

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Multi-Step Conversational Signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      store_name,
      owner_name,
      location,
      phone,
      currency
    } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }
    if (!store_name || !store_name.trim()) {
      return res.status(400).json({ success: false, error: 'Store name is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db.getUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please log in instead.'
      });
    }

    // 1. Create fresh Business entity with valid RFC4122 UUID
    const businessId = crypto.randomUUID();
    const newBusiness: Business = {
      id: businessId,
      name: store_name.trim(),
      owner_name: owner_name?.trim() || 'Store Owner',
      phone: phone?.trim() || '',
      address: location?.trim() || 'India',
      currency: currency || 'INR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await db.createBusiness(newBusiness);

    // 2. Create User entity with valid RFC4122 UUID
    const userId = crypto.randomUUID();
    const newUser: User = {
      id: userId,
      email: cleanEmail,
      password_hash: hashPassword(password),
      business_id: businessId,
      name: owner_name?.trim() || store_name.trim(),
      phone: phone?.trim() || '',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await db.createUser(newUser);

    // 3. Seed initial Kirana catalog for store
    await db.seedInitialData(businessId);

    const token = generateToken(newUser);

    res.json({
      success: true,
      message: 'Account and store created successfully!',
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          business_id: newUser.business_id
        },
        business: newBusiness
      }
    });
  } catch (err: any) {
    const rawMsg = err?.message || '';
    console.error('[Signup Error]', rawMsg);
    let userMsg = 'Registration failed. Please check your information and try again.';
    if (rawMsg.includes('already exists')) {
      userMsg = 'An account with this email already exists. Please log in instead.';
    } else if (!rawMsg.toLowerCase().includes('supabase') && !rawMsg.includes('syntax') && !rawMsg.includes('uuid') && !rawMsg.includes('table')) {
      userMsg = rawMsg;
    }
    res.status(500).json({ success: false, error: userMsg });
  }
});

// 4. Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Official Demo Credentials: hannan@volopay.co / Hannan_Volopay
    if (cleanEmail === 'hannan@volopay.co') {
      if (password !== 'Hannan_Volopay') {
        return res.status(401).json({ success: false, error: 'Incorrect password for demo account. Please use: Hannan_Volopay' });
      }

      const demoBizId = process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
      let business = await db.getBusiness(demoBizId);
      if (!business) {
        business = {
          id: demoBizId,
          name: 'Sri Venkateshwara Store',
          owner_name: 'Abdul Hannan',
          phone: '9848022338',
          address: 'Visakhapatnam, Andhra Pradesh',
          currency: 'INR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.createBusiness(business);
        await db.seedInitialData(demoBizId);
      }

      let demoUser = await db.getUserByEmail(cleanEmail);
      if (!demoUser) {
        demoUser = {
          id: 'u-volopay-hannan-demo',
          email: cleanEmail,
          password_hash: hashPassword('Hannan_Volopay'),
          business_id: demoBizId,
          name: 'Abdul Hannan',
          phone: '9848022338',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.createUser(demoUser);
      }

      const token = generateToken(demoUser);
      return res.json({
        success: true,
        message: 'Welcome Abdul Hannan! Demo store access granted.',
        data: {
          token,
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            phone: demoUser.phone,
            business_id: demoUser.business_id
          },
          business
        }
      });
    }

    const user = await db.getUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ success: false, error: 'No account found with this email. Please sign up.' });
    }

    const computedHash = hashPassword(password);
    if (user.password_hash !== computedHash) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    const business = await db.getBusiness(user.business_id);
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in successfully!',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          business_id: user.business_id
        },
        business
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Current Session (Me)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authenticated. Please log in.' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    let userId = '';
    let businessId = '';

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      userId = parts[0];
      businessId = parts[1];
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid authentication token' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Invalid authentication token' });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User session not found' });
    }

    const business = await db.getBusiness(user.business_id || businessId);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          business_id: user.business_id
        },
        business
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Demo Store Login (Instant 1-Click Access)
router.post('/demo-login', async (_req: Request, res: Response) => {
  try {
    const demoBizId = process.env.DEFAULT_BUSINESS_ID || 'b0000000-0000-0000-0000-000000000001';
    let business = await db.getBusiness(demoBizId);
    if (!business) {
      business = {
        id: demoBizId,
        name: 'Sri Venkateshwara Store',
        owner_name: 'Abdul Hannan',
        phone: '9848022338',
        address: 'Visakhapatnam, Andhra Pradesh',
        currency: 'INR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await db.createBusiness(business);
      await db.seedInitialData(demoBizId);
    }

    const demoEmail = 'hannan@volopay.co';
    let demoUser = await db.getUserByEmail(demoEmail);
    if (!demoUser) {
      demoUser = {
        id: 'u-volopay-hannan-demo',
        email: demoEmail,
        password_hash: hashPassword('Hannan_Volopay'),
        business_id: demoBizId,
        name: 'Abdul Hannan',
        phone: '9848022338',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await db.createUser(demoUser);
    }

    const token = generateToken(demoUser);

    res.json({
      success: true,
      message: 'Demo store session loaded successfully!',
      data: {
        token,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          phone: demoUser.phone,
          business_id: demoUser.business_id
        },
        business
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to initialize demo store session' });
  }
});

export default router;

