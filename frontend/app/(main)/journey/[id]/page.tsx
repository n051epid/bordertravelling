'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { journeysApi, photosApi, routesApi } from '@/lib/api';
import type { Journey, Photo, BorderRoute } from '@/types';
import { useAuthStore } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Calendar, Camera, Edit2, Check } from 'lucide-react';

const STATUS_CONFIG = {
  planning: { label: '规划中', color: 'bg-yellow-100 text-yellow-800' },
  active: { label: '进行中', color: 'bg-green-100 text-green-800' },
  completed: { label: '已完成', color: 'bg-blue-100 text-blue-800' },
};

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [routes, setRoutes] = useState<BorderRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const journeyId = Number(params.id);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  async function loadData() {
    try {
      const [journeyData, photosData, routesData] = await Promise.all([
        journeysApi.get(journeyId),
        photosApi.list().catch(() => []),
        routesApi.list(),
      ]);
      setJourney(journeyData);
      setPhotos(photosData);
      setRoutes(routesData);
      setEditTitle(journeyData.title);
    } catch (error) {
      console.error('Failed to load journey:', error);
      alert('加载失败');
      router.push('/journey');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async () => {
    if (!editTitle.trim()) return;
    try {
      const updated = await journeysApi.update(journeyId, { title: editTitle });
      setJourney(updated);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update journey:', error);
    }
  };

  const handleStatusChange = async (status: 'planning' | 'active' | 'completed') => {
    try {
      const updated = await journeysApi.update(journeyId, { status });
      setJourney(updated);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!journey) return null;

  const route = routes.find((r) => r.id === journey.routeId);
  const statusInfo = STATUS_CONFIG[journey.status] || STATUS_CONFIG.planning;

  return (
    <div className="container py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/journey')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleUpdate}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                取消
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{journey.title}</h1>
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={journey.status === 'planning' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('planning')}
              >
                规划中
              </Button>
              <Button
                size="sm"
                variant={journey.status === 'active' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('active')}
              >
                进行中
              </Button>
              <Button
                size="sm"
                variant={journey.status === 'completed' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('completed')}
              >
                已完成
              </Button>
            </div>
          </div>

          {route && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{route.routeNumber} - {route.name}</span>
            </div>
          )}

          {journey.startedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Calendar className="w-4 h-4" />
              <span>开始于 {new Date(journey.startedAt).toLocaleDateString('zh-CN')}</span>
            </div>
          )}

          {journey.description && (
            <p className="text-sm mt-4 pt-4 border-t">{journey.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" /> 照片 ({photos.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/upload')}>
              添加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              还没有照片
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 12).map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-muted rounded-lg overflow-hidden relative"
                >
                  {photo.latitude && photo.longitude && (
                    <div className="absolute top-1 right-1">
                      <MapPin className="w-3 h-3 text-primary fill-primary" />
                    </div>
                  )}
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
