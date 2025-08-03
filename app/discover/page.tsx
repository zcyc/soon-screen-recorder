'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';
import VideoGalleryWrapper from '@/components/video-gallery-wrapper';

export default function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 py-8">
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