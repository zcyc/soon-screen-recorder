/**
 * Safari-safe URL object management with automatic cleanup and error handling
 */

import { detectBrowser } from './browser-compatibility';

interface ManagedURL {
  url: string;
  created: number;
  revoked: boolean;
}

class SafariURLManager {
  private managedURLs: Map<string, ManagedURL> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private browser = detectBrowser();

  constructor() {
    // Start automatic cleanup for Safari
    if (this.browser.isSafari) {
      this.startCleanupInterval();
    }
  }

  /**
   * Create object URL with Safari-specific handling and automatic tracking
   */
  createObjectURL(object: Blob | File): string {
    try {
      if (!URL || typeof URL.createObjectURL !== 'function') {
        throw new Error('URL.createObjectURL is not supported in this browser');
      }

      const url = URL.createObjectURL(object);
      const id = this.generateUrlId(url);
      
      this.managedURLs.set(id, {
        url,
        created: Date.now(),
        revoked: false,
      });

      console.log(`🔗 Created object URL (${this.browser.name}):`, {
        id,
        url: url.substring(0, 50) + '...',
        objectType: object.constructor.name,
        size: object.size,
        isSafari: this.browser.isSafari,
      });

      // For Safari, revoke after shorter time to prevent memory issues
      if (this.browser.isSafari) {
        setTimeout(() => {
          this.revokeObjectURL(url);
        }, 30000); // 30 seconds for Safari
      }

      return url;
    } catch (error) {
      console.error('❌ Failed to create object URL:', error);
      throw new Error(`Failed to create object URL: ${error.message}`);
    }
  }

  /**
   * Revoke object URL with error handling
   */
  revokeObjectURL(url: string): void {
    try {
      const id = this.generateUrlId(url);
      const managed = this.managedURLs.get(id);

      if (managed && !managed.revoked) {
        URL.revokeObjectURL(url);
        managed.revoked = true;
        
        console.log(`🗑️ Revoked object URL (${this.browser.name}):`, {
          id,
          url: url.substring(0, 50) + '...',
          lifespan: Date.now() - managed.created,
        });
      }

      this.managedURLs.delete(id);
    } catch (error) {
      console.warn('⚠️ Failed to revoke object URL:', error);
    }
  }

  /**
   * Revoke all managed URLs
   */
  revokeAll(): void {
    console.log(`🧹 Revoking all managed URLs (${this.managedURLs.size} URLs)`);
    
    for (const [id, managed] of this.managedURLs.entries()) {
      if (!managed.revoked) {
        try {
          URL.revokeObjectURL(managed.url);
        } catch (error) {
          console.warn(`Failed to revoke URL ${id}:`, error);
        }
      }
    }
    
    this.managedURLs.clear();
  }

  /**
   * Get stats about managed URLs
   */
  getStats() {
    const now = Date.now();
    const active = Array.from(this.managedURLs.values()).filter(m => !m.revoked);
    const old = active.filter(m => now - m.created > 60000); // Older than 1 minute
    
    return {
      total: this.managedURLs.size,
      active: active.length,
      revoked: this.managedURLs.size - active.length,
      old: old.length,
      browser: this.browser.name,
    };
  }

  /**
   * Start automatic cleanup interval for Safari
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupOldURLs();
    }, 15000); // Every 15 seconds for Safari

    console.log('🔄 Started Safari URL cleanup interval');
  }

  /**
   * Stop automatic cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('⏹️ Stopped Safari URL cleanup interval');
    }
  }

  /**
   * Cleanup URLs older than specified time
   */
  private cleanupOldURLs(maxAge: number = 60000): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, managed] of this.managedURLs.entries()) {
      if (!managed.revoked && now - managed.created > maxAge) {
        try {
          URL.revokeObjectURL(managed.url);
          managed.revoked = true;
          cleaned++;
        } catch (error) {
          console.warn(`Failed to cleanup URL ${id}:`, error);
        }
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old URLs`);
    }
  }

  /**
   * Generate a unique ID for URL tracking
   */
  private generateUrlId(url: string): string {
    return url.split('/').pop() || url;
  }

  /**
   * Destroy the manager and cleanup all resources
   */
  destroy(): void {
    this.stopCleanupInterval();
    this.revokeAll();
    console.log('💥 SafariURLManager destroyed');
  }
}

// Singleton instance
let urlManagerInstance: SafariURLManager | null = null;

/**
 * Get the singleton URL manager instance
 */
export function getURLManager(): SafariURLManager {
  if (!urlManagerInstance) {
    urlManagerInstance = new SafariURLManager();
  }
  return urlManagerInstance;
}

/**
 * Safari-safe createObjectURL wrapper
 */
export function safariCreateObjectURL(object: Blob | File): string {
  return getURLManager().createObjectURL(object);
}

/**
 * Safari-safe revokeObjectURL wrapper
 */
export function safariRevokeObjectURL(url: string): void {
  getURLManager().revokeObjectURL(url);
}

/**
 * Cleanup hook for React components
 */
export function useSafariURLCleanup() {
  if (typeof window !== 'undefined') {
    const manager = getURLManager();
    
    // Cleanup on page unload
    const handleUnload = () => {
      manager.revokeAll();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }
  
  return () => {};
}

/**
 * Enhanced video element with Safari-safe URL handling
 */
export function createSafariSafeVideoElement(videoSource: File | string): {
  video: HTMLVideoElement;
  cleanup: () => void;
} {
  const video = document.createElement('video');
  const browser = detectBrowser();
  let objectURL: string | null = null;

  // Safari-specific settings
  if (browser.isSafari) {
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true; // Required for autoplay in Safari
  } else {
    video.preload = 'metadata';
  }

  // Set video source with Safari-safe handling
  if (typeof videoSource === 'string') {
    video.src = videoSource;
  } else {
    objectURL = safariCreateObjectURL(videoSource);
    video.src = objectURL;
  }

  // Cleanup function
  const cleanup = () => {
    try {
      if (objectURL) {
        safariRevokeObjectURL(objectURL);
        objectURL = null;
      }
      video.remove();
    } catch (error) {
      console.warn('Video cleanup error:', error);
    }
  };

  return { video, cleanup };
}