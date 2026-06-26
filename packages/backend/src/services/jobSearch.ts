import { PrismaClient, JobSource, JobType } from '@prisma/client';

const prisma = new PrismaClient();

let ApifyClient: any;
try {
  ApifyClient = require('apify-client').ApifyClient;
} catch {}

const apifyClient = process.env.APIFY_API_TOKEN && ApifyClient
  ? new ApifyClient({ token: process.env.APIFY_API_TOKEN })
  : null;

const SAMPLE_JOBS = [
  {
    externalId: 'sample-stripe-1',
    source: JobSource.LINKEDIN,
    title: 'Senior Full Stack Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA',
    isRemote: true,
    jobType: JobType.FULL_TIME,
    salaryMin: 180000,
    salaryMax: 250000,
    description: 'Join Stripe to build the financial infrastructure for the internet. Work on payments, billing, and developer tools using React, TypeScript, Ruby, and Go.',
    skills: ['React', 'TypeScript', 'Ruby', 'Go', 'PostgreSQL', 'AWS', 'GraphQL'],
    applicationUrl: 'https://stripe.com/jobs',
    postedAt: new Date(),
  },
  {
    externalId: 'sample-vercel-1',
    source: JobSource.LINKEDIN,
    title: 'Frontend Engineer - Next.js',
    company: 'Vercel',
    location: 'Remote',
    isRemote: true,
    jobType: JobType.FULL_TIME,
    salaryMin: 160000,
    salaryMax: 220000,
    description: 'Help build the future of web development at Vercel. Contribute to Next.js, Turborepo, and the Vercel platform. Deep React/TypeScript expertise required.',
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Vercel'],
    applicationUrl: 'https://vercel.com/careers',
    postedAt: new Date(),
  },
  {
    externalId: 'sample-crowdstrike-1',
    source: JobSource.INDEED,
    title: 'Cloud Security Engineer',
    company: 'CrowdStrike',
    location: 'Austin, TX',
    isRemote: true,
    jobType: JobType.FULL_TIME,
    salaryMin: 150000,
    salaryMax: 210000,
    description: 'Protect organizations from breaches. Design and implement cloud security solutions using AWS, Kubernetes, and Go. Experience with threat detection and incident response.',
    skills: ['AWS', 'Kubernetes', 'Go', 'Python', 'Docker', 'Terraform', 'Security'],
    applicationUrl: 'https://crowdstrike.com/careers',
    postedAt: new Date(),
  },
  {
    externalId: 'sample-openai-1',
    source: JobSource.YC_JOBS,
    title: 'Machine Learning Engineer',
    company: 'OpenAI',
    location: 'San Francisco, CA',
    isRemote: false,
    jobType: JobType.FULL_TIME,
    salaryMin: 200000,
    salaryMax: 370000,
    description: 'Work on cutting-edge AI research and deployment. Build and scale large language models, develop new training techniques, and ship AI products to millions of users.',
    skills: ['Python', 'PyTorch', 'Machine Learning', 'Deep Learning', 'CUDA', 'Distributed Systems'],
    applicationUrl: 'https://openai.com/careers',
    postedAt: new Date(),
  },
  {
    externalId: 'sample-gitlab-1',
    source: JobSource.REMOTE_OK,
    title: 'Senior Backend Engineer - DevOps',
    company: 'GitLab',
    location: 'Remote (Global)',
    isRemote: true,
    jobType: JobType.FULL_TIME,
    salaryMin: 140000,
    salaryMax: 200000,
    description: 'Build the DevOps platform used by millions. Work on CI/CD pipelines, container registry, and infrastructure automation. Fully remote company with async-first culture.',
    skills: ['Ruby', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'CI/CD'],
    applicationUrl: 'https://about.gitlab.com/jobs',
    postedAt: new Date(),
  },
];

export class JobSearchService {
  static async triggerJobFetch(query: string, location?: string): Promise<void> {
    if (apifyClient) {
      await Promise.allSettled([
        this.fetchLinkedIn(query, location),
        this.fetchIndeed(query, location),
        this.fetchRemoteOk(query),
        this.fetchYCJobs(query),
      ]);
    } else {
      await this.seedSampleJobs();
    }
  }

  static async fetchLinkedIn(query: string, location?: string): Promise<void> {
    if (!apifyClient) return;
    try {
      const run = await apifyClient.actor('anchor/linkedin-jobs-scraper').call({
        searchQuery: query,
        location: location || 'United States',
        maxResults: 25,
      });
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      await this.storeJobs(items, JobSource.LINKEDIN);
    } catch (error) {
      console.error('LinkedIn fetch failed:', error);
    }
  }

  static async fetchIndeed(query: string, location?: string): Promise<void> {
    if (!apifyClient) return;
    try {
      const run = await apifyClient.actor('hyp/indeed-scraper').call({
        query,
        location: location || 'United States',
        maxItems: 25,
      });
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      await this.storeJobs(items, JobSource.INDEED);
    } catch (error) {
      console.error('Indeed fetch failed:', error);
    }
  }

  static async fetchRemoteOk(query: string): Promise<void> {
    try {
      const response = await fetch('https://remoteok.com/api');
      const jobs = await response.json();
      const filtered = jobs.slice(1).filter((j: any) =>
        j.position?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 25);

      const mapped = filtered.map((j: any) => ({
        externalId: `remoteok-${j.id}`,
        source: JobSource.REMOTE_OK,
        title: j.position || 'Unknown',
        company: j.company || 'Unknown',
        location: j.location || 'Remote',
        isRemote: true,
        jobType: JobType.FULL_TIME,
        salaryMin: j.salary_min || null,
        salaryMax: j.salary_max || null,
        description: j.description || '',
        skills: j.tags || [],
        applicationUrl: j.url || '',
        postedAt: new Date(j.date || Date.now()),
      }));

      for (const job of mapped) {
        await prisma.job.upsert({
          where: { externalId_source: { externalId: job.externalId, source: job.source } },
          update: job,
          create: job,
        });
      }
    } catch (error) {
      console.error('RemoteOK fetch failed:', error);
    }
  }

  static async fetchYCJobs(query: string): Promise<void> {
    if (!apifyClient) return;
    try {
      const run = await apifyClient.actor('misceres/ycombinator-jobs-scraper').call({
        query,
        maxItems: 25,
      });
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      await this.storeJobs(items, JobSource.YC_JOBS);
    } catch (error) {
      console.error('YC Jobs fetch failed:', error);
    }
  }

  private static async storeJobs(items: any[], source: JobSource): Promise<void> {
    for (const item of items) {
      try {
        const job = {
          externalId: item.id || item.url || `${source}-${Date.now()}-${Math.random()}`,
          source,
          title: item.title || item.position || 'Unknown',
          company: item.company || item.companyName || 'Unknown',
          location: item.location || 'Unknown',
          isRemote: item.isRemote || item.remote || false,
          jobType: JobType.FULL_TIME,
          salaryMin: item.salaryMin || item.salary_min || null,
          salaryMax: item.salaryMax || item.salary_max || null,
          description: item.description || '',
          skills: item.skills || item.tags || [],
          applicationUrl: item.url || item.applicationUrl || '',
          postedAt: new Date(item.postedAt || item.date || Date.now()),
        };

        await prisma.job.upsert({
          where: { externalId_source: { externalId: job.externalId, source: job.source } },
          update: job,
          create: job,
        });
      } catch (error) {
        console.error('Failed to store job:', error);
      }
    }
  }

  private static async seedSampleJobs(): Promise<void> {
    for (const job of SAMPLE_JOBS) {
      await prisma.job.upsert({
        where: { externalId_source: { externalId: job.externalId, source: job.source } },
        update: job,
        create: job,
      });
    }
  }
}
