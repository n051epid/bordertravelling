import { create } from 'zustand';

export type User = {
  id: number;
  phone: string;
};

const TOKEN_KEY = 'auth-token';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => {
    setToken(token);
    set({ user, token, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    removeToken();
    set({ user: null, token: null, isLoading: false });
  },
}));
