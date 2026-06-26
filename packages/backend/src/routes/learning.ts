import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const createRoadmapSchema = z.object({
  title: z.string().min(1),
  targetRole: z.string().optional(),
  skills: z.array(z.string()).optional(),
  timelineWeeks: z.number().min(1).max(52).optional(),
});

const updateProgressSchema = z.object({
  milestoneId: z.string(),
  completed: z.boolean(),
});

const studyMaterialSchema = z.object({
  topic: z.string().min(1),
  type: z.enum(['article', 'video', 'course', 'book', 'practice']).optional(),
  roadmapId: z.string().optional(),
});



// POST /roadmap
router.post('/roadmap', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = createRoadmapSchema.parse(req.body);
    const roadmap = await prisma.learningRoadmap.create({
      data: { userId, ...data, milestones: [] },
    });
    res.status(201).json(roadmap);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create roadmap' });
  }
});

// GET /roadmaps
router.get('/roadmaps', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const roadmaps = await prisma.learningRoadmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(roadmaps);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

// GET /roadmaps/:id
router.get('/roadmaps/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const roadmap = await prisma.learningRoadmap.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    res.json(roadmap);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch roadmap' });
  }
});



// PATCH /roadmaps/:id/progress
router.patch('/roadmaps/:id/progress', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = updateProgressSchema.parse(req.body);
    const roadmap = await prisma.learningRoadmap.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    // Update milestone progress in the milestones JSON
    const milestones = (roadmap.milestones as any[]) || [];
    const updated = milestones.map((m: any) =>
      m.id === data.milestoneId ? { ...m, completed: data.completed } : m
    );
    await prisma.learningRoadmap.update({
      where: { id: roadmap.id },
      data: { milestones: updated },
    });
    res.json({ message: 'Progress updated' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// POST /study-material
router.post('/study-material', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = studyMaterialSchema.parse(req.body);
    const material = await prisma.studyMaterial.create({
      data: { userId, ...data },
    });
    res.status(201).json(material);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create study material' });
  }
});

// GET /study-materials
router.get('/study-materials', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const materials = await prisma.studyMaterial.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch study materials' });
  }
});

export default router;
