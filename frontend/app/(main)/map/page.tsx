'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { BorderRoute, Photo } from '@/types';
import { routesApi, photosApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Route approximate center coordinates and colors
const ROUTE_CONFIG: Record<string, { color: string; center: [number, number]; zoom: number; description: string }> = {
  G219: {
    color: '#e53e3e',
    center: [28.0, 105.0],
    zoom: 5,
    description: '中国最长边境公路，全长约10,000公里',
  },
  G331: {
    color: '#3182ce',
    center: [45.0, 118.0],
    zoom: 5,
    description: '沿中国北部边境的公路，全长约9,000公里',
  },
  G228: {
    color: '#38a169',
    center: [35.0, 120.0],
    zoom: 5,
    description: '中国东部沿海公路，全长约7,000公里',
  },
};

function MapContent() {
  const [routes, setRoutes] = useState<BorderRoute[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<BorderRoute | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [routesData, photosData] = await Promise.all([
          routesApi.list(),
          photosApi.list().catch(() => []),
        ]);
        setRoutes(routesData);
        setPhotos(photosData);
      } catch (error) {
        console.error('Failed to load map data:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-4">
          <Skeleton className="h-64 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Map container */}
      <div className="flex-1 relative">
        <div id="map" className="h-full rounded-lg overflow-hidden bg-slate-100 min-h-[400px]" />
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)] p-1">
        {/* Routes list */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3">边境路线</h2>
          <div className="space-y-2">
            {routes.map((route) => {
              const config = ROUTE_CONFIG[route.routeNumber];
              return (
                <div
                  key={route.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRoute?.id === route.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedRoute(route)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{route.routeNumber}</span>
                    <Badge
                      variant="outline"
                      style={{ borderColor: config?.color, color: config?.color }}
                    >
                      {route.totalLength?.toLocaleString()} km
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{route.name}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected route details */}
        {selectedRoute && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">{selectedRoute.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {selectedRoute.description}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">起点：</span>
                <span>{selectedRoute.startPoint}</span>
              </div>
              <div>
                <span className="text-muted-foreground">终点：</span>
                <span>{selectedRoute.endPoint}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Photo count */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">我的照片</span>
            <Badge variant="secondary">{photos.length}</Badge>
          </div>
          {photos.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {photos.filter((p) => p.latitude && p.longitude).length} 张带GPS定位
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

// Dynamic import to avoid SSR issues with Leaflet
const MapPageContent = dynamic(() => Promise.resolve(MapContent), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
      <p className="text-muted-foreground">加载地图中...</p>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="container py-4">
      <MapPageContent />
    </div>
  );
}
