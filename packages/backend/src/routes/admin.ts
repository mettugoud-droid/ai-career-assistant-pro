import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Admin role check middleware
const requireAdmin = async (req: Request, res: Response, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
    });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Apply admin middleware to all routes
router.use(authenticate, requireAdmin);



// GET /stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalJobs, totalApplications, totalResumes] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.application.count(),
      prisma.resume.count(),
    ]);
    res.json({ totalUsers, totalJobs, totalApplications, totalResumes });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /users - paginated
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, emailVerified: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /users/:id/role
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// GET /jobs
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({ skip, take: limit, orderBy: { postedAt: 'desc' } }),
      prisma.job.count(),
    ]);

    res.json({ jobs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /audit-logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
