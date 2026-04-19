'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackPoint {
  latitude: number;
  longitude: number;
}

interface PhotoMarker {
  id: string;
  latitude: number;
  longitude: number;
  verified: boolean;
}

interface MapViewProps {
  trackPoints?: TrackPoint[];
  photoMarkers?: PhotoMarker[];
  className?: string;
  center?: [number, number];
  zoom?: number;
}

// G219, G331, G228 simplified routes (array of [lat, lng] points)
const ROUTES: Record<string, [number, number][]> = {
  G219: [
    [39.0, 73.0], [38.5, 75.0], [37.5, 77.5], [36.5, 80.0], [35.5, 80.5],
    [34.5, 79.5], [33.5, 78.5], [32.5, 78.0], [31.5, 81.0], [30.5, 82.0],
    [29.5, 82.5], [28.5, 84.0], [27.5, 86.0], [26.5, 88.0], [25.5, 89.5],
    [24.5, 91.0], [22.5, 93.0], [21.5, 95.0], [20.5, 96.5], [22.0, 98.5],
    [23.0, 100.5], [24.0, 102.0], [25.0, 103.5], [26.0, 105.0], [27.5, 106.5],
    [28.5, 108.0], [29.5, 109.5], [28.5, 110.5], [27.0, 111.5], [25.5, 112.5],
    [24.0, 114.0], [22.5, 115.5], [21.5, 117.0], [22.5, 119.0], [24.0, 121.0],
    [25.0, 122.5], [26.0, 124.0], [27.0, 125.5], [28.0, 127.0], [29.0, 128.5],
    [30.0, 130.0], [31.5, 131.5], [33.0, 133.0], [34.5, 134.5],
  ],
  G331: [
    [42.0, 120.0], [43.0, 122.0], [44.0, 124.0], [45.0, 126.0],
    [46.0, 128.0], [47.5, 130.0], [49.0, 132.0], [50.5, 134.0],
    [52.0, 136.0], [53.0, 128.0], [52.0, 120.0], [51.0, 115.0],
    [50.0, 110.0], [49.0, 105.0], [48.0, 100.0], [47.0, 95.0],
  ],
  G228: [
    [27.0, 120.0], [25.0, 119.0], [23.0, 117.0], [21.0, 110.0],
    [19.0, 109.0], [17.0, 111.0], [15.0, 108.0], [13.0, 100.0],
    [11.0, 99.0], [10.0, 104.0], [9.0, 110.0], [8.0, 115.0],
  ],
};

export default function MapView({
  trackPoints = [],
  photoMarkers = [],
  className = '',
  center = [35.0, 105.0],
  zoom = 5,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing layers (except base tile)
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    // Add route lines
    const routeColors: Record<string, string> = {
      G219: '#dc2626',
      G331: '#2563eb',
      G228: '#16a34a',
    };

    Object.entries(ROUTES).forEach(([route, points]) => {
      L.polyline(points, {
        color: routeColors[route],
        weight: 3,
        opacity: 0.6,
      }).addTo(map);
    });

    // Add track points
    if (trackPoints.length > 0) {
      const trackLine: [number, number][] = trackPoints.map(
        (p) => [p.latitude, p.longitude]
      );
      L.polyline(trackLine, {
        color: '#f59e0b',
        weight: 4,
      }).addTo(map);
    }

    // Add photo markers
    photoMarkers.forEach((marker) => {
      const color = marker.verified ? '#22c55e' : '#ef4444';
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      L.marker([marker.latitude, marker.longitude], { icon })
        .addTo(map)
        .bindPopup(marker.verified ? '已验证' : '未验证');
    });

    return () => {
      // Don't remove map on cleanup - just clear layers
    };
  }, [trackPoints, photoMarkers, center, zoom]);

  return <div id="map" className={`w-full h-full ${className}`} />;
}
