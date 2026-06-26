import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIAgent } from '@career-assistant/shared';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const gemini = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;

const SYSTEM_PROMPTS: Record<AIAgent, string> = {
  [AIAgent.RESUME_REVIEW]: 'You are an expert resume reviewer with 15+ years of HR and recruiting experience. Analyze resumes for clarity, impact, formatting, and content quality. Provide specific, actionable feedback.',
  [AIAgent.ATS_OPTIMIZATION]: 'You are an ATS (Applicant Tracking System) optimization specialist. Analyze resumes against job descriptions, identify missing keywords, and suggest improvements to maximize ATS compatibility scores.',
  [AIAgent.JOB_SEARCH]: 'You are a job search strategist. Help users find relevant positions, craft search queries, and identify companies that match their skills and career goals.',
  [AIAgent.COMPANY_RESEARCH]: 'You are a company research analyst. Provide detailed insights about companies including culture, tech stack, interview process, growth trajectory, and employee reviews.',
  [AIAgent.COVER_LETTER]: 'You are a professional cover letter writer. Create compelling, personalized cover letters that highlight relevant experience and demonstrate genuine interest in the role and company.',
  [AIAgent.INTERVIEW_COACH]: 'You are an interview preparation coach. Provide tailored interview questions, STAR method responses, behavioral examples, and technical preparation guidance based on the role.',
  [AIAgent.LEARNING_COACH]: 'You are a learning and skill development coach. Create personalized learning roadmaps, recommend resources, and help users track their progress toward career goals.',
  [AIAgent.CAREER_ADVISOR]: 'You are a career advisor with expertise in tech industry career paths. Help users make strategic career decisions, plan transitions, and identify growth opportunities.',
  [AIAgent.SALARY_NEGOTIATION]: 'You are a salary negotiation expert. Help users research market rates, prepare negotiation strategies, and craft professional responses to offers.',
  [AIAgent.APPLICATION_TRACKER]: 'You are an application tracking assistant. Help users organize their job applications, follow up on submissions, and maintain momentum in their job search.',
};

export class AIService {
  static async chat(messages: Array<{ role: string; content: string }>, agent: AIAgent, provider?: AIProvider): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[agent];
    const providers = provider ? [provider] : [AIProvider.OPENAI, AIProvider.ANTHROPIC, AIProvider.GEMINI];

    for (const p of providers) {
      try {
        switch (p) {
          case AIProvider.OPENAI:
            if (!openai) continue;
            const openaiRes = await openai.chat.completions.create({
              model: 'gpt-4-turbo-preview',
              messages: [{ role: 'system', content: systemPrompt }, ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))],
              max_tokens: 4096,
            });
            return openaiRes.choices[0]?.message?.content || '';

          case AIProvider.ANTHROPIC:
            if (!anthropic) continue;
            const anthropicRes = await anthropic.messages.create({
              model: 'claude-3-sonnet-20240229',
              max_tokens: 4096,
              system: systemPrompt,
              messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            });
            return (anthropicRes.content[0] as { text: string }).text || '';

          case AIProvider.GEMINI:
            if (!gemini) continue;
            const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
            const geminiRes = await model.generateContent(`${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`);
            return geminiRes.response.text();
        }
      } catch (error) {
        console.error(`AI provider ${p} failed:`, error);
        continue;
      }
    }
    throw new Error('All AI providers failed. Please check API keys configuration.');
  }

  static async analyzeResume(resumeText: string, jobDescription?: string): Promise<{
    atsScore: number; overallScore: number; strengths: string[]; weaknesses: string[]; missingKeywords: string[]; suggestions: string[];
  }> {
    const prompt = jobDescription
      ? `Analyze this resume against the job description. Return JSON with: atsScore (0-100), overallScore (0-100), strengths (array), weaknesses (array), missingKeywords (array), suggestions (array).\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}`
      : `Analyze this resume. Return JSON with: atsScore (0-100), overallScore (0-100), strengths (array), weaknesses (array), missingKeywords (array), suggestions (array).\n\nResume:\n${resumeText}`;

    const response = await this.chat([{ role: 'user', content: prompt }], AIAgent.ATS_OPTIMIZATION);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { atsScore: 70, overallScore: 65, strengths: [], weaknesses: [], missingKeywords: [], suggestions: [] };
    } catch {
      return { atsScore: 70, overallScore: 65, strengths: ['Unable to parse'], weaknesses: [], missingKeywords: [], suggestions: ['Try again'] };
    }
  }

  static async generateCoverLetter(resumeText: string, jobDescription: string, companyName: string, tone: string = 'professional'): Promise<string> {
    const prompt = `Write a ${tone} cover letter for the position at ${companyName}. Use the resume and job description below to personalize it.\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nGenerate a compelling cover letter (300-400 words).`;
    return this.chat([{ role: 'user', content: prompt }], AIAgent.COVER_LETTER);
  }

  static async generateInterviewPrep(jobTitle: string, company: string, jobDescription: string): Promise<{
    technicalQuestions: string[]; behavioralQuestions: string[]; companySpecific: string[]; tips: string[];
  }> {
    const prompt = `Prepare interview questions for a ${jobTitle} role at ${company}. Return JSON with: technicalQuestions (5 items), behavioralQuestions (5 items), companySpecific (3 items), tips (5 items).\n\nJob Description:\n${jobDescription}`;
    const response = await this.chat([{ role: 'user', content: prompt }], AIAgent.INTERVIEW_COACH);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { technicalQuestions: [], behavioralQuestions: [], companySpecific: [], tips: [] };
    } catch {
      return { technicalQuestions: [], behavioralQuestions: [], companySpecific: [], tips: [] };
    }
  }

  static async researchCompany(companyName: string): Promise<{
    overview: string; culture: string; techStack: string[]; interviewProcess: string; prosAndCons: { pros: string[]; cons: string[] };
  }> {
    const prompt = `Research ${companyName} as an employer. Return JSON with: overview (string), culture (string), techStack (array), interviewProcess (string), prosAndCons ({pros: array, cons: array}).`;
    const response = await this.chat([{ role: 'user', content: prompt }], AIAgent.COMPANY_RESEARCH);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { overview: '', culture: '', techStack: [], interviewProcess: '', prosAndCons: { pros: [], cons: [] } };
    } catch {
      return { overview: '', culture: '', techStack: [], interviewProcess: '', prosAndCons: { pros: [], cons: [] } };
    }
  }

  static async generateLearningRoadmap(currentSkills: string[], targetRole: string, duration: string): Promise<{
    title: string; weeklyPlans: Array<{ week: number; topics: string[]; resources: string[] }>; milestones: string[];
  }> {
    const prompt = `Create a ${duration} learning roadmap to become a ${targetRole}. Current skills: ${currentSkills.join(', ')}. Return JSON with: title (string), weeklyPlans (array of {week, topics, resources}), milestones (array).`;
    const response = await this.chat([{ role: 'user', content: prompt }], AIAgent.LEARNING_COACH);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { title: '', weeklyPlans: [], milestones: [] };
    } catch {
      return { title: '', weeklyPlans: [], milestones: [] };
    }
  }

  static async generateStudyMaterial(topic: string, level: string = 'intermediate'): Promise<string> {
    const prompt = `Create a comprehensive study guide for "${topic}" at ${level} level. Include key concepts, examples, practice exercises, and recommended resources.`;
    return this.chat([{ role: 'user', content: prompt }], AIAgent.LEARNING_COACH);
  }

  static async generateResume(profileData: any, targetRole: string, style: string = 'modern'): Promise<string> {
    const prompt = `Generate a ${style} resume for the target role of ${targetRole}. Use this profile data:\n${JSON.stringify(profileData, null, 2)}\n\nReturn the resume in markdown format, optimized for ATS systems.`;
    return this.chat([{ role: 'user', content: prompt }], AIAgent.RESUME_REVIEW);
  }

  static async matchJobToResume(resumeText: string, jobDescription: string): Promise<{
    matchScore: number; atsMatchScore: number; matchedSkills: string[]; missingSkills: string[]; recommendations: string[];
  }> {
    const prompt = `Match this resume to the job description. Return JSON with: matchScore (0-100), atsMatchScore (0-100), matchedSkills (array), missingSkills (array), recommendations (array).\n\nResume:\n${resumeText}\n\nJob:\n${jobDescription}`;
    const response = await this.chat([{ role: 'user', content: prompt }], AIAgent.ATS_OPTIMIZATION);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { matchScore: 0, atsMatchScore: 0, matchedSkills: [], missingSkills: [], recommendations: [] };
    } catch {
      return { matchScore: 0, atsMatchScore: 0, matchedSkills: [], missingSkills: [], recommendations: [] };
    }
  }
}
