import ky from 'ky';
import type {
  AuthResponse,
  User,
  Photo,
  Journey,
  BorderRoute,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Default export for backward compatibility (login page uses api.post etc)
export const api = ky.create({
  prefix: '/api',
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
  },
});

// Named exports for typed API methods
const client = api;

export const authApi = {
  sendCode: (phone: string) =>
    client.post('auth/send-code', { json: { phone } }).json<{ success: boolean; message: string }>(),

  verify: (phone: string, code: string) =>
    client.post('auth/verify', { json: { phone, code } }).json<AuthResponse>(),

  me: () => client.get('auth/me').json<User>(),
};

export const photosApi = {
  list: () => client.get('photos').json<Photo[]>(),

  get: (id: number) => client.get(`photos/${id}`).json<Photo>(),

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('photos/upload', { body: formData }).json<Photo>();
  },

  delete: (id: number) => client.delete(`photos/${id}`).json<{ success: boolean }>(),
};

export const journeysApi = {
  list: () => client.get('journeys').json<Journey[]>(),

  get: (id: number) => client.get(`journeys/${id}`).json<Journey>(),

  create: (data: { title: string; description?: string; routeId?: number; status?: string }) =>
    client.post('journeys', { json: data }).json<Journey>(),

  update: (id: number, data: Partial<Journey>) =>
    client.patch(`journeys/${id}`, { json: data }).json<Journey>(),

  delete: (id: number) => client.delete(`journeys/${id}`).json<{ success: boolean }>(),

  addPhoto: (id: number, data: { photoId: number; orderIndex?: number; caption?: string }) =>
    client.post(`journeys/${id}/photos`, { json: data }).json<unknown>(),
};

export const routesApi = {
  list: () => client.get('routes').json<BorderRoute[]>(),

  get: (id: number) => client.get(`routes/${id}`).json<BorderRoute>(),

  getByNumber: (routeNumber: string) =>
    client.get(`routes/by-number/${routeNumber}`).json<BorderRoute>(),
};

export const usersApi = {
  get: (id: number) => client.get(`users/${id}`).json<User>(),

  update: (data: { username: string }) =>
    client.patch('users/me', { json: data }).json<User>(),
};
