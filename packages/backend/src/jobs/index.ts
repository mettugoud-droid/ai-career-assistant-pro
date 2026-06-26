import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { JobSearchService } from '../services/jobSearch';
import { AIService } from '../services/ai';
import { ResumeParserService } from '../services/resumeParser';

const prisma = new PrismaClient();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Queues
export const jobSearchQueue = new Queue('job-search', { connection });
export const resumeAnalysisQueue = new Queue('resume-analysis', { connection });
export const matchCalculationQueue = new Queue('match-calculation', { connection });
export const notificationsQueue = new Queue('notifications', { connection });
export const autoApplyQueue = new Queue('auto-apply', { connection });

export function initializeQueues(): void {
  // Job Search Worker
  new Worker('job-search', async (job) => {
    const { query, location, userId } = job.data;
    await JobSearchService.triggerJobFetch(query, location);

    // Notify user
    await notificationsQueue.add('new-jobs', {
      userId,
      type: 'NEW_JOB_MATCH',
      title: 'New Jobs Found',
      message: `Found new jobs matching "${query}"`,
    });
  }, { connection, concurrency: 2 });

  // Resume Analysis Worker
  new Worker('resume-analysis', async (job) => {
    const { resumeId, userId } = job.data;
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || !resume.parsedData) return;

    const parsedData = resume.parsedData as any;
    const resumeText = parsedData.text || JSON.stringify(parsedData);

    const analysis = await AIService.analyzeResume(resumeText);

    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        atsScore: analysis.atsScore,
        overallScore: analysis.overallScore,
      },
    });

    // Trigger match calculation for all jobs
    const jobs = await prisma.job.findMany({ take: 50, orderBy: { postedAt: 'desc' } });
    for (const j of jobs) {
      await matchCalculationQueue.add('calculate', {
        userId,
        resumeId,
        jobId: j.id,
        resumeText,
        jobDescription: j.description,
      });
    }
  }, { connection, concurrency: 3 });

  // Match Calculation Worker
  new Worker('match-calculation', async (job) => {
    const { userId, jobId, resumeText, jobDescription } = job.data;
    const result = await AIService.matchJobToResume(resumeText, jobDescription);

    await prisma.jobMatch.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: {
        matchScore: result.matchScore,
        atsMatchScore: result.atsMatchScore,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
      },
      create: {
        userId,
        jobId,
        matchScore: result.matchScore,
        atsMatchScore: result.atsMatchScore,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
      },
    });
  }, { connection, concurrency: 5 });

  // Notifications Worker
  new Worker('notifications', async (job) => {
    const { userId, type, title, message } = job.data;
    await prisma.notification.create({
      data: { userId, type, title, message },
    });
  }, { connection, concurrency: 10 });

  // Auto Apply Worker
  new Worker('auto-apply', async (job) => {
    const { userId, jobId, resumeId } = job.data;

    const existingApp = await prisma.application.findFirst({
      where: { userId, jobId },
    });
    if (existingApp) return;

    await prisma.application.create({
      data: {
        userId,
        jobId,
        resumeId,
        status: 'APPLIED',
        applyMode: 'AUTO_APPLY',
      },
    });

    await notificationsQueue.add('auto-applied', {
      userId,
      type: 'APPLICATION_STATUS_CHANGE',
      title: 'Auto-Applied',
      message: 'Successfully auto-applied to a matching job.',
    });
  }, { connection, concurrency: 2 });

  console.log('✅ BullMQ queues and workers initialized');
}
