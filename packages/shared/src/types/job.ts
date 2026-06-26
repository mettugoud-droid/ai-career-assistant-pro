import { JobType } from './user';
export enum JobSource { LINKEDIN = 'LINKEDIN', INDEED = 'INDEED', GLASSDOOR = 'GLASSDOOR', NAUKRI = 'NAUKRI', REMOTE_OK = 'REMOTE_OK', WEWORKREMOTELY = 'WEWORKREMOTELY', YC_JOBS = 'YC_JOBS', COMPANY_CAREER = 'COMPANY_CAREER', OTHER = 'OTHER' }
export interface Job { id: string; source: JobSource; title: string; company: string; location: string; isRemote: boolean; jobType: JobType; salaryMin?: number; salaryMax?: number; description: string; skills: string[]; applicationUrl: string; postedAt: Date; }
export interface JobSearchFilters { query?: string; location?: string; isRemote?: boolean; salaryMin?: number; skills?: string[]; jobTypes?: JobType[]; sources?: JobSource[]; page?: number; limit?: number; }
export interface JobMatch { jobId: string; userId: string; matchScore: number; atsMatchScore: number; matchedSkills: string[]; missingSkills: string[]; }
