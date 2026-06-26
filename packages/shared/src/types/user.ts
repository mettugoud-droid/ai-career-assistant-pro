export enum UserRole { USER = 'USER', ADMIN = 'ADMIN', MODERATOR = 'MODERATOR' }
export enum AuthProvider { EMAIL = 'EMAIL', GOOGLE = 'GOOGLE', GITHUB = 'GITHUB', LINKEDIN = 'LINKEDIN' }
export enum SubscriptionPlan { FREE = 'FREE', PRO = 'PRO', ENTERPRISE = 'ENTERPRISE' }
export enum JobType { FULL_TIME = 'FULL_TIME', PART_TIME = 'PART_TIME', CONTRACT = 'CONTRACT', INTERNSHIP = 'INTERNSHIP', FREELANCE = 'FREELANCE', REMOTE = 'REMOTE' }
export interface User { id: string; email: string; name: string; avatar?: string; role: UserRole; provider: AuthProvider; subscriptionPlan: SubscriptionPlan; isEmailVerified: boolean; profileCompletion: number; createdAt: Date; updatedAt: Date; }
export interface AuthResponse { user: User; accessToken: string; refreshToken: string; }
