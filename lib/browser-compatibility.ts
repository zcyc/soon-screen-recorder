/**
 * Browser compatibility utilities for video processing and format support
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isMobile: boolean;
  supportsWebM: boolean;
  supportsMP4: boolean;
  supportsMOV: boolean;
  supportsCreateObjectURL: boolean;
  supportsCanvasVideoCapture: boolean;
}

/**
 * Detect current browser and its capabilities
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      name: 'Unknown',
      version: '0',
      isSafari: false,
      isChrome: false,
      isFirefox: false,
      isEdge: false,
      isMobile: false,
      supportsWebM: false,
      supportsMP4: true,
      supportsMOV: false,
      supportsCreateObjectURL: true,
      supportsCanvasVideoCapture: true,
    };
  }

  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

  // Extract browser version
  let version = '0';
  let name = 'Unknown';

  if (isSafari) {
    name = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    version = match ? match[1] : '0';
  } else if (isChrome) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    version = match ? match[1] : '0';
  } else if (isFirefox) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    version = match ? match[1] : '0';
  } else if (isEdge) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    version = match ? match[1] : '0';
  }

  return {
    name,
    version,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isMobile,
    supportsWebM: checkWebMSupport(),
    supportsMP4: checkMP4Support(),
    supportsMOV: checkMOVSupport(),
    supportsCreateObjectURL: checkCreateObjectURLSupport(),
    supportsCanvasVideoCapture: checkCanvasVideoCapture(),
  };
}

/**
 * Check if browser supports WebM format
 */
function checkWebMSupport(): boolean {
  if (typeof HTMLVideoElement === 'undefined') return false;
  
  const video = document.createElement('video');
  return !!(
    video.canPlayType('video/webm') ||
    video.canPlayType('video/webm; codecs="vp8"') ||
    video.canPlayType('video/webm; codecs="vp9"')
  );
}

/**
 * Check if browser supports MP4 format
 */
function checkMP4Support(): boolean {
  if (typeof HTMLVideoElement === 'undefined') return false;
  
  const video = document.createElement('video');
  return !!(
    video.canPlayType('video/mp4') ||
    video.canPlayType('video/mp4; codecs="avc1.42E01E"')
  );
}

/**
 * Check if browser supports MOV format
 */
function checkMOVSupport(): boolean {
  if (typeof HTMLVideoElement === 'undefined') return false;
  
  const video = document.createElement('video');
  return !!(
    video.canPlayType('video/mov') ||
    video.canPlayType('video/quicktime')
  );
}

/**
 * Check if browser supports URL.createObjectURL
 */
function checkCreateObjectURLSupport(): boolean {
  return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
}

/**
 * Check if browser supports canvas video capture
 */
function checkCanvasVideoCapture(): boolean {
  if (typeof HTMLCanvasElement === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return !!ctx && typeof ctx.drawImage === 'function';
  } catch {
    return false;
  }
}

/**
 * Get preferred video formats for current browser
 */
export function getPreferredVideoFormats(): string[] {
  const browser = detectBrowser();
  
  if (browser.isSafari) {
    // Safari prefers MP4 and has limited WebM support
    return ['video/mp4', 'video/quicktime', 'video/webm'];
  } else if (browser.isFirefox) {
    // Firefox has good WebM support
    return ['video/webm', 'video/mp4'];
  } else {
    // Chrome and Edge support both well
    return ['video/webm', 'video/mp4', 'video/quicktime'];
  }
}

/**
 * Check if video format is supported
 */
export function isVideoFormatSupported(mimeType: string): boolean {
  if (typeof HTMLVideoElement === 'undefined') return false;
  
  const video = document.createElement('video');
  const canPlay = video.canPlayType(mimeType);
  return canPlay === 'probably' || canPlay === 'maybe';
}

/**
 * Get Safari-safe video loading options
 */
export function getSafariSafeVideoOptions(): {
  crossOrigin: 'anonymous' | undefined;
  preload: 'metadata' | 'auto' | 'none' | '';
  playsInline: boolean;
  muted: boolean;
  controls: boolean;
} {
  const browser = detectBrowser();
  
  return {
    crossOrigin: browser.isSafari ? 'anonymous' : undefined,
    preload: browser.isSafari ? 'metadata' : 'metadata' as const,
    playsInline: browser.isSafari || browser.isMobile,
    muted: browser.isSafari || browser.isMobile, // Safari requires muted for autoplay
    controls: false,
  };
}

/**
 * Create video element with Safari-compatible settings
 */
export function createSafariCompatibleVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  const options = getSafariSafeVideoOptions();
  
  if (options.crossOrigin) video.crossOrigin = options.crossOrigin;
  video.preload = (options.preload || 'metadata') as 'metadata' | 'auto' | 'none' | '';
  video.playsInline = options.playsInline || false;
  video.muted = options.muted || false;
  video.controls = options.controls || false;
  
  return video;
}