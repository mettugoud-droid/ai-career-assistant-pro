import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const searchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  experience_level: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  job_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']).optional(),
  skills: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// POST /search
router.post('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const filters = searchSchema.parse(req.body);
    const skip = (filters.page - 1) * filters.limit;
    const where: any = {};

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { company: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.remote !== undefined) where.remote = filters.remote;
    if (filters.experience_level) where.experienceLevel = filters.experience_level;
    if (filters.job_type) where.jobType = filters.job_type;
    if (filters.salary_min) where.salaryMax = { gte: filters.salary_min };
    if (filters.salary_max) where.salaryMin = { lte: filters.salary_max };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({ where, skip, take: filters.limit, orderBy: { postedAt: 'desc' } }),
      prisma.job.count({ where }),
    ]);

    res.json({ jobs, total, page: filters.page, totalPages: Math.ceil(total / filters.limit) });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /recommended
router.get('/recommended', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    // Get user profile for recommendation matching
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    const jobs = await prisma.job.findMany({
      take: 20,
      orderBy: { postedAt: 'desc' },
    });
    // TODO: AI-powered job matching
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET /saved/list
router.get('/saved/list', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(savedJobs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch saved jobs' });
  }
});

// GET /:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /:id/save
router.post('/:id/save', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const jobId = req.params.id;
    const existing = await prisma.savedJob.findFirst({ where: { userId, jobId } });
    if (existing) {
      return res.status(409).json({ error: 'Job already saved' });
    }
    const saved = await prisma.savedJob.create({ data: { userId, jobId } });
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save job' });
  }
});

// DELETE /:id/unsave
router.delete('/:id/unsave', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const jobId = req.params.id;
    await prisma.savedJob.deleteMany({ where: { userId, jobId } });
    res.json({ message: 'Job unsaved' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to unsave job' });
  }
});

// GET /:id/company-research
router.get('/:id/company-research', authenticate, async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    // TODO: AI-powered company research
    res.json({
      jobId: job.id,
      company: job.company,
      research: {
        overview: '',
        culture: '',
        recentNews: [],
        glassdoorRating: null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch company research' });
  }
});

// POST /fetch - trigger job fetch from sources
router.post('/fetch', authenticate, async (req: Request, res: Response) => {
  try {
    // TODO: Trigger BullMQ job to fetch from external sources (LinkedIn, Indeed, etc.)
    res.json({ message: 'Job fetch initiated', status: 'queued' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to initiate job fetch' });
  }
});

export default router;
