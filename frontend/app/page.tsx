'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { MapPin, Camera, Compass, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/map');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="text-center max-w-lg space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">边境旅程</h1>
          <p className="text-xl text-muted-foreground">
            记录你的环中国边境线之旅
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">G219/G331/G228</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">照片+GPS</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Compass className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">旅程记录</span>
            </div>
          </div>

          <Button size="lg" className="w-full max-w-xs" onClick={() => router.push('/login')}>
            开始记录 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Info section */}
      <div className="bg-card py-12 px-4">
        <div className="max-w-2xl mx-auto grid md:grid-cols-3 gap-6 text-center">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">三条边境线</h3>
              <p className="text-sm text-muted-foreground">
                G219 国境线、G331 边境线、G228 海岸线
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">自动 GPS 标记</h3>
              <p className="text-sm text-muted-foreground">
                上传照片自动提取位置，在地图上展示
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">旅程时间线</h3>
              <p className="text-sm text-muted-foreground">
                创建旅程，关联照片，记录你的每一步
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
