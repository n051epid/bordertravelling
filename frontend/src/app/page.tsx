'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(api.isAuthenticated());
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          环游中国边境线
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          记录你的 G219、G331、G228 三条边境公路之旅。<br />
          用照片和轨迹，丈量祖国的每一寸土地。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isLoggedIn ? (
            <Link
              href="/journeys"
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              我的旅程
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                开始旅程
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
              >
                登录
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Route Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="text-3xl mb-3">🛣️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">G219 边境公路</h3>
          <p className="text-gray-600 text-sm">
            全长约 10,000 公里，从新疆到广西，途经西藏、云南，是我国最长的边境公路。
          </p>
          <div className="mt-4 text-sm text-red-600 font-medium">约 10,000 公里</div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-3xl mb-3">🏔️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">G331 边境公路</h3>
          <p className="text-gray-600 text-sm">
            沿东北边境前行，穿越长白山、大兴安岭，欣赏北国雪景与森林风光。
          </p>
          <div className="mt-4 text-sm text-blue-600 font-medium">约 9,000 公里</div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="text-3xl mb-3">🌊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">G228 边境公路</h3>
          <p className="text-gray-600 text-sm">
            沿着东部海岸线，从辽宁到广西，串联起沿海城市的海岛风光。
          </p>
          <div className="mt-4 text-sm text-green-600 font-medium">约 7,000 公里</div>
        </div>
      </div>

      {/* Features */}
      <div className="py-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">功能特点</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📍</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">GPS 位置验证</h3>
              <p className="text-sm text-gray-600 mt-1">照片自动验证地理位置，确保真实性</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🗺️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">轨迹可视化</h3>
              <p className="text-sm text-gray-600 mt-1">在地图上展示你的旅行轨迹</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📸</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">照片记录</h3>
              <p className="text-sm text-gray-600 mt-1">上传并管理你的旅行照片</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">边境证书</h3>
              <p className="text-sm text-gray-600 mt-1">完成旅程获取专属证书（即将推出）</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
