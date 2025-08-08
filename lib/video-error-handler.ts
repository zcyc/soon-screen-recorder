/**
 * Comprehensive error handling for video operations with Safari-specific solutions
 */

import { detectBrowser } from './browser-compatibility';

export interface VideoError {
  code: string;
  message: string;
  originalError?: Error | Event;
  browser: string;
  suggestions: string[];
  retryable: boolean;
  fallbackAvailable: boolean;
}

export class VideoErrorHandler {
  private browser = detectBrowser();

  /**
   * Handle video loading errors with Safari-specific solutions
   */
  handleVideoError(error: Error | Event | string, context: string = 'video-operation'): VideoError {
    const errorMessage = this.extractErrorMessage(error);
    const errorCode = this.categorizeError(errorMessage, context);
    
    console.error(`🚫 Video error in ${this.browser.name}:`, {
      context,
      error: errorMessage,
      code: errorCode,
      userAgent: navigator.userAgent,
    });

    return {
      code: errorCode,
      message: errorMessage,
      originalError: error instanceof Error ? error : undefined,
      browser: this.browser.name,
      suggestions: this.getSuggestions(errorCode),
      retryable: this.isRetryable(errorCode),
      fallbackAvailable: this.hasFallback(errorCode),
    };
  }

  /**
   * Get user-friendly error message with browser-specific guidance
   */
  getUserFriendlyMessage(videoError: VideoError): string {
    const baseMessage = this.getBaseMessage(videoError.code);
    
    if (this.browser.isSafari) {
      return `${baseMessage} (Safari浏览器兼容性问题)`;
    }
    
    return baseMessage;
  }

  /**
   * Check if error is related to Safari WebM compatibility
   */
  isSafariWebMIssue(error: VideoError): boolean {
    return this.browser.isSafari && (
      error.code === 'FORMAT_UNSUPPORTED' ||
      error.code === 'CODEC_UNSUPPORTED' ||
      error.message.includes('webm') ||
      error.message.includes('format')
    );
  }

  /**
   * Check if error is related to URL.createObjectURL issues
   */
  isObjectURLIssue(error: VideoError): boolean {
    return error.code === 'OBJECT_URL_FAILED' ||
           error.message.includes('createObjectURL') ||
           error.message.includes('blob:');
  }

  /**
   * Get recommended retry strategy
   */
  getRetryStrategy(error: VideoError): {
    shouldRetry: boolean;
    maxAttempts: number;
    delay: number;
    alternateMethods: string[];
  } {
    if (!error.retryable) {
      return {
        shouldRetry: false,
        maxAttempts: 0,
        delay: 0,
        alternateMethods: [],
      };
    }

    if (this.browser.isSafari) {
      return {
        shouldRetry: true,
        maxAttempts: 3,
        delay: 2000, // Longer delay for Safari
        alternateMethods: [
          'use-mp4-format',
          'direct-url-loading',
          'canvas-fallback',
        ],
      };
    }

    return {
      shouldRetry: true,
      maxAttempts: 2,
      delay: 1000,
      alternateMethods: [
        'alternative-codec',
        'format-conversion',
      ],
    };
  }

  /**
   * Extract meaningful error message from various error types
   */
  private extractErrorMessage(error: Error | Event | string): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      return error.message || 'Unknown error occurred';
    }
    
    if (error && typeof error === 'object') {
      // Handle DOM events
      if ('type' in error) {
        return `Video ${error.type} event occurred`;
      }
      
      // Handle media error objects
      if ('code' in error && 'message' in error) {
        return `Media error ${(error as any).code}: ${(error as any).message}`;
      }
    }
    
    return 'Unknown video error';
  }

  /**
   * Categorize errors into standard codes
   */
  private categorizeError(message: string, context: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Safari-specific issues
    if (this.browser.isSafari) {
      if (lowerMessage.includes('webm')) {
        return 'SAFARI_WEBM_UNSUPPORTED';
      }
      if (lowerMessage.includes('createobjecturl')) {
        return 'SAFARI_OBJECT_URL_FAILED';
      }
      if (lowerMessage.includes('cors') || lowerMessage.includes('cross-origin')) {
        return 'SAFARI_CORS_ERROR';
      }
    }

    // General error categories
    if (lowerMessage.includes('format') || lowerMessage.includes('unsupported')) {
      return 'FORMAT_UNSUPPORTED';
    }
    if (lowerMessage.includes('codec')) {
      return 'CODEC_UNSUPPORTED';
    }
    if (lowerMessage.includes('load') || lowerMessage.includes('fetch')) {
      return 'LOADING_FAILED';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    if (lowerMessage.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
      return 'PERMISSION_DENIED';
    }
    if (lowerMessage.includes('canvas') || lowerMessage.includes('context')) {
      return 'CANVAS_ERROR';
    }
    if (lowerMessage.includes('createobjecturl') || lowerMessage.includes('blob')) {
      return 'OBJECT_URL_FAILED';
    }

    // Context-specific errors
    if (context.includes('thumbnail')) {
      return 'THUMBNAIL_GENERATION_FAILED';
    }
    if (context.includes('upload')) {
      return 'UPLOAD_FAILED';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Get suggestions based on error code
   */
  private getSuggestions(errorCode: string): string[] {
    const commonSuggestions: Record<string, string[]> = {
      SAFARI_WEBM_UNSUPPORTED: [
        '转换视频为MP4格式',
        '使用Safari支持的H.264编码',
        '避免使用VP8/VP9编码的WebM文件',
        '考虑使用QuickTime MOV格式',
      ],
      SAFARI_OBJECT_URL_FAILED: [
        '检查文件大小是否过大',
        '尝试刷新页面',
        '清理浏览器缓存',
        '使用直接URL而非Blob URL',
      ],
      SAFARI_CORS_ERROR: [
        '确保视频文件在同一域名下',
        '检查服务器CORS配置',
        '使用适当的crossOrigin设置',
      ],
      FORMAT_UNSUPPORTED: [
        '转换为浏览器支持的格式',
        '使用MP4 H.264编码',
        '检查视频编码设置',
      ],
      CODEC_UNSUPPORTED: [
        '使用标准H.264编码',
        '避免使用实验性编码格式',
        '检查浏览器版本',
      ],
      LOADING_FAILED: [
        '检查网络连接',
        '验证视频文件完整性',
        '重试操作',
        '使用较小的视频文件测试',
      ],
      NETWORK_ERROR: [
        '检查网络连接状态',
        '重新加载页面',
        '稍后重试',
      ],
      TIMEOUT_ERROR: [
        '检查网络速度',
        '使用较小的视频文件',
        '增加超时时间',
        '分段处理视频',
      ],
      CANVAS_ERROR: [
        '检查浏览器对Canvas的支持',
        '尝试降低图像分辨率',
        '使用替代的缩略图生成方法',
      ],
      OBJECT_URL_FAILED: [
        '检查浏览器对Blob URL的支持',
        '清理未使用的Object URL',
        '使用文件直接路径',
      ],
      THUMBNAIL_GENERATION_FAILED: [
        '使用预设缩略图',
        '降低缩略图质量设置',
        '尝试不同的时间点截取',
      ],
    };

    return commonSuggestions[errorCode] || ['联系技术支持获取帮助'];
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(errorCode: string): boolean {
    const nonRetryableErrors = [
      'FORMAT_UNSUPPORTED',
      'CODEC_UNSUPPORTED',
      'SAFARI_WEBM_UNSUPPORTED',
      'PERMISSION_DENIED',
    ];
    
    return !nonRetryableErrors.includes(errorCode);
  }

  /**
   * Check if fallback is available
   */
  private hasFallback(errorCode: string): boolean {
    const fallbackAvailable = [
      'SAFARI_WEBM_UNSUPPORTED',
      'FORMAT_UNSUPPORTED',
      'CODEC_UNSUPPORTED',
      'THUMBNAIL_GENERATION_FAILED',
      'CANVAS_ERROR',
    ];
    
    return fallbackAvailable.includes(errorCode);
  }

  /**
   * Get base user message for error code
   */
  private getBaseMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      SAFARI_WEBM_UNSUPPORTED: 'Safari浏览器不支持此WebM视频格式',
      SAFARI_OBJECT_URL_FAILED: 'Safari浏览器无法创建视频预览',
      SAFARI_CORS_ERROR: 'Safari浏览器跨域访问受限',
      FORMAT_UNSUPPORTED: '不支持的视频格式',
      CODEC_UNSUPPORTED: '不支持的视频编码',
      LOADING_FAILED: '视频加载失败',
      NETWORK_ERROR: '网络连接错误',
      TIMEOUT_ERROR: '操作超时',
      CANVAS_ERROR: '图像处理错误',
      OBJECT_URL_FAILED: '视频预览生成失败',
      THUMBNAIL_GENERATION_FAILED: '缩略图生成失败',
      UPLOAD_FAILED: '视频上传失败',
      UNKNOWN_ERROR: '未知错误',
    };

    return messages[errorCode] || '发生了未知错误';
  }
}

// Singleton instance
let errorHandlerInstance: VideoErrorHandler | null = null;

/**
 * Get the singleton error handler instance
 */
export function getVideoErrorHandler(): VideoErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new VideoErrorHandler();
  }
  return errorHandlerInstance;
}

/**
 * Quick error handling wrapper function
 */
export function handleVideoError(error: Error | Event | string, context?: string): VideoError {
  return getVideoErrorHandler().handleVideoError(error, context);
}

/**
 * Check if error suggests Safari WebM compatibility issue
 */
export function isSafariCompatibilityIssue(error: VideoError): boolean {
  return getVideoErrorHandler().isSafariWebMIssue(error) || 
         getVideoErrorHandler().isObjectURLIssue(error);
}