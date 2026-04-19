import ky from 'ky';

export const api = ky.create({
  baseUrl: 'http://localhost:3000',
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

export type ApiError = {
  error?: string;
  message?: string;
};
