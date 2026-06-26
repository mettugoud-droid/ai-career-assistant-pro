import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor - attach auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  googleAuth: () => `${API_BASE_URL}/auth/google`,
  githubAuth: () => `${API_BASE_URL}/auth/github`,
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getDashboardStats: () => api.get('/users/dashboard-stats'),
  updateSettings: (data: any) => api.put('/users/settings', data),
};

export const resumeApi = {
  getAll: () => api.get('/resumes'),
  getById: (id: string) => api.get(`/resumes/${id}`),
  upload: (formData: FormData) => api.post('/resumes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyze: (id: string, jobDescription?: string) => api.post(`/resumes/${id}/analyze`, { jobDescription }),
  delete: (id: string) => api.delete(`/resumes/${id}`),
  generate: (data: any) => api.post('/resumes/generate', data),
};

export const jobApi = {
  search: (params: any) => api.get('/jobs', { params }),
  getById: (id: string) => api.get(`/jobs/${id}`),
  getMatches: (params?: any) => api.get('/jobs/matches', { params }),
  triggerSearch: (data: { query: string; location?: string }) => api.post('/jobs/search', data),
  getRecommended: () => api.get('/jobs/recommended'),
};

export const applicationApi = {
  getAll: (params?: any) => api.get('/applications', { params }),
  getById: (id: string) => api.get(`/applications/${id}`),
  create: (data: any) => api.post('/applications', data),
  updateStatus: (id: string, status: string) => api.patch(`/applications/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/applications/${id}`),
};

export const aiApi = {
  chat: (data: { messages: any[]; agent: string; sessionId?: string }) => api.post('/ai/chat', data),
  analyzeResume: (resumeId: string, jobDescription?: string) => api.post('/ai/analyze-resume', { resumeId, jobDescription }),
  generateCoverLetter: (data: any) => api.post('/ai/cover-letter', data),
  interviewPrep: (data: any) => api.post('/ai/interview-prep', data),
  researchCompany: (company: string) => api.post('/ai/company-research', { company }),
  generateRoadmap: (data: any) => api.post('/ai/learning-roadmap', data),
  matchJob: (resumeId: string, jobId: string) => api.post('/ai/match-job', { resumeId, jobId }),
};

export const learningApi = {
  getRoadmaps: () => api.get('/learning/roadmaps'),
  getRoadmap: (id: string) => api.get(`/learning/roadmaps/${id}`),
  createRoadmap: (data: any) => api.post('/learning/roadmaps', data),
  updateProgress: (id: string, progress: number) => api.patch(`/learning/roadmaps/${id}/progress`, { progress }),
  getStudyMaterial: (topic: string) => api.post('/learning/study-material', { topic }),
};

export const notificationApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getApplicationTrends: (params?: any) => api.get('/analytics/applications', { params }),
  getSkillsGap: () => api.get('/analytics/skills-gap'),
  getMatchHistory: () => api.get('/analytics/match-history'),
};

export default api;
