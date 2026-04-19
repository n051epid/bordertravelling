'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, useAuthStore } from '@/lib/auth';

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setAuth, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const validateToken = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('auth/me');
        const data = await res.json();
        setAuth(data as { id: number; phone: string }, token);
      } catch {
        setLoading(false);
      }
    };

    validateToken();
  }, [setAuth, setLoading]);

  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return <>{children}</>;
}
