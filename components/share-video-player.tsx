'use client';

import { useState, useEffect } from 'react';
import { getFileUrlAction } from '@/app/actions/video-actions';

interface ShareVideoPlayerProps {
  fileId: string;
  subtitleUrl?: string | null;
  title: string;
  className?: string;
  onLoadStart?: () => void;
}

export default function ShareVideoPlayer({ 
  fileId, 
  subtitleUrl,
  title,
  className = "w-full rounded-t-lg",
  onLoadStart
}: ShareVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUrl = async () => {
      try {
        setLoading(true);
        const result = await getFileUrlAction(fileId);
        if (isMounted && result.success && result.data?.url) {
          setVideoUrl(result.data.url);
        }
      } catch (error) {
        console.error('Error fetching video URL:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [fileId]);

  if (loading) {
    return (
      <div className={`${className} aspect-video bg-muted flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <video
      className={className}
      controls
      poster="/api/placeholder/800/450"
      src={videoUrl}
      crossOrigin="anonymous"
      onLoadStart={onLoadStart}
    >
      {subtitleUrl && (
        <track
          kind="subtitles"
          src={subtitleUrl}
          srcLang="auto"
          label="字幕"
        />
      )}
      您的浏览器不支持视频播放。
    </video>
  );
}