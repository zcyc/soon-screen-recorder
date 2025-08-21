'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DeleteModal, useDeleteModal } from '@/components/ui/delete-modal';
import VideoCardWithUrl from '@/components/video-card-with-url';
import VideoPlayerModal from '@/components/video-player-modal';
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
  Shield,
  Play,
  Rss
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { type Video } from '@/lib/database';
import { useI18n } from '@/lib/i18n';
import { generatePlaceholderThumbnail } from '@/lib/video-utils';
import { 
  getUserVideosAction, 
  getPublicVideosAction, 
  deleteVideoAction, 
  toggleVideoPrivacyAction,
  toggleVideoPublishStatusAction,
  incrementVideoViewsAction,
  getFileUrlAction
} from '@/app/actions/video-actions';

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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [updatingPrivacyId, setUpdatingPrivacyId] = useState<string | null>(null);
  const [updatingPublishId, setUpdatingPublishId] = useState<string | null>(null);
  const { isOpen: isDeleteModalOpen, deleteData, openDeleteModal, closeDeleteModal } = useDeleteModal();

  useEffect(() => {
    loadVideos();
  }, [showPublic, user]);

  // Handle escape key to close modal and prevent body scroll
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedVideo) {
        handleCloseModal();
      }
    };

    if (selectedVideo) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Force scroll to top when modal opens to ensure it's visible
      const modalContainer = document.querySelector('.video-modal-container');
      if (modalContainer) {
        (modalContainer as HTMLElement).scrollTop = 0;
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedVideo]);



  const loadVideos = async () => {
    try {
      setLoading(true);
      let result;
      
      if (showPublic) {
        result = await getPublicVideosAction();
      } else if (user) {
        result = await getUserVideosAction();
      }
      
      if (result?.success && result.data) {
        setVideos(result.data);
      } else if (result?.error) {
        throw new Error(result.error);
      } else {
        setVideos([]);
      }
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

  const getVideoUrl = async (fileId: string) => {
    try {
      const result = await getFileUrlAction(fileId);
      return result.success && result.data?.url ? result.data.url : '#';
    } catch (error) {
      console.error('Error getting video URL:', error);
      return '#';
    }
  };

  const handleVideoClick = async (video: Video) => {
    setSelectedVideo(video);
    setIsVideoPlaying(false); // Reset playing state
    
    // Increment view count
    if (showPublic || (user && user.$id !== video.userId)) {
      await incrementVideoViewsAction(video.$id);
    }
  };

  // Handle starting video playback
  const handleStartPlaying = () => {
    setIsVideoPlaying(true);
  };

  // Handle closing video modal
  const handleCloseModal = () => {
    setSelectedVideo(null);
    setIsVideoPlaying(false);
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

    }
  };

  const handleCopyShareLink = async (video: Video) => {
    const shareLink = `${window.location.origin}/share/${video.$id}`;
    try {
      await navigator.clipboard.writeText(shareLink);

    } catch (error) {
      console.error('复制失败:', error);
      // 回退方法
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

    }
  };

  const handleDownload = async (video: Video) => {
    try {
      const result = await getFileUrlAction(video.fileId);
      if (!result.success || !result.data?.url) {

        return;
      }
      
      const link = document.createElement('a');
      link.href = result.data.url;
      link.download = `${video.title}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading video:', error);

    }
  };

  const handleDeleteClick = (video: Video) => {
    openDeleteModal({
      title: video.title,
      description: '此操作无法撤销，视频将永久从您的账户中移除。',
      onConfirm: async () => {
        try {
          setDeletingVideoId(video.$id);
          const result = await deleteVideoAction(video.$id, video.fileId);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          // Update video list immediately
          setVideos(videos.filter(v => v.$id !== video.$id));
          
          // Close modal if the deleted video was currently selected
          if (selectedVideo && selectedVideo.$id === video.$id) {
            setSelectedVideo(null);
            setIsVideoPlaying(false);
          }
          
          // Show appropriate success message
          if (result.data && result.data.message) {

          } else {

          }
        } catch (error: any) {
          console.error('Error deleting video:', error);

          throw error; // 重新抛出错误，保持模态框打开
        } finally {
          setDeletingVideoId(null);
        }
      }
    });
  };

  const handlePrivacyToggle = async (video: Video) => {
    if (!user) {

      return;
    }

    try {
      setUpdatingPrivacyId(video.$id);
      
      // Call the server action
      const result = await toggleVideoPrivacyAction(video.$id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update the video in the local state
      setVideos(videos.map(v => 
        v.$id === video.$id 
          ? { ...v, isPublic: result.data.isPublic }
          : v
      ));
      

    } catch (error: any) {
      console.error('Error updating privacy:', error);

    } finally {
      setUpdatingPrivacyId(null);
    }
  };

  const handlePublishToggle = async (video: Video) => {
    if (!user) {

      return;
    }

    try {
      setUpdatingPublishId(video.$id);
      
      // Call the server action
      const result = await toggleVideoPublishStatusAction(video.$id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update the video in the local state
      setVideos(videos.map(v => 
        v.$id === video.$id 
          ? { ...v, isPublish: result.data.isPublish }
          : v
      ));
      

    } catch (error: any) {
      console.error('Error updating publish status:', error);

    } finally {
      setUpdatingPublishId(null);
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
          <VideoCardWithUrl
            key={video.$id}
            video={video}
            isOwner={Boolean(!showPublic && user && user.$id === video.userId)}
            showPublic={showPublic}
            onVideoClick={handleVideoClick}
            onShare={handleShare}
            onCopyLink={handleCopyShareLink}
            onDownload={handleDownload}
            onDelete={handleDeleteClick}
            onPrivacyToggle={handlePrivacyToggle}
            onPublishToggle={handlePublishToggle}
            formatDate={formatDate}
            formatDuration={formatDuration}
            deletingVideoId={deletingVideoId}
            updatingPrivacyId={updatingPrivacyId}
            updatingPublishId={updatingPublishId}
            t={t}
          />
        ))}
      </div>
      
      {/* Video Modal */}
      {selectedVideo && typeof document !== 'undefined' && createPortal(
        <div 
          className="video-modal-container fixed bg-black/80 p-4"
          onClick={handleCloseModal}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 'auto'
            }}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedVideo.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                >
                  <span className="text-2xl leading-none">×</span>
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                {!isVideoPlaying ? (
                  // 显示缩略图和播放按钮
                  <>
                    <img
                      className="w-full h-full object-cover"
                      src={selectedVideo.thumbnailUrl || generatePlaceholderThumbnail(800, 450, selectedVideo.title)}
                      alt={selectedVideo.title}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Button
                        size="lg"
                        onClick={handleStartPlaying}
                        className="bg-white/90 hover:bg-white text-black rounded-full h-20 w-20 p-0"
                      >
                        <Play className="h-8 w-8 ml-1" fill="currentColor" />
                      </Button>
                    </div>
                  </>
                ) : (
                  // 只有在点击播放后才加载视频
                  <VideoPlayerModal
                    fileId={selectedVideo.fileId}
                    isPlaying={isVideoPlaying}
                    onLoadStart={() => console.log('Video loading started')}
                    className="w-full h-full"
                  />
                )}
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>{t.videos.created}: {formatDate(selectedVideo.$createdAt)}</p>
                  <p>{t.videos.duration}: {formatDuration(selectedVideo.duration)}</p>
                  <p>{t.videos.quality}: {selectedVideo.quality}</p>
                  <p>{t.videos.views}: {selectedVideo.views}</p>
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
                        onClick={() => handlePublishToggle(selectedVideo)}
                        disabled={updatingPublishId === selectedVideo.$id}
                        className={selectedVideo.isPublish ? "border-purple-300 text-purple-700 hover:bg-purple-50" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
                      >
                        {updatingPublishId === selectedVideo.$id ? (
                          <div className="animate-spin rounded-full h-4 w-4 mr-2 border border-current border-t-transparent" />
                        ) : (
                          <Rss className={`h-4 w-4 mr-2 ${selectedVideo.isPublish ? 'text-purple-500' : ''}`} />
                        )}
                        {selectedVideo.isPublish ? (t.publish?.removeFromDiscovery || '从发现页移除') : (t.publish?.publishToDiscovery || '发布到发现页')}
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
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteClick(selectedVideo)}
                        disabled={deletingVideoId === selectedVideo.$id}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {deletingVideoId === selectedVideo.$id ? (
                          <div className="animate-spin rounded-full h-4 w-4 mr-2 border border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {t.recording.delete || '删除'}
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
        </div>,
        document.body
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