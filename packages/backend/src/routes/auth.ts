import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const otpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
    const tokens = generateTokens(user.id);
    res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }, ...tokens });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const tokens = generateTokens(user.id);
    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }, ...tokens });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const data = otpSchema.parse(req.body);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.otp.create({
      data: { email: data.email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
    // TODO: Send OTP via email service
    res.json({ message: 'OTP sent successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const data = verifyOtpSchema.parse(req.body);
    const otp = await prisma.otp.findFirst({
      where: { email: data.email, code: data.code, expiresAt: { gt: new Date() }, used: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    await prisma.otp.update({ where: { id: otp.id }, data: { used: true } });
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    const tokens = generateTokens(user.id);
    res.json({ ...tokens, verified: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as any;
    const tokens = generateTokens(payload.userId);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, emailVerified: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /google - OAuth redirect
router.get('/google', (req: Request, res: Response) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || '')}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(redirectUrl);
});

// GET /github - OAuth redirect
router.get('/github', (req: Request, res: Response) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GITHUB_REDIRECT_URI || '')}&scope=user:email`;
  res.redirect(redirectUrl);
});

// GET /linkedin - OAuth redirect
router.get('/linkedin', (req: Request, res: Response) => {
  const redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI || '')}&response_type=code&scope=r_liteprofile%20r_emailaddress`;
  res.redirect(redirectUrl);
});

export default router;
