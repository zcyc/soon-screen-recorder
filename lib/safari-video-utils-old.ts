/**
 * Safari-compatible video utilities with enhanced error handling and fallback mechanisms
 */

import { detectBrowser, createSafariCompatibleVideo, isVideoFormatSupported } from './browser-compatibility';

export interface SafariThumbnailOptions {
  time?: number;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  timeout?: number;
  retryAttempts?: number;
  fallbackText?: string;
}

/**
 * Generate placeholder thumbnail URL using the existing placeholder service
 */
export const generatePlaceholderThumbnail = (
  width: number = 320,
  height: number = 180,
  text: string = 'Video'
): string => {
  const encodedText = encodeURIComponent(text.replace(/\s+/g, '+'));
  return `/api/placeholder/${width}/${height}?text=${encodedText}&bg=1a1a1a&color=ffffff`;
};

/**
 * Safari-compatible video thumbnail generation with comprehensive error handling
 */
export const generateSafariCompatibleThumbnail = (
  videoSource: File | string,
  options: SafariThumbnailOptions = {}
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const {
      time = 1,
      width = 320,
      height = 180,
      quality = 0.8,
      format = 'jpeg',
      timeout = 15000,
      retryAttempts = 2,
      fallbackText = 'Video'
    } = options;

    const browser = detectBrowser();
    let attempts = 0;

    const attemptGeneration = async (): Promise<string> => {
      attempts++;
      console.log(`📱 Safari thumbnail generation attempt ${attempts}/${retryAttempts + 1}`);

      return new Promise<string>((attemptResolve, attemptReject) => {
        const video = createSafariCompatibleVideo();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          attemptReject(new Error('Canvas 2D context not available'));
          return;
        }

        let timeoutId: NodeJS.Timeout;
        let videoObjectURL: string | null = null;

        // Set up timeout
        timeoutId = setTimeout(() => {
          attemptReject(new Error(`Timeout: Video loading took longer than ${timeout}ms`));
        }, timeout);

        // Cleanup function
        const cleanup = () => {
          clearTimeout(timeoutId);
          try {
            if (videoObjectURL) {
              URL.revokeObjectURL(videoObjectURL);
            }
            video.remove();
            canvas.remove();
          } catch (cleanupError) {
            console.warn('Cleanup error:', cleanupError);
          }
        };

        // Safari-specific error handling
        const handleError = (error: string | Event) => {
          console.error(`🚫 Safari video error (attempt ${attempts}):`, error);
          cleanup();
          
          if (browser.isSafari && attempts <= retryAttempts) {
            setTimeout(() => {
              attemptGeneration()
                .then(attemptResolve)
                .catch(attemptReject);
            }, 1000 * attempts);
          } else {
            attemptReject(new Error(typeof error === 'string' ? error : 'Failed to load video for thumbnail generation'));
          }
        };

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Enhanced error handlers
        video.onerror = (event) => handleError(`Video loading error: ${event}`);
        video.onabort = () => handleError('Video loading aborted');
        video.onstalled = () => console.warn('📱 Safari video loading stalled, waiting...');

        // Metadata loaded handler
        video.onloadedmetadata = () => {
          console.log('📱 Safari video metadata loaded successfully');
          
          if (video.duration === 0 || isNaN(video.duration)) {
            handleError('Invalid video: duration is 0 or NaN');
            return;
          }

          if (video.videoWidth === 0 || video.videoHeight === 0) {
            handleError('Invalid video: width or height is 0');
            return;
          }

          const seekTime = Math.min(time, Math.max(0, video.duration - 0.5));
          console.log(`📱 Seeking to ${seekTime}s (duration: ${video.duration}s)`);
          video.currentTime = seekTime;
        };

        // Seeked handler
        video.onseeked = () => {
          try {
            console.log('📱 Safari video seeked, capturing frame...');
            
            ctx.drawImage(video, 0, 0, width, height);
            const mimeType = `image/${format}`;
            const dataURL = canvas.toDataURL(mimeType, quality);

            if (!dataURL || dataURL === 'data:,') {
              throw new Error('Generated thumbnail is empty or invalid');
            }

            console.log('✅ Safari thumbnail generated successfully');
            cleanup();
            attemptResolve(dataURL);
          } catch (captureError) {
            handleError(`Frame capture error: ${captureError}`);
          }
        };

        // Load video source with Safari-safe handling
        try {
          if (typeof videoSource === 'string') {
            const extension = videoSource.split('.').pop()?.toLowerCase();
            const mimeType = `video/${extension === 'mov' ? 'quicktime' : extension}`;
            
            if (!isVideoFormatSupported(mimeType)) {
              throw new Error(`Video format ${extension} not supported in ${browser.name}`);
            }
            
            video.src = videoSource;
          } else {
            if (!URL || typeof URL.createObjectURL !== 'function') {
              throw new Error('URL.createObjectURL not supported');
            }

            try {
              videoObjectURL = URL.createObjectURL(videoSource);
              video.src = videoObjectURL;
              console.log('📱 Created object URL for Safari video loading');
            } catch (objectURLError) {
              throw new Error(`Failed to create object URL: ${objectURLError}`);
            }
          }

          video.load();
        } catch (sourceError) {
          handleError(`Video source error: ${sourceError}`);
        }
      });
    };

    try {
      const result = await attemptGeneration();
      resolve(result);
    } catch (finalError) {
      console.error('❌ All Safari thumbnail generation attempts failed:', finalError);
      
      try {
        const fallbackThumbnail = generatePlaceholderThumbnail(width, height, fallbackText);
        console.log('🔄 Using fallback placeholder thumbnail');
        resolve(fallbackThumbnail);
      } catch (fallbackError) {
        reject(new Error(`Thumbnail generation failed and fallback failed: ${finalError instanceof Error ? finalError.message : String(finalError)}`));
      }
    }
  });
};

/**
 * Safari-compatible blob thumbnail generation
 */
export const generateSafariCompatibleThumbnailBlob = (
  videoSource: File | string,
  options: SafariThumbnailOptions = {}
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    const {
      time = 1,
      width = 320,
      height = 180,
      quality = 0.8,
      format = 'jpeg',
      timeout = 15000,
      retryAttempts = 2
    } = options;

    const browser = detectBrowser();
    let attempts = 0;

    const attemptGeneration = async (): Promise<Blob> => {
      attempts++;
      console.log(`📱 Safari blob generation attempt ${attempts}/${retryAttempts + 1}`);

      return new Promise<Blob>((attemptResolve, attemptReject) => {
        const video = createSafariCompatibleVideo();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          attemptReject(new Error('Canvas 2D context not available'));
          return;
        }

        let timeoutId: NodeJS.Timeout;
        let videoObjectURL: string | null = null;

        timeoutId = setTimeout(() => {
          attemptReject(new Error(`Timeout: Video processing took longer than ${timeout}ms`));
        }, timeout);

        const cleanup = () => {
          clearTimeout(timeoutId);
          try {
            if (videoObjectURL) {
              URL.revokeObjectURL(videoObjectURL);
            }
            video.remove();
            canvas.remove();
          } catch (cleanupError) {
            console.warn('Cleanup error:', cleanupError);
          }
        };

        canvas.width = width;
        canvas.height = height;

        video.onloadedmetadata = () => {
          if (video.duration === 0 || isNaN(video.duration)) {
            attemptReject(new Error('Invalid video: duration is 0 or NaN'));
            return;
          }
          
          const seekTime = Math.min(time, Math.max(0, video.duration - 0.5));
          video.currentTime = seekTime;
        };

        video.onseeked = () => {
          try {
            ctx.drawImage(video, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  console.log('✅ Safari thumbnail blob generated successfully');
                  cleanup();
                  attemptResolve(blob);
                } else {
                  cleanup();
                  attemptReject(new Error('Failed to generate thumbnail blob'));
                }
              },
              `image/${format}`,
              quality
            );
          } catch (captureError) {
            cleanup();
            attemptReject(captureError);
          }
        };

        video.onerror = (event) => {
          cleanup();
          if (browser.isSafari && attempts <= retryAttempts) {
            setTimeout(() => {
              attemptGeneration()
                .then(attemptResolve)
                .catch(attemptReject);
            }, 1000 * attempts);
          } else {
            attemptReject(new Error(`Video loading error: ${event}`));
          }
        };

        try {
          if (typeof videoSource === 'string') {
            video.src = videoSource;
          } else {
            if (!URL || typeof URL.createObjectURL !== 'function') {
              throw new Error('URL.createObjectURL not supported');
            }
            videoObjectURL = URL.createObjectURL(videoSource);
            video.src = videoObjectURL;
          }
          video.load();
        } catch (sourceError) {
          cleanup();
          attemptReject(sourceError);
        }
      });
    };

    try {
      const result = await attemptGeneration();
      resolve(result);
    } catch (error) {
      console.error('❌ Safari blob generation failed:', error);
      reject(error);
    }
  });
};

/**
 * Check if video can be processed in current browser
 */
export function canProcessVideo(videoSource: File | string): { canProcess: boolean; reason?: string } {
  const browser = detectBrowser();

  if (!browser.supportsCreateObjectURL && typeof videoSource !== 'string') {
    return { canProcess: false, reason: 'Browser does not support URL.createObjectURL for File objects' };
  }

  if (!browser.supportsCanvasVideoCapture) {
    return { canProcess: false, reason: 'Browser does not support canvas video capture' };
  }

  if (typeof videoSource !== 'string') {
    const fileType = videoSource.type;
    if (fileType.includes('webm') && !browser.supportsWebM) {
      return { canProcess: false, reason: `WebM format not supported in ${browser.name}` };
    }
  }

  return { canProcess: true };
}

/**
 * Get video format recommendations for current browser
 */
export function getVideoFormatRecommendations(): {
  preferred: string[];
  supported: string[];
  avoid: string[];
} {
  const browser = detectBrowser();

  if (browser.isSafari) {
    return {
      preferred: ['video/mp4', 'video/quicktime'],
      supported: ['video/mp4', 'video/quicktime', 'video/webm'],
      avoid: ['video/webm;codecs=vp9']
    };
  } else if (browser.isFirefox) {
    return {
      preferred: ['video/webm', 'video/mp4'],
      supported: ['video/webm', 'video/mp4', 'video/ogg'],
      avoid: ['video/quicktime']
    };
  } else {
    return {
      preferred: ['video/webm', 'video/mp4'],
      supported: ['video/webm', 'video/mp4', 'video/quicktime', 'video/avi'],
      avoid: []
    };
  }
}