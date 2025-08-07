'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/lib/i18n';
import { uploadVideoFileAction } from '@/app/actions/video-actions';

import { getFileUrlAction, uploadFileAction, updateVideoThumbnailAction } from '@/app/actions/video-actions';

import { getVideoFormatRecommendations } from '@/lib/safari-video-utils';
import { generateVideoThumbnailBlob } from '@/lib/video-utils';
import { isVideoFormatSupported, detectBrowser } from '@/lib/browser-compatibility';
import { handleVideoError, isSafariCompatibilityIssue } from '@/lib/video-error-handler';


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
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [formatWarning, setFormatWarning] = useState<string | null>(null);
  const [isThumbnailGenerating, setIsThumbnailGenerating] = useState(false);
  const [thumbnailStatus, setThumbnailStatus] = useState<string>('');

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 后台缩略图生成函数
  const generateThumbnailInBackground = async (videoId: string, videoFile: File) => {
    try {
      setIsThumbnailGenerating(true);
      setThumbnailStatus(t.thumbnail.generating);
      
      const browser = detectBrowser();
      console.log(`🎨 Starting thumbnail generation for video ${videoId} in ${browser.name}`);
      
      // 生成缩略图 blob
      const thumbnailBlob = await generateVideoThumbnailBlob(videoFile, {
        width: 320,
        height: 180,
        time: 1,
        quality: 0.8,
        format: 'jpeg',
        timeout: browser.isSafari ? 20000 : 15000
      });
      
      console.log('📷 Thumbnail blob generated, size:', thumbnailBlob.size);
      setThumbnailStatus(t.thumbnail.uploading);
      
      // 将 Blob 转换为 File 并上传
      const thumbnailFile = new File([thumbnailBlob], `thumbnail-${videoId}.jpg`, {
        type: 'image/jpeg'
      });
      
      const uploadResult = await uploadFileAction(thumbnailFile);
      
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload thumbnail');
      }
      
      console.log('🔄 Thumbnail uploaded, updating video record...');
      setThumbnailStatus(t.thumbnail.updatingRecord);
      
      // 更新视频记录的缩略图 URL
      const updateResult = await updateVideoThumbnailAction(videoId, uploadResult.data.url);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update video thumbnail');
      }
      
      console.log(`✅ Thumbnail generated successfully: ${uploadResult.data.url}`);
      setThumbnailStatus(t.thumbnail.generateSuccess);
      
      // 3秒后清除状态信息
      setTimeout(() => {
        setThumbnailStatus('');
      }, 3000);
      
    } catch (error: any) {
      console.error(`❌ Thumbnail generation failed for video ${videoId}:`, error);
      setThumbnailStatus(t.thumbnail.generateFailed);
      
      // 5秒后清除错误信息
      setTimeout(() => {
        setThumbnailStatus('');
      }, 5000);
    } finally {
      setIsThumbnailGenerating(false);
    }
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

    // Check browser compatibility for the video format
    const browser = detectBrowser();
    const formatSupported = isVideoFormatSupported(file.type);
    const recommendations = getVideoFormatRecommendations();
    
    setFormatWarning(null);
    
    if (!formatSupported) {
      const warningMsg = `当前浏览器 (${browser.name}) 可能不完全支持 ${file.type} 格式。建议使用: ${recommendations.preferred.join(', ')}`;
      setFormatWarning(warningMsg);
      console.warn('🚫 Video format compatibility issue:', warningMsg);
    } else if (recommendations.avoid.includes(file.type)) {
      const warningMsg = `当前格式 ${file.type} 在 ${browser.name} 中可能存在兼容性问题。建议转换为: ${recommendations.preferred.join(', ')}`;
      setFormatWarning(warningMsg);
      console.warn('⚠️ Video format warning:', warningMsg);
    } else {
      console.log('✅ Video format is compatible with current browser');
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
        const browser = detectBrowser();
        console.log('Starting file upload:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          browser: browser.name,
          supportsFormat: isVideoFormatSupported(file.type)
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

        setUploadProgress(100);
        const uploadedVideoData = { 
          $id: result.data?.videoId, 
          title: videoTitle.trim() || file.name,
          fileId: result.data?.fileId 
        };
        setUploadedVideo(uploadedVideoData);
        
        // 在后台自动生成缩略图
        if (selectedVideoFile && uploadedVideoData.$id) {
          generateThumbnailInBackground(uploadedVideoData.$id, selectedVideoFile);
        }

      } catch (error: any) {
        // Use comprehensive error handling
        const videoError = handleVideoError(error, 'file-upload');
        console.error('Video upload failed:', videoError);
        
        // Provide user-friendly error message with suggestions
        let errorMessage = videoError.message;
        if (isSafariCompatibilityIssue(videoError)) {
          errorMessage += ` (Safari兼容性问题：${videoError.suggestions[0]})`;
        } else if (videoError.suggestions.length > 0) {
          errorMessage += ` 建议: ${videoError.suggestions[0]}`;
        }
        
        setError(errorMessage);
      } finally {
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  // Initialize browser info on mount
  useEffect(() => {
    const browser = detectBrowser();
    setBrowserInfo(browser);
    console.log('🔍 Browser detected:', browser);
  }, []);

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
        {/* Browser compatibility info */}
        {browserInfo && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                浏览器兼容性信息
              </span>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>当前浏览器: {browserInfo.name} {browserInfo.version}</p>
              <p>推荐格式: {getVideoFormatRecommendations().preferred.join(', ')}</p>
              {browserInfo.isSafari && (
                <p className="text-amber-700 dark:text-amber-300">
                  🍎 Safari用户：WebM格式可能存在兼容性问题，建议使用MP4格式
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Format warning */}
        {formatWarning && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                格式兼容性警告
              </span>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">{formatWarning}</p>
          </div>
        )}
        
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
                {thumbnailStatus ? (
                  <span className={isThumbnailGenerating ? 'text-amber-600 dark:text-amber-400' : thumbnailStatus.includes('失败') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    {isThumbnailGenerating && '🔄 '}{thumbnailStatus}
                  </span>
                ) : (
                  t.thumbnail.ready
                )}
              </p>
              

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