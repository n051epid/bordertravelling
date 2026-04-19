'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { journeysApi, routesApi } from '@/lib/api';
import type { Journey, BorderRoute } from '@/types';
import { useAuthStore } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, MapPin, Calendar, MoreHorizontal, Trash2 } from 'lucide-react';

const STATUS_CONFIG = {
  planning: { label: '规划中', color: 'bg-yellow-100 text-yellow-800' },
  active: { label: '进行中', color: 'bg-green-100 text-green-800' },
  completed: { label: '已完成', color: 'bg-blue-100 text-blue-800' },
};

export default function JourneyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [routes, setRoutes] = useState<BorderRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRouteId, setNewRouteId] = useState<number | ''>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  async function loadData() {
    try {
      const [journeysData, routesData] = await Promise.all([
        journeysApi.list(),
        routesApi.list(),
      ]);
      setJourneys(journeysData);
      setRoutes(routesData);
    } catch (error) {
      console.error('Failed to load journeys:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const created = await journeysApi.create({
        title: newTitle,
        routeId: newRouteId === '' ? undefined : (newRouteId as number),
        status: 'planning',
      });
      setJourneys([created, ...journeys]);
      setShowCreate(false);
      setNewTitle('');
      setNewRouteId('');
    } catch (error) {
      console.error('Failed to create journey:', error);
      alert('创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个旅程吗？')) return;
    try {
      await journeysApi.delete(id);
      setJourneys(journeys.filter((j) => j.id !== id));
    } catch (error) {
      console.error('Failed to delete journey:', error);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">我的旅程</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> 新建旅程
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="mb-6 p-4">
          <h3 className="font-semibold mb-3">创建新旅程</h3>
          <div className="space-y-3">
            <Input
              placeholder="旅程名称"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <select
              className="w-full p-2 border rounded-lg bg-background"
              value={newRouteId}
              onChange={(e) => setNewRouteId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">选择路线（可选）</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.routeNumber} - {r.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="flex-1">
                创建
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                取消
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Journey list */}
      {journeys.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">还没有旅程，开始记录你的边境之旅吧</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> 创建第一个旅程
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {journeys.map((journey) => {
            const route = routes.find((r) => r.id === journey.routeId);
            const statusInfo = STATUS_CONFIG[journey.status] || STATUS_CONFIG.planning;
            return (
              <Card key={journey.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{journey.title}</h3>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {route && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {route.routeNumber}
                        </span>
                      )}
                      {journey.startedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(journey.startedAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                    {journey.description && (
                      <p className="text-sm text-muted-foreground mt-2">{journey.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/journey/${journey.id}`)}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(journey.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
