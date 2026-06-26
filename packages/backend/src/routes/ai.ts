import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

const coverLetterSchema = z.object({
  jobId: z.string(),
  resumeId: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'creative']).default('professional'),
});

const generateResumeSchema = z.object({
  resumeId: z.string(),
  jobId: z.string().optional(),
  format: z.enum(['standard', 'technical', 'executive']).default('standard'),
});



// POST /chat
router.post('/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = chatSchema.parse(req.body);

    let sessionId = data.sessionId;
    if (!sessionId) {
      const session = await prisma.aiSession.create({
        data: { userId, title: data.message.substring(0, 50) },
      });
      sessionId = session.id;
    }

    await prisma.aiMessage.create({
      data: { sessionId, role: 'user', content: data.message },
    });

    // TODO: Call AI service for response
    const aiResponse = 'AI response placeholder';

    await prisma.aiMessage.create({
      data: { sessionId, role: 'assistant', content: aiResponse },
    });

    res.json({ sessionId, message: aiResponse });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Chat failed' });
  }
});



// POST /cover-letter
router.post('/cover-letter', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = coverLetterSchema.parse(req.body);
    const job = await prisma.job.findUnique({ where: { id: data.jobId } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    // TODO: AI cover letter generation
    res.json({ coverLetter: '', jobId: data.jobId, tone: data.tone });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// POST /generate-resume
router.post('/generate-resume', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = generateResumeSchema.parse(req.body);
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId, userId },
    });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    // TODO: AI resume generation/tailoring
    res.json({ resumeId: data.resumeId, generated: '', format: data.format });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate resume' });
  }
});



// GET /sessions
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const sessions = await prisma.aiSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /sessions/:id/messages
router.get('/sessions/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const session = await prisma.aiSession.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const messages = await prisma.aiMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ session, messages });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
