'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, FileText, Search, Target, MessageSquare, BookOpen,
  BarChart3, Shield, Zap, ArrowRight, CheckCircle, Sparkles,
} from 'lucide-react';

const features = [
  { icon: Brain, title: '10 AI Agents', description: 'Specialized AI assistants for every career need' },
  { icon: FileText, title: 'Resume Builder', description: 'ATS-optimized resumes with AI scoring' },
  { icon: Search, title: 'Smart Job Search', description: 'Multi-platform search with intelligent matching' },
  { icon: Target, title: 'Job Matching', description: 'AI-powered compatibility scoring' },
  { icon: MessageSquare, title: 'Interview Prep', description: 'Personalized mock interviews and coaching' },
  { icon: BookOpen, title: 'Learning Paths', description: 'Custom skill development roadmaps' },
  { icon: BarChart3, title: 'Analytics', description: 'Track your progress and insights' },
  { icon: Shield, title: 'Auto Apply', description: 'Automated applications to matching jobs' },
  { icon: Sparkles, title: 'Cover Letters', description: 'AI-generated personalized cover letters' },
];

const steps = [
  { step: '1', title: 'Upload Resume', description: 'Upload your resume and get instant AI analysis' },
  { step: '2', title: 'Get Matched', description: 'Our AI matches you with relevant opportunities' },
  { step: '3', title: 'Prepare', description: 'AI coaches help you prepare for interviews' },
  { step: '4', title: 'Land Your Dream Job', description: 'Apply with confidence and track progress' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Brain className="w-7 h-7 text-primary" />
            <span>CareerAI Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition">
              Sign In
            </Link>
            <Link href="/auth/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" /> Powered by 10 AI Agents
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Your AI-Powered<br />
            <span className="text-primary">Career Companion</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            From resume optimization to interview coaching, our AI agents guide you through every step of your career journey.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/register" className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-medium hover:opacity-90 transition inline-flex items-center gap-2">
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="border border-border px-8 py-3 rounded-lg text-lg font-medium hover:bg-accent transition">
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg">Comprehensive AI-powered tools for your career success</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-accent/50 py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get started in minutes</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Accelerate Your Career?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of professionals using AI to land their dream jobs faster.
          </p>
          <Link href="/auth/register" className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:opacity-90 transition inline-flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Get Started for Free
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold">
              <Brain className="w-5 h-5 text-primary" />
              <span>CareerAI Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AI Career Assistant Pro. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition">Terms</Link>
              <Link href="#" className="hover:text-foreground transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
