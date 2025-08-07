/**
 * Enhanced Safari-compatible video utilities with better duration handling
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
  metadataTimeout?: number;
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
 * Wait for video metadata to be fully loaded with enhanced Safari support
 */
const waitForVideoMetadata = (video: HTMLVideoElement, timeout: number = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkMetadata = () => {
      // Check if basic metadata is available
      if (video.readyState >= video.HAVE_METADATA) {
        console.log(`📱 Video ready state: ${video.readyState}, duration: ${video.duration}, width: ${video.videoWidth}, height: ${video.videoHeight}`);
        
        // For Safari, sometimes duration might still be loading
        if (video.duration > 0 && !isNaN(video.duration) && video.videoWidth > 0 && video.videoHeight > 0) {
          console.log('✅ Video metadata fully loaded');
          resolve();
          return;
        }
        
        // If basic dimensions are available but duration is still loading, wait a bit more
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          console.log('📱 Video dimensions available, waiting for duration...');
          if (Date.now() - startTime < timeout) {
            setTimeout(checkMetadata, 100);
            return;
          } else {
            // Accept what we have if timeout reached
            console.log('⚠️ Metadata timeout reached, using available data');
            resolve();
            return;
          }
        }
      }
      
      // Continue checking if we haven't timed out
      if (Date.now() - startTime < timeout) {
        setTimeout(checkMetadata, 100);
      } else {
        reject(new Error(`Video metadata loading timeout after ${timeout}ms`));
      }
    };
    
    // Start checking immediately
    checkMetadata();
  });
};

/**
 * Enhanced Safari-compatible video thumbnail generation with better duration handling
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
      timeout = 20000,
      retryAttempts = 2,
      fallbackText = 'Video',
      metadataTimeout = 10000
    } = options;

    const browser = detectBrowser();
    let attempts = 0;

    const attemptGeneration = async (): Promise<string> => {
      attempts++;
      console.log(`📱 Enhanced Safari thumbnail generation attempt ${attempts}/${retryAttempts + 1}`);

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
          attemptReject(new Error(`Timeout: Video processing took longer than ${timeout}ms`));
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
          console.error(`🚫 Enhanced Safari video error (attempt ${attempts}):`, error);
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

        // Enhanced metadata loading process
        const processVideoMetadata = async () => {
          try {
            console.log('📱 Waiting for video metadata...');
            await waitForVideoMetadata(video, metadataTimeout);
            
            const actualDuration = video.duration;
            const actualWidth = video.videoWidth;
            const actualHeight = video.videoHeight;
            
            console.log(`📱 Video metadata loaded - Duration: ${actualDuration}s, Size: ${actualWidth}x${actualHeight}`);
            
            // Enhanced validation with more flexible duration handling
            if (actualWidth === 0 || actualHeight === 0) {
              throw new Error('Invalid video: width or height is 0');
            }
            
            let seekTime = time;
            
            // Handle duration issues more gracefully
            if (actualDuration > 0 && !isNaN(actualDuration)) {
              seekTime = Math.min(time, Math.max(0, actualDuration - 0.5));
              console.log(`📱 Seeking to ${seekTime}s (duration: ${actualDuration}s)`);
            } else {
              // If duration is not available, try seeking to a small time anyway
              seekTime = Math.min(1, time);
              console.warn(`⚠️ Duration unavailable (${actualDuration}), attempting seek to ${seekTime}s`);
            }
            
            // Set up seeked handler before seeking
            video.onseeked = () => {
              try {
                console.log('📱 Enhanced Safari video seeked, capturing frame...');
                
                ctx.drawImage(video, 0, 0, width, height);
                const mimeType = `image/${format}`;
                const dataURL = canvas.toDataURL(mimeType, quality);

                if (!dataURL || dataURL === 'data:,') {
                  throw new Error('Generated thumbnail is empty or invalid');
                }

                console.log('✅ Enhanced Safari thumbnail generated successfully');
                cleanup();
                attemptResolve(dataURL);
              } catch (captureError) {
                handleError(`Frame capture error: ${captureError}`);
              }
            };
            
            // Attempt to seek
            video.currentTime = seekTime;
            
          } catch (metadataError) {
            console.error('📱 Metadata loading failed:', metadataError);
            handleError(`Metadata loading failed: ${metadataError}`);
          }
        };

        // Set up the loadedmetadata handler
        video.onloadedmetadata = () => {
          console.log('📱 Initial metadata event fired');
          processVideoMetadata();
        };

        // Also try on loadeddata as a fallback
        video.onloadeddata = () => {
          console.log('📱 LoadedData event fired as backup');
          if (!video.onloadedmetadata) {
            processVideoMetadata();
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
              console.log('📱 Created object URL for enhanced Safari video loading');
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
      console.error('❌ All enhanced Safari thumbnail generation attempts failed:', finalError);
      
      try {
        const fallbackThumbnail = generatePlaceholderThumbnail(width, height, fallbackText);
        console.log('🔄 Using fallback placeholder thumbnail');
        resolve(fallbackThumbnail);
      } catch (fallbackError) {
        reject(new Error(`Thumbnail generation failed and fallback failed: ${finalError.message}`));
      }
    }
  });
};

/**
 * Enhanced Safari-compatible blob thumbnail generation
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
      timeout = 20000,
      retryAttempts = 2,
      metadataTimeout = 10000
    } = options;

    const browser = detectBrowser();
    let attempts = 0;

    const attemptGeneration = async (): Promise<Blob> => {
      attempts++;
      console.log(`📱 Enhanced Safari blob generation attempt ${attempts}/${retryAttempts + 1}`);

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

        const handleError = (error: string | Event) => {
          console.error(`🚫 Enhanced Safari blob error (attempt ${attempts}):`, error);
          cleanup();
          
          if (browser.isSafari && attempts <= retryAttempts) {
            setTimeout(() => {
              attemptGeneration()
                .then(attemptResolve)
                .catch(attemptReject);
            }, 1000 * attempts);
          } else {
            attemptReject(new Error(typeof error === 'string' ? error : 'Failed to process video for thumbnail'));
          }
        };

        // Enhanced error handlers
        video.onerror = (event) => handleError(`Video loading error: ${event}`);
        video.onabort = () => handleError('Video loading aborted');

        // Enhanced metadata processing for blob generation
        const processVideoMetadata = async () => {
          try {
            console.log('📱 Waiting for video metadata for blob generation...');
            await waitForVideoMetadata(video, metadataTimeout);
            
            const actualDuration = video.duration;
            const actualWidth = video.videoWidth;
            const actualHeight = video.videoHeight;
            
            console.log(`📱 Blob generation metadata - Duration: ${actualDuration}s, Size: ${actualWidth}x${actualHeight}`);
            
            if (actualWidth === 0 || actualHeight === 0) {
              throw new Error('Invalid video: width or height is 0');
            }
            
            let seekTime = time;
            
            if (actualDuration > 0 && !isNaN(actualDuration)) {
              seekTime = Math.min(time, Math.max(0, actualDuration - 0.5));
            } else {
              seekTime = Math.min(1, time);
              console.warn(`⚠️ Duration unavailable for blob generation, attempting seek to ${seekTime}s`);
            }
            
            video.onseeked = () => {
              try {
                console.log('📱 Enhanced Safari blob video seeked, capturing frame...');
                
                ctx.drawImage(video, 0, 0, width, height);

                canvas.toBlob(
                  (blob) => {
                    if (blob) {
                      console.log('✅ Enhanced Safari blob generated successfully');
                      cleanup();
                      attemptResolve(blob);
                    } else {
                      handleError('Failed to generate thumbnail blob');
                    }
                  },
                  `image/${format}`,
                  quality
                );
              } catch (captureError) {
                handleError(`Blob capture error: ${captureError}`);
              }
            };
            
            video.currentTime = seekTime;
            
          } catch (metadataError) {
            console.error('📱 Blob metadata loading failed:', metadataError);
            handleError(`Blob metadata loading failed: ${metadataError}`);
          }
        };

        video.onloadedmetadata = () => {
          console.log('📱 Initial metadata event fired for blob generation');
          processVideoMetadata();
        };

        video.onloadeddata = () => {
          console.log('📱 LoadedData event fired as backup for blob generation');
          if (!video.onloadedmetadata) {
            processVideoMetadata();
          }
        };

        // Load video source
        try {
          if (typeof videoSource === 'string') {
            video.src = videoSource;
          } else {
            if (!URL || typeof URL.createObjectURL !== 'function') {
              throw new Error('URL.createObjectURL not supported');
            }

            try {
              videoObjectURL = URL.createObjectURL(videoSource);
              video.src = videoObjectURL;
              console.log('📱 Created object URL for enhanced Safari blob generation');
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
      console.error('❌ All enhanced Safari blob generation attempts failed:', finalError);
      reject(finalError);
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