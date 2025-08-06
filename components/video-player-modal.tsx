'use client';

import { useState, useEffect } from 'react';
import { getFileUrlAction } from '@/app/actions/video-actions';

interface VideoPlayerModalProps {
  fileId: string;
  isPlaying: boolean;
  onLoadStart?: () => void;
  className?: string;
}

export default function VideoPlayerModal({ 
  fileId, 
  isPlaying, 
  onLoadStart,
  className = "w-full h-full"
}: VideoPlayerModalProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (isPlaying && fileId) {
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
    }

    return () => {
      isMounted = false;
    };
  }, [fileId, isPlaying]);

  if (!isPlaying) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-black`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <video
      className={className}
      controls
      autoPlay
      src={videoUrl}
      onLoadStart={onLoadStart}
    />
  );
}