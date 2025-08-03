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
  // Clap, // Not available in lucide-react
  Star
} from 'lucide-react';
import { DatabaseService, VideoRecord, VideoReaction } from '@/lib/database';
import { storage, config } from '@/lib/appwrite';
import { useAuth } from '@/contexts/auth-context';

export default function SharePage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const { user } = useAuth();
  
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [reactions, setReactions] = useState<VideoReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emojis = [
    { emoji: '👍', icon: ThumbsUp, label: 'Like' },
    { emoji: '❤️', icon: Heart, label: 'Love' },
    { emoji: '😊', icon: Smile, label: 'Happy' },
    { emoji: '👏', icon: ThumbsUp, label: 'Applause' },
    { emoji: '⭐', icon: Star, label: 'Awesome' },
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

  const loadVideo = async () => {
    try {
      const videoData = await DatabaseService.getVideoById(videoId);
      if (!videoData.isPublic && (!user || user.$id !== videoData.userId)) {
        setError('This video is private or not found.');
        return;
      }
      setVideo(videoData);
    } catch (error) {
      console.error('Failed to load video:', error);
      setError('Video not found or no longer available.');
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
          <p className="mt-4 text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Video Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'The video you\'re looking for doesn\'t exist or is no longer available.'}
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Video Player */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <video
                className="w-full rounded-t-lg"
                controls
                poster="/api/placeholder/800/450"
                src={getVideoUrl(video.fileId)}
              />
            </CardContent>
          </Card>

          {/* Video Info */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{video.title}</CardTitle>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
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
                  {video.views} views
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDuration(video.duration)}
                </div>
                <div>
                  {formatDate(video.$createdAt)}
                </div>
                <Badge variant="secondary">{video.quality}</Badge>
              </div>

              {/* Reactions */}
              {user && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Reactions</h3>
                  <div className="flex space-x-2 mb-4">
                    {emojis.map(({ emoji, icon: Icon, label }) => {
                      const count = getReactionCount(emoji);
                      const hasReacted = hasUserReacted(emoji);
                      
                      return (
                        <Button
                          key={emoji}
                          variant={hasReacted ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleReaction(emoji)}
                          className="flex items-center space-x-1"
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
                      <h4 className="text-sm font-medium mb-2">Recent reactions:</h4>
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
                            and {reactions.length - 10} more...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!user && (
                <div className="border-t pt-4 text-center">
                  <p className="text-muted-foreground mb-4">
                    Sign in to react to this video
                  </p>
                  <div className="space-x-2">
                    <Button asChild variant="outline">
                      <a href="/sign-in">Sign In</a>
                    </Button>
                    <Button asChild>
                      <a href="/sign-up">Sign Up</a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}