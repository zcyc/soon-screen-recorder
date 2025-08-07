'use client';

import { useEffect, useState, useRef } from 'react';
import { generateVideoThumbnailBlob } from '@/lib/video-utils';
import { uploadFileAction } from '@/app/actions/video-actions';
import { updateVideoThumbnailAction } from '@/app/actions/video-actions';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [processedVideoId, setProcessedVideoId] = useState<string | null>(null);
  
  // 使用 ref 来跟踪当前正在处理的视频ID，防止竞态条件
  const currentlyProcessingRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    console.log('🔄 ClientThumbnailGenerator useEffect triggered:', { 
      videoId, 
      hasVideoFile: !!videoFile, 
      videoUrl, 
      generated, 
      isGenerating,
      timestamp: new Date().toISOString()
    });
    
    // 检查是否已经处理过这个videoId
    const alreadyProcessed = processedVideoId === videoId;
    const currentlyProcessing = currentlyProcessingRef.current === videoId;
    
    if (!videoId || (!videoFile && !videoUrl) || alreadyProcessed || currentlyProcessing) {
      console.log('⏭️ ClientThumbnailGenerator skipping generation:', { 
        videoId: !!videoId, 
        hasVideoFile: !!videoFile, 
        videoUrl: !!videoUrl, 
        alreadyProcessed, 
        currentlyProcessing,
        isGenerating,
        processedVideoId,
        currentlyProcessingRef: currentlyProcessingRef.current,
        reason: !videoId ? 'no-video-id' : 
                (!videoFile && !videoUrl) ? 'no-video-source' :
                alreadyProcessed ? 'already-processed' : 
                currentlyProcessing ? 'currently-processing' : 'unknown'
      });
      return;
    }

    const generateThumbnail = async () => {
      // 标记开始处理这个videoId
      currentlyProcessingRef.current = videoId;
      setIsGenerating(true);
      
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();

      try {
        console.log(`🚀 Starting thumbnail generation for video ${videoId}...`);

        let videoSource: string | File;
        
        // 优先使用原始文件，如果没有则使用 URL
        if (videoFile) {
          videoSource = videoFile;
          console.log('Using original video file for thumbnail generation');
        } else if (videoUrl) {
          videoSource = videoUrl;
          console.log('Using video URL for thumbnail generation');
        } else {
          throw new Error('No video source available');
        }

        // 1. 在客户端生成缩略图 blob
        const thumbnailBlob = await generateVideoThumbnailBlob(videoSource, {
          width: 320,
          height: 180,
          time: 1,
          quality: 0.8,
          format: 'jpeg'
        });

        console.log('Thumbnail blob generated, size:', thumbnailBlob.size);

        // 2. 将 Blob 转换为 File
        const thumbnailFile = new File([thumbnailBlob], `thumbnail-${videoId}.jpg`, {
          type: 'image/jpeg'
        });

        // 3. 上传缩略图文件
        console.log('Uploading thumbnail file...');
        const uploadResult = await uploadFileAction(thumbnailFile);
        
        if (!uploadResult.success || !uploadResult.data) {
          throw new Error(uploadResult.error || 'Failed to upload thumbnail');
        }

        console.log('Thumbnail uploaded, updating video record...');

        // 4. 更新视频记录的缩略图 URL
        const updateResult = await updateVideoThumbnailAction(
          videoId,
          uploadResult.data.url
        );

        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update video thumbnail');
        }

        console.log(`✅ Thumbnail generated successfully: ${uploadResult.data.url}`);
        setGenerated(true);
        setProcessedVideoId(videoId); // 标记这个videoId已处理
        onThumbnailGenerated?.(uploadResult.data.url);

      } catch (error: any) {
        console.error(`❌ Failed to generate thumbnail for video ${videoId}:`, error);
        onError?.(error.message || 'Failed to generate thumbnail');
      } finally {
        // 清理状态
        currentlyProcessingRef.current = null;
        abortControllerRef.current = null;
        setIsGenerating(false);
      }
    };

    generateThumbnail();
    
    // 清理函数：组件卸载时取消正在进行的操作
    return () => {
      if (abortControllerRef.current) {
        console.log(`💯 Aborting thumbnail generation for video ${videoId}`);
        abortControllerRef.current.abort();
      }
    };
  }, [videoId, videoFile, videoUrl, processedVideoId, isGenerating]);

  // 此组件不渲染任何 UI，只是在后台生成缩略图
  return null;
}