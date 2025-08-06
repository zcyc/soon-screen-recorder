/**
 * Video utilities for thumbnail generation and optimization
 */

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
  return new Promise((resolve, reject) => {
    const {
      time = 1, // Default to 1 second
      width = 320,
      height = 180,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

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

        // Clean up
        video.remove();
        canvas.remove();

        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    // Load video
    if (typeof videoFile === 'string') {
      video.src = videoFile;
    } else {
      video.src = URL.createObjectURL(videoFile);
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
  return new Promise((resolve, reject) => {
    const {
      time = 1,
      width = 320,
      height = 180,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

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
              video.remove();
              canvas.remove();
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail blob'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    if (typeof videoFile === 'string') {
      video.src = videoFile;
    } else {
      video.src = URL.createObjectURL(videoFile);
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
    const video = document.createElement('video');
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

    if (typeof videoFile === 'string') {
      video.src = videoFile;
    } else {
      video.src = URL.createObjectURL(videoFile);
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