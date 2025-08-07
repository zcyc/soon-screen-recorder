'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { generateVideoThumbnailBlob } from '@/lib/video-utils';
import { uploadFileAction } from '@/app/actions/video-actions';
import { updateVideoThumbnailAction } from '@/app/actions/video-actions';
import { canProcessVideo } from '@/lib/safari-video-utils';
import { detectBrowser } from '@/lib/browser-compatibility';

interface EnhancedThumbnailGeneratorProps {
  videoId: string;
  videoFile?: File;
  videoUrl?: string;
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
  onError?: (error: string) => void;
  onProgress?: (stage: 'generating' | 'uploading' | 'updating') => void;
}

export default function EnhancedThumbnailGenerator({
  videoId,
  videoFile,
  videoUrl,
  onThumbnailGenerated,
  onError,
  onProgress,
}: EnhancedThumbnailGeneratorProps) {
  const [status, setStatus] = useState<{
    isGenerating: boolean;
    completed: Set<string>;
    currentStage: 'idle' | 'generating' | 'uploading' | 'updating' | 'completed' | 'error';
    error: string | null;
  }>({
    isGenerating: false,
    completed: new Set(),
    currentStage: 'idle',
    error: null,
  });

  // Use refs to prevent infinite loops
  const processingRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Stable video source identifier to prevent re-processing
  const videoSourceId = useRef<string>('');
  
  // Create a stable identifier for the current video source
  const currentVideoSourceId = videoFile 
    ? `file-${videoId}-${videoFile.size}-${videoFile.name}`
    : videoUrl 
      ? `url-${videoId}-${videoUrl}`
      : `none-${videoId}`;

  // Memoized generation function to prevent recreation on every render
  const generateThumbnail = useCallback(async (
    sourceId: string,
    videoSource: File | string,
    targetVideoId: string
  ) => {
    if (!mountedRef.current) return;
    
    // Prevent concurrent processing of the same video
    if (processingRef.current.has(sourceId)) {
      console.log(`⚠️ Thumbnail generation already in progress for: ${sourceId}`);
      return;
    }

    // Check if already completed
    if (status.completed.has(sourceId)) {
      console.log(`✅ Thumbnail already generated for: ${sourceId}`);
      return;
    }

    const browser = detectBrowser();
    console.log(`🔄 Starting thumbnail generation for ${targetVideoId} in ${browser.name}`);

    // Check browser compatibility
    const compatibility = canProcessVideo(videoSource);
    if (!compatibility.canProcess) {
      const errorMsg = `Browser compatibility issue: ${compatibility.reason}`;
      console.error(errorMsg);
      setStatus(prev => ({ ...prev, currentStage: 'error', error: errorMsg }));
      onError?.(errorMsg);
      return;
    }

    // Mark as processing
    processingRef.current.add(sourceId);
    abortControllerRef.current = new AbortController();

    try {
      setStatus(prev => ({ 
        ...prev, 
        isGenerating: true, 
        currentStage: 'generating',
        error: null 
      }));
      onProgress?.('generating');

      console.log(`📸 Generating thumbnail blob for ${targetVideoId}...`);
      const thumbnailBlob = await generateVideoThumbnailBlob(videoSource, {
        width: 320,
        height: 180,
        time: 1,
        quality: 0.8,
        format: 'jpeg',
        timeout: browser.isSafari ? 20000 : 15000, // Longer timeout for Safari
      });

      if (!mountedRef.current) return;

      console.log(`📤 Uploading thumbnail (${thumbnailBlob.size} bytes)...`);
      setStatus(prev => ({ ...prev, currentStage: 'uploading' }));
      onProgress?.('uploading');

      const thumbnailFile = new File([thumbnailBlob], `thumbnail-${targetVideoId}.jpg`, {
        type: 'image/jpeg'
      });

      const uploadResult = await uploadFileAction(thumbnailFile);
      
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload thumbnail');
      }

      if (!mountedRef.current) return;

      console.log(`🔄 Updating video record...`);
      setStatus(prev => ({ ...prev, currentStage: 'updating' }));
      onProgress?.('updating');

      const updateResult = await updateVideoThumbnailAction(
        targetVideoId,
        uploadResult.data.url
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update video thumbnail');
      }

      if (!mountedRef.current) return;

      console.log(`✅ Thumbnail generated successfully: ${uploadResult.data.url}`);
      
      setStatus(prev => ({
        ...prev,
        isGenerating: false,
        currentStage: 'completed',
        completed: new Set([...prev.completed, sourceId]),
        error: null,
      }));

      onThumbnailGenerated?.(uploadResult.data.url);

    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error(`❌ Thumbnail generation failed for ${targetVideoId}:`, error);
      
      const errorMessage = error.message || 'Failed to generate thumbnail';
      setStatus(prev => ({
        ...prev,
        isGenerating: false,
        currentStage: 'error',
        error: errorMessage,
      }));
      
      onError?.(errorMessage);
    } finally {
      // Cleanup
      processingRef.current.delete(sourceId);
      abortControllerRef.current = null;
    }
  }, [onThumbnailGenerated, onError, onProgress, status.completed]);

  // Effect to trigger thumbnail generation when video source changes
  useEffect(() => {
    // Validate inputs
    if (!videoId) {
      console.log('⚠️ No videoId provided');
      return;
    }

    if (!videoFile && !videoUrl) {
      console.log('⚠️ No video source provided');
      return;
    }

    // Check if the video source has actually changed
    if (videoSourceId.current === currentVideoSourceId) {
      console.log('⚠️ Video source unchanged, skipping generation');
      return;
    }

    // Update the video source ID
    videoSourceId.current = currentVideoSourceId;

    const videoSource = videoFile || videoUrl;
    if (!videoSource) return;

    console.log(`🎯 Video source changed, triggering generation: ${currentVideoSourceId}`);
    generateThumbnail(currentVideoSourceId, videoSource, videoId);

  }, [videoId, currentVideoSourceId, generateThumbnail]); // Stable dependencies

  // Cleanup effect
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        console.log(`🛑 Aborting thumbnail generation for ${videoId}`);
        abortControllerRef.current.abort();
      }
    };
  }, [videoId]);

  // Debug logging (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 EnhancedThumbnailGenerator render:', {
        videoId,
        hasVideoFile: !!videoFile,
        hasVideoUrl: !!videoUrl,
        currentStage: status.currentStage,
        isGenerating: status.isGenerating,
        completedCount: status.completed.size,
        currentVideoSourceId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // This component doesn't render any UI, it's just a service component
  return null;
}