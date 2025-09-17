'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { FILE_UPLOAD, PUBLISH } from '@/lib/constants';
import { uploadVideoFileAction } from '@/app/actions/video-actions';

import { getFileUrlAction, uploadFileAction, updateVideoThumbnailAction } from '@/app/actions/video-actions';

import { getVideoFormatRecommendations } from '@/lib/safari-video-utils';
import { generateVideoThumbnailBlob } from '@/lib/video-utils';
import { isVideoFormatSupported, detectBrowser } from '@/lib/browser-compatibility';
import { handleVideoError, isSafariCompatibilityIssue } from '@/lib/video-error-handler';


export default function FileVideoUpload() {
  const { user } = useAuth();

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


  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Background thumbnail generation function
  const generateThumbnailInBackground = async (videoId: string, videoFile: File) => {
    try {
      
      const browser = detectBrowser();
      console.log(`🎨 Starting thumbnail generation for video ${videoId} in ${browser.name}`);
      
      // Generate thumbnail blob
      const thumbnailBlob = await generateVideoThumbnailBlob(videoFile, {
        width: 320,
        height: 180,
        time: 1,
        quality: 0.8,
        format: 'jpeg',
        timeout: browser.isSafari ? 20000 : 15000
      });
      
      console.log('📷 Thumbnail blob generated, size:', thumbnailBlob.size);
      
      // Convert Blob to File and upload
      const thumbnailFile = new File([thumbnailBlob], `thumbnail-${videoId}.jpg`, {
        type: 'image/jpeg'
      });
      
      const uploadResult = await uploadFileAction(thumbnailFile);
      
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload thumbnail');
      }
      
      console.log('🔄 Thumbnail uploaded, updating video record...');
      
      // Update video record thumbnail URL
      const updateResult = await updateVideoThumbnailAction(videoId, uploadResult.data.url);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update video thumbnail');
      }
      
      console.log(`✅ Thumbnail generated successfully: ${uploadResult.data.url}`);
      
    } catch (error: any) {
      console.error(`❌ Thumbnail generation failed for video ${videoId}:`, error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert(FILE_UPLOAD.invalidFileType);
      return;
    }

    // Validate file size (1000MB limit)
    const maxSize = 1000 * 1024 * 1024; // 1000MB
    if (file.size > maxSize) {
      alert(FILE_UPLOAD.fileSizeExceeded);
      return;
    }

    // Check browser compatibility for the video format
    const browser = detectBrowser();
    const formatSupported = isVideoFormatSupported(file.type);
    const recommendations = getVideoFormatRecommendations();
    
    setFormatWarning(null);
    
    if (!formatSupported) {
      const warningMsg = `Current browser (${browser.name}) may not fully support ${file.type} format. Recommended: ${recommendations.preferred.join(', ')}`;
      setFormatWarning(warningMsg);
      console.warn('🚫 Video format compatibility issue:', warningMsg);
    } else if (recommendations.avoid.includes(file.type)) {
      const warningMsg = `Current format ${file.type} may have compatibility issues in ${browser.name}. Recommended to convert to: ${recommendations.preferred.join(', ')}`;
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
        
        // Automatically generate thumbnail in background
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
          errorMessage += ` (Safari compatibility issue: ${videoError.suggestions[0]})`;
        } else if (videoError.suggestions.length > 0) {
          errorMessage += ` Suggestion: ${videoError.suggestions[0]}`;
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
          <p className="text-muted-foreground">Please log in to upload videos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
File Video Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser compatibility info */}
        {browserInfo && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Browser Compatibility Information
              </span>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>Current Browser: {browserInfo.name} {browserInfo.version}</p>
              <p>Recommended Formats: {getVideoFormatRecommendations().preferred.join(', ')}</p>
              {browserInfo.isSafari && (
                <p className="text-amber-700 dark:text-amber-300">
                  🍎 Safari Users: WebM format may have compatibility issues, MP4 format is recommended
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
                Format Compatibility Warning
              </span>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">{formatWarning}</p>
          </div>
        )}
        
        {/* Upload form */}
        {!uploadedVideo && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                placeholder="Enter video title (optional)"
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
                <Label htmlFor="public-video">Set as Public Video</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="publish-video"
                  checked={isPublish}
                  onCheckedChange={setIsPublish}
                  disabled={isPending}
                />
                <Label htmlFor="publish-video">{PUBLISH.publishToDiscovery}</Label>
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
                    {FILE_UPLOAD.uploading} ({uploadProgress}%)
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {FILE_UPLOAD.selectVideoFile}
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
              <p>• Supported formats: MP4, WebM, AVI, MOV, etc.</p>
              <p>• {FILE_UPLOAD.maxFileSize}</p>
              <p>• Thumbnails will be automatically generated after upload</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {uploadedVideo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Video uploaded successfully!</span>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-green-600" />
                <span className="font-medium">{uploadedVideo.title}</span>
              </div>
              <p className="text-sm text-green-700">
                ✅ Video saved to your media library<br/>
                ✅ Can be viewed in video list<br/>
✅ Thumbnail processing
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
Upload More Videos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}