'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Photo, TrackPoint } from '@/types';
import PhotoUploader from '@/components/PhotoUploader';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function MapPage() {
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [photoMarkers, setPhotoMarkers] = useState<PhotoMarker[]>([]);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  interface PhotoMarker {
    id: string;
    latitude: number;
    longitude: number;
    verified: boolean;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const journeys = await api.getJourneys();
        if (journeys.length > 0) {
          const activeJourney = journeys[0];
          setJourneyId(activeJourney.id);

          const photos = await api.getPhotos(activeJourney.id);
          
          const markers: PhotoMarker[] = photos
            .filter((p: Photo) => p.latitude && p.longitude)
            .map((p: Photo) => ({
              id: p.id,
              latitude: p.latitude!,
              longitude: p.longitude!,
              verified: p.gps_verified,
            }));
          
          setPhotoMarkers(markers);

          // Demo track points (simulated)
          const demoTrackPoints: TrackPoint[] = [
            { latitude: 35.0, longitude: 105.0 },
            { latitude: 34.5, longitude: 106.5 },
            { latitude: 34.0, longitude: 108.0 },
            { latitude: 33.5, longitude: 109.5 },
          ];
          setTrackPoints(demoTrackPoints);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePhotoUploaded = (photo: Photo) => {
    if (photo.latitude !== null && photo.longitude !== null) {
      const marker: PhotoMarker = {
        id: photo.id,
        latitude: photo.latitude,
        longitude: photo.longitude,
        verified: photo.gps_verified,
      };
      setPhotoMarkers((prev) => [...prev, marker]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">地图</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="h-[400px] md:h-[600px]">
              <MapView
                trackPoints={trackPoints}
                photoMarkers={photoMarkers}
                zoom={5}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">照片上传</h2>
            {journeyId ? (
              <PhotoUploader journeyId={journeyId} onUploadComplete={handlePhotoUploaded} />
            ) : (
              <p className="text-sm text-gray-600">请先创建旅程后再上传照片</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">照片列表</h2>
            {photoMarkers.length === 0 ? (
              <p className="text-sm text-gray-500">暂无照片</p>
            ) : (
              <ul className="space-y-2">
                {photoMarkers.map((marker) => (
                  <li
                    key={marker.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`w-3 h-3 rounded-full ${
                        marker.verified ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span className="text-gray-700">
                      {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {marker.verified ? '已验证' : '未验证'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">图例</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span style={{ width: 20, height: 3, background: '#dc2626', display: 'inline-block' }}></span>
                <span>G219 边境公路</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ width: 20, height: 3, background: '#2563eb', display: 'inline-block' }}></span>
                <span>G331 边境公路</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ width: 20, height: 3, background: '#16a34a', display: 'inline-block' }}></span>
                <span>G228 边境公路</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span>GPS 已验证</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>GPS 未验证</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
