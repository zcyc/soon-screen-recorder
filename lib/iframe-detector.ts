/**
 * Utility functions for detecting iframe environment and handling media permissions
 */

/**
 * Check if the current page is running inside an iframe
 */
export function isInIframe(): boolean {
  try {
    return window !== window.top;
  } catch (e) {
    // If we can't access window.top, we're definitely in an iframe with different origin
    return true;
  }
}

/**
 * Check if media device access is likely to be blocked due to iframe restrictions
 */
export function isMediaAccessBlocked(): boolean {
  // Check if we're in iframe and don't have media device access
  if (isInIframe()) {
    return true;
  }
  
  // Also check if mediaDevices is available
  return !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia;
}

/**
 * Get the current page URL for opening in new window
 */
export function getCurrentPageUrl(): string {
  return window.location.href;
}

/**
 * Open current page in a new window/tab
 */
export function openInNewWindow(): void {
  const url = getCurrentPageUrl();
  const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  
  if (!newWindow) {
    // Fallback if popup was blocked
    alert('Please allow popups for this site and try again, or manually copy this URL to a new tab:\n\n' + url);
  }
}

/**
 * Get user-friendly message explaining iframe restrictions
 */
export function getIframeRestrictionMessage(): string {
  return 'This page is running in an embedded frame, which prevents access to your microphone for security reasons. Please open this page in a new window to enable microphone access.';
}