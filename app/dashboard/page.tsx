'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import ScreenRecorder from '@/components/screen-recorder';
import VideoGalleryWrapper from '@/components/video-gallery-wrapper';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  // 移除自动跳转到登录页面的逻辑，允许游客访问
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/sign-in?redirect=/dashboard');
  //   }
  // }, [user, loading, router]);

  // 对于已登录用户，这样做是可选的 - 可以保留欢迎信息
  // 对于游客用户，我们显示录制功能但限制某些功能

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // 移除登录检查，允许游客访问
  // if (!user) {
  //   return null;
  // }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 content-container">
      <div className="mb-8">
        {user ? (
          <>
            <h1 className="text-3xl font-bold">{t.dashboard.welcomeBack}, {user.name || 'User'}!</h1>
            <p className="text-muted-foreground mt-2">
              {t.dashboard.welcomeDescription}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">欢迎使用录屏工具!</h1>
            <p className="text-muted-foreground mt-2">
              游客模式下可以录制和下载视频，登录后可上传到云端。
            </p>
          </>
        )}
      </div>

      {/* Recording Section */}
      <div className="mb-8">
        <Card>
          <CardContent>
            <ScreenRecorder />
          </CardContent>
        </Card>
      </div>

      {/* Recent Recordings Section - 只对已登录用户显示 */}
      {user && <VideoGalleryWrapper />}
    </div>
  );
}