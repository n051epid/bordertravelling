'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi, photosApi, journeysApi } from '@/lib/api';
import type { User, Photo, Journey } from '@/types';
import { useAuthStore } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Camera, LogOut, Edit2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  async function loadData() {
    try {
      const [userData, photosData, journeysData] = await Promise.all([
        usersApi.get(user!.id),
        photosApi.list().catch(() => []),
        journeysApi.list().catch(() => []),
      ]);
      setProfile(userData);
      setPhotos(photosData);
      setJourneys(journeysData);
      setNewUsername(userData.username);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return;
    try {
      const updated = await usersApi.update({ username: newUsername });
      setProfile(updated);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update username:', error);
      alert('更新失败');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const photosWithLocation = photos.filter((p) => p.latitude && p.longitude);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container py-8 max-w-2xl">
      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl">{profile.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 p-2 border rounded-lg bg-background"
                  />
                  <Button size="sm" onClick={handleUpdateUsername}>保存</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>取消</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{profile.username}</h2>
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setEditing(true)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{profile.phone}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{journeys.length}</div>
              <div className="text-xs text-muted-foreground">旅程</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{photos.length}</div>
              <div className="text-xs text-muted-foreground">照片</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{photosWithLocation.length}</div>
              <div className="text-xs text-muted-foreground">已定位</div>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> 退出登录
          </Button>
        </CardContent>
      </Card>

      {/* Recent photos */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" /> 我的照片
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/upload')}>
              上传
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              还没有照片，去上传一张吧
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 9).map((photo) => (
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
              {photos.length > 9 && (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">+{photos.length - 9}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent journeys */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">我的旅程</CardTitle>
        </CardHeader>
        <CardContent>
          {journeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              还没有旅程，去创建一个吧
            </p>
          ) : (
            <div className="space-y-3">
              {journeys.slice(0, 5).map((journey) => (
                <div
                  key={journey.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{journey.title}</span>
                      <Badge variant="outline">{journey.status}</Badge>
                    </div>
                    {journey.startedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(journey.startedAt).toLocaleDateString('zh-CN')}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/journey/${journey.id}`)}>
                    查看
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
