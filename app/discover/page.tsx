'use client';

import { Video } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import VideoGalleryWrapper from '@/components/video-gallery-wrapper';

export default function DiscoverPage() {
  const { t } = useI18n();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Video className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold">{t.discover.title}</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t.discover.description}
        </p>
      </div>

      <VideoGalleryWrapper showPublic={true} />
    </div>
  );
}