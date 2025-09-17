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
import { DASHBOARD, VIDEOS } from '@/lib/constants';
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
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
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
    if (showPublic || (user && user.id.toString() !== video.userId)) {
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
          text: `Watch ${video.title}`,
          url: shareUrl,
        });
        // Native share successful, don't show message
      } catch (error) {
        // User cancelled share or other error, do nothing
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('Share cancelled or failed:', error.message);
        }
      }
    } else {
      // Browser doesn't support native share, show message

    }
  };

  const handleCopyShareLink = async (video: Video) => {
    const shareLink = `${window.location.origin}/share/${video.$id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      // Successfully copied, can add success message here
    } catch (error) {
      console.error('Copy failed:', error);
      // Copy failed, can add failure message here
    }
  };

  const handleDownload = async (video: Video) => {
    try {
      const videoUrl = await getVideoUrl(video.fileId);
      if (videoUrl && videoUrl !== '#') {
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `${video.title}.${video.quality === '4K' ? 'mp4' : 'mp4'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDeleteClick = (video: Video) => {
    openDeleteModal({
      title: video.title,
      description: VIDEOS.deleteConfirmation,
      onConfirm: () => handleDeleteConfirm(video.$id)
    });
  };

  const handleDeleteConfirm = async (videoId: string) => {
    try {
      setDeletingVideoId(videoId);
      const result = await deleteVideoAction(videoId);
      
      if (result.success) {
        setVideos(videos.filter(video => video.$id !== videoId));
        closeDeleteModal();
      } else {
        throw new Error(result.error || 'Failed to delete video');
      }
    } catch (error: any) {
      console.error('Error deleting video:', error);
      // Can add error message here
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handlePrivacyToggle = async (video: Video) => {
    try {
      setUpdatingPrivacyId(video.$id);
      const result = await toggleVideoPrivacyAction(video.$id);
      
      if (result.success && result.data) {
        // Update video list immediately
        setVideos(videos.map(v => v.$id === video.$id ? result.data! : v));
      } else {
        throw new Error(result.error || 'Failed to update privacy');
      }
    } catch (error: any) {
      console.error('Error updating privacy:', error);
    } finally {
      setUpdatingPrivacyId(null);
    }
  };

  const handlePublishToggle = async (video: Video) => {
    try {
      setUpdatingPublishId(video.$id);
      const result = await toggleVideoPublishStatusAction(video.$id);
      
      if (result.success && result.data) {
        setVideos(videos.map(v => v.$id === video.$id ? result.data! : v));
      } else {
        throw new Error(result.error || 'Failed to update publish status');
      }
    } catch (error: any) {
      console.error('Error updating publish status:', error);
    } finally {
      setUpdatingPublishId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border border-current border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {!showPublic && (
          <h2 className="text-2xl font-bold">
            {DASHBOARD.myVideos}
          </h2>
        )}
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={VIDEOS.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery ? DASHBOARD.noMatchingVideos : showPublic ? DASHBOARD.noPublicVideos : DASHBOARD.noVideosYet}
          </div>

        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-3 gap-y-1">
        {filteredVideos.map((video) => (
          <VideoCardWithUrl
            key={video.$id}
            video={video}
            isOwner={Boolean(!showPublic && user && user.id.toString() === video.userId)}
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
            // Removed t prop, VideoCardWithUrl should use constants directly
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
                  // Show thumbnail and play button
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
                  // Only load video after clicking play
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
                  <p>{VIDEOS.created}: {formatDate(selectedVideo.$createdAt)}</p>
                  <p>{VIDEOS.duration}: {formatDuration(selectedVideo.duration)}</p>
                  <p>{VIDEOS.quality}: {selectedVideo.quality}</p>
                  <p>{VIDEOS.views}: {selectedVideo.views}</p>
                </div>
                
                <div className="flex space-x-2">
                  {/* User's own video - show all buttons */}
                  {(!showPublic && user && user.id.toString() === selectedVideo.userId) && (
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
                        {selectedVideo.isPublic ? VIDEOS.makePrivate : VIDEOS.makePublic}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handlePublishToggle(selectedVideo)}
                        disabled={updatingPublishId === selectedVideo.$id}
                        className={selectedVideo.isPublish ? "border-red-300 text-red-700 hover:bg-red-50" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
                      >
                        {updatingPublishId === selectedVideo.$id ? (
                          <div className="animate-spin rounded-full h-4 w-4 mr-2 border border-current border-t-transparent" />
                        ) : selectedVideo.isPublish ? (
                          <Shield className="h-4 w-4 mr-2" />
                        ) : (
                          <Rss className="h-4 w-4 mr-2" />
                        )}
                        {selectedVideo.isPublish ? VIDEOS.removeFromDiscovery : VIDEOS.publishToDiscovery}
                      </Button>
                    </>
                  )}
                  
                  {/* Share button - shown in all cases */}
                  <Button variant="outline" onClick={() => handleShare(selectedVideo)}>
                    <Share className="h-4 w-4 mr-2" />
                    {VIDEOS.share}
                  </Button>
                  
                  {/* Copy link button - shown in all cases */}
                  <Button variant="outline" onClick={() => handleCopyShareLink(selectedVideo)}>
                    <Copy className="h-4 w-4 mr-2" />
                    {VIDEOS.copyLink}
                  </Button>
                  
                  {/* Download button - only shown on private page */}
                  {!showPublic && (
                    <Button variant="outline" onClick={() => handleDownload(selectedVideo)}>
                      <Download className="h-4 w-4 mr-2" />
                      {VIDEOS.download}
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
        title={deleteData?.title || ''}
        description={deleteData?.description || ''}
        onConfirm={deleteData?.onConfirm || (() => {})}
        onClose={closeDeleteModal}
        isLoading={Boolean(deletingVideoId)}
      />
    </div>
  );
}