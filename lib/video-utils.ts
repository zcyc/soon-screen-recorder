import { detectBrowser, type BrowserInfo } from './browser-compatibility';
import { 
  generateSafariCompatibleThumbnail,
  generateSafariCompatibleThumbnailBlob,
  type SafariThumbnailOptions
} from './safari-video-utils';
import { createSafariSafeVideoElement } from './safari-url-manager';

/**
 * Video thumbnail generation options
 */
export interface ThumbnailOptions {
  time?: number;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  timeout?: number;
}

/**
 * Generate video thumbnail data URL from file or URL
 */
export const generateVideoThumbnail = (
  videoSource: File | string,
  options: ThumbnailOptions = {}
): Promise<string> => {
  const browser = detectBrowser();
  
  // Use Safari-compatible function for Safari browsers
  if (browser.isSafari) {
    console.log('🍎 Using Safari-compatible thumbnail generation');
    return generateSafariCompatibleThumbnail(videoSource, options as SafariThumbnailOptions);
  }
  
  // Original implementation for other browsers with enhanced error handling
  return new Promise((resolve, reject) => {
    const {
      time = 1,
      width = 320,
      height = 180,
      quality = 0.8,
      format = 'jpeg',
      timeout = 10000
    } = options;

    let videoElement = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    videoElement.crossOrigin = 'anonymous';
    videoElement.preload = 'metadata';

    // Enhanced timeout handling
    const timeoutId = setTimeout(() => {
      reject(new Error('Video processing timeout'));
    }, timeout);

    // Cleanup function
    let cleanupFunctions: Array<() => void> = [];
    
    const cleanup = () => {
      clearTimeout(timeoutId);
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (cleanupError) {
          console.warn('Cleanup error:', cleanupError);
        }
      });
      
      try {
        if (videoElement?.src && videoElement.src.startsWith('blob:')) {
          URL.revokeObjectURL(videoElement.src);
        }
        videoElement?.remove();
        canvas.remove();
      } catch (cleanupError) {
        console.warn('Final cleanup error:', cleanupError);
      }
    };

    const onLoadedMetadata = () => {
      canvas.width = width;
      canvas.height = height;
      if (videoElement) {
        videoElement.currentTime = Math.min(time, videoElement.duration - 0.1);
      }
    };

    const onSeeked = () => {
      try {
        if (videoElement && ctx) {
          ctx.drawImage(videoElement, 0, 0, width, height);

          const dataURL = canvas.toDataURL(`image/${format}`, quality);
          cleanup();
          resolve(dataURL);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const onError = (event: any) => {
      cleanup();
      reject(new Error(`Failed to load video: ${event}`));
    };

    // Set up event handlers
    videoElement.onloadedmetadata = onLoadedMetadata;
    videoElement.onseeked = onSeeked;
    videoElement.onerror = onError;

    // Handle Safari-specific video loading
    try {
      if (browser.isSafari || typeof videoSource === 'object') {
        const { video: safariVideo, cleanup: safariCleanup } = createSafariSafeVideoElement(videoSource);
        
        // Add Safari cleanup to cleanup functions
        cleanupFunctions.push(safariCleanup);
        
        // Copy event handlers to Safari-safe video element
        safariVideo.onloadedmetadata = onLoadedMetadata;
        safariVideo.onseeked = onSeeked;
        safariVideo.onerror = onError;
        
        // Remove original video element and use Safari-safe one
        videoElement.remove();
        videoElement = safariVideo as HTMLVideoElement;
      } else {
        // Standard loading for non-Safari browsers with string URLs
        videoElement.src = videoSource as string;
      }
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

    let videoElement = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    videoElement.crossOrigin = 'anonymous';
    videoElement.preload = 'metadata';

    // Enhanced timeout handling
    const timeout = setTimeout(() => {
      reject(new Error('Video processing timeout'));
    }, 10000);

    // Cleanup function
    let cleanupFunctions: Array<() => void> = [];
    
    const cleanup = () => {
      clearTimeout(timeout);
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (cleanupError) {
          console.warn('Cleanup error:', cleanupError);
        }
      });
      
      try {
        if (videoElement?.src && videoElement.src.startsWith('blob:')) {
          URL.revokeObjectURL(videoElement.src);
        }
        videoElement?.remove();
        canvas.remove();
      } catch (cleanupError) {
        console.warn('Final cleanup error:', cleanupError);
      }
    };

    const onLoadedMetadata = () => {
      canvas.width = width;
      canvas.height = height;
      if (videoElement) {
        videoElement.currentTime = Math.min(time, videoElement.duration - 0.1);
      }
    };

    const onSeeked = () => {
      try {
        if (videoElement && ctx) {
          ctx.drawImage(videoElement, 0, 0, width, height);

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
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const onError = (event: any) => {
      cleanup();
      reject(new Error(`Failed to load video: ${event}`));
    };

    // Set up event handlers
    videoElement.onloadedmetadata = onLoadedMetadata;
    videoElement.onseeked = onSeeked;
    videoElement.onerror = onError;

    try {
      const { video: safariVideo, cleanup: safariCleanup } = createSafariSafeVideoElement(videoFile);
      
      // Add Safari cleanup to cleanup functions
      cleanupFunctions.push(safariCleanup);
      
      // Copy event handlers to Safari-safe video element
      safariVideo.onloadedmetadata = onLoadedMetadata;
      safariVideo.onseeked = onSeeked;
      safariVideo.onerror = onError;
      
      // Remove original video element and use Safari-safe one
      videoElement.remove();
      videoElement = safariVideo as HTMLVideoElement;
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
    let videoElement = document.createElement('video');
    videoElement.preload = 'metadata';

    let cleanupFunctions: Array<() => void> = [];
    
    const cleanup = () => {
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.warn('Metadata cleanup error:', error);
        }
      });
      
      try {
        if (videoElement?.src && videoElement.src.startsWith('blob:')) {
          URL.revokeObjectURL(videoElement.src);
        }
        videoElement?.remove();
      } catch (error) {
        console.warn('Final metadata cleanup error:', error);
      }
    };

    const onLoadedMetadata = () => {
      if (videoElement) {
        const metadata = {
          duration: videoElement.duration,
          width: videoElement.videoWidth,
          height: videoElement.videoHeight
        };
        
        cleanup();
        resolve(metadata);
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to load video metadata'));
    };

    videoElement.onloadedmetadata = onLoadedMetadata;
    videoElement.onerror = onError;

    try {
      const { video: safariVideo, cleanup: safariCleanup } = createSafariSafeVideoElement(videoFile);
      
      // Add Safari cleanup to cleanup functions
      cleanupFunctions.push(safariCleanup);
      
      // Copy event handlers
      safariVideo.onloadedmetadata = onLoadedMetadata;
      safariVideo.onerror = onError;
      
      // Remove original video element and use Safari-safe one
      videoElement.remove();
      videoElement = safariVideo as HTMLVideoElement;
    } catch (error) {
      cleanup();
      reject(new Error(`Failed to create video source: ${error}`));
    }
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