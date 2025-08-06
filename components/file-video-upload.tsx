'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { uploadVideoFileAction } from '@/app/actions/video-actions';
import { generateThumbnailOnUploadAction } from '@/app/actions/thumbnail-actions';
import { getFileUrlAction } from '@/app/actions/video-actions';

export default function FileVideoUpload() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [videoTitle, setVideoTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('请选择视频文件');
      return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('文件大小不能超过100MB');
      return;
    }

    await uploadVideo(file);
  };

  const uploadVideo = async (file: File) => {
    if (!user) return;
    
    setError(null);
    setUploadProgress(0);
    setUploadedVideo(null);

    startTransition(async () => {
      try {
        console.log('Starting file upload:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });

        setUploadProgress(20);

        // Prepare form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', videoTitle.trim() || file.name.replace(/\.[^/.]+$/, ''));
        formData.append('quality', 'original');
        formData.append('duration', '0');
        formData.append('isPublic', isPublic.toString());
        formData.append('thumbnailUrl', '');

        setUploadProgress(50);

        // Upload video using server action
        const result = await uploadVideoFileAction(formData);
        
        if (result.error) {
          throw new Error(result.error);
        }

        console.log('Video uploaded successfully:', result.data);
        setUploadProgress(70);

        // Generate thumbnail automatically
        if (result.data?.videoId && result.data?.fileId) {
          try {
            console.log('Getting file URL and generating thumbnail...');
            
            // Get file URL
            const urlResult = await getFileUrlAction(result.data.fileId);
            if (urlResult.success && urlResult.data?.url) {
              const thumbnailResult = await generateThumbnailOnUploadAction(
                result.data.videoId,
                urlResult.data.url
              );
              
              if (thumbnailResult.success) {
                console.log('✅ Thumbnail generated successfully');
              } else {
                console.warn('⚠️ Thumbnail generation failed:', thumbnailResult.error);
              }
            }
          } catch (thumbnailError) {
            console.warn('⚠️ Thumbnail generation failed:', thumbnailError);
          }
        }

        setUploadProgress(100);
        setUploadedVideo({ $id: result.data?.videoId, title: videoTitle.trim() || file.name });

      } catch (error: any) {
        console.error('Upload failed:', error);
        setError(error.message || '上传失败');
      } finally {
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">请登录后上传视频</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          文件视频上传
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload form */}
        {!uploadedVideo && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">视频标题</Label>
              <Input
                id="video-title"
                placeholder="输入视频标题（可选）"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public-video"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isPending}
              />
              <Label htmlFor="public-video">设为公开视频</Label>
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isPending}
              />
              
              <Button
                onClick={handleFileSelect}
                disabled={isPending}
                className="w-full h-12"
                size="lg"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    上传中... ({uploadProgress}%)
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    选择视频文件
                  </div>
                )}
              </Button>
              
              {isPending && uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• 支持的格式: MP4, WebM, AVI, MOV 等</p>
              <p>• 文件大小限制: 最大 100MB</p>
              <p>• 上传后将自动生成缩略图</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {uploadedVideo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">视频上传成功！</span>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-green-600" />
                <span className="font-medium">{uploadedVideo.title}</span>
              </div>
              <p className="text-sm text-green-700">
                ✅ 视频已保存到您的媒体库<br/>
                ✅ 缩略图已自动生成<br/>
                ✅ 可以在视频列表中查看
              </p>
            </div>

            <Button
              onClick={() => {
                setUploadedVideo(null);
                setVideoTitle('');
              }}
              variant="outline"
              className="w-full"
            >
              继续上传更多视频
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}