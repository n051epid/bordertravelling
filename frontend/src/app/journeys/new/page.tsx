'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const ROUTES = [
  {
    id: 'G219',
    name: 'G219 边境公路',
    description: '新疆到广西，全程约 10,000 公里',
    color: 'red',
    emoji: '🏔️',
  },
  {
    id: 'G331',
    name: 'G331 边境公路',
    description: '东北边境线，全程约 9,000 公里',
    color: 'blue',
    emoji: '❄️',
  },
  {
    id: 'G228',
    name: 'G228 边境公路',
    description: '东部海岸线，全程约 7,000 公里',
    color: 'green',
    emoji: '🌊',
  },
];

export default function NewJourneyPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoute) {
      setError('请选择一条路线');
      return;
    }

    if (!title.trim()) {
      setError('请输入旅程标题');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createJourney({
        title: title.trim(),
        route: selectedRoute,
      });
      router.push('/map');
    } catch {
      setError('创建旅程失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const colorClasses: Record<string, { border: string; selected: string; bg: string }> = {
    red: {
      border: 'border-red-200',
      selected: 'ring-2 ring-red-500 border-red-500',
      bg: 'bg-red-50',
    },
    blue: {
      border: 'border-blue-200',
      selected: 'ring-2 ring-blue-500 border-blue-500',
      bg: 'bg-blue-50',
    },
    green: {
      border: 'border-green-200',
      selected: 'ring-2 ring-green-500 border-green-500',
      bg: 'bg-green-50',
    },
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/journeys" className="text-emerald-600 hover:underline text-sm">
          ← 返回旅程列表
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">创建新旅程</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">选择路线</label>
          <div className="grid gap-4">
            {ROUTES.map((route) => {
              const colors = colorClasses[route.color];
              const isSelected = selectedRoute === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRoute(route.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? `${colors.selected} ${colors.bg}`
                      : `${colors.border} hover:border-gray-300`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{route.emoji}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{route.name}</div>
                      <div className="text-sm text-gray-600">{route.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">旅程标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：我的 G219 之旅"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? '创建中...' : '创建旅程'}
        </button>
      </form>
    </div>
  );
}
