import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

// POST /upload
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let textContent = '';
    if (file.mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(file.buffer);
      textContent = pdfData.text;
    } else {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      textContent = result.value;
    }

    // TODO: AI analysis of resume content
    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: '', // TODO: Upload to S3
        fileSize: file.size,
        mimeType: file.mimetype,
        rawText: textContent,
        parsedData: {},
        aiAnalysis: {},
      },
    });

    res.status(201).json(resume);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// GET / - list user resumes
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(resumes);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// GET /:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(resume);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// GET /:id/intelligence
router.get('/:id/intelligence', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    // Return AI analysis/intelligence data
    res.json({
      resumeId: resume.id,
      analysis: resume.aiAnalysis,
      suggestions: [],
      score: null,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch resume intelligence' });
  }
});

// POST /:id/rewrite
router.post('/:id/rewrite', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    // TODO: AI-powered resume rewrite
    res.json({ resumeId: resume.id, rewrittenContent: resume.rawText, message: 'Rewrite initiated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to rewrite resume' });
  }
});

// PATCH /:id/set-active
router.patch('/:id/set-active', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    // Deactivate all other resumes
    await prisma.resume.updateMany({ where: { userId }, data: { isActive: false } });
    // Set this one as active
    const resume = await prisma.resume.updateMany({
      where: { id: req.params.id, userId },
      data: { isActive: true },
    });
    if (resume.count === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ message: 'Resume set as active' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to set active resume' });
  }
});

// DELETE /:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resume = await prisma.resume.deleteMany({
      where: { id: req.params.id, userId },
    });
    if (resume.count === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ message: 'Resume deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

export default router;
