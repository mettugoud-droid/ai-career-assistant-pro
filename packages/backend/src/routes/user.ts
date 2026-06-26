import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.number().min(0).optional(),
  preferredRoles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  salaryExpectation: z.number().optional(),
});

// GET /profile
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      include: { profile: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /profile
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const userId = (req as any).userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        profile: {
          upsert: {
            create: {
              phone: data.phone,
              location: data.location,
              bio: data.bio,
              linkedinUrl: data.linkedinUrl,
              githubUrl: data.githubUrl,
              portfolioUrl: data.portfolioUrl,
              skills: data.skills,
              experience: data.experience,
              preferredRoles: data.preferredRoles,
              preferredLocations: data.preferredLocations,
              salaryExpectation: data.salaryExpectation,
            },
            update: {
              phone: data.phone,
              location: data.location,
              bio: data.bio,
              linkedinUrl: data.linkedinUrl,
              githubUrl: data.githubUrl,
              portfolioUrl: data.portfolioUrl,
              skills: data.skills,
              experience: data.experience,
              preferredRoles: data.preferredRoles,
              preferredLocations: data.preferredLocations,
              salaryExpectation: data.salaryExpectation,
            },
          },
        },
      },
      include: { profile: true },
    });
    res.json(user);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /dashboard
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const [totalApplications, activeApplications, interviews, savedJobs, resumes] = await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.application.count({ where: { userId, status: { in: ['APPLIED', 'SCREENING', 'INTERVIEWING'] } } }),
      prisma.application.count({ where: { userId, status: 'INTERVIEWING' } }),
      prisma.savedJob.count({ where: { userId } }),
      prisma.resume.count({ where: { userId } }),
    ]);

    const stats = {
      totalApplications,
      activeApplications,
      interviews,
      savedJobs,
      resumes,
      weeklyApplications: totalApplications, // simplified
      responseRate: totalApplications > 0 ? Math.round((activeApplications / totalApplications) * 100) : 0,
    };
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
