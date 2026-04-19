import ky from 'ky';

export const api = ky.create({
  prefix: 'http://localhost:3002',
  credentials: 'include',
});

export type ApiError = {
  message: string;
  code?: string;
};
