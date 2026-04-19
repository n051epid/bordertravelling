'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Photo } from '@/types';

interface PhotoUploaderProps {
  journeyId: string;
  onUploadComplete?: (photo: Photo) => void;
}

export default function PhotoUploader({ journeyId, onUploadComplete }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; photo?: Photo } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('journey_id', journeyId);

      const photo = await api.uploadPhoto(formData);
      setResult({
        success: true,
        message: photo.gps_verified
          ? '上传成功！GPS 位置已验证'
          : '上传成功！GPS 位置未验证（照片缺少位置信息）',
        photo,
      });
      onUploadComplete?.(photo);
    } catch {
      setResult({
        success: false,
        message: '上传失败，请重试',
      });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">上传照片</h3>
      
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={triggerFileInput}
        disabled={uploading}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            上传中...
          </span>
        ) : (
          <span className="flex flex-col items-center">
            <svg className="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            点击拍照或选择照片
          </span>
        )}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="text-sm">{result.message}</p>
          {result.photo && (
            <div className="mt-2 text-xs text-gray-600">
              <p>经度: {result.photo.longitude ?? 'N/A'}</p>
              <p>纬度: {result.photo.latitude ?? 'N/A'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
