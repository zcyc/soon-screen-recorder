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

  // 重定向到主页，因为现在主页已经集成了所有功能
  useEffect(() => {
    if (!loading) {
      router.replace('/'); // 使用 replace 避免在浏览器历史中留下记录
    }
  }, [loading, router]);

  // 显示加载状态，然后重定向
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">跳转中...</p>
      </div>
    </div>
  );
}