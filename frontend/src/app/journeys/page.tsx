'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Journey } from '@/types';
import JourneyCard from '@/components/JourneyCard';

export default function JourneysPage() {
  const router = useRouter();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchJourneys = async () => {
      try {
        const data = await api.getJourneys();
        setJourneys(data);
      } catch {
        setError('获取旅程失败');
      } finally {
        setLoading(false);
      }
    };

    fetchJourneys();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的旅程</h1>
        <Link
          href="/journeys/new"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
        >
          新建旅程
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {journeys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">还没有旅程</h2>
          <p className="text-gray-600 mb-6">开始你的边境之旅，记录难忘的风景</p>
          <Link
            href="/journeys/new"
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
          >
            创建第一个旅程
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {journeys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))}
        </div>
      )}
    </div>
  );
}
