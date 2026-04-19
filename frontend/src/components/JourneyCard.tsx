'use client';

import Link from 'next/link';
import { Journey } from '@/types';

interface JourneyCardProps {
  journey: Journey;
}

export default function JourneyCard({ journey }: JourneyCardProps) {
  const routeColors: Record<string, string> = {
    G219: 'bg-red-100 text-red-800 border-red-200',
    G331: 'bg-blue-100 text-blue-800 border-blue-200',
    G228: 'bg-green-100 text-green-800 border-green-200',
  };

  const routeNames: Record<string, string> = {
    G219: 'G219 边境公路',
    G331: 'G331 边境公路',
    G228: 'G228 边境公路',
  };

  return (
    <Link href={`/journeys/${journey.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{journey.title}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${routeColors[journey.route]}`}>
            {journey.route}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{routeNames[journey.route]}</p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className={`px-2 py-1 rounded ${
            journey.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {journey.status === 'completed' ? '已完成' : '进行中'}
          </span>
          <span>{new Date(journey.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </Link>
  );
}
