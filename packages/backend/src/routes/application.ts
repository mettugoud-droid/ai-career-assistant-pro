import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const createApplicationSchema = z.object({
  jobId: z.string(),
  resumeId: z.string().optional(),
  coverLetter: z.string().optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'SAVED', 'APPLIED', 'SCREENING', 'INTERVIEWING',
    'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN',
  ]),
});

// POST / - create application
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = createApplicationSchema.parse(req.body);
    const application = await prisma.application.create({
      data: { userId, ...data, status: 'APPLIED' },
    });
    res.status(201).json(application);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create application' });
  }
});



// GET / - list with kanban grouping
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const applications = await prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { updatedAt: 'desc' },
    });
    const kanban = {
      saved: applications.filter((a: any) => a.status === 'SAVED'),
      applied: applications.filter((a: any) => a.status === 'APPLIED'),
      screening: applications.filter((a: any) => a.status === 'SCREENING'),
      interviewing: applications.filter((a: any) => a.status === 'INTERVIEWING'),
      offer: applications.filter((a: any) => a.status === 'OFFER'),
      accepted: applications.filter((a: any) => a.status === 'ACCEPTED'),
      rejected: applications.filter((a: any) => a.status === 'REJECTED'),
      withdrawn: applications.filter((a: any) => a.status === 'WITHDRAWN'),
    };
    res.json({ applications, kanban });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});



// GET /:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, userId },
      include: { job: true },
    });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// PATCH /:id/status
router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status } = updateStatusSchema.parse(req.body);
    const application = await prisma.application.updateMany({
      where: { id: req.params.id, userId },
      data: { status },
    });
    if (application.count === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Status updated', status });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update status' });
  }
});



// POST /:id/interview-prep
router.post('/:id/interview-prep', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, userId },
      include: { job: true },
    });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    // TODO: AI-powered interview prep
    res.json({
      applicationId: application.id,
      questions: [],
      tips: [],
      companyInsights: null,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate interview prep' });
  }
});

// POST /:id/cover-letter
router.post('/:id/cover-letter', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, userId },
      include: { job: true },
    });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    // TODO: AI-powered cover letter generation
    res.json({
      applicationId: application.id,
      coverLetter: '',
      message: 'Cover letter generation initiated',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

export default router;
