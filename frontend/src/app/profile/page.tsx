'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User, Journey } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = api.getCurrentUser();
    setUser(currentUser);

    const fetchJourneys = async () => {
      try {
        const data = await api.getJourneys();
        setJourneys(data);
      } catch (err) {
        console.error('Failed to fetch journeys:', err);
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

  const completedJourneys = journeys.filter((j) => j.status === 'completed').length;
  const totalPhotos = journeys.length * 3; // Demo data

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">个人中心</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.username || '用户'}</h2>
            <p className="text-gray-600 text-sm">{user?.email}</p>
            <p className="text-gray-500 text-xs mt-2">
              注册于 {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600">{journeys.length}</div>
              <div className="text-sm text-gray-600 mt-1">我的旅程</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600">{completedJourneys}</div>
              <div className="text-sm text-gray-600 mt-1">已完成</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600">{totalPhotos}</div>
              <div className="text-sm text-gray-600 mt-1">照片数量</div>
            </div>
          </div>

          {/* Journey History */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">旅程历史</h3>
            {journeys.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">暂无旅程记录</p>
            ) : (
              <ul className="space-y-3">
                {journeys.slice(0, 5).map((journey) => (
                  <li key={journey.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="font-medium text-gray-900">{journey.title}</div>
                      <div className="text-xs text-gray-500">{journey.route}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      journey.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {journey.status === 'completed' ? '已完成' : '进行中'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Certificate (Phase 2) */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🏆</div>
              <div>
                <h3 className="text-lg font-semibold">边境线旅行证书</h3>
                <p className="text-emerald-100 text-sm mt-1">完成旅程即可解锁专属证书（即将推出）</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
