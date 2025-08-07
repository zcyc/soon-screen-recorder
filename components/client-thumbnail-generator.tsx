'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { generateVideoThumbnailBlob } from '@/lib/video-utils';
import { uploadFileAction } from '@/app/actions/video-actions';
import { updateVideoThumbnailAction } from '@/app/actions/video-actions';
import { detectBrowser } from '@/lib/browser-compatibility';
import { canProcessVideo } from '@/lib/safari-video-utils';
import { handleVideoError, isSafariCompatibilityIssue } from '@/lib/video-error-handler';
import { useSafariURLCleanup } from '@/lib/safari-url-manager';
import { useI18n } from '@/lib/i18n';

interface ClientThumbnailGeneratorProps {
  videoId: string;
  videoFile?: File; // 使用原始文件而不是 URL
  videoUrl?: string; // 保持 URL 作为备选
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
  onError?: (error: string) => void;
}

export default function ClientThumbnailGenerator({
  videoId,
  videoFile,
  videoUrl,
  onThumbnailGenerated,
  onError,
}: ClientThumbnailGeneratorProps) {
  const { t } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);
  const [processedSources, setProcessedSources] = useState<Set<string>>(new Set());
  // 添加一个额外的检查，防止对同一个videoId重复生成缩略图
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());
  
  // 使用 ref 来跟踪当前正在处理的视频，防止竞态条件
  const currentlyProcessingRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  
  // Create a stable source identifier that changes only when the actual source changes
  // 移除lastModified以避免死循环，只使用size和name来识别文件
  const sourceIdentifier = useMemo(() => {
    if (videoFile) {
      return `file-${videoId}-${videoFile.size}-${videoFile.name}`;
    } else if (videoUrl) {
      return `url-${videoId}-${videoUrl}`;
    }
    return `none-${videoId}`;
  }, [videoId, videoFile?.size, videoFile?.name, videoUrl]);

  // Memoized generation function to prevent infinite loops
  const generateThumbnail = useCallback(async () => {
    if (!mountedRef.current) return;
    
    const browser = detectBrowser();
    console.log(`🔄 ClientThumbnailGenerator starting for ${videoId} in ${browser.name}`);
    
    // Determine video source
    let videoSource: string | File;
    if (videoFile) {
      videoSource = videoFile;
      console.log('📁 Using original video file for thumbnail generation');
    } else if (videoUrl) {
      videoSource = videoUrl;
      console.log('🔗 Using video URL for thumbnail generation');
    } else {
      throw new Error('No video source available');
    }

    // Check browser compatibility
    const compatibility = canProcessVideo(videoSource);
    if (!compatibility.canProcess) {
      throw new Error(`Browser compatibility issue: ${compatibility.reason}`);
    }

    // Mark as processing
    currentlyProcessingRef.current.add(sourceIdentifier);
    abortControllerRef.current = new AbortController();
    setIsGenerating(true);

    try {
      console.log(`🚀 Starting thumbnail generation for video ${videoId}...`);

      // 1. 在客户端生成缩略图 blob
      const thumbnailBlob = await generateVideoThumbnailBlob(videoSource, {
        width: 320,
        height: 180,
        time: 1,
        quality: 0.8,
        format: 'jpeg',
        timeout: browser.isSafari ? 20000 : 15000, // Longer timeout for Safari
      });

      if (!mountedRef.current) return;

      console.log('📸 Thumbnail blob generated, size:', thumbnailBlob.size);

      // 2. 将 Blob 转换为 File
      const thumbnailFile = new File([thumbnailBlob], `thumbnail-${videoId}.jpg`, {
        type: 'image/jpeg'
      });

      // 3. 上传缩略图文件
      console.log('📤 Uploading thumbnail file...');
      const uploadResult = await uploadFileAction(thumbnailFile);
      
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload thumbnail');
      }

      if (!mountedRef.current) return;

      console.log('🔄 Thumbnail uploaded, updating video record...');

      // 4. 更新视频记录的缩略图 URL
      const updateResult = await updateVideoThumbnailAction(
        videoId,
        uploadResult.data.url
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update video thumbnail');
      }

      if (!mountedRef.current) return;

      console.log(`✅ Thumbnail generated successfully: ${uploadResult.data.url}`);
      
      // Mark as processed
      setProcessedSources(prev => new Set([...prev, sourceIdentifier]));
      setCompletedVideoIds(prev => new Set([...prev, videoId]));
      onThumbnailGenerated?.(uploadResult.data.url);

    } catch (error: any) {
      if (!mountedRef.current) return;
      
      // Use comprehensive error handling
      const videoError = handleVideoError(error, 'thumbnail-generation');
      console.error(`❌ Thumbnail generation failed for ${videoId}:`, videoError);
      
      // Check if it's a Safari compatibility issue
      if (isSafariCompatibilityIssue(videoError)) {
        const compatibilityMsg = `Safari兼容性问题: ${videoError.message}。建议: ${videoError.suggestions.slice(0, 2).join(', ')}`;
        console.warn('🍎 Safari compatibility issue detected:', compatibilityMsg);
        onError?.(compatibilityMsg);
      } else {
        // Handle other errors with suggestions
        const errorMsg = videoError.suggestions.length > 0 
          ? `${videoError.message}。建议: ${videoError.suggestions[0]}`
          : videoError.message;
        onError?.(errorMsg);
      }
      
      // Log retry strategy if available
      const retryStrategy = new (await import('@/lib/video-error-handler')).VideoErrorHandler().getRetryStrategy(videoError);
      if (retryStrategy.shouldRetry) {
        console.log('🔄 Retry strategy available:', retryStrategy);
      }
    } finally {
      // 清理状态
      currentlyProcessingRef.current.delete(sourceIdentifier);
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, [videoId, sourceIdentifier, onThumbnailGenerated, onError]);

  useEffect(() => {
    console.log('🔄 ClientThumbnailGenerator useEffect triggered:', { 
      videoId, 
      hasVideoFile: !!videoFile, 
      videoUrl, 
      sourceIdentifier,
      isGenerating,
      processedCount: processedSources.size,
      timestamp: new Date().toISOString()
    });
    
    // Validation checks
    if (!videoId) {
      console.log('⚠️ No videoId provided');
      return;
    }

    if (!videoFile && !videoUrl) {
      console.log('⚠️ No video source provided');
      return;
    }
    
    // Check if already processed or currently processing
    const alreadyProcessed = processedSources.has(sourceIdentifier);
    const currentlyProcessing = currentlyProcessingRef.current.has(sourceIdentifier);
    
    if (alreadyProcessed || currentlyProcessing) {
      console.log('⏭️ ClientThumbnailGenerator skipping generation:', {
        reason: alreadyProcessed ? 'already-processed' : 'currently-processing',
        sourceIdentifier,
      });
      return;
    }

    // Start generation
    generateThumbnail();
  }, [videoId, sourceIdentifier, generateThumbnail, processedSources]);

  // Component mount/unmount effect with Safari URL cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    // Safari URL cleanup hook
    const safariCleanup = useSafariURLCleanup();
    
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        console.log(`🛑 Aborting thumbnail generation for video ${videoId}`);
        abortControllerRef.current.abort();
      }
      safariCleanup();
    };
  }, [videoId, useSafariURLCleanup]);

  // 如果该videoId已经完成过缩略图生成，直接显示完成状态
  if (completedVideoIds.has(videoId)) {
    return (
      <div className="text-sm text-green-600 flex items-center space-x-2">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>{t.thumbnail.generated}</span>
      </div>
    );
  }

  // 渲染生成状态提示
  if (isGenerating) {
    return (
      <div className="flex items-center space-x-2 text-sm text-blue-600">
        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span>{t.thumbnail.generating}</span>
      </div>
    );
  }

  return (
    <div className="text-sm text-green-600 flex items-center space-x-2">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>缩略图已生成</span>
    </div>
  );
}