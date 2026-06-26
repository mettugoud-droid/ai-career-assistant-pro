import { PrismaClient, UserRole, AuthProvider, SubscriptionPlan, JobSource, JobType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@careerassistant.com' },
    update: {},
    create: {
      email: 'admin@careerassistant.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      provider: AuthProvider.EMAIL,
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      isEmailVerified: true,
      profileCompletion: 100,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123456', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@careerassistant.com' },
    update: {},
    create: {
      email: 'demo@careerassistant.com',
      name: 'Demo User',
      passwordHash: demoPassword,
      role: UserRole.USER,
      provider: AuthProvider.EMAIL,
      subscriptionPlan: SubscriptionPlan.PRO,
      isEmailVerified: true,
      profileCompletion: 75,
      profile: {
        create: {
          currentJobTitle: 'Software Engineer',
          yearsOfExperience: 4,
          preferredLocations: ['San Francisco', 'Remote'],
          preferredJobRoles: ['Full Stack Engineer', 'Frontend Engineer'],
          openToRemote: true,
        },
      },
    },
  });
  console.log(`✅ Demo user created: ${demo.email}`);

  // Create sample jobs
  const sampleJobs = [
    {
      externalId: 'seed-stripe-1',
      source: JobSource.LINKEDIN,
      title: 'Senior Full Stack Engineer',
      company: 'Stripe',
      location: 'San Francisco, CA',
      isRemote: true,
      jobType: JobType.FULL_TIME,
      salaryMin: 180000,
      salaryMax: 250000,
      description: 'Join Stripe to build the financial infrastructure for the internet. Work on payments, billing, and developer tools using React, TypeScript, Ruby, and Go. You will design and implement scalable APIs and user-facing features.',
      skills: ['React', 'TypeScript', 'Ruby', 'Go', 'PostgreSQL', 'AWS', 'GraphQL'],
      applicationUrl: 'https://stripe.com/jobs',
      postedAt: new Date('2024-01-15'),
    },
    {
      externalId: 'seed-vercel-1',
      source: JobSource.LINKEDIN,
      title: 'Frontend Engineer - Next.js',
      company: 'Vercel',
      location: 'Remote',
      isRemote: true,
      jobType: JobType.FULL_TIME,
      salaryMin: 160000,
      salaryMax: 220000,
      description: 'Help build the future of web development at Vercel. Contribute to Next.js, Turborepo, and the Vercel platform. Deep React and TypeScript expertise required. You will work on performance-critical features.',
      skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Webpack'],
      applicationUrl: 'https://vercel.com/careers',
      postedAt: new Date('2024-01-12'),
    },
    {
      externalId: 'seed-crowdstrike-1',
      source: JobSource.INDEED,
      title: 'Cloud Security Engineer',
      company: 'CrowdStrike',
      location: 'Austin, TX',
      isRemote: true,
      jobType: JobType.FULL_TIME,
      salaryMin: 150000,
      salaryMax: 210000,
      description: 'Protect organizations from breaches. Design and implement cloud security solutions using AWS, Kubernetes, and Go. Experience with threat detection, incident response, and security automation required.',
      skills: ['AWS', 'Kubernetes', 'Go', 'Python', 'Docker', 'Terraform', 'Security'],
      applicationUrl: 'https://crowdstrike.com/careers',
      postedAt: new Date('2024-01-10'),
    },
    {
      externalId: 'seed-openai-1',
      source: JobSource.YC_JOBS,
      title: 'Machine Learning Engineer',
      company: 'OpenAI',
      location: 'San Francisco, CA',
      isRemote: false,
      jobType: JobType.FULL_TIME,
      salaryMin: 200000,
      salaryMax: 370000,
      description: 'Work on cutting-edge AI research and deployment. Build and scale large language models, develop new training techniques, and ship AI products to millions of users. Strong ML fundamentals and systems engineering required.',
      skills: ['Python', 'PyTorch', 'Machine Learning', 'Deep Learning', 'CUDA', 'Distributed Systems'],
      applicationUrl: 'https://openai.com/careers',
      postedAt: new Date('2024-01-08'),
    },
    {
      externalId: 'seed-gitlab-1',
      source: JobSource.REMOTE_OK,
      title: 'Senior Backend Engineer - DevOps',
      company: 'GitLab',
      location: 'Remote (Global)',
      isRemote: true,
      jobType: JobType.FULL_TIME,
      salaryMin: 140000,
      salaryMax: 200000,
      description: 'Build the DevOps platform used by millions. Work on CI/CD pipelines, container registry, and infrastructure automation. Fully remote company with async-first culture. Ruby and Go experience preferred.',
      skills: ['Ruby', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'CI/CD'],
      applicationUrl: 'https://about.gitlab.com/jobs',
      postedAt: new Date('2024-01-05'),
    },
  ];

  for (const job of sampleJobs) {
    await prisma.job.upsert({
      where: { externalId_source: { externalId: job.externalId, source: job.source } },
      update: job,
      create: job,
    });
  }
  console.log(`✅ ${sampleJobs.length} sample jobs created`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
