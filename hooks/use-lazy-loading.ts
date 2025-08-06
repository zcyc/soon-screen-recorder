/**
 * Lazy loading hook using Intersection Observer API
 */

import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useLazyLoading = (options: UseLazyLoadingOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Skip if already triggered and triggerOnce is true
    if (triggerOnce && hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && triggerOnce) {
          setHasTriggered(true);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    elementRef,
    isIntersecting,
    hasTriggered,
    shouldLoad: triggerOnce ? hasTriggered : isIntersecting
  };
};

/**
 * Lazy loading hook specifically for video elements
 */
export const useVideoLazyLoading = (options: UseLazyLoadingOptions = {}) => {
  const { elementRef, shouldLoad, isIntersecting } = useLazyLoading({
    threshold: 0.1,
    rootMargin: '100px', // Load videos slightly before they come into view
    triggerOnce: true,
    ...options
  });

  return {
    videoRef: elementRef,
    shouldLoadThumbnail: shouldLoad,
    shouldLoadVideo: isIntersecting, // Only load full video when actually visible
    isVisible: isIntersecting
  };
};

/**
 * Hook for managing video thumbnail loading states
 */
export const useVideoThumbnail = (videoUrl: string, videoTitle: string) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThumbnail = async () => {
    if (thumbnailUrl || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Import the utility function dynamically to avoid SSR issues
      const { createOptimizedThumbnail } = await import('../lib/video-utils');
      
      const thumbnail = await createOptimizedThumbnail(videoUrl, {
        width: 320,
        height: 180,
        time: 1,
        fallbackText: videoTitle
      });
      
      setThumbnailUrl(thumbnail);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load thumbnail';
      setError(errorMessage);
      console.error('Thumbnail loading error:', err);
      
      // Fallback to placeholder
      const { generatePlaceholderThumbnail } = await import('../lib/video-utils');
      setThumbnailUrl(generatePlaceholderThumbnail(320, 180, videoTitle));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    thumbnailUrl,
    isLoading,
    error,
    loadThumbnail
  };
};