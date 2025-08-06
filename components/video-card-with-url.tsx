'use client';

import { useState, useEffect } from 'react';
import OptimizedVideoCard from './optimized-video-card';
import { type Video } from '@/lib/database';
import { getFileUrlAction } from '@/app/actions/video-actions';

interface VideoCardWithUrlProps {
  video: Video;
  isOwner: boolean;
  showPublic: boolean;
  onVideoClick: (video: Video) => void;
  onShare: (video: Video) => void;
  onCopyLink: (video: Video) => void;
  onDownload: (video: Video) => void;
  onDelete: (video: Video) => void;
  onPrivacyToggle: (video: Video) => void;
  formatDate: (dateString: string) => string;
  formatDuration: (duration: number) => string;
  deletingVideoId: string | null;
  updatingPrivacyId: string | null;
  t: any;
}

export default function VideoCardWithUrl(props: VideoCardWithUrlProps) {
  const [videoUrl, setVideoUrl] = useState<string>('#');

  useEffect(() => {
    let isMounted = true;
    
    const fetchUrl = async () => {
      try {
        const result = await getFileUrlAction(props.video.fileId);
        if (isMounted && result.success && result.data?.url) {
          setVideoUrl(result.data.url);
        }
      } catch (error) {
        console.error('Error fetching video URL:', error);
        if (isMounted) {
          setVideoUrl('#');
        }
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [props.video.fileId]);

  const getVideoUrl = () => videoUrl;

  return (
    <OptimizedVideoCard
      {...props}
      getVideoUrl={getVideoUrl}
    />
  );
}