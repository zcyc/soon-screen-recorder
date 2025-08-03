'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { VideoDeleteDialog } from '@/components/ui/confirm-dialog';
import { 
  Search, 
  Eye, 
  Clock, 
  Share, 
  Download, 
  Trash2, 
  ExternalLink,
  Grid,
  List,
  Copy,
  Link
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { DatabaseService, type Video } from '@/lib/database';
import { storage } from '@/lib/appwrite';
import { useI18n } from '@/lib/i18n';

interface VideoGalleryProps {
  showPublic?: boolean;
  onError?: (error: string) => void;
}

export default function VideoGallery({ showPublic = false, onError }: VideoGalleryProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, [showPublic, user]);

  // Show toast message
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000); // Hide after 3 seconds
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      let videoList: Video[] = [];
      
      if (showPublic) {
        videoList = await DatabaseService.getPublicVideos();
      } else if (user) {
        videoList = await DatabaseService.getUserVideos(user.$id);
      }
      
      setVideos(videoList);
    } catch (error: any) {
      console.error('Error loading videos:', error);
      if (onError) {
        onError(error.message || 'Failed to load videos');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.quality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVideoUrl = (fileId: string) => {
    return storage.getFileView(process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!, fileId);
  };

  const handleVideoClick = async (video: Video) => {
    setSelectedVideo(video);
    
    // Increment view count
    if (showPublic || (user && user.$id !== video.userId)) {
      await DatabaseService.incrementViews(video.$id);
    }
  };

  const handleShare = async (video: Video) => {
    const shareUrl = `${window.location.origin}/share/${video.$id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `观看 ${video.title}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        fallbackShare(shareUrl);
      }
    } else {
      fallbackShare(shareUrl);
    }
  };

  const fallbackShare = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('链接已复制到剪贴板！');
  };

  const handleCopyShareLink = async (video: Video) => {
    const shareLink = `${window.location.origin}/share/${video.$id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      showToast(t.recording.linkCopied || '分享链接已复制！');
    } catch (error) {
      console.error('复制失败:', error);
      // 回退方法
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(t.recording.linkCopied || '分享链接已复制！');
    }
  };

  const handleDownload = (video: Video) => {
    const downloadUrl = storage.getFileDownload(
      process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
      video.fileId
    );
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${video.title}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (videoId: string, fileId: string) => {
    try {
      setDeletingVideoId(videoId);
      const result = await DatabaseService.deleteVideo(videoId, fileId);
      
      // Update video list immediately
      setVideos(videos.filter(v => v.$id !== videoId));
      
      // Show appropriate success message
      if (result && typeof result === 'object' && 'storageDeleteSuccess' in result) {
        // New response format with detailed info
        showToast(result.message || '视频删除成功！');
        if (!result.storageDeleteSuccess) {
          console.warn('Storage file deletion failed but video removed from list');
        }
      } else {
        // Legacy response or direct success
        showToast('视频已成功删除！');
      }
    } catch (error: any) {
      console.error('Error deleting video:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        type: error.type
      });
      // 显示具体的错误信息
      showToast(error.message || '删除视频时出错，请重试。');
    } finally {
      setDeletingVideoId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">
          {showPublic ? t.dashboard.publicVideos : t.dashboard.myVideos}
        </h2>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.videos.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery ? t.dashboard.noMatchingVideos : showPublic ? t.dashboard.noPublicVideos : t.dashboard.noVideosYet}
          </div>
          {!showPublic && !searchQuery && (
            <Button onClick={() => window.location.href = '/dashboard'}>
              {t.dashboard.startRecording}
            </Button>
          )}
        </div>
      )}

      {/* Video Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6"
          : "space-y-4"
      }>
        {filteredVideos.map((video) => (
          <Card 
            key={video.$id} 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-sm hover:shadow-2xl"
            onClick={() => handleVideoClick(video)}
          >
            <CardContent className="p-3">
              {/* Video Thumbnail/Preview */}
              <div className="aspect-video bg-muted rounded-lg mb-3 relative overflow-hidden">
                <video
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  src={getVideoUrl(video.fileId)}
                  preload="metadata"
                  muted
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {video.views}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {formatDuration(video.duration)}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg">
                    <svg className="h-6 w-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
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
                  {video.isPublic && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {t.videos.public}
                    </Badge>
                  )}
                </div>
                
                {/* Action Buttons */}
                {/* 用户自己的视频 */}
                {(!showPublic && user && user.$id === video.userId) && (
                  <div className="flex justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-blue-600 hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyShareLink(video);
                      }}
                      title={t.recording.copyShareLink || '复制分享链接'}
                    >
                      <Link className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(video);
                      }}
                    >
                      <Share className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-green-600 hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(video);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <VideoDeleteDialog
                      videoTitle={video.title}
                      onConfirm={() => handleDelete(video.$id, video.fileId)}
                      isLoading={deletingVideoId === video.$id}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-red-600 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </VideoDeleteDialog>
                  </div>
                )}
                
                {/* 公开视频或别人的视频 - 只显示复制链接按钮 */}
                {(showPublic || (user && user.$id !== video.userId)) && (
                  <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-blue-600 hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyShareLink(video);
                      }}
                      title={t.recording.copyShareLink || '复制分享链接'}
                    >
                      <Link className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedVideo.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVideo(null)}
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <video
                className="w-full rounded-md"
                controls
                autoPlay
                src={getVideoUrl(selectedVideo.fileId)}
              />
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>Created: {formatDate(selectedVideo.$createdAt)}</p>
                  <p>Duration: {formatDuration(selectedVideo.duration)}</p>
                  <p>Quality: {selectedVideo.quality}</p>
                  <p>Views: {selectedVideo.views}</p>
                </div>
                
                <div className="flex space-x-2">
                  {/* 用户自己的视频 - 显示所有按钮 */}
                  {(!showPublic && user && user.$id === selectedVideo.userId) && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleCopyShareLink(selectedVideo)}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        {t.recording.copyShareLink || '复制分享链接'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleShare(selectedVideo)}
                      >
                        <Share className="h-4 w-4 mr-2" />
                        {t.recording.shareVideo || '分享视频'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(selectedVideo)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t.recording.download || '下载'}
                      </Button>
                    </>
                  )}
                  
                  {/* 公开视频或别人的视频 - 只显示复制链接 */}
                  {(showPublic || (user && user.$id !== selectedVideo.userId)) && (
                    <Button
                      variant="outline"
                      onClick={() => handleCopyShareLink(selectedVideo)}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      {t.recording.copyShareLink || '复制分享链接'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast 消息 */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}