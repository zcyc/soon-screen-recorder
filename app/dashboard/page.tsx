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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in?redirect=/dashboard');
    }
  }, [user, loading, router]);

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

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.dashboard.welcomeBack}, {user.name || 'User'}!</h1>
        <p className="text-muted-foreground mt-2">
          {t.dashboard.welcomeDescription}
        </p>
      </div>

      {/* Recording Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2" />
              {t.dashboard.recordVideo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenRecorder />
          </CardContent>
        </Card>
      </div>

      {/* Recent Recordings Section */}
      <Card>
        <CardContent className="pt-6">
          <VideoGalleryWrapper />
        </CardContent>
      </Card>
    </div>
  );
}