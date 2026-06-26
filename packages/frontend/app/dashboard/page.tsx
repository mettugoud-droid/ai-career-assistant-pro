'use client';

import { useEffect, useState } from 'react';
import {
  FileText, Briefcase, Target, Calendar, Trophy, BookOpen,
  TrendingUp, Bell, ArrowRight, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { userApi, jobApi, applicationApi } from '@/lib/api';
import { cn, formatSalary, getMatchColor, timeAgo } from '@/lib/utils';

interface Stats {
  profileCompletion: number;
  resumeScore: number;
  atsScore: number;
  skillsMatch: number;
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    profileCompletion: 75,
    resumeScore: 82,
    atsScore: 78,
    skillsMatch: 85,
    totalApplications: 24,
    activeApplications: 8,
    interviewsScheduled: 3,
    offersReceived: 1,
  });

  const statCards = [
    { label: 'Profile Completion', value: `${stats.profileCompletion}%`, icon: Target, color: 'text-blue-600' },
    { label: 'Resume Score', value: `${stats.resumeScore}/100`, icon: FileText, color: 'text-green-600' },
    { label: 'ATS Score', value: `${stats.atsScore}/100`, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Skills Match', value: `${stats.skillsMatch}%`, icon: Sparkles, color: 'text-yellow-600' },
    { label: 'Total Applications', value: stats.totalApplications, icon: Briefcase, color: 'text-indigo-600' },
    { label: 'Active Applications', value: stats.activeApplications, icon: Trophy, color: 'text-orange-600' },
    { label: 'Interviews Scheduled', value: stats.interviewsScheduled, icon: Calendar, color: 'text-pink-600' },
    { label: 'Offers Received', value: stats.offersReceived, icon: Bell, color: 'text-emerald-600' },
  ];

  const quickActions = [
    { title: 'Upload Resume', description: 'Get instant AI analysis', href: '/dashboard/resumes', icon: FileText },
    { title: 'Search Jobs', description: 'Find matching opportunities', href: '/dashboard/jobs', icon: Briefcase },
    { title: 'Interview Prep', description: 'Practice with AI coach', href: '/dashboard/interview', icon: Target },
    { title: 'AI Chat', description: 'Ask your career advisor', href: '/dashboard/chat', icon: Sparkles },
  ];

  const recommendedJobs = [
    { id: '1', title: 'Senior Full Stack Engineer', company: 'Stripe', matchScore: 92, salary: '$180K - $250K' },
    { id: '2', title: 'Frontend Engineer', company: 'Vercel', matchScore: 88, salary: '$160K - $220K' },
    { id: '3', title: 'Cloud Security Engineer', company: 'CrowdStrike', matchScore: 76, salary: '$150K - $210K' },
  ];

  const recentApplications = [
    { id: '1', title: 'ML Engineer', company: 'OpenAI', status: 'INTERVIEW_SCHEDULED', appliedAt: '2024-01-10' },
    { id: '2', title: 'Backend Engineer', company: 'GitLab', status: 'APPLIED', appliedAt: '2024-01-08' },
    { id: '3', title: 'Full Stack Dev', company: 'Stripe', status: 'HR_ROUND', appliedAt: '2024-01-05' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your career dashboard overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="flex items-center gap-3 p-4 bg-card border rounded-xl hover:shadow-md transition group"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <action.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recommended Jobs */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recommended Jobs</h2>
            <a href="/dashboard/jobs" className="text-sm text-primary hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {recommendedJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition">
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company} &middot; {job.salary}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full', getMatchColor(job.matchScore))}>
                  {job.matchScore}% match
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Applications</h2>
            <a href="/dashboard/applications" className="text-sm text-primary hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition">
                <div>
                  <p className="font-medium text-sm">{app.title}</p>
                  <p className="text-xs text-muted-foreground">{app.company} &middot; {timeAgo(app.appliedAt)}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                  {app.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
