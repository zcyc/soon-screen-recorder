/**
 * Video utilities for thumbnail generation and optimization
 * Enhanced with Safari compatibility and browser-specific handling
 */

import { detectBrowser } from './browser-compatibility';
import { generateSafariCompatibleThumbnail, generateSafariCompatibleThumbnailBlob } from './safari-video-utils';
import { createSafariSafeVideoElement } from './safari-url-manager';

export interface ThumbnailOptions {
  time?: number; // Time in seconds to capture thumbnail
  width?: number;
  height?: number;
  quality?: number; // 0-1 for JPEG quality
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Generate thumbnail from video file
 */
export const generateVideoThumbnail = (
  videoFile: File | string,
  options: ThumbnailOptions = {}
): Promise<string> => {
  const browser = detectBrowser();
  
  // Use Safari-compatible function for Safari browsers
  if (browser.isSafari) {
    console.log('🍎 Using Safari-compatible thumbnail generation');
    return generateSafariCompatibleThumbnail(videoFile, options);
  }
  
  // Original implementation for other browsers
  return new Promise((resolve, reject) => {
    const {
      time = 1, // Default to 1 second
      width = 320,
      height = 180,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    let video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    // Enhanced timeout handling
    const timeout = setTimeout(() => {
      reject(new Error('Video loading timeout'));
    }, 10000);

    let cleanup = () => {
      clearTimeout(timeout);
      try {
        if (video.src && video.src.startsWith('blob:')) {
          URL.revokeObjectURL(video.src);
        }
        video.remove();
        canvas.remove();
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
    };

    video.onloadedmetadata = () => {
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Seek to specified time
      video.currentTime = Math.min(time, video.duration - 0.1);
    };

    video.onseeked = () => {
      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);

        // Convert to data URL
        const mimeType = `image/${format}`;
        const dataURL = canvas.toDataURL(mimeType, quality);

        cleanup();
        resolve(dataURL);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = (event) => {
      cleanup();
      reject(new Error(`Failed to load video: ${event}`));
    };

    // Load video with Safari-safe handling
    try {
      const { video: safariVideo, cleanup: safariCleanup } = createSafariSafeVideoElement(videoFile);
      
      // Copy event handlers to Safari-safe video element
      safariVideo.onloadedmetadata = video.onloadedmetadata;
      safariVideo.onseeked = video.onseeked;
      safariVideo.onerror = video.onerror;
      
      // Replace original video element
      video.remove();
      
      // Update cleanup to include Safari cleanup
      const originalCleanup = cleanup;
      cleanup = () => {
        originalCleanup();
        safariCleanup();
      };
      
      // Use the Safari-safe video element
      video = safariVideo as any;
    } catch (error) {
      cleanup();
      reject(new Error(`Failed to create video source: ${error}`));
    }
  });
};

/**
 * Generate thumbnail blob from video file
 */
export const generateVideoThumbnailBlob = (
  videoFile: File | string,
  options: ThumbnailOptions = {}
): Promise<Blob> => {
  const browser = detectBrowser();
  
  // Use Safari-compatible function for Safari browsers
  if (browser.isSafari) {
    console.log('🍎 Using Safari-compatible blob generation');
    return generateSafariCompatibleThumbnailBlob(videoFile, options);
  }
  
  // Original implementation for other browsers with enhanced error handling
  return new Promise((resolve, reject) => {
    const {
      time = 1,
      width = 320,
      height = 180,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    let video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    // Enhanced timeout handling
    const timeout = setTimeout(() => {
      reject(new Error('Video processing timeout'));
    }, 10000);

    let cleanup = () => {
      clearTimeout(timeout);
      try {
        if (video.src && video.src.startsWith('blob:')) {
          URL.revokeObjectURL(video.src);
        }
        video.remove();
        canvas.remove();
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
    };

    video.onloadedmetadata = () => {
      canvas.width = width;
      canvas.height = height;
      video.currentTime = Math.min(time, video.duration - 0.1);
    };

    video.onseeked = () => {
      try {
        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              cleanup();
              resolve(blob);
            } else {
              cleanup();
              reject(new Error('Failed to generate thumbnail blob'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = (event) => {
      cleanup();
      reject(new Error(`Failed to load video: ${event}`));
    };

    try {
      const { video: safariVideo, cleanup: safariCleanup } = createSafariSafeVideoElement(videoFile);
      
      // Copy event handlers to Safari-safe video element
      safariVideo.onloadedmetadata = video.onloadedmetadata;
      safariVideo.onseeked = video.onseeked;
      safariVideo.onerror = video.onerror;
      
      // Replace original video element
      video.remove();
      
      // Update cleanup to include Safari cleanup
      const originalCleanup = cleanup;
      cleanup = () => {
        originalCleanup();
        safariCleanup();
      };
      
      // Use the Safari-safe video element
      video = safariVideo as any;
    } catch (error) {
      cleanup();
      reject(new Error(`Failed to create video source: ${error}`));
    }
  });
};

/**
 * Get video metadata without loading full video
 */
export const getVideoMetadata = (
  videoFile: File | string
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    let video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      };
      
      video.remove();
      resolve(metadata);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    const { video: safariVideo, cleanup: safariCleanup } = createSafariSafeVideoElement(videoFile);
    
    // Copy event handlers
    safariVideo.onloadedmetadata = video.onloadedmetadata;
    safariVideo.onerror = video.onerror;
    
    // Replace video element
    video.remove();
    video = safariVideo as any;
    
    // Store cleanup function for later use
    (video as any)._safariCleanup = safariCleanup;
  });
};

/**
 * Generate placeholder thumbnail URL using the existing placeholder service
 */
export const generatePlaceholderThumbnail = (
  width: number = 320,
  height: number = 180,
  text: string = 'Video'
): string => {
  // Use the existing placeholder API endpoint
  const encodedText = encodeURIComponent(text.replace(/\s+/g, '+'));
  return `/api/placeholder/${width}/${height}?text=${encodedText}&bg=1a1a1a&color=ffffff`;
};

/**
 * Create optimized video thumbnail with fallback to placeholder
 */
export const createOptimizedThumbnail = async (
  videoUrl: string,
  options: ThumbnailOptions & { fallbackText?: string } = {}
): Promise<string> => {
  const { fallbackText = 'Video', width = 320, height = 180 } = options;
  
  try {
    // Try to generate real thumbnail
    return await generateVideoThumbnail(videoUrl, options);
  } catch (error) {
    console.warn('Failed to generate video thumbnail, using placeholder:', error);
    // Fallback to placeholder
    return generatePlaceholderThumbnail(width, height, fallbackText);
  }
};