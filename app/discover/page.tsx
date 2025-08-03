'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';
import VideoGalleryWrapper from '@/components/video-gallery-wrapper';

export default function DiscoverPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Video className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold">Discover Recordings</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Browse public recordings shared by the Soon community.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoGalleryWrapper showPublic={true} />
        </CardContent>
      </Card>
    </div>
  );
}