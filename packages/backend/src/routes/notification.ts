import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET / - paginated notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    res.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount: await prisma.notification.count({ where: { userId, read: false } }),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /:id/read
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId },
      data: { read: true },
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PATCH /read-all
router.patch('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
