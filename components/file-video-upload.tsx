'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { storage } from '@/lib/appwrite';
import { DatabaseService } from '@/lib/database';
import { ID, Permission, Role } from 'appwrite';
import { config } from '@/lib/config';

export default function FileVideoUpload() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<any>(null);

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
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedVideo(null);

    try {
      console.log('Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Upload file to storage
      const fileResponse = await storage.createFile(
        config.bucketId,
        ID.unique(),
        file,
        [
          Permission.read(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
          ...(isPublic ? [Permission.read(Role.any())] : [])
        ]
      );

      console.log('File uploaded successfully:', fileResponse);
      setUploadProgress(50);

      // Create video record
      const finalTitle = videoTitle.trim() || file.name.replace(/\.[^/.]+$/, '');
      const videoRecord = {
        title: String(finalTitle),
        fileId: fileResponse.$id,
        quality: 'original',
        userId: String(user.$id),
        userName: String(user.name || user.email || 'Anonymous User'),
        duration: Number(0), // We don't know duration for uploaded files
        views: Number(0),
        isPublic: Boolean(isPublic),
        thumbnailUrl: String(''),
        subtitleFileId: null
      };

      const createdVideo = await DatabaseService.createVideoRecord(videoRecord);
      console.log('Video record created:', createdVideo);
      setUploadProgress(70);

      // Generate thumbnail automatically
      try {
        console.log('Generating thumbnail for uploaded video...');
        const { ThumbnailService } = await import('@/lib/thumbnail-service');
        const videoUrl = storage.getFileView(config.bucketId, fileResponse.$id);
        
        await ThumbnailService.generateThumbnailOnUpload(
          createdVideo.$id,
          videoUrl.toString(),
          user.$id
        );
        console.log('✅ Thumbnail generated successfully');
        setUploadProgress(100);
      } catch (thumbnailError) {
        console.warn('⚠️ Thumbnail generation failed:', thumbnailError);
        setUploadProgress(100);
      }

      setUploadedVideo(createdVideo);
      alert('视频上传成功！缩略图已自动生成。');

    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`上传失败: ${error.message || '未知错误'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
                disabled={isUploading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public-video"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isUploading}
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
                disabled={isUploading}
              />
              
              <Button
                onClick={handleFileSelect}
                disabled={isUploading}
                className="w-full h-12"
                size="lg"
              >
                {isUploading ? (
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
              
              {isUploading && uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
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