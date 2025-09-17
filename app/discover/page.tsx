'use client';


import { DISCOVER } from '@/lib/constants';
import VideoGalleryWrapper from '@/components/video-gallery-wrapper';

export default function DiscoverPage() {
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h1 className="text-3xl font-bold">{DISCOVER.title}</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {DISCOVER.description}
        </p>
      </div>

      <VideoGalleryWrapper showPublic={true} />
    </div>
  );
}