'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/lib/i18n';
import { uploadVideoFileAction } from '@/app/actions/video-actions';

import { getFileUrlAction } from '@/app/actions/video-actions';
import ClientThumbnailGenerator from './client-thumbnail-generator';


export default function FileVideoUpload() {
  const { user } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [videoTitle, setVideoTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isPublish, setIsPublish] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert(t.fileUpload.invalidFileType);
      return;
    }

    // Validate file size (1000MB limit)
    const maxSize = 1000 * 1024 * 1024; // 1000MB
    if (file.size > maxSize) {
      alert(t.fileUpload.fileSizeExceeded);
      return;
    }

    setSelectedVideoFile(file);
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
        formData.append('isPublish', isPublish.toString());
        formData.append('thumbnailUrl', '');

        setUploadProgress(50);

        // Upload video using server action
        const result = await uploadVideoFileAction(formData);
        
        if (result.error) {
          throw new Error(result.error);
        }

        console.log('Video uploaded successfully:', result.data);
        setUploadProgress(70);

        // 缩略图将由客户端组件处理

        setUploadProgress(100);
        setUploadedVideo({ 
          $id: result.data?.videoId, 
          title: videoTitle.trim() || file.name,
          fileId: result.data?.fileId 
        });

      } catch (error: any) {
        console.error('Upload failed:', error);
        setError(error.message || t.fileUpload.uploadFailed);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="public-video"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={isPending}
                />
                <Label htmlFor="public-video">设为公开视频</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="publish-video"
                  checked={isPublish}
                  onCheckedChange={setIsPublish}
                  disabled={isPending}
                />
                <Label htmlFor="publish-video">{t.publish.publishToDiscovery}</Label>
              </div>
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
                variant="outline"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.fileUpload.uploading} ({uploadProgress}%)
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {t.fileUpload.selectVideoFile}
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
              <p>• {t.fileUpload.maxFileSize}</p>
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
                ✅ 可以在视频列表中查看<br/>
                🎬 正在自动生成缩略图...
              </p>
              
              {/* 自动缩略图生成器 */}
              {selectedVideoFile && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <ClientThumbnailGenerator
                    videoId={uploadedVideo.$id}
                    videoFile={selectedVideoFile} // 使用原始文件
                    videoUrl={`${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ENDPOINT}/storage/buckets/videos/files/${(uploadedVideo as any).fileId}/view?project=soon`} // 作为备选
                    onThumbnailGenerated={(url) => {
                      console.log('✅ Thumbnail generated successfully:', url);
                    }}
                    onError={(error) => {
                      console.warn('⚠️ Thumbnail generation failed:', error);
                    }}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                setUploadedVideo(null);
                setVideoTitle('');
                setSelectedVideoFile(null);
                setIsPublic(false);
                setIsPublish(false);
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