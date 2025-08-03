'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Download, 
  Eye,
  Clock,
  User,
  Heart,
  Smile,
  ThumbsUp,
  ThumbsDown,
  Star,
  Frown,
  Meh
} from 'lucide-react';
import { DatabaseService, VideoRecord, VideoReaction } from '@/lib/database';
import { storage, config } from '@/lib/appwrite';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/lib/i18n';

export default function SharePage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const { user } = useAuth();
  const { t } = useI18n();
  
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [reactions, setReactions] = useState<VideoReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [showSubtitles, setShowSubtitles] = useState(true);

  const emojis = [
    // 正面反馈
    { emoji: '👍', icon: ThumbsUp, label: t.share.like },
    { emoji: '❤️', icon: Heart, label: t.share.love },
    { emoji: '😊', icon: Smile, label: t.share.happy },
    { emoji: '👏', icon: ThumbsUp, label: t.share.applause },
    { emoji: '⭐', icon: Star, label: t.share.awesome },
    // 负面反馈
    { emoji: '👎', icon: ThumbsDown, label: t.share.dislike },
    { emoji: '😕', icon: Frown, label: t.share.confused },
    { emoji: '😴', icon: Meh, label: t.share.boring },
    { emoji: '😞', icon: Frown, label: t.share.disappointed },
  ];

  useEffect(() => {
    if (videoId) {
      loadVideo();
      loadReactions();
    }
  }, [videoId]);

  useEffect(() => {
    // Increment view count when video loads
    if (video) {
      DatabaseService.incrementViews(video.$id);
    }
  }, [video]);
  
  // Control subtitle display
  useEffect(() => {
    const video = document.querySelector('video');
    if (video && video.textTracks && video.textTracks.length > 0) {
      const track = video.textTracks[0];
      track.mode = showSubtitles ? 'showing' : 'hidden';
    }
  }, [showSubtitles, subtitleUrl]);

  const loadVideo = async () => {
    try {
      const videoData = await DatabaseService.getVideoById(videoId);
      if (!videoData.isPublic && (!user || user.$id !== videoData.userId)) {
        setError(t.share.privateVideoError);
        return;
      }
      setVideo(videoData);
      
      // Load subtitle file if available
      if (videoData.subtitleFileId) {
        try {
          const subtitleUrl = getSubtitleUrl(videoData.subtitleFileId);
          setSubtitleUrl(subtitleUrl);
          console.log('Subtitle file loaded:', subtitleUrl);
        } catch (subtitleError) {
          console.error('Failed to load subtitle file:', subtitleError);
          // Don't fail the entire video loading if subtitles fail
        }
      }
    } catch (error) {
      console.error('Failed to load video:', error);
      setError(t.share.videoNotFoundDesc);
    } finally {
      setLoading(false);
    }
  };

  const loadReactions = async () => {
    try {
      const reactionsData = await DatabaseService.getVideoReactions(videoId);
      setReactions(reactionsData);
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user || !video) {
      return;
    }

    try {
      await DatabaseService.addReaction(
        video.$id,
        user.$id,
        user.name || user.email,
        emoji
      );
      loadReactions();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const getVideoUrl = (fileId: string) => {
    return `${config.endpoint}/storage/buckets/${config.bucketId}/files/${fileId}/view?project=${config.projectId}`;
  };
  
  const getSubtitleUrl = (fileId: string) => {
    return `${config.endpoint}/storage/buckets/${config.bucketId}/files/${fileId}/view?project=${config.projectId}`;
  };

  const getReactionCount = (emoji: string) => {
    return reactions.filter(r => r.emoji === emoji).length;
  };

  const hasUserReacted = (emoji: string) => {
    return user && reactions.some(r => r.emoji === emoji && r.userId === user.$id);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = () => {
    if (!video) return;
    
    const videoUrl = getVideoUrl(video.fileId);
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `${video.title}.webm`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t.share.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">{t.share.videoNotFound}</h1>
          <p className="text-muted-foreground mb-4">
            {error || t.share.videoNotFoundDesc}
          </p>
          <Button onClick={() => window.location.href = '/'}>
            {t.share.backToHome}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 content-container">
        <div className="max-w-4xl mx-auto">
          {/* Video Player */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <video
                className="w-full rounded-t-lg"
                controls
                poster="/api/placeholder/800/450"
                src={getVideoUrl(video.fileId)}
                crossOrigin="anonymous"
              >
                {subtitleUrl && (
                  <track
                    kind="subtitles"
                    src={subtitleUrl}
                    srcLang={video.subtitleFileId ? 'auto' : 'zh-CN'}
                    label="字幕"
                  />
                )}
                您的浏览器不支持视频播放。
              </video>
            </CardContent>
          </Card>

          {/* Video Info */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{video.title}</CardTitle>
                <div className="flex space-x-2">
                  {subtitleUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSubtitles(!showSubtitles)}
                    >
                      <span className="text-xs font-bold mr-2">CC</span>
                      {showSubtitles ? t.subtitles?.hideSubtitles || '隐藏字幕' : t.subtitles?.showSubtitles || '显示字幕'}
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t.share.download}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {video.userName}
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {video.views} {t.share.views}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDuration(video.duration)}
                </div>
                <div>
                  {formatDate(video.$createdAt)}
                </div>
                <Badge variant="secondary">{video.quality}</Badge>
                {subtitleUrl && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <span className="text-xs font-bold">CC</span>
                    <span>{t.subtitles?.enableSubtitles || '字幕'}</span>
                  </Badge>
                )}
              </div>

              {/* Reactions */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">{t.share.reactions}</h3>
                <div className="flex space-x-2 mb-4">
                  {emojis.map(({ emoji, icon: Icon, label }) => {
                    const count = getReactionCount(emoji);
                    const hasReacted = hasUserReacted(emoji);
                    
                    return (
                      <Button
                        key={emoji}
                        variant={hasReacted ? "default" : "outline"}
                        size="sm"
                        onClick={user ? () => handleReaction(emoji) : undefined}
                        disabled={!user}
                        className="flex items-center space-x-1"
                        title={user ? label : t.share.signInToReact}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="text-xs">{count}</span>}
                      </Button>
                    );
                  })}
                </div>

                {/* Recent Reactions */}
                {reactions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t.share.recentReactions}</h4>
                    <div className="flex flex-wrap gap-2">
                      {reactions.slice(0, 10).map((reaction) => (
                        <div
                          key={reaction.$id}
                          className="flex items-center space-x-1 text-xs bg-muted px-2 py-1 rounded"
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.userName}</span>
                        </div>
                      ))}
                      {reactions.length > 10 && (
                        <span className="text-xs text-muted-foreground">
                          {t.share.andMore.replace('{count}', (reactions.length - 10).toString())}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Sign in prompt for non-logged in users */}
                {!user && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      {t.share.signInToReact}
                    </p>
                    <div className="space-x-2">
                      <Button asChild variant="outline" size="sm">
                        <a href="/sign-in">{t.share.signIn}</a>
                      </Button>
                      <Button asChild size="sm">
                        <a href="/sign-up">{t.share.signUp}</a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}