'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import LoginModal from '@/components/login-modal';

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Monitor, 
  Camera, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Download,
  Upload,
  Settings,
  MicOff,
  CameraOff,
  Share2,
  Copy,
  ExternalLink,
  Link,
  Circle,
  StopCircle,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { RECORDING, SUBTITLES, PERMISSIONS, COMMON, GUEST, VIDEOS, PUBLISH, DEVICES } from '@/lib/constants';
import { isInIframe, isMediaAccessBlocked, openInNewWindow, getIframeRestrictionMessage } from '@/lib/iframe-detector';
import { recordingConfig } from '@/lib/config';
import { uploadVideoFileAction } from '@/app/actions/video-actions';
import { detectBrowser as detectBrowserFromLib } from '@/lib/browser-compatibility';

import { getFileUrlAction, uploadFileAction, updateVideoThumbnailAction } from '@/app/actions/video-actions';
import { generateVideoThumbnailBlob } from '@/lib/video-utils';

// Utility function to check Permissions Policy support
const checkPermissionsPolicy = (): { supported: boolean; allowed: boolean; error?: string } => {
  try {
    // Check if Permissions Policy API is available
    if (typeof document !== 'undefined' && 'featurePolicy' in document) {
      const policy = (document as any).featurePolicy;
      if (policy && typeof policy.allowsFeature === 'function') {
        const displayCaptureAllowed = policy.allowsFeature('display-capture');
        return { supported: true, allowed: displayCaptureAllowed };
      }
    }
    
    // Check for newer Permissions Policy API
    if (typeof document !== 'undefined' && 'permissionsPolicy' in document) {
      const policy = (document as any).permissionsPolicy;
      if (policy && typeof policy.allowsFeature === 'function') {
        const displayCaptureAllowed = policy.allowsFeature('display-capture');
        return { supported: true, allowed: displayCaptureAllowed };
      }
    }
    
    // If no Permissions Policy API, assume allowed (older browsers)
    return { supported: false, allowed: true };
  } catch (error) {
    console.warn('Error checking Permissions Policy:', error);
    return { supported: false, allowed: true, error: (error as Error).message };
  }
};

type RecordingQuality = '720p' | '1080p';
type RecordingSource = 'screen' | 'camera' | 'both' | 'camera-only';
type ScreenSourceType = 'monitor' | 'window' | 'browser';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
}

interface SubtitleState {
  isEnabled: boolean;
  language: string;
  segments: SubtitleSegment[];
  currentText: string;
  isListening: boolean;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
}

// 简化的视频预览组件
const RestoreableVideo: React.FC<{
  blob: Blob | null;
  className?: string;
}> = ({ blob, className }) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!blob) {
      setVideoSrc(null);
      setError(null);
      return;
    }

    let objectUrl: string | null = null;

    try {
      // 基本验证
      if (!blob || blob.size === 0) {
        setError('Invalid video data');
        return;
      }
      
      if (!(blob instanceof Blob)) {
        setError('Invalid video data type');
        return;
      }

      // 检查文件大小
      if (blob.size > 500 * 1024 * 1024) { // 大于500MB
        setError('Video file too large (over 500MB)');
        return;
      }
      
      // 创建 URL
      objectUrl = URL.createObjectURL(blob);
      setVideoSrc(objectUrl);
      setError(null);
      
      console.log('Video preview ready:', {
        size: blob.size,
        type: blob.type,
        sizeKB: Math.round(blob.size / 1024)
      });
      
    } catch (err: any) {
      console.error('Failed to create video URL:', err);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setError(`Video loading failed: ${err.message}`);
      setVideoSrc(null);
    }

    // 清理函数
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [blob]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.target as HTMLVideoElement;
    console.error('Video playback error:', {
      errorCode: video.error?.code,
      errorMessage: video.error?.message,
      blobSize: blob?.size,
      blobType: blob?.type
    });
    
    let errorMessage = 'Video playback failed';
    if (video.error) {
      switch (video.error.code) {
        case 1: errorMessage = 'Video loading interrupted'; break;
        case 2: errorMessage = 'Network error'; break;
        case 3: errorMessage = 'Video decoding failed'; break;
        case 4: errorMessage = 'Video format not supported'; break;
        default: errorMessage = `Video error (${video.error.code})`;
      }
    }
    setError(errorMessage);
  };

  const handleVideoLoad = () => {
    setError(null);
    setIsLoaded(true);
  };

  const handleVideoLoadedMetadata = () => {
    setError(null);
    setIsLoaded(true);
    
    // Safari 特殊处理：强制显示第一帧
    if (videoRef.current) {
      const browser = detectBrowserFromLib();
      
      if (browser.isSafari) {
        console.log('🍎 Safari video metadata loaded, preparing to display first frame...');
        
        // Safari需要显式地寻址到第一帧来触发画面显示
        const video = videoRef.current;
        
        // 方法1：设置currentTime来强制加载第一帧
        video.currentTime = 0.1;
        
        // 方法2：使用loadeddata事件确保画面显示
        const handleLoadedData = () => {
          console.log('🍎 Safari video data loaded, first frame should be visible');
          video.removeEventListener('loadeddata', handleLoadedData);
          
          // 确保视频在第一帧暂停
          if (!video.paused) {
            video.pause();
          }
        };
        
        video.addEventListener('loadeddata', handleLoadedData);
        
        // 方法3：强制渲染
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            video.currentTime = 0;
            console.log('🍎 Safari forced to first frame');
          }
        }, 50);
      }
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 border border-destructive/20 rounded-lg ${className}`}>
        <div className="text-center text-sm p-4">
          <div className="mb-3">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-destructive text-xl">⚠️</span>
            </div>
            <p className="font-medium text-destructive">{error}</p>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            <p>Please try recording the video again</p>
          </div>
        </div>
      </div>
    );
  }

  if (!videoSrc) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mx-auto mb-2"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  // Safari 特殊属性
  const browser = detectBrowserFromLib();
  const safariProps = browser.isSafari ? {
    // Safari 特殊属性以确保视频正确显示
    'webkit-playsinline': 'true',
    'x5-video-player-type': 'h5',
    'x5-video-player-fullscreen': 'true'
  } : {};

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      src={videoSrc}
      onError={handleVideoError}
      onLoadedData={handleVideoLoad}
      onLoadedMetadata={handleVideoLoadedMetadata}
      preload={browser.isSafari ? "auto" : "metadata"}
      muted
      playsInline
      crossOrigin="anonymous"
      poster=""
      {...safariProps}
      style={{
        backgroundColor: '#000',
        objectFit: 'contain',
        // Safari 特殊样式
        ...(browser.isSafari ? {
          WebkitTransform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden'
        } : {})
      }}
    />
  );
};

export default function ScreenRecorder() {
  const { user } = useAuth();

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    recordedBlob: null,
  });
  
  const [quality, setQuality] = useState<RecordingQuality>('720p');
  const [source, setSource] = useState<RecordingSource>('screen');
  const [screenSource, setScreenSource] = useState<ScreenSourceType>('monitor');
  const [includeAudio, setIncludeAudio] = useState(false);
  const [includeCamera, setIncludeCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [videoTitle, setVideoTitle] = useState('');
  const [isVideoPublic, setIsVideoPublic] = useState(true); // Default to public for sharing
  const [isVideoPublished, setIsVideoPublished] = useState(false); // Default to not published to discovery
  const [uploadedVideo, setUploadedVideo] = useState<any>(null); // Store uploaded video data

  const [cameraPreviewStream, setCameraPreviewStream] = useState<MediaStream | null>(null); // Camera preview stream
  const [isMounted, setIsMounted] = useState(false); // Track component mount status
  const [showTimeWarning, setShowTimeWarning] = useState(false); // Show time warning
  const [isNearTimeLimit, setIsNearTimeLimit] = useState(false); // Near time limit state
  const [isPiPRequesting, setIsPiPRequesting] = useState(false); // 画中画请求状态
  const pipTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 超时定时器引用
  
  // 清理PiP状态的函数
  const clearPiPState = useCallback(() => {
    if (pipTimeoutRef.current) {
      clearTimeout(pipTimeoutRef.current);
      pipTimeoutRef.current = null;
    }
    setIsPiPRequesting(false);
  }, []);
  
  // 设置带超时保护的PiP请求状态
  const setIsPiPRequestingWithTimeout = useCallback((requesting: boolean) => {
    if (requesting) {
      setIsPiPRequesting(true);
      // 设置3秒超时保护
      pipTimeoutRef.current = setTimeout(() => {
        console.log('PiP request timeout, automatically cleaning up state');
        setIsPiPRequesting(false);
        pipTimeoutRef.current = null;
      }, 3000);
    } else {
      clearPiPState();
    }
  }, [clearPiPState]);
  
  // Subtitle states
  const [subtitleState, setSubtitleState] = useState<SubtitleState>({
    isEnabled: false,
    language: 'zh-CN',
    segments: [],
    currentText: '',
    isListening: false
  });
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  // Show toast message


  // 后台缩略图生成函数
  const generateThumbnailInBackground = async (videoId: string, recordedBlob: Blob) => {
    try {
      
      const browser = detectBrowserFromLib();
      console.log(`🎨 Starting thumbnail generation for recording ${videoId} in ${browser.name}`);
      
      // 将 Blob 转换为 File 以供缩略图生成使用
      const videoFile = new File([recordedBlob], 'recording.webm', { type: recordedBlob.type });
      
      // 生成缩略图 blob
      const thumbnailBlob = await generateVideoThumbnailBlob(videoFile, {
        width: 320,
        height: 180,
        time: 1,
        quality: 0.8,
        format: 'jpeg',
        timeout: browser.isSafari ? 20000 : 15000
      });
      
      console.log('📷 Recording thumbnail blob generated, size:', thumbnailBlob.size);
      
      // 将 Blob 转换为 File 并上传
      const thumbnailFile = new File([thumbnailBlob], `thumbnail-${videoId}.jpg`, {
        type: 'image/jpeg'
      });
      
      const uploadResult = await uploadFileAction(thumbnailFile);
      
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload thumbnail');
      }
      
      console.log('🔄 Thumbnail uploaded, updating video record...');
      
      // 更新视频记录的缩略图 URL
      const updateResult = await updateVideoThumbnailAction(videoId, uploadResult.data.url);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update video thumbnail');
      }
      
      console.log(`✅ Recording thumbnail generated successfully: ${uploadResult.data.url}`);
      
    } catch (error: any) {
      console.error(`❌ Recording thumbnail generation failed for video ${videoId}:`, error);
    }
  };
  
  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (pipTimeoutRef.current) {
        clearTimeout(pipTimeoutRef.current);
        pipTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Generate default title for placeholder and fallback
  const getDefaultTitle = () => {
    const now = new Date();
    return `Recording ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };
  
  const startNewRecording = () => {
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      recordedBlob: null
    });
    setVideoTitle('');
    setIsVideoPublic(true);
    
    console.log('Starting new recording, resetting state in memory');
    
    setIsVideoPublished(false);
    setUploadedVideo(null);
    
    // 清除录制错误状态
    setRecordingError(null);

    setShowTimeWarning(false);
    setIsNearTimeLimit(false);
    // Reset subtitle state
    setSubtitleState(prev => ({
      ...prev,
      segments: [],
      currentText: '',
      isListening: false
    }));
    stopSpeechRecognition();
    // 重置开始时间
    recordingStartTimeRef.current = 0;
  };
  
  // Speech Recognition Functions
  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {

      return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = subtitleState.language;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setSubtitleState(prev => ({ ...prev, isListening: true }));
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      // 计算当前时间相对于录制开始的时间（秒）
      const currentTime = recordingStartTimeRef.current > 0 
        ? (Date.now() - recordingStartTimeRef.current) / 1000
        : recordingState.duration;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          // Create subtitle segment with proper timing
          const segmentDuration = Math.min(transcript.length * 0.1, 5); // 根据文本长度估算时长，最长5秒
          const segment: SubtitleSegment = {
            id: `subtitle-${Date.now()}-${i}`,
            startTime: Math.max(0, currentTime - segmentDuration), 
            endTime: currentTime,
            text: transcript.trim(),
            confidence: confidence || 0.8
          };
          
          if (segment.text.length > 0) {
            setSubtitleState(prev => ({
              ...prev,
              segments: [...prev.segments, segment],
              currentText: ''
            }));
          }
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (interimTranscript) {
        setSubtitleState(prev => ({ ...prev, currentText: interimTranscript }));
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('语音识别错误:', event.error);
      if (event.error === 'not-allowed') {

      } else if (event.error === 'no-speech') {
        // 重新启动识别
        setTimeout(() => {
          if (subtitleState.isEnabled && recordingState.isRecording) {
            startSpeechRecognition();
          }
        }, 1000);
      }
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setSubtitleState(prev => ({ ...prev, isListening: false }));
      
      // 如果字幕功能仍然启用且正在录制，重新启动识别
      if (subtitleState.isEnabled && recordingState.isRecording && !recordingState.isPaused) {
        setTimeout(() => {
          startSpeechRecognition();
        }, 500);
      }
    };
    
    speechRecognitionRef.current = recognition;
    return true;
  };
  
  const startSpeechRecognition = () => {
    if (!subtitleState.isEnabled || !includeAudio) return;
    
    try {
      if (!speechRecognitionRef.current) {
        if (!initializeSpeechRecognition()) return;
      }
      
      if (speechRecognitionRef.current && !subtitleState.isListening) {
        speechRecognitionRef.current.start();
      }
    } catch (error) {
      console.error('启动语音识别失败:', error);

    }
  };
  
  const stopSpeechRecognition = () => {
    try {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
      setSubtitleState(prev => ({ ...prev, isListening: false }));
    } catch (error) {
      console.error('停止语音识别失败:', error);
    }
  };
  
  // Subtitle Export Functions
  const formatTimeForSRT = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };
  
  const formatTimeForVTT = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  
  const generateSRTContent = (): string => {
    if (subtitleState.segments.length === 0) return '';
    
    return subtitleState.segments.map((segment, index) => {
      const startTime = formatTimeForSRT(segment.startTime);
      const endTime = formatTimeForSRT(segment.endTime);
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');
  };
  
  const generateVTTContent = (): string => {
    if (subtitleState.segments.length === 0) return 'WEBVTT\n\n';
    
    const vttHeader = 'WEBVTT\n\n';
    const vttContent = subtitleState.segments.map((segment, index) => {
      const startTime = formatTimeForVTT(segment.startTime);
      const endTime = formatTimeForVTT(segment.endTime);
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');
    
    return vttHeader + vttContent;
  };
  
  const downloadSubtitles = (format: 'srt' | 'vtt') => {
    if (subtitleState.segments.length === 0) {

      return;
    }
    
    const content = format === 'srt' ? generateSRTContent() : generateVTTContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    const finalTitle = videoTitle.trim() || getDefaultTitle();
    const cleanTitle = finalTitle.replace(/[<>:"/\|?*]/g, '-');
    a.download = `${cleanTitle}.${format}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    

  };
  
  const getShareUrl = (videoId: string) => {
    return `${window.location.origin}/share/${videoId}`;
  };
  
  const copyShareLink = async (videoId: string) => {
    const shareUrl = getShareUrl(videoId);
    try {
      await navigator.clipboard.writeText(shareUrl);

    } catch (error) {
      console.error(RECORDING.copyFailed, error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

    }
  };
  
  const shareVideo = async (video: any) => {
    const shareUrl = getShareUrl(video.$id);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `${RECORDING.watchVideo}: ${video.title}`,
          url: shareUrl,
        });
        // 原生分享成功，不显示消息
      } catch (error) {
        // 用户取消分享或其他错误，不作任何操作
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('Share cancelled or failed:', error.message);
        }
      }
    } else {
      // 浏览器不支持原生分享，显示提示消息

    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement | null>(null);
  
  // Speech recognition refs
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const recognitionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // 监听摄像头开启状态变化
  useEffect(() => {
    // 只在组件完全挂载后才处理摄像头预览
    if (!isMounted) {
      console.log('Component not fully mounted yet, skipping camera preview');
      return;
    }
    
    console.log('Camera state change:', { includeCamera, isRecording: recordingState.isRecording, isMounted });
    
    if (includeCamera) {
      // 开启摄像头时启动预览（录制时也保持开启）
      if (!cameraPreviewStream) {
        console.log('Starting camera preview...');
        startCameraPreview();
      } else if (recordingState.isRecording) {
        console.log('Recording in progress, keeping camera picture-in-picture enabled...');
      }
    } else {
      // 关闭摄像头时停止预览
      console.log('Stopping camera preview...');
      stopCameraPreview();
    }
  }, [includeCamera, recordingState.isRecording, isMounted]);

  // 自动关闭摄像头当选择不支持的录制源时
  useEffect(() => {
    if ((screenSource === 'window' || screenSource === 'browser') && 
        source !== 'camera-only' && 
        includeCamera) {
      console.log(`Auto-closing camera when ${screenSource === 'window' ? 'application window' : 'browser tab'} is selected`);
      setIncludeCamera(false);
    }
  }, [screenSource, source, includeCamera]);

  // 组件挂载状态管理
  useEffect(() => {
    setIsMounted(true);
    
    // 不需要从 localStorage 恢复状态，因为不再存储 Blob 数据
    // 登录不会刷新页面，所有状态都在内存中保持
    console.log('Component initialization, using default state');
    
    return () => {
      setIsMounted(false);
      stopCameraPreview();
    };
  }, []);

  // 状态变化监控 - 用于调试Firefox问题
  useEffect(() => {
    console.log('=== RecordingState Change ===', {
      isRecording: recordingState.isRecording,
      isPaused: recordingState.isPaused,
      hasBlob: !!recordingState.recordedBlob,
      blobSize: recordingState.recordedBlob?.size || 0,
      duration: recordingState.duration,
      timestamp: new Date().toISOString()
    });
    
    if (recordingState.recordedBlob && !recordingState.isRecording) {
      console.log('🎆 Recording completed! Preview page should be displayed.');
      console.log('Blob details:', {
        size: recordingState.recordedBlob.size,
        type: recordingState.recordedBlob.type,
        sizeInKB: Math.round(recordingState.recordedBlob.size / 1024)
      });
      
      // 检查预览页显示条件
      const shouldShowPreview = recordingState.recordedBlob && !uploadedVideo;
      console.log('Preview page display conditions:', {
        hasBlob: !!recordingState.recordedBlob,
        noUploadedVideo: !uploadedVideo,
        shouldShow: shouldShowPreview
      });
    }
  }, [recordingState, uploadedVideo]);

  const getQualityConstraints = (quality: RecordingQuality) => {
    return quality === '1080p' 
      ? { width: 1920, height: 1080 }
      : { width: 1280, height: 720 };
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingState(prev => {
        const newDuration = prev.duration + 1;
        
        // Check if time limit is enabled
        if (recordingConfig.enableTimeLimit) {
          // Show warning when approaching time limit
          if (newDuration >= recordingConfig.timeWarningThreshold && !showTimeWarning) {
            setShowTimeWarning(true);
            setIsNearTimeLimit(true);

          }
          
          // Stop recording when time limit is reached
          if (newDuration >= recordingConfig.maxDurationSeconds) {
            stopRecording();

            return prev; // Don't update duration as recording is stopping
          }
        }
        
        return { ...prev, duration: newDuration };
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 检测画中画API支持情况
  // Unified browser detection function


  const detectPiPSupport = useCallback(() => {
    const browser = detectBrowserFromLib();
    
    // 对Firefox做特殊处理 - Firefox可能不提供document.pictureInPictureEnabled
    let supported = false;
    
    if (browser.isFirefox) {
      // Firefox: Firefox有原生画中画按钮，不依赖JS API
      // Firefox的画中画是通过视频控件实现，而不是通过requestPictureInPicture API
      const firefoxVersionMatch = navigator.userAgent.match(/Firefox\/(\d+)/);
      const firefoxVersion = firefoxVersionMatch ? parseInt(firefoxVersionMatch[1]) : 0;
      
      // Firefox 71+有原生画中画支持，但需要通过视频控件
      supported = firefoxVersion >= 71;
      

    } else {
      // 其他浏览器使用常规检查
      const testVideo = document.createElement('video');
      const hasPiPEnabled = document.pictureInPictureEnabled !== false;
      const hasRequestMethod = 'requestPictureInPicture' in testVideo;
      supported = hasPiPEnabled && hasRequestMethod;
    }
    

    
    return {
      supported,
      canAutoStart: browser.isChrome, // 只有Chrome支持自动启动
      needsUserInteraction: browser.isSafari || browser.isFirefox,
      browser: browser.name
    };
  }, []);
  
  // 启动摄像头预览 - 重写画中画逻辑
  const startCameraPreview = async () => {
    console.log('Starting camera preview initialization...');
    
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能');
      }

      console.log('Requesting camera permission...');
      
      // 使用尝试-降级策略来获取摄像头流
      let stream: MediaStream;
      
      // 第一次尝试：理想设置
      try {
        const idealConstraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user'
          },
          audio: false
        };
        console.log('Trying ideal settings:', idealConstraints);
        stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
      } catch (firstError) {
        console.warn('理想设置失败，尝试基本设置:', firstError);
        
        // 第二次尝试：移除尺寸约束
        try {
          const basicConstraints: MediaStreamConstraints = {
            video: {
              facingMode: 'user'
            },
            audio: false
          };
          console.log('Trying basic settings:', basicConstraints);
          stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        } catch (secondError) {
          console.warn('基本设置失败，尝试最简单设置:', secondError);
          
          // 第三次尝试：最简单设置
          const minimalConstraints: MediaStreamConstraints = {
            video: true,
            audio: false
          };
          console.log('Trying minimal settings:', minimalConstraints);
          stream = await navigator.mediaDevices.getUserMedia(minimalConstraints);
        }
      }
      
      console.log('Camera stream obtained successfully:', {
        id: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length
      });
      
      // 检查视频轨道
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('没有找到可用的摄像头');
      }
      
      setCameraPreviewStream(stream);
      
      // 检测画中画支持
      const pipSupport = detectPiPSupport();
      
      // 设置视频流到元素
      const setupVideoElement = (retryCount = 0) => {
        const maxRetries = 10;
        
        if (cameraPreviewRef.current) {
          console.log('Setting up video element...');
          cameraPreviewRef.current.srcObject = stream;
          
          // 根据画中画支持情况决定显示策略
          if (!pipSupport.supported) {
            // 不支持画中画，显示普通视频预览
            console.log('Browser does not support picture-in-picture, showing normal video preview');

          } else if (pipSupport.canAutoStart) {
            // Chrome - 尝试自动启动画中画
            cameraPreviewRef.current.onloadedmetadata = async () => {
              console.log('Chrome detected, trying to auto-start picture-in-picture');
              try {
                if (!document.pictureInPictureElement && !isPiPRequesting) {
                  setIsPiPRequestingWithTimeout(true);
                  await cameraPreviewRef.current!.requestPictureInPicture();
                  console.log('Chrome picture-in-picture auto-start successful');

                }
              } catch (error: any) {
                console.log('Chrome auto-start failed, falling back to manual mode:', error.message);

              } finally {
                setIsPiPRequestingWithTimeout(false);
              }
            };
          } else {
            // Safari/Firefox - 显示引导信息
            console.log(`${pipSupport.browser} detected, requires manual picture-in-picture activation`);

          }
          
          // 设置通用事件监听器
          cameraPreviewRef.current.onenterpictureinpicture = () => {
            console.log('Entering picture-in-picture mode');
            setIsPiPRequestingWithTimeout(false);
          };
          
          cameraPreviewRef.current.onleavepictureinpicture = () => {
            console.log('Exiting picture-in-picture mode');
            setIsPiPRequestingWithTimeout(false);
          };
          
          cameraPreviewRef.current.onerror = (e) => {
            console.error('视频元素错误:', e);
          };
          
          // 播放视频
          cameraPreviewRef.current.play().then(() => {
            console.log('Video playback successful');
          }).catch((playError) => {
            console.error('视频播放失败:', playError);
          });
          
        } else if (retryCount < maxRetries) {
          console.log(`Video element not rendered yet, retrying later (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => {
            setupVideoElement(retryCount + 1);
          }, 200);
        } else {
          console.error('达到最大重试次数，放弃设置视频元素');

        }
      };
      
      setupVideoElement();
      
    } catch (error: any) {
      console.error('Camera preview startup failed:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      let errorMessage = 'Unable to start camera preview';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Camera device not found';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = `Camera does not support requested settings (${error.constraint}). Automatically downgraded, please retry`;
      } else if (error.name === 'TypeError') {
        errorMessage = 'Browser does not support camera functionality or lacks necessary permissions';
      }
      

    }
  };

  // 手动启动画中画模式 - 重写支持所有浏览器
  const startPictureInPictureManually = async () => {
    if (!cameraPreviewRef.current || !cameraPreviewStream) {

      return;
    }

    if (document.pictureInPictureElement) {

      return;
    }

    if (isPiPRequesting) {

      return;
    }
    
    // 检测浏览器和画中画支持
    const pipSupport = detectPiPSupport();
    
    if (!pipSupport.supported) {

      return;
    }
    
    // Firefox特别检查 - 确保可用
    if (pipSupport.browser === 'Firefox') {
      // 检查Firefox版本和设置
      const userAgent = navigator.userAgent;
      const firefoxVersionMatch = userAgent.match(/Firefox\/(\d+)/);
      const firefoxVersion = firefoxVersionMatch ? parseInt(firefoxVersionMatch[1]) : 0;
      
      if (firefoxVersion < 71) {

        return;
      }
      
      if (!document.pictureInPictureEnabled) {

        return;
      }
    }
    
    // 确保video元素有requestPictureInPicture方法
    if (typeof cameraPreviewRef.current.requestPictureInPicture !== 'function') {
      console.error('video元素缺少requestPictureInPicture方法');
      if (pipSupport.browser === 'Firefox') {

      } else {

      }
      return;
    }

    console.log(`Starting manual picture-in-picture activation for ${pipSupport.browser} browser`);
    setIsPiPRequestingWithTimeout(true);
    
    try {
      await cameraPreviewRef.current.requestPictureInPicture();
      console.log('Manual picture-in-picture activation successful');

    } catch (error: any) {
      console.error('手动启动画中画失败:', error);
      
      // 浏览器特定错误处理
      if (error.name === 'NotAllowedError') {
        if (pipSupport.browser === 'Safari') {

        } else if (pipSupport.browser === 'Firefox') {

        } else {

        }
      } else if (error.name === 'InvalidStateError') {
        if (pipSupport.browser === 'Firefox') {

        } else {

        }
      } else if (error.message.includes('processing')) {

      } else if (error.name === 'NotSupportedError') {

      } else {

      }
    } finally {
      setIsPiPRequestingWithTimeout(false);
    }
  };

  // 停止摄像头预览 - 退出画中画模式
  const stopCameraPreview = async () => {
    console.log('Stopping camera picture-in-picture preview...');
    
    try {
      // 所有模式都尝试退出画中画模式
      if (document.pictureInPictureElement) {
        console.log('Exiting picture-in-picture mode...');
        await document.exitPictureInPicture();
        console.log('Picture-in-picture mode exit successful');
      }
    } catch (error) {
      console.warn('退出画中画模式失败:', error);
      // 不阻塞后续清理操作
    }
    
    if (cameraPreviewStream) {
      console.log('Stopping camera stream...');
      cameraPreviewStream.getTracks().forEach(track => {
        console.log('Stopping track:', track.label);
        track.stop();
      });
      setCameraPreviewStream(null);
    }
    
    if (cameraPreviewRef.current) {
      console.log('Cleaning up picture-in-picture video element...');
      // 暂停视频
      cameraPreviewRef.current.pause();
      // 清空视频源
      cameraPreviewRef.current.srcObject = null;
      // 移除事件监听器
      cameraPreviewRef.current.onloadedmetadata = null;
      cameraPreviewRef.current.onenterpictureinpicture = null;
      cameraPreviewRef.current.onleavepictureinpicture = null;
      cameraPreviewRef.current.onerror = null;
    }
    

    
    console.log('Camera picture-in-picture preview stop completed');
  };

  const getScreenStream = async (): Promise<MediaStream> => {
    const constraints = getQualityConstraints(quality);
    const browser = detectBrowserFromLib();
    
    // Configure display media constraints based on screen source type
    const displayConstraints: any = {
      video: {
        ...constraints,
        frameRate: { ideal: 30, max: 60 }
      },
      audio: includeAudio // 支持独立的音频控制
    };
    
    console.log('Screen audio status:', includeAudio ? 'enabled' : 'disabled');
    console.log('Browser information:', {
      name: browser.name,
      supportsDisplaySurface: browser.supportsDisplaySurface
    });

    // Add source-specific constraints only for browsers that support displaySurface
    if (browser.supportsDisplaySurface && 'getDisplayMedia' in navigator.mediaDevices) {
      if (screenSource === 'window') {
        console.log('Requesting window capture with displaySurface constraint...');
        displayConstraints.video = {
          ...displayConstraints.video,
          // @ts-ignore - Chrome/Edge experimental API
          displaySurface: 'window'
        };
      } else if (screenSource === 'browser') {
        console.log('Requesting browser tab capture with displaySurface constraint...');
        displayConstraints.video = {
          ...displayConstraints.video,
          // @ts-ignore - Chrome/Edge experimental API
          displaySurface: 'browser'
        };
      } else {
        console.log('Requesting monitor capture with displaySurface constraint...');
        displayConstraints.video = {
          ...displayConstraints.video,
          // @ts-ignore - Chrome/Edge experimental API
          displaySurface: 'monitor'
        };
      }
    } else {
      // Safari/Firefox: Use standard getDisplayMedia without displaySurface constraints
      console.log(`${browser.name} detected: Using standard getDisplayMedia without displaySurface constraints`);
      if (browser.isSafari || browser.isFirefox) {
        console.log(`Safari/Firefox will show native source selection dialog with all available options`);
      }
    }
    
    console.log('Display constraints:', displayConstraints);
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
      
      // Log what was actually captured
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log('Actual capture settings:', {
          displaySurface: settings.displaySurface,
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate
        });
        
        // Provide user feedback about what's being captured
        const surfaceType = settings.displaySurface;
        if (surfaceType) {
          const surfaceMap: Record<string, string> = {
            monitor: 'Entire Screen',
            window: 'Application Window', 
            browser: 'Browser Tab'
          };
          console.log(`Actual capture type: ${surfaceMap[surfaceType] || surfaceType}`);
          
          // Show user what's actually being captured
          const actualType = surfaceMap[surfaceType] || surfaceType;
          const expectedType = surfaceMap[screenSource] || screenSource;
          
          if (surfaceType !== screenSource) {
            console.warn(`User selected: ${expectedType}, Actually captured: ${actualType}`);
            // Don't show alert during recording, just log for debugging
          }
        }
      }
      
      return stream;
    } catch (error) {
      console.error('getDisplayMedia error:', error);
      throw error;
    }
  };

  const getCameraStream = async (audioOnly: boolean = false): Promise<MediaStream> => {
    const constraints = getQualityConstraints(quality);
    
    // 如果只需要音频，则不请求视频流
    return await navigator.mediaDevices.getUserMedia({
      video: audioOnly ? false : {
        ...constraints,
        facingMode: 'user'
      },
      audio: includeAudio // 独立控制音频
    });
  };
  
  // 只获取音频流（当不需要摄像头视频但需要音频时）
  const getAudioOnlyStream = async (): Promise<MediaStream | null> => {
    if (!includeAudio) return null; // 如果不包含音频，直接返回null
    
    try {
      console.log('Getting standalone audio stream...');
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      
      console.log('Audio stream acquired successfully:', {
        id: audioStream.id,
        audioTracks: audioStream.getAudioTracks().length
      });
      
      return audioStream;
    } catch (error) {
      console.error('Audio stream acquisition failed:', error);
      return null;
    }
  };

  const combineStreams = (streams: MediaStream[]): MediaStream => {
    console.log('Combining streams:', streams.map(s => ({
      id: s.id,
      videoTracks: s.getVideoTracks().length,
      audioTracks: s.getAudioTracks().length
    })));
    
    const combinedStream = new MediaStream();
    const isScreenRecording = source === 'screen' || source === 'both';
    
    streams.forEach((stream, index) => {
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      console.log(`Stream ${index}:`, {
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoEnabled: videoTracks.map(t => t.enabled),
        audioEnabled: audioTracks.map(t => t.enabled)
      });
      
      // 在屏幕录制模式下，只使用第一个流（屏幕流）的视频
      const shouldAddVideo = !isScreenRecording || index === 0;
      
      // Add video tracks (screen video only in screen recording mode)
      if (shouldAddVideo) {
        videoTracks.forEach(track => {
          if (track.readyState === 'live') {
            combinedStream.addTrack(track);
            console.log(`Added video track from stream ${index}:`, track.label);
          }
        });
      } else {
        console.log(`Skipped video tracks from stream ${index} (using screen video with PiP)`);
      }
      
      // Add all audio tracks from all streams
      audioTracks.forEach(track => {
        if (track.readyState === 'live') {
          combinedStream.addTrack(track);
          console.log(`Added audio track from stream ${index}:`, track.label);
        }
      });
    });
    
    console.log('Combined stream tracks:', {
      videoTracks: combinedStream.getVideoTracks().length,
      audioTracks: combinedStream.getAudioTracks().length,
      totalTracks: combinedStream.getTracks().length
    });
    
    return combinedStream;
  };

  const startRecording = async () => {
    try {
      // 清除之前的录制错误状态
      setRecordingError(null);
      
      // 录制时保持画中画开启，屏幕录制会包含画中画内容
      console.log('Starting recording, keeping camera picture-in-picture enabled...');
      
      chunksRef.current = [];
      const streams: MediaStream[] = [];

      // Request permissions and get streams based on source
      if (source === 'screen' || source === 'both') {
        const sourceNames: Record<string, string> = {
          monitor: 'Entire Screen',
          window: 'Application Window',
          browser: 'Browser Tab'
        };
        
        // Check Permissions Policy before attempting screen capture
        const policyCheck = checkPermissionsPolicy();
        console.log('Permissions Policy check:', policyCheck);
        
        if (policyCheck.supported && !policyCheck.allowed) {
          const errorMessage = 'Screen recording is blocked by permissions policy. Please ensure this page is opened in a new tab, not in an iframe or embedded environment.';
          console.error(errorMessage);
          setRecordingError(errorMessage);
          return;
        }
        
        console.log(`Requesting screen recording permission (${sourceNames[screenSource]})...`);
        
        try {
          const screenStream = await getScreenStream();
          screenStreamRef.current = screenStream;
          streams.push(screenStream);
          console.log(`Screen recording permission granted - target: ${sourceNames[screenSource]}`);
          // Keep browser compatibility logic but remove user feedback
        } catch (error: any) {
          console.error('Screen recording permission denied:', error);
          if (error.name === 'NotAllowedError') {
            const errorMessage = '屏幕录制权限被拒绝。请在浏览器弹窗中允许屏幕共享，或检查浏览器设置中的媒体权限。';
            console.error(errorMessage);
            setRecordingError(errorMessage);
            return;
          } else if (error.message && error.message.includes('display-capture')) {
            const errorMessage = '浏览器不支持屏幕录制或被安全策略阻止。请尝试在新标签页中打开此页面，或检查浏览器的媒体权限设置。';
            console.error(errorMessage);
            setRecordingError(errorMessage);
            return;
          }
          throw error;
        }
      }

      // 仅录制摄像头的情况才需要摄像头流
      if (source === 'camera-only') {
        console.log('Request camera permission for camera-only recording...');
        try {
          const cameraStream = await getCameraStream();
          cameraStreamRef.current = cameraStream;
          streams.push(cameraStream);
          console.log('Camera permission granted:', {
            videoTracks: cameraStream.getVideoTracks().length,
            audioTracks: cameraStream.getAudioTracks().length,
            active: cameraStream.active
          });
          
          // Verify camera tracks are active
          cameraStream.getVideoTracks().forEach(track => {
            console.log('Camera video track:', {
              id: track.id,
              label: track.label,
              enabled: track.enabled,
              readyState: track.readyState
            });
          });
        } catch (error: any) {
          console.error('Camera permission denied:', error);
          if (error.name === 'NotAllowedError') {
            const errorMessage = '摄像头访问权限被拒绝。请在浏览器弹窗中允许摄像头访问，或在浏览器设置中检查媒体权限。';
            console.error(errorMessage);
            setRecordingError(errorMessage);
            return;
          } else if (error.name === 'NotFoundError') {
            const errorMessage = '未找到可用的摄像头设备。请确保摄像头已连接并且没有被其他应用程序占用。';
            console.error(errorMessage);
            setRecordingError(errorMessage);
            return;
          }
          throw error;
        }
      }
      
      // 对于屏幕录制模式，根据摄像头开启状态决定使用哪种模式获取音频
      if ((source === 'screen' || source === 'both')) {
        if (includeCamera) {
          // 如果开启了摄像头，使用摄像头流获取音频和画中画视频
          console.log('Adding camera stream for audio (picture-in-picture provides video)');
          try {
            const cameraStream = await getCameraStream();
            cameraStreamRef.current = cameraStream;
            streams.push(cameraStream);
            console.log('Camera stream added successfully, includes audio tracks:', {
              videoTracks: cameraStream.getVideoTracks().length,
              audioTracks: cameraStream.getAudioTracks().length,
              active: cameraStream.active
            });
          } catch (error: any) {
            console.error('摄像头音频获取失败:', error);
            console.warn('将继续屏幕录制，但没有摄像头音频');
          }
        } else if (includeAudio) {
          // 如果关闭了摄像头但开启了音频，获取独立音频流
          console.log('Getting standalone audio stream...');
          try {
            const audioStream = await getAudioOnlyStream();
            if (audioStream) {
              streams.push(audioStream);
              console.log('Independent audio stream added successfully:', {
                audioTracks: audioStream.getAudioTracks().length
              });
            }
          } catch (error) {
            console.error('独立音频获取失败:', error);
          }
        }
      }

      if (streams.length === 0) {
        throw new Error('No streams available for recording');
      }

      let finalStream: MediaStream;
      
      if (streams.length === 1) {
        finalStream = streams[0];
        console.log('Using single stream for recording');
      } else {
        finalStream = combineStreams(streams);
        console.log('Using combined stream for recording');
      }
      
      // Verify final stream has tracks
      console.log('Final stream for recording:', {
        id: finalStream.id,
        videoTracks: finalStream.getVideoTracks().length,
        audioTracks: finalStream.getAudioTracks().length,
        active: finalStream.active
      });
      
      const browser = detectBrowserFromLib();
      
      // 浏览器兼容性增强
      const isFirefoxRecording = browser.isFirefox;
      const isSafariRecording = browser.isSafari;

      let options: MediaRecorderOptions = {};
      
      if (browser.isFirefox) {
        console.log('🤊 Firefox detected, using optimized settings...');
        
        // Firefox 兼容性检查
        const firefoxSupportedTypes = [
          'video/webm;codecs=vp8',
          'video/webm', 
          'video/mp4',
          ''
        ];
        
        for (const mimeType of firefoxSupportedTypes) {
          const isSupported = mimeType === '' || MediaRecorder.isTypeSupported(mimeType);
          console.log(`Firefox checking MIME type: ${mimeType || 'default'} - ${isSupported ? 'supported' : 'not supported'}`);
          
          if (isSupported) {
            if (mimeType) {
              options.mimeType = mimeType;
            } else {
              // Use default webm for Firefox when empty mimeType is supported
              options.mimeType = 'video/webm';
            }
            break;
          }
        }
        
        // Firefox 优化参数
        options.videoBitsPerSecond = 1000000; // 1Mbps 降低码率以提高兼容性
        if (includeAudio) {
          options.audioBitsPerSecond = 64000; // 64kbps
        }
      } else if (isSafariRecording) {
        console.log('🍎 Safari detected, using Safari compatibility settings...');
        
        // Safari 兼容性格式优先级 - 避免VP9
        const safariSupportedTypes = [
          'video/mp4',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp8', 
          'video/webm',
          ''
        ];
        
        for (const mimeType of safariSupportedTypes) {
          const isSupported = mimeType === '' || MediaRecorder.isTypeSupported(mimeType);
          console.log(`Safari checking MIME type: ${mimeType || 'default'} - ${isSupported ? 'supported' : 'not supported'}`);
          
          if (isSupported) {
            if (mimeType) {
              options.mimeType = mimeType;
            } else {
              options.mimeType = 'video/mp4';
            }
            break;
          }
        }
        
        // Safari 优化参数 - 降低码率以提高兼容性
        options.videoBitsPerSecond = quality === '1080p' ? 3000000 : 1500000;
        if (includeAudio) {
          options.audioBitsPerSecond = 128000; // Safari 音频编码优化

        }
      } else {
        // Chrome, Edge 等其他浏览器使用高质量设置
        console.log(`🌐 Other browser (${browser.name}) detected, using standard settings...`);
        
        options = {
          mimeType: 'video/webm;codecs=vp9,opus',
          videoBitsPerSecond: quality === '1080p' ? 5000000 : 2500000
        };
        
        // Fallback for browsers that don't support VP9
        if (options.mimeType && !MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm;codecs=vp8,opus';
        }
        
        // Final fallback
        if (options.mimeType && !MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }
      }
      
      console.log('🎥 MediaRecorder configuration:', {
        options,
        browserName: browser.name,
        browser: browser.name,
        isFirefox: browser.isFirefox,
        isSafari: browser.isSafari,
        streamActive: finalStream.active,
        videoTracks: finalStream.getVideoTracks().length,
        audioTracks: finalStream.getAudioTracks().length
      });

      mediaRecorderRef.current = new MediaRecorder(finalStream, options);

      // 增强的数据收集事件
      mediaRecorderRef.current.ondataavailable = (event) => {
        const timestamp = new Date().toISOString();
        console.log(`=== Data available event [${timestamp}] ===`, { 
          size: event.data.size, 
          type: event.data.type,
          browser: isFirefoxRecording ? 'Firefox' : isSafariRecording ? 'Safari' : 'Other'
        });
        
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          
          console.log('✅ Successfully collected data chunk:', {
            currentSize: event.data.size,
            totalChunks: chunksRef.current.length,
            totalSizeKB: Math.round(totalSize / 1024),
            isFirefox: isFirefoxRecording,
            isSafari: isSafariRecording,
            browser: browser.name
          });
          
          if (browser.isFirefox) {
            console.log('🤊 Firefox data collection progress:', {
              chunkIndex: chunksRef.current.length,
              chunkType: event.data.type,
              chunkSize: event.data.size,
              totalAccumulated: totalSize,
              allSizes: chunksRef.current.map(c => c.size)
            });
          }
        } else {
          console.error('❌ 收到空数据块！这是一个严重问题。');
          
          if (browser.isFirefox) {
            console.error('🤊 Firefox 检测到空数据块，可能原因:');
            console.error('1. 媒体流不活跃或已停止');
            console.error('2. 编码器不支持当前格式');
            console.error('3. Firefox 版本兼容性问题');
            
            // 检查媒体流状态
            console.log('Firefox media stream status check:', {
              streamActive: finalStream.active,
              videoTracks: finalStream.getVideoTracks().map(t => ({ label: t.label, enabled: t.enabled, readyState: t.readyState })),
              audioTracks: finalStream.getAudioTracks().map(t => ({ label: t.label, enabled: t.enabled, readyState: t.readyState }))
            });
          }
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('=== MediaRecorder stop event ===');
        console.log('📀 Available data chunks count:', chunksRef.current.length);
        console.log('📄 Data chunk size list:', chunksRef.current.map(c => c.size));
        
        if (chunksRef.current.length === 0) {
          console.error('❌ 致命错误: 没有收集到任何数据！');
          
          let errorMessage = 'Recording failed: No video data collected';
          
          if (browser.isFirefox) {
            console.error('🤊 Firefox 没有数据块，可能原因:');
            console.error('- 媒体流没有正确启动或已被停止');
            console.error('- MediaRecorder 不支持当前媒体格式');
            console.error('- Firefox 特定的权限或安全策略限制');
            console.error('- 网络或性能问题导致数据丢失');
            
            errorMessage = 'Firefox recording failed: Possible permission restriction or unsupported format, please check browser settings';
            
            // 检查 MediaRecorder 状态
            console.log('MediaRecorder status:', {
              state: mediaRecorderRef.current?.state,
              mimeType: mediaRecorderRef.current?.mimeType,
              videoBitsPerSecond: mediaRecorderRef.current?.videoBitsPerSecond,
              audioBitsPerSecond: mediaRecorderRef.current?.audioBitsPerSecond
            });
          }
          
          // 设置错误状态
          setRecordingError(errorMessage);
          setRecordingState(prev => ({ ...prev, recordedBlob: null }));
          return;
        }
        
        // 使用正确的 MIME 类型创建 blob
        const blobType = options.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        
        console.log('✅ Successfully created recording Blob:', { 
          size: blob.size, 
          type: blob.type,
          sizeInKB: Math.round(blob.size / 1024),
          sizeInMB: Math.round(blob.size / 1024 / 1024 * 100) / 100,
          chunksUsed: chunksRef.current.length,
          browser: browser.name
        });
        
        if (blob.size === 0) {
          console.warn('⚠️ 创建的 blob 大小为 0！这可能会导致预览问题。');
        }
        
        // 验证 blob 的有效性
        if (!blob || blob.size === 0) {
          const errorMsg = blob ? 'Recording failed: Generated video file is empty' : 'Recording failed: No video data generated';
          console.error('录制停止但没有生成有效的Blob数据, size:', blob?.size);
          setRecordingError(errorMsg);
          setRecordingState(prev => ({ ...prev, recordedBlob: null }));
          return;
        }
        
        if (!(blob instanceof Blob)) {
          console.error('录制数据不是有效的Blob对象:', typeof blob);
          setRecordingError('Recording failed: Data type error, please try recording again');
          setRecordingState(prev => ({ ...prev, recordedBlob: null }));
          return;
        }
        
        // 检查blob的基本有效性
        if (blob.size < 1000) { // 小于1KB可能有问题
          console.warn('警告：录制文件过小，可能存在问题, size:', blob.size);
          setRecordingError('Recording may have issues: File too small, recommend re-recording');
          // 不直接返回，让用户看到视频并决定是否重新录制
        }
        
        console.log('Recording stopped, generated Blob information:', {
          size: blob.size,
          type: blob.type,
          sizeKB: Math.round(blob.size / 1024),
          constructor: blob.constructor.name
        });
        
        // 清除之前的录制错误（如果有的话）
        if (recordingError) {
          setRecordingError(null);
        }
        
        // 立即设置 blob，不等待清理完成
        setRecordingState(prev => {
          console.log('Setting recordedBlob:', blob);
          const newState = { ...prev, recordedBlob: blob };
          
          // 不再需要localStorage备份，因为登录不会刷新页面
          console.log('Recording completed, state managed in memory');
          
          return newState;
        });
        
        console.log('Recording stopped, starting media stream cleanup...');
        
        // 全面清理所有媒体流
        if (screenStreamRef.current) {
          console.log('Stopping screen/desktop sharing stream...');
          screenStreamRef.current.getTracks().forEach(track => {
            console.log(`Stopping screen track: ${track.kind} - ${track.label}`);
            track.stop();
          });
          screenStreamRef.current = null;
        }
        
        if (cameraStreamRef.current) {
          console.log('Stopping camera stream during recording...');
          cameraStreamRef.current.getTracks().forEach(track => {
            console.log(`Stopping recording camera track: ${track.kind} - ${track.label}`);
            track.stop();
          });
          cameraStreamRef.current = null;
        }
        
        // 对于Firefox，需要特殊处理以确保全面清理
        const isFirefox = navigator.userAgent.includes('Firefox');
        if (isFirefox) {
          console.log('Firefox detected, performing enhanced cleanup...');
          
          // 尝试停止所有可能的媒体轨道
          const allTracks = [...(navigator.mediaDevices as any).getAllActiveTracks?.() || []];
          allTracks.forEach((track: MediaStreamTrack) => {
            if (track.readyState === 'live') {
              console.log(`Stopping active track: ${track.kind} - ${track.label}`);
              track.stop();
            }
          });
          
          // Firefox特殊处理：尝试停止所有活动的屏幕共享
          try {
            // 检查是否有活动的屏幕共享
            if (navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia) {
              console.log('Firefox checking and stopping all active display streams...');
              
              // 在Firefox中，尝试通过检查document.hidden和视频轨道状态来确保清理
              const videoTracks = document.querySelectorAll('video');
              videoTracks.forEach((video, index) => {
                if (video !== cameraPreviewRef.current && video.srcObject) {
                  console.log(`Stopping video element ${index} stream`);
                  const stream = video.srcObject as MediaStream;
                  if (stream) {
                    stream.getTracks().forEach(track => {
                      console.log(`Stopping video element track: ${track.kind} - ${track.label}`);
                      track.stop();
                    });
                    video.srcObject = null;
                  }
                }
              });
            }
          } catch (cleanupError) {
            console.warn('Firefox清理过程中出现非致命错误:', cleanupError);
          }
          
          // 延迟更长时间再重启摄像头预览，但不影响预览页显示
          setTimeout(() => {
            if (includeCamera) {
              console.log('Firefox delayed restart of camera preview...');
              startCameraPreview();
            }
          }, 2000); // Firefox需要更长的延迟
        } else {
          // 其他浏览器的正常处理
          console.log('Recording completed, camera picture-in-picture preview continues to stay enabled');
        }
        
        // 确保预览页能够立即显示
        console.log('Recording stopped, preview should now be available');
        
        // 对于Firefox，添加额外的状态检查和强制更新
        if (isFirefox) {
          // 多次尝试设置blob以确保Firefox正确更新状态
          const attempts = [100, 300, 600, 1000];
          attempts.forEach((delay, index) => {
            setTimeout(() => {
              console.log(`Firefox: Attempt ${index + 1} to check and set blob`);
              
              setRecordingState(prev => {
                const hasValidBlob = prev.recordedBlob && prev.recordedBlob.size > 0;
                console.log('Firefox status check:', {
                  isRecording: prev.isRecording,
                  hasBlob: !!prev.recordedBlob,
                  blobSize: prev.recordedBlob?.size || 0,
                  shouldShowPreview: hasValidBlob && !recordingState.isRecording
                });
                
                if (!hasValidBlob) {
                  console.log('Firefox: Re-setting blob');
                  return { ...prev, recordedBlob: blob };
                }
                return prev;
              });
            }, delay);
          });
        }
      };

      // Firefox 优化: 使用更短的时间片段来提高数据收集频率
      const timeSlice = browser.isFirefox ? 100 : 1000; // Firefox 使用 100ms，其他 1000ms
      console.log(`🎥 Starting recording - time slice: ${timeSlice}ms, browser: ${browser.name}`);
      
      try {
        mediaRecorderRef.current.start(timeSlice);
        console.log('✅ MediaRecorder started successfully');
      } catch (startError) {
        console.error('❌ MediaRecorder 启动失败:', startError);
        throw startError;
      }
      startTimer();
      
      // 记录开始时间
      recordingStartTimeRef.current = Date.now();
      
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: true, 
        duration: 0,
        recordedBlob: null
      }));
      
      // Start speech recognition if subtitles enabled
      if (subtitleState.isEnabled && includeAudio) {
        setTimeout(() => {
          startSpeechRecognition();
        }, 1000); // 稍微延迟以确保音频流已经建立
      }

    } catch (error) {
      console.error('Failed to start recording:', error);

    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
      // Stop speech recognition when paused
      stopSpeechRecognition();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
      // Restart speech recognition when resumed
      if (subtitleState.isEnabled && includeAudio) {
        setTimeout(() => {
          startSpeechRecognition();
        }, 500);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      console.log('Stopping recording...');
      console.log('Current recording state:', recordingState);
      console.log('Chunks before stop:', chunksRef.current.length);
      
      mediaRecorderRef.current.stop();
      stopTimer();
      
      // 立即更新录制状态
      setRecordingState(prev => {
        console.log('Updating recording state to stopped');
        return { 
          ...prev, 
          isRecording: false, 
          isPaused: false 
        };
      });
      
      // Stop speech recognition
      stopSpeechRecognition();
      
      // 重置开始时间
      recordingStartTimeRef.current = 0;
      
      // Reset time warning states
      setShowTimeWarning(false);
      setIsNearTimeLimit(false);
      
      // 对于非Firefox浏览器，在stopRecording中也重启预览
      const isFirefox = navigator.userAgent.includes('Firefox');
      if (!isFirefox) {
        setTimeout(() => {
          if (includeCamera) {
            console.log('Non-Firefox browser restarting camera preview...');
            startCameraPreview();
          }
        }, 500); // 稍微延迟以确保录制完全停止
      } else {
        console.log('Firefox detected, delayed handling of camera preview in onstop');
      }
    }
  };

  const downloadRecording = () => {
    if (recordingState.recordedBlob) {
      const url = URL.createObjectURL(recordingState.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Use user input title or default title for filename
      const finalTitle = videoTitle.trim() || getDefaultTitle();
      // Clean filename by removing invalid characters
      const cleanTitle = finalTitle.replace(/[<>:"/\|?*]/g, '-');
      a.download = `${cleanTitle}.webm`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const uploadToAppwrite = async () => {
    if (!recordingState.recordedBlob) {

      return;
    }
    
    if (!user) {

      return;
    }

    console.log('User authenticated:', {
      userId: user.id,
      userEmail: user.email,
      userName: user.name
    });

    setIsUploading(true);
    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `recording-${timestamp}.webm`;
      
      const file = new File(
        [recordingState.recordedBlob], 
        filename, 
        { type: 'video/webm' }
      );

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', videoTitle.trim() || getDefaultTitle());
      formData.append('quality', quality);
      formData.append('duration', recordingState.duration.toString());
      formData.append('isPublic', isVideoPublic.toString());
      formData.append('isPublish', isVideoPublished.toString());
      formData.append('thumbnailUrl', '');

      console.log('Uploading file using server action...');
      
      // Upload video using server action
      const result = await uploadVideoFileAction(formData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      console.log('File uploaded successfully:', result.data);

      // Handle subtitle file if subtitles were generated  
      // TODO: Add subtitle file upload to server action if needed
      if (subtitleState.segments.length > 0) {
        console.log('Note: Subtitle file upload not yet implemented in server actions');
      }
      
      console.log('✅ Recording uploaded successfully.');
      

      
      // Save uploaded video data for display
      const uploadedVideoData = { $id: result.data?.videoId, title: videoTitle.trim() || getDefaultTitle() };
      setUploadedVideo(uploadedVideoData);
      
      console.log('Upload successful, recording state managed in memory');
      
      // 在后台自动生成缩略图
      if (recordingState.recordedBlob && uploadedVideoData.$id) {
        generateThumbnailInBackground(uploadedVideoData.$id, recordingState.recordedBlob);
      }
      
      // Keep recording blob for preview, don't clear it yet
      // The blob will be cleared when starting new recording

    } catch (error: any) {
      console.error('Upload failed. Error details:', error);

    } finally {
      setIsUploading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
      {/* Recording Controls */}
      {!recordingState.isRecording && !recordingState.recordedBlob && (
        <Card>
          <CardContent className="px-6 py-1">
            <div className="space-y-4">
          {/* 第一行：录制质量和录制源 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="select-container">
              <Label className="text-sm font-medium mb-3 block">{RECORDING.recordingQuality}</Label>
              <Select value={quality} onValueChange={(value) => setQuality(value as RecordingQuality)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={RECORDING.selectRecordingQuality} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p (1280x720)</SelectItem>
                  <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="select-container">
              <Label className="text-sm font-medium mb-3 block">{RECORDING.recordingSource}</Label>
              <Select 
                value={source === 'camera-only' ? 'camera-only' : screenSource} 
                onValueChange={(value) => {
                  if (value === 'camera-only') {
                    setSource('camera-only' as RecordingSource);
                    setIncludeCamera(true); // 自动开启摄像头
                  } else {
                    // 如果之前是camera-only，现在切换到屏幕录制，需要设置为screen模式
                    if (source === 'camera-only') {
                      setSource('screen' as RecordingSource);
                    }
                    setScreenSource(value as ScreenSourceType);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={RECORDING.selectRecordingSource} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const browser = detectBrowserFromLib();
                    
                    // Chrome/Edge: 显示完整选项（屏幕、窗口、标签页、摄像头）
                    if (browser.supportsDisplaySurface) {
                      return (
                        <>
                          <SelectItem value="monitor">
                            <div className="w-full">
                              <div className="flex items-center">
                                <Monitor className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="font-medium">{RECORDING.entireScreen}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {RECORDING.entireScreenDesc}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="window">
                            <div className="w-full">
                              <div className="flex items-center">
                                <Square className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="font-medium">{RECORDING.applicationWindow}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {RECORDING.applicationWindowDesc}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="browser">
                            <div className="w-full">
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="font-medium">{RECORDING.browserTab}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {RECORDING.browserTabDesc}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="camera-only">
                            <div className="w-full">
                              <div className="flex items-center">
                                <Camera className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="font-medium">{RECORDING.cameraOnly}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {RECORDING.cameraOnlyDesc}
                              </div>
                            </div>
                          </SelectItem>
                        </>
                      );
                    } else {
                      // Safari/Firefox: 只显示系统设置和摄像头，使用多语言
                      return (
                        <>
                          <SelectItem value="monitor">
                            <div className="w-full">
                              <div className="flex items-center">
                                <Monitor className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="font-medium">{RECORDING.systemSettings}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {RECORDING.systemSettingsDesc}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="camera-only">
                            <div className="w-full">
                              <div className="flex items-center">
                                <Camera className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="font-medium">{RECORDING.cameraOnly}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {RECORDING.cameraOnlyDesc}
                              </div>
                            </div>
                          </SelectItem>
                        </>
                      );
                    }
                  })()
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 第二行：音频和摄像头控制 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {includeAudio ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                <div className="flex flex-col">
                  <Label>{RECORDING.openMicrophone}</Label>
                  <p className="text-xs text-muted-foreground">
                    {RECORDING.microphoneDescription}
                  </p>
                </div>
                {/* Microphone status indicator */}
                {includeAudio && (
                  <div 
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    title={RECORDING.microphoneEnabled}
                  ></div>
                )}
              </div>
              <Switch
                checked={includeAudio}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    // Check if we're in an iframe first
                    if (isInIframe()) {
                      const shouldOpenNewWindow = confirm(
                        DEVICES.iframeMediaBlocked + '\n\nWould you like to open this page in a new window?'
                      );
                      if (shouldOpenNewWindow) {
                        openInNewWindow();
                      }
                      setIncludeAudio(false);
                      return;
                    }
                    
                    // Check if media access is blocked (no secure context)
                    if (isMediaAccessBlocked()) {
                      alert('Microphone access requires a secure connection (HTTPS). Please use HTTPS or localhost.');
                      setIncludeAudio(false);
                      return;
                    }
                    
                    // Request microphone permission when user enables it
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      // Stop the stream immediately after getting permission
                      stream.getTracks().forEach(track => track.stop());
                      setIncludeAudio(true);
                      console.log('Microphone permission granted successfully');
                    } catch (error) {
                      console.error('Microphone permission request failed:', error);
                      setIncludeAudio(false);
                      
                      // Show user-friendly error message
                      let errorMessage: string = PERMISSIONS.microphoneDenied;
                      if (error instanceof DOMException) {
                        switch (error.name) {
                          case 'NotAllowedError':
                            errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and try again.';
                            break;
                          case 'NotFoundError':
                            errorMessage = PERMISSIONS.microphoneNotFound;
                            break;
                          case 'NotReadableError':
                            errorMessage = 'Microphone is being used by another application. Please close other applications using the microphone and try again.';
                            break;
                          default:
                            errorMessage = `Microphone error: ${error.message}`;
                        }
                      }
                      
                      // Show alert with error message
                      if (typeof window !== 'undefined') {
                        alert(errorMessage);
                      }
                    }
                  } else {
                    setIncludeAudio(false);
                  }
                }}
              />
      
      {/* Firefox specific CSS - Only show picture-in-picture button */}
      <style jsx global>{`
        /* Firefox media controls complete hiding strategy */
        .firefox-pip-video {
          position: relative !important;
          background: #000 !important;
        }
        
        /* Hide Firefox native controls through multiple methods */
        .firefox-pip-video[controls] {
          /* Try to hide the entire control bar */
        }
        
        .firefox-pip-video::-moz-media-controls {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
          -moz-appearance: none !important;
        }
        
        /* Hide Firefox control panel */
        .firefox-pip-video::-moz-media-controls-panel {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* Hide play/pause buttons */
        .firefox-pip-video::-moz-media-controls-play-button,
        .firefox-pip-video::-moz-media-controls-overlay-play-button {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* Hide time controls */
        .firefox-pip-video::-moz-media-controls-scrubber,
        .firefox-pip-video::-moz-media-controls-time-display,
        .firefox-pip-video::-moz-media-controls-current-time,
        .firefox-pip-video::-moz-media-controls-duration {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* Hide volume controls */
        .firefox-pip-video::-moz-media-controls-volume-control,
        .firefox-pip-video::-moz-media-controls-mute-button,
        .firefox-pip-video::-moz-media-controls-volume-slider {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* Hide fullscreen button */
        .firefox-pip-video::-moz-media-controls-fullscreen-button {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* Firefox latest version control structure */
        .firefox-pip-video video::-moz-media-controls,
        .firefox-pip-video::-moz-media-controls-button-panel,
        .firefox-pip-video::-moz-media-controls-statusbar {
          visibility: hidden !important;
          opacity: 0 !important;
          display: none !important;
          height: 0 !important;
        }
        
        /* Firefox 130+ new control selectors */
        .firefox-pip-video div[role="group"],
        .firefox-pip-video div[class*="control"],
        .firefox-pip-video button:not([title*="picture"]):not([title*="Picture"]) {
          visibility: hidden !important;
          opacity: 0 !important;
          display: none !important;
        }
        
        /* Show and optimize picture-in-picture button - Firefox */
        .firefox-pip-video::-moz-media-controls-picture-in-picture-button,
        .firefox-pip-video button[title*="picture"],
        .firefox-pip-video button[title*="Picture"] {
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: all !important;
          display: block !important;
          position: relative !important;
          background: rgba(0, 0, 0, 0.8) !important;
          border-radius: 6px !important;
          padding: 4px !important;
          margin: 4px !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          transition: all 0.2s ease !important;
          z-index: 9999 !important;
        }
        
        .firefox-pip-video::-moz-media-controls-picture-in-picture-button:hover {
          background: rgba(0, 0, 0, 0.9) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
          transform: scale(1.05) !important;
        }
        
        /* Hide Firefox overlay and other elements */
        .firefox-pip-video::-moz-media-controls-overlay {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* Hide other possible controls */
        .firefox-pip-video::-moz-media-controls > *:not(button[title*="Picture-in-Picture"]):not([aria-label*="Picture-in-Picture"]) {
          visibility: hidden !important;
          opacity: 0 !important;
          display: none !important;
        }
        
        /* Compatible with WebKit browsers (if Firefox uses WebKit engine) */
        .firefox-pip-video::-webkit-media-controls {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        .firefox-pip-video::-webkit-media-controls-panel {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* WebKit 播放按钮隐藏 */
        .firefox-pip-video::-webkit-media-controls-play-button,
        .firefox-pip-video::-webkit-media-controls-overlay-play-button {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* WebKit 时间轴隐藏 */
        .firefox-pip-video::-webkit-media-controls-timeline,
        .firefox-pip-video::-webkit-media-controls-timeline-container,
        .firefox-pip-video::-webkit-media-controls-current-time-display,
        .firefox-pip-video::-webkit-media-controls-time-remaining-display {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* WebKit 音量控件隐藏 */
        .firefox-pip-video::-webkit-media-controls-volume-slider,
        .firefox-pip-video::-webkit-media-controls-mute-button {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* WebKit 全屏按钮隐藏 */
        .firefox-pip-video::-webkit-media-controls-fullscreen-button {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* WebKit 画中画按钮显示 */
        .firefox-pip-video::-webkit-media-controls-picture-in-picture-button {
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: all !important;
          background: rgba(0, 0, 0, 0.8) !important;
          border-radius: 6px !important;
          padding: 4px !important;
          margin: 4px !important;
        }
      `}</style>

            </div>
            
            {/* 字幕设置 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  {subtitleState.isEnabled ? (
                    <span className="text-xs font-bold">CC</span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">CC</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <Label>{SUBTITLES.enableSubtitles}</Label>
                  {SUBTITLES.subtitleDescription && (
                    <p className="text-xs text-muted-foreground">
                      {SUBTITLES.subtitleDescription}
                    </p>
                  )}
                  {!includeAudio && (
                    <span className="text-xs text-muted-foreground">
                      {SUBTITLES.needMicrophoneForSubtitles}
                    </span>
                  )}
                </div>
                {/* 字幕状态指示器 */}
                {subtitleState.isListening && (
                  <div 
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    title={SUBTITLES.listeningForSpeech}
                  ></div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {subtitleState.isEnabled && includeAudio && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSubtitleSettings(!showSubtitleSettings)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                )}
                <Switch
                  checked={subtitleState.isEnabled}
                  onCheckedChange={(checked) => {
                    if (checked && !includeAudio) {

                      return;
                    }
                    setSubtitleState(prev => ({ ...prev, isEnabled: checked }));
                    if (!checked) {
                      stopSpeechRecognition();
                    }
                  }}
                  disabled={!includeAudio}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {includeCamera ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                <div className="flex flex-col">
                  <Label>{RECORDING.enableCamera}</Label>
                  {/* Camera not supported notification */}
                  {(screenSource === 'window' || screenSource === 'browser') && source !== 'camera-only' && (
                    <span className="text-xs text-muted-foreground">
                      {screenSource === 'window' ? RECORDING.windowNotSupportCamera : RECORDING.browserTabNotSupportCamera}
                    </span>
                  )}
                </div>
                {/* Camera status indicator */}
                {includeCamera && cameraPreviewStream && (
                  <div 
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    title={RECORDING.cameraEnabled}
                  ></div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={includeCamera}
                  onCheckedChange={async (checked) => {
                    // When only camera recording is selected, don't allow turning off camera
                    if (source === 'camera-only' && !checked) {
                      return; // Don't allow turning off
                    }
                    
                    if (checked) {
                      // Check if we're in an iframe first
                      if (isInIframe()) {
                        const shouldOpenNewWindow = confirm(
                          DEVICES.iframeMediaBlocked + '\n\nWould you like to open this page in a new window?'
                        );
                        if (shouldOpenNewWindow) {
                          openInNewWindow();
                        }
                        setIncludeCamera(false);
                        return;
                      }
                      
                      // Check if media access is blocked (no secure context)
                      if (isMediaAccessBlocked()) {
                        alert('Camera access requires a secure connection (HTTPS). Please use HTTPS or localhost.');
                        setIncludeCamera(false);
                        return;
                      }
                      
                      // Request camera permission when user enables it
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        // Stop test stream immediately, actual stream will be obtained in startCameraPreview
                        stream.getTracks().forEach(track => track.stop());
                        setIncludeCamera(true);
                        console.log('Camera permission granted successfully');
                      } catch (error) {
                        console.error('Camera permission request failed:', error);
                        setIncludeCamera(false);
                        
                        // Show user-friendly error message
                        let errorMessage: string = PERMISSIONS.cameraDenied;
                        if (error instanceof DOMException) {
                          switch (error.name) {
                            case 'NotAllowedError':
                              errorMessage = 'Camera access denied. Please allow camera access in your browser settings and try again.';
                              break;
                            case 'NotFoundError':
                              errorMessage = PERMISSIONS.cameraNotFound;
                              break;
                            case 'NotReadableError':
                              errorMessage = 'Camera is being used by another application. Please close other applications using the camera and try again.';
                              break;
                            default:
                              errorMessage = `Camera error: ${error.message}`;
                          }
                        }
                        
                        // Show alert with error message
                        if (typeof window !== 'undefined') {
                          alert(errorMessage);
                        }
                      }
                    } else {
                      setIncludeCamera(false);
                    }
                  }}
                  disabled={
                    source === 'camera-only' || // Disable switching when only recording camera
                    (screenSource === 'window' || screenSource === 'browser') // Application windows and browser tabs don't support camera
                  }
                />
              </div>
            </div>
            
            {/* 字幕设置面板 */}
            {showSubtitleSettings && subtitleState.isEnabled && includeAudio && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {SUBTITLES.subtitleLanguage}
                  </Label>
                  <Select
                    value={subtitleState.language}
                    onValueChange={(value) => {
                      setSubtitleState(prev => ({ ...prev, language: value }));
                      // 重新初始化语音识别以应用新语言
                      if (subtitleState.isListening) {
                        stopSpeechRecognition();
                        setTimeout(() => {
                          if (recordingState.isRecording && includeAudio) {
                            startSpeechRecognition();
                          }
                        }, 500);
                      }
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="ja-JP">Japanese</SelectItem>
                      <SelectItem value="ko-KR">Korean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {SUBTITLES.subtitleInfo}
                </div>
              </div>
            )}
          </div>
          
          {/* Start Recording Button */}
          <div className="pt-4">
            <Button onClick={startRecording} className="w-full" size="lg">
              <Circle className="h-5 w-5 mr-2 fill-current" />
              {RECORDING.start}
            </Button>
          </div>
            </div>
          </CardContent>
        </Card>
      )}


      

      
      {/* 摄像头预览视频元素 - 根据画中画支持动态显示/隐藏 */}
      <video
        ref={cameraPreviewRef}
        className={`${detectPiPSupport().canAutoStart ? 'hidden' : cameraPreviewStream ? 'block' : 'hidden'} w-64 h-48 bg-black rounded-lg border border-gray-300 dark:border-gray-600 ${detectPiPSupport().browser === 'Safari' || detectPiPSupport().browser === 'Firefox' ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''} ${detectPiPSupport().browser === 'Firefox' ? 'firefox-pip-video' : ''} relative`}
        autoPlay
        muted
        playsInline
        controls={detectPiPSupport().browser === 'Firefox'} // 只有Firefox显示原生控件以便使用画中画按钮
        controlsList={detectPiPSupport().browser === 'Firefox' ? 'nodownload nofullscreen noremoteplayback noplaybackrate' : undefined} // Firefox尽可能隐藏其他控件
        onClick={async (e) => {
          // 直接点击视频元素启动画中画（适用于Safari等需要用户手势的浏览器）
          const pipSupport = detectPiPSupport();
          
          if (pipSupport.browser === 'Firefox') {
            // Firefox也支持点击视频启动画中画，同时保留控件中的画中画按钮
            console.log('Firefox click video to try starting picture-in-picture');
            // 继续执行下面的逻辑，不return
          }
          
          e.preventDefault();
          if (cameraPreviewStream && !document.pictureInPictureElement && !isPiPRequesting) {
            console.log(`${pipSupport.browser} click video to try starting picture-in-picture`);
            
            if (pipSupport.supported && typeof cameraPreviewRef.current?.requestPictureInPicture === 'function') {
              try {
                setIsPiPRequestingWithTimeout(true);
                await cameraPreviewRef.current.requestPictureInPicture();
                console.log(`${pipSupport.browser} click video picture-in-picture started successfully`);

              } catch (error: any) {
                console.error(`${pipSupport.browser}点击视频启动失败:`, error);
                if (pipSupport.browser === 'Safari') {

                } else if (pipSupport.browser === 'Firefox') {

                } else {

                }
              } finally {
                setIsPiPRequestingWithTimeout(false);
              }
            } else if (!pipSupport.supported) {
              // Browser does not support Picture in Picture
            }
          }
        }}
        onLoadedData={() => console.log('Video data loading completed')}
        onCanPlay={() => console.log('视频可以播放')}
        onError={(e) => console.error('视频元素错误:', e)}
        disablePictureInPicture={detectPiPSupport().browser !== 'Firefox' && detectPiPSupport().browser !== 'Chrome'} // 只为Firefox和Chrome启用画中画
      />
      
      {/* 画中画引导提示 - 根据浏览器显示不同内容 */}
      {(() => {
        const pipSupport = detectPiPSupport();
        const shouldShow = cameraPreviewStream && !pipSupport.canAutoStart && (
          pipSupport.supported || pipSupport.browser === 'Firefox'
        );
        return shouldShow;
      })() && (
        <Card className="mt-4 border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10">
          <CardContent className="px-6 py-1">
            <div className="flex items-start space-x-3">
              <ExternalLink className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {detectPiPSupport().browser === 'Safari' ? (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      点击上方视频启用画中画
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      启用画中画后可在其他应用中录制摄像头
                    </p>
                  </div>
                ) : detectPiPSupport().browser === 'Firefox' ? (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      点击上方视频中的按钮启用画中画
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      启用画中画后可在其他应用中录制摄像头
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      启用画中画预览
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      点击上方视频或下方按钮启用画中画模式。
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startPictureInPictureManually}
                      disabled={isPiPRequesting || !!document.pictureInPictureElement}
                      className="bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40 text-primary hover:bg-primary/20 dark:hover:bg-primary/30"
                    >
                      {isPiPRequesting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          启动中...
                        </span>
                      ) : document.pictureInPictureElement ? (
                        '画中画已启动'
                      ) : (
                        <span className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          启动画中画
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Status */}
      {recordingState.isRecording && (
        <Card className={`transition-colors ${
          isNearTimeLimit 
            ? 'border-orange-300 dark:border-orange-700' 
            : ''
        }`}>
          <CardContent className="px-6 py-1 space-y-3">
            {/* Main Status Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    isNearTimeLimit ? 'bg-orange-500' : 'bg-primary'
                  }`}></div>
                  <span className="font-medium">
                    {recordingState.isPaused ? RECORDING.paused : RECORDING.recordingStatus}
                  </span>
                </div>
                <span className={`font-mono text-lg ${
                  isNearTimeLimit ? 'text-orange-600 dark:text-orange-400 font-bold' : ''
                }`}>
                  {formatDuration(recordingState.duration)}
                </span>
                {recordingConfig.enableTimeLimit && (
                  <span className="text-sm text-muted-foreground">
                    / {formatDuration(recordingConfig.maxDurationSeconds)}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {!recordingState.isPaused ? (
                  <Button size="sm" variant="outline" onClick={pauseRecording}>
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={resumeRecording}>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" onClick={stopRecording}>
                  <StopCircle className="h-4 w-4 mr-1" />
                  {RECORDING.stop}
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            {recordingConfig.enableTimeLimit && (
              <div className="w-full">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isNearTimeLimit 
                        ? 'bg-orange-500 dark:bg-orange-400' 
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min((recordingState.duration / recordingConfig.maxDurationSeconds) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                {isNearTimeLimit && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 text-center">
                    {RECORDING.recordingWillStopAt()}
                  </p>
                )}
              </div>
            )}
            
            {/* 字幕实时显示 */}
            {subtitleState.isEnabled && includeAudio && (
              <div className="bg-black/80 rounded-lg p-3 min-h-[60px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-blue-400 font-medium">
                    {SUBTITLES.liveSubtitles}
                  </span>
                  {subtitleState.isListening && (
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-400">
                        {SUBTITLES.listening}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="text-white text-sm leading-relaxed">
                  {subtitleState.currentText && (
                    <p className="text-gray-300 italic">
                      {subtitleState.currentText}
                    </p>
                  )}
                  
                  {subtitleState.segments.slice(-3).map((segment, index) => (
                    <p key={segment.id} className={`mb-1 ${
                      index === subtitleState.segments.slice(-3).length - 1 
                        ? 'text-white font-medium' 
                        : 'text-gray-400'
                    }`}>
                      <span className="text-xs text-gray-500 mr-2">
                        {formatDuration(segment.startTime)}
                      </span>
                      {segment.text}
                    </p>
                  ))}
                  
                  {!subtitleState.isListening && subtitleState.segments.length === 0 && !subtitleState.currentText && (
                    <p className="text-gray-500 text-center text-xs">
                      {SUBTITLES.waitingForSpeech}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}





      {/* Recording Error Display */}
      {recordingError && (
        <Card className="border-destructive/50">
          <CardContent className="px-6 py-1">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-destructive text-xl">⚠️</span>
              </div>
              <h3 className="font-medium text-destructive mb-2">Recording Error</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {recordingError}
              </p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  <p>Suggested Solutions:</p>
                  <ul className="text-left mt-2 space-y-1">
                    <li>• Check browser permission settings</li>
                    <li>• Ensure the correct recording source is selected</li>
                    <li>• Restart the recording</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => {
                    setRecordingError(null);
                    startNewRecording();
                  }}
                  className="mt-4"
                >
                  Retry Recording
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Complete - Not Uploaded Yet */}
      {recordingState.recordedBlob && !uploadedVideo && !recordingError && (
        <Card>
          <CardContent className="px-6 py-1">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium">{RECORDING.recordingComplete}</h3>
                <p className="text-sm text-muted-foreground">
                  {RECORDING.duration}: {formatDuration(recordingState.duration)}
                </p>
              </div>
              
              {/* Video Preview */}
              <div className="space-y-3">
                <div className="mx-auto max-w-md">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <RestoreableVideo 
                      blob={recordingState.recordedBlob}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

              </div>
              
              {/* Video Title Input */}
              <div>
                <Label htmlFor="videoTitle" className="text-sm font-medium mb-2 block">
                  {RECORDING.videoTitle}
                </Label>
                <Input
                  id="videoTitle"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder={getDefaultTitle()}
                  className="w-full"
                />
              </div>
              
              {/* Public/Private and Publish to Discovery Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      {RECORDING.publicVideo}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isVideoPublic ? RECORDING.publicVideoDesc : RECORDING.privateVideoDesc}
                    </p>
                  </div>
                  <Switch
                    checked={isVideoPublic}
                    onCheckedChange={setIsVideoPublic}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      {VIDEOS.publishToDiscovery}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isVideoPublished ? PUBLISH.publishedDescription : PUBLISH.unpublishedDescription}
                    </p>
                  </div>
                  <Switch
                    checked={isVideoPublished}
                    onCheckedChange={setIsVideoPublished}
                  />
                </div>
              </div>
              

              
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" onClick={downloadRecording}>
                  <Download className="h-4 w-4 mr-2" />
                  {RECORDING.download}
                </Button>
                
                {/* Upload button - temporarily disabled */}
                {user ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" disabled={true}>
                        <Upload className="h-4 w-4 mr-2" />
                        {RECORDING.upload}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {RECORDING.uploadNotSupported}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" disabled={true}>
                        <Upload className="h-4 w-4 mr-2" />
                        {RECORDING.upload}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {RECORDING.uploadNotSupported}
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* 字幕下载按钮 */}
                {subtitleState.segments.length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadSubtitles('srt')}
                    >
                      SRT
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadSubtitles('vtt')}
                    >
                      VTT
                    </Button>
                  </>
                )}
              </div>
              
              <div className="text-center">
                <Button onClick={startNewRecording}>
                  {RECORDING.startNewRecording}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Recording Uploaded - Show Preview and Share Options */}
      {uploadedVideo && recordingState.recordedBlob && (
        <Card>
          <CardContent className="px-6 py-1">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-green-600">{RECORDING.uploadSuccess}</h3>
                <p className="text-sm text-muted-foreground">
                  {uploadedVideo.title}
                </p>
              </div>
              
              {/* Video Preview */}
              <div className="mx-auto max-w-md">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    src={URL.createObjectURL(recordingState.recordedBlob)}
                  />
                </div>
              </div>
              

              
              {/* Share URL Display */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{RECORDING.shareLink}</Label>
                <div className="flex space-x-2">
                  <Input
                    readOnly
                    value={getShareUrl(uploadedVideo.$id)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyShareLink(uploadedVideo.$id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" onClick={downloadRecording}>
                  <Download className="h-4 w-4 mr-2" />
                  {RECORDING.download}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => shareVideo(uploadedVideo)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {RECORDING.shareVideo}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const shareUrl = getShareUrl(uploadedVideo.$id);
                    window.open(shareUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {RECORDING.viewVideo}
                </Button>
                
                {/* 字幕下载按钮 */}
                {subtitleState.segments.length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadSubtitles('srt')}
                    >
                      SRT
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadSubtitles('vtt')}
                    >
                      VTT
                    </Button>
                  </>
                )}
              </div>
              
              <div className="text-center">
                <Button onClick={startNewRecording}>
                  {RECORDING.startNewRecording}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 登录弹窗 */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          // 登录成功后可以在这里做一些操作
          console.log('登录成功！');
        }}
      />

      </div>
    </TooltipProvider>
  );
}