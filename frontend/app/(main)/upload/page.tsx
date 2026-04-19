'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { photosApi, journeysApi } from '@/lib/api';
import type { Photo, Journey } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Upload, X, Camera, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; altitude?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [caption, setCaption] = useState('');

  // Load journeys on mount
  useState(() => {
    journeysApi.list().then(setJourneys).catch(() => setJourneys([]));
  });

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);

    // Extract GPS from file
    extractGps(selectedFile);
  }, []);

  const extractGps = async (f: File) => {
    try {
      // Simple GPS extraction from EXIF
      const exif = await import('exifr');
      const data = await exif.default.parse(f, { gps: true });
      if (data?.GPSLatitude && data?.GPSLongitude) {
        setGpsData({
          lat: data.GPSLatitude,
          lng: data.GPSLongitude,
          altitude: data.GPSAltitude,
        });
      }
    } catch {
      // GPS extraction failed - continue without GPS
      setGpsData(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const photo = await photosApi.upload(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Associate with journey if selected
      if (selectedJourneyId) {
        await journeysApi.addPhoto(selectedJourneyId, {
          photoId: photo.id,
          caption,
        });
      }

      // Redirect to map
      setTimeout(() => {
        router.push('/map');
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">上传照片</h1>

      {/* Drop zone */}
      <Card
        className={`p-8 border-2 border-dashed transition-colors mb-6 ${
          dragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="file-input"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        {!file ? (
          <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center">
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">拖拽照片到这里，或点击选择</p>
            <p className="text-sm text-muted-foreground mt-1">支持 JPG、PNG、HEIC 格式</p>
          </label>
        ) : (
          <div className="flex items-center gap-4">
            {preview && (
              <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
            )}
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setFile(null); setPreview(null); setGpsData(null); }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* GPS info */}
      {gpsData && (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">GPS 信息</span>
            <Badge variant="secondary">已提取</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">纬度：</span>
              <span>{gpsData.lat.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">经度：</span>
              <span>{gpsData.lng.toFixed(6)}</span>
            </div>
            {gpsData.altitude && (
              <div>
                <span className="text-muted-foreground">海拔：</span>
                <span>{gpsData.altitude.toFixed(1)} m</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {!gpsData && file && (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              未检测到 GPS 信息，将上传至您的照片库
            </span>
          </div>
        </Card>
      )}

      {/* Journey selection */}
      <Card className="p-4 mb-6">
        <label className="text-sm font-medium mb-2 block">关联旅程（可选）</label>
        <select
          className="w-full p-2 border rounded-lg bg-background"
          value={selectedJourneyId ?? ''}
          onChange={(e) => setSelectedJourneyId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">不关联</option>
          {journeys.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} ({j.status})
            </option>
          ))}
        </select>
      </Card>

      {/* Caption */}
      <Card className="p-4 mb-6">
        <label className="text-sm font-medium mb-2 block">描述（可选）</label>
        <Input
          placeholder="添加照片描述..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </Card>

      {/* Upload button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!file || loading}
        onClick={handleUpload}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            上传中 {uploadProgress}%
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            上传照片
          </>
        )}
      </Button>

      {/* Progress bar */}
      {loading && (
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
