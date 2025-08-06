'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DeleteModal, useDeleteModal } from '@/components/ui/delete-modal';
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
  Link,
  Lock,
  Unlock,
  Globe,
  Shield
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
  const [updatingPrivacyId, setUpdatingPrivacyId] = useState<string | null>(null);
  const { isOpen: isDeleteModalOpen, deleteData, openDeleteModal, closeDeleteModal } = useDeleteModal();

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
        // 原生分享成功，不显示消息
      } catch (error) {
        // 用户取消分享或其他错误，不作任何操作
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('分享取消或失败:', error.message);
        }
      }
    } else {
      // 浏览器不支持原生分享，显示提示消息
      showToast('您的浏览器不支持分享功能，请使用复制链接按钮');
    }
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

  const handleDeleteClick = (video: Video) => {
    openDeleteModal({
      title: video.title,
      description: '此操作无法撤销，视频将永久从您的账户中移除。',
      onConfirm: async () => {
        try {
          setDeletingVideoId(video.$id);
          const result = await DatabaseService.deleteVideo(video.$id, video.fileId);
          
          // Update video list immediately
          setVideos(videos.filter(v => v.$id !== video.$id));
          
          // Show appropriate success message
          if (result && typeof result === 'object' && 'storageDeleteSuccess' in result) {
            showToast(result.message || '视频删除成功！');
            if (!result.storageDeleteSuccess) {
              console.warn('Storage file deletion failed but video removed from list');
            }
          } else {
            showToast('视频已成功删除！');
          }
        } catch (error: any) {
          console.error('Error deleting video:', error);
          showToast(error.message || '删除视频时出错，请重试。');
          throw error; // 重新抛出错误，保持模态框打开
        } finally {
          setDeletingVideoId(null);
        }
      }
    });
  };

  const handlePrivacyToggle = async (video: Video) => {
    if (!user) {
      showToast(t.recording.loginRequired);
      return;
    }

    try {
      setUpdatingPrivacyId(video.$id);
      
      // Call the database service directly from the client
      const updatedVideo = await DatabaseService.toggleVideoPrivacy(video.$id, user.$id);
      
      // Update the video in the local state
      setVideos(videos.map(v => 
        v.$id === video.$id 
          ? { ...v, isPublic: updatedVideo.isPublic }
          : v
      ));
      
      showToast(t.videos.privacyUpdated);
    } catch (error: any) {
      console.error('Error updating privacy:', error);
      showToast(error.message || t.videos.privacyUpdateFailed);
    } finally {
      setUpdatingPrivacyId(null);
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

        </div>
      )}

      {/* Video Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-3 gap-y-1"
          : "space-y-1"
      }>
        {filteredVideos.map((video) => (
          <Card 
            key={video.$id} 
            className="group cursor-pointer transition-all duration-300 hover:scale-105 border-0 shadow-none rounded-none overflow-hidden"
            onClick={() => handleVideoClick(video)}
          >
            <CardContent className="p-0">
              {/* Video Thumbnail/Preview */}
              <div className="aspect-video bg-muted relative overflow-hidden">
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
                
                {/* Action Buttons - Float on video */}
                {/* 用户自己的视频 */}
                {(!showPublic && user && user.$id === video.userId) && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 transition-all duration-300 hover:scale-110 bg-black/70 hover:bg-opacity-100 text-white backdrop-blur-sm ${
                        video.isPublic 
                          ? "hover:bg-orange-600 hover:text-white hover:shadow-lg" 
                          : "hover:bg-green-600 hover:text-white hover:shadow-lg"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrivacyToggle(video);
                      }}
                      title={video.isPublic ? t.videos.makePrivate : t.videos.makePublic}
                      disabled={updatingPrivacyId === video.$id}
                    >
                      {updatingPrivacyId === video.$id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                      ) : video.isPublic ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Globe className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-black/70 hover:bg-blue-600 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm"
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
                      className="h-8 w-8 p-0 bg-black/70 hover:bg-primary text-white transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm"
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
                      className="h-8 w-8 p-0 bg-black/70 hover:bg-green-600 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(video);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-black/70 hover:bg-red-600 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleDeleteClick(video);
                      }}
                      disabled={deletingVideoId === video.$id}
                    >
                      {deletingVideoId === video.$id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
                
                {/* 公开视频或别人的视频 - 只显示复制链接按钮 */}
                {(showPublic || (user && user.$id !== video.userId)) && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-black/70 hover:bg-blue-600 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm"
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
                        {t.videos.public}
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        {t.videos.private}
                      </>
                    )}
                  </Badge>
                </div>

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
                        onClick={() => handlePrivacyToggle(selectedVideo)}
                        disabled={updatingPrivacyId === selectedVideo.$id}
                        className={selectedVideo.isPublic ? "border-orange-300 text-orange-700 hover:bg-orange-50" : "border-green-300 text-green-700 hover:bg-green-50"}
                      >
                        {updatingPrivacyId === selectedVideo.$id ? (
                          <div className="animate-spin rounded-full h-4 w-4 mr-2 border border-current border-t-transparent" />
                        ) : selectedVideo.isPublic ? (
                          <Lock className="h-4 w-4 mr-2" />
                        ) : (
                          <Globe className="h-4 w-4 mr-2" />
                        )}
                        {selectedVideo.isPublic ? t.videos.makePrivate : t.videos.makePublic}
                      </Button>
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
      
      {/* Delete Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteData?.onConfirm || (() => {})}
        title={deleteData?.title || ''}
        description={deleteData?.description || '此操作无法撤销，请确认要继续。'}
        isLoading={deletingVideoId !== null}
      />
    </div>
  );
}