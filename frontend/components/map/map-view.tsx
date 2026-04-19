'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon path issue in Next.js
// @ts-expect-error - Leaflet type declarations incomplete for custom icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{ id: number; lat: number; lng: number; label?: string }>;
  routeLines?: Array<{ coordinates: [number, number][]; color: string; label: string }>;
  onMapClick?: (lat: number, lng: number) => void;
  selectedRoute?: string | null;
}

export default function Map({
  center = [35.0, 120.0],
  zoom = 5,
  markers = [],
  routeLines = [],
  onMapClick,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // OSM tile layer - for China coverage, consider using Tencent Maps tiles in production
    // See: https://www.yuque.com/chaofun/tuxun (图寻 uses Tencent Maps)
    L.tileLayer('https://tile.openstreetmap.cn/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map tiles by <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    markers.forEach((marker) => {
      const l = L.marker([marker.lat, marker.lng]);
      if (marker.label) {
        l.bindPopup(`<b>${marker.label}</b>`);
      }
      l.addTo(map);
    });
  }, [markers]);

  // Update route lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline && !(layer instanceof L.Marker)) {
        map.removeLayer(layer);
      }
    });

    // Add route lines
    routeLines.forEach((route) => {
      if (route.coordinates.length < 2) return;
      L.polyline(route.coordinates, {
        color: route.color,
        weight: 4,
        opacity: 0.8,
      })
        .bindPopup(route.label)
        .addTo(map);
    });
  }, [routeLines]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
}
