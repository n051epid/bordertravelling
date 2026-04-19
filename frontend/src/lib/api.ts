import { AuthResponse, Journey, Photo, ApiResponse, User } from '@/types';

const API_BASE = 'http://api-border.qinglv.online/api/v1';

export const api = {
  // 认证
  register: async (data: { username: string; email: string; password: string }): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Registration failed');
    const result: AuthResponse = await res.json();
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    return result;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Login failed');
    const result: AuthResponse = await res.json();
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    return result;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },

  // 旅程
  getJourneys: async (): Promise<Journey[]> => {
    const headers: HeadersInit = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}/journeys`, { headers });
    if (!res.ok) throw new Error('Failed to fetch journeys');
    const result: ApiResponse<Journey[]> = await res.json();
    return result.data;
  },

  createJourney: async (data: { title: string; route: string }): Promise<Journey> => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}/journeys`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create journey');
    const result: ApiResponse<Journey> = await res.json();
    return result.data;
  },

  getJourney: async (id: string): Promise<Journey> => {
    const headers: HeadersInit = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}/journeys/${id}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch journey');
    const result: ApiResponse<Journey> = await res.json();
    return result.data;
  },

  // 照片
  uploadPhoto: async (formData: FormData): Promise<Photo> => {
    const headers: HeadersInit = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}/photos/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload photo');
    const result: ApiResponse<Photo> = await res.json();
    return result.data;
  },

  getPhotos: async (journeyId: string): Promise<Photo[]> => {
    const headers: HeadersInit = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}/photos?journey_id=${journeyId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch photos');
    const result: ApiResponse<Photo[]> = await res.json();
    return result.data;
  },
};
