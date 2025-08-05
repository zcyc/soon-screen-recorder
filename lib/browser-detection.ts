/**
 * Browser detection utilities for screen recording compatibility
 */

export interface BrowserInfo {
  isFirefox: boolean;
  isChrome: boolean;
  isEdge: boolean;
  isSafari: boolean;
  version: string | null;
  userAgent: string;
}

/**
 * Detect the current browser and version
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  
  // Firefox detection
  const isFirefox = /Firefox\/(\d+\.?\d*)/.test(userAgent);
  const firefoxMatch = userAgent.match(/Firefox\/(\d+\.?\d*)/);
  
  // Chrome detection (must come before Edge as Edge includes Chrome in UA)
  const isChrome = /Chrome\/(\d+\.?\d*)/.test(userAgent) && !/Edg\//.test(userAgent);
  const chromeMatch = userAgent.match(/Chrome\/(\d+\.?\d*)/);
  
  // Edge detection (new Chromium-based Edge)
  const isEdge = /Edg\/(\d+\.?\d*)/.test(userAgent);
  const edgeMatch = userAgent.match(/Edg\/(\d+\.?\d*)/);
  
  // Safari detection
  const isSafari = /Safari\/(\d+\.?\d*)/.test(userAgent) && !/Chrome/.test(userAgent);
  const safariMatch = userAgent.match(/Safari\/(\d+\.?\d*)/);
  
  let version: string | null = null;
  
  if (isFirefox && firefoxMatch) {
    version = firefoxMatch[1];
  } else if (isChrome && chromeMatch) {
    version = chromeMatch[1];
  } else if (isEdge && edgeMatch) {
    version = edgeMatch[1];
  } else if (isSafari && safariMatch) {
    version = safariMatch[1];
  }
  
  return {
    isFirefox,
    isChrome,
    isEdge,
    isSafari,
    version,
    userAgent
  };
}

/**
 * Check if the current browser is Firefox
 */
export function isFirefox(): boolean {
  return detectBrowser().isFirefox;
}

/**
 * Check if the current browser supports certain MediaRecorder features
 */
export function getMediaRecorderSupport() {
  const browser = detectBrowser();
  
  return {
    ...browser,
    supportsWebM: MediaRecorder.isTypeSupported('video/webm'),
    supportsVP9: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus'),
    supportsVP8: MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus'),
    supportsH264: MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac'),
    // Firefox-specific quirks
    needsDelayedBlobCreation: browser.isFirefox,
    needsExplicitStreamCleanup: browser.isFirefox,
    supportsDataAvailableChunking: true, // All modern browsers support this
  };
}

/**
 * Get optimal MediaRecorder settings for the current browser
 */
export function getOptimalRecordingSettings(quality: '720p' | '1080p' = '720p') {
  const support = getMediaRecorderSupport();
  
  // Base settings
  let mimeType = 'video/webm';
  let videoBitsPerSecond = quality === '1080p' ? 5000000 : 2500000;
  
  // Firefox-specific optimizations
  if (support.isFirefox) {
    // Firefox works better with VP8 in some cases
    if (support.supportsVP8) {
      mimeType = 'video/webm;codecs=vp8,opus';
    } else if (support.supportsWebM) {
      mimeType = 'video/webm';
    }
    
    // Lower bitrate for Firefox to ensure stability
    videoBitsPerSecond = quality === '1080p' ? 4000000 : 2000000;
  } else if (support.isChrome || support.isEdge) {
    // Chrome and Edge prefer VP9
    if (support.supportsVP9) {
      mimeType = 'video/webm;codecs=vp9,opus';
    } else if (support.supportsVP8) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
  }
  
  return {
    mimeType,
    videoBitsPerSecond,
    audioBitsPerSecond: 128000, // Standard audio bitrate
    // Firefox needs explicit timeslice for better chunk collection
    timeslice: support.isFirefox ? 1000 : undefined,
  };
}