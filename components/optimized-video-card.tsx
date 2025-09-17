'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Lock,
  Globe,
  Play
} from 'lucide-react';
import { type Video } from '@/lib/database';
import { generatePlaceholderThumbnail } from '@/lib/video-utils';

interface OptimizedVideoCardProps {
  video: Video;
  isOwner: boolean;
  showPublic: boolean;
  onVideoClick: (video: Video) => void;
  onShare: (video: Video) => void;
  onCopyLink: (video: Video) => void;
  onDownload: (video: Video) => void;
  onDelete: (video: Video) => void;
  onPrivacyToggle: (video: Video) => void;
  onPublishToggle: (video: Video) => void;
  getVideoUrl: (fileId: string) => string;
  formatDate: (dateString: string) => string;
  formatDuration: (duration: number) => string;
  deletingVideoId: string | null;
  updatingPrivacyId: string | null;
  updatingPublishId: string | null;

}

export default function OptimizedVideoCard({
  video,
  isOwner,
  showPublic,
  onVideoClick,
  onShare,
  onCopyLink,
  onDownload,
  onDelete,
  onPrivacyToggle,
  onPublishToggle,
  getVideoUrl,
  formatDate,
  formatDuration,
  deletingVideoId,
  updatingPrivacyId,
  updatingPublishId
}: OptimizedVideoCardProps) {
  // Completely avoid using dynamic thumbnail generation to avoid loading videos
  const getThumbnailSrc = () => {
    // 1. Try database thumbnail URL first (if exists)
    if (video.thumbnailUrl) {
      return video.thumbnailUrl;
    }
    
    // 2. Use placeholder image directly, don't generate dynamic thumbnails
    return generatePlaceholderThumbnail(320, 180, video.title);
  };

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:scale-105 border-0 shadow-none rounded-none overflow-hidden"
      onClick={() => onVideoClick(video)}
    >
      <CardContent className="p-0 relative">
        {/* Video Thumbnail Only */}
        <div className="aspect-video bg-muted relative overflow-hidden">
          <div className="relative w-full h-full">
            {/* Thumbnail Image */}
            <img
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              src={getThumbnailSrc()}
              alt={video.title}
              loading="lazy"
              onError={(e) => {
                // Fallback to placeholder on error
                const target = e.target as HTMLImageElement;
                target.src = generatePlaceholderThumbnail(320, 180, video.title);
              }}
            />
            
            {/* Play button overlay - only for visual indication */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 rounded-full p-3 shadow-lg hover:bg-white transition-colors">
                <Play className="h-6 w-6 text-gray-800 ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* View count badge */}
          <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {video.views}
            </span>
          </div>
          
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-2 py-1 rounded-full font-medium">
            {formatDuration(video.duration)}
          </div>
        </div>
        
        {/* Video Information */}
        <div className="space-y-1 p-2">
          {/* Title */}
          <h4 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h4>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{formatDate(video.$createdAt)}</span>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {video.quality}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {video.views}
              </span>
            </div>
            <div className="flex space-x-1">
              <Badge 
                variant={video.isPublic ? "outline" : "secondary"} 
                className={`text-xs px-2 py-0.5 ${
                  video.isPublic 
                    ? "border-green-300 text-green-700 bg-green-50" 
                    : "border-gray-300 text-gray-700 bg-gray-100"
                }`}
              >
                {video.isPublic ? (
                  <>
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </>
                )}
              </Badge>
              {video.isPublish && (
                <Badge 
                  variant="outline"
                  className="text-xs px-2 py-0.5 border-blue-300 text-blue-700 bg-blue-50"
                >
                  Discover
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating action buttons removed - all functionality moved to modal */}
        
        {/* Public video floating buttons removed - functionality available in modal */}
      </CardContent>
    </Card>
  );
}