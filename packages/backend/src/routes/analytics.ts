import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /dashboard
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Applications per week (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const applications = await prisma.application.findMany({
      where: { userId, createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true, status: true },
    });

    // Group by week
    const weeklyData: Record<string, number> = {};
    applications.forEach((app: any) => {
      const weekStart = new Date(app.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().split('T')[0];
      weeklyData[key] = (weeklyData[key] || 0) + 1;
    });

    const applicationsPerWeek = Object.entries(weeklyData)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Success rate
    const totalApps = await prisma.application.count({ where: { userId } });
    const offers = await prisma.application.count({
      where: { userId, status: { in: ['OFFER', 'ACCEPTED'] } },
    });
    const successRate = totalApps > 0 ? Math.round((offers / totalApps) * 100) : 0;

    // Interview conversion
    const interviews = await prisma.application.count({
      where: { userId, status: 'INTERVIEWING' },
    });
    const interviewConversion = totalApps > 0
      ? Math.round((interviews / totalApps) * 100) : 0;

    res.json({
      applicationsPerWeek,
      successRate,
      interviewConversion,
      totalApplications: totalApps,
      totalOffers: offers,
      totalInterviews: interviews,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
