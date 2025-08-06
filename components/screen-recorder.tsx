'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

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
  StopCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/lib/i18n';
import { recordingConfig } from '@/lib/config';
import { uploadVideoFileAction } from '@/app/actions/video-actions';
import { generateThumbnailOnUploadAction } from '@/app/actions/thumbnail-actions';
import { getFileUrlAction } from '@/app/actions/video-actions';

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

export default function ScreenRecorder() {
  const { user } = useAuth();
  const { t } = useI18n();
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
  const [uploadedVideo, setUploadedVideo] = useState<any>(null); // Store uploaded video data
  const [toastMessage, setToastMessage] = useState<string | null>(null); // Toast message state
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
        console.log('PiP请求超时，自动清理状态');
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
  
  // Show toast message
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000); // Hide after 3 seconds
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
    setUploadedVideo(null);
    setToastMessage(null);
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
      showToast(t.subtitles.speechNotSupported || '浏览器不支持语音识别功能');
      return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = subtitleState.language;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('语音识别已启动');
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
        showToast(t.subtitles.microphonePermissionNeeded || '需要麦克风权限才能生成字幕');
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
      console.log('语音识别结束');
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
      showToast(t.subtitles.recognitionStartFailed || '语音识别启动失败');
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
      showToast(t.subtitles.noSubtitlesToExport || '没有字幕可以导出');
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
    
    showToast(t.subtitles.subtitlesExported || `字幕已导出为 ${format.toUpperCase()} 格式`);
  };
  
  const getShareUrl = (videoId: string) => {
    return `${window.location.origin}/share/${videoId}`;
  };
  
  const copyShareLink = async (videoId: string) => {
    const shareUrl = getShareUrl(videoId);
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(t.recording.linkCopied);
    } catch (error) {
      console.error(t.recording.copyFailed, error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(t.recording.linkCopied);
    }
  };
  
  const shareVideo = async (video: any) => {
    const shareUrl = getShareUrl(video.$id);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `${t.recording.watchVideo}: ${video.title}`,
          url: shareUrl,
        });
        // 原生分享成功，不显示消息
      } catch (error) {
        // 用户取消分享或其他错误，不作任何操作
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('分享取消或失败:', error.message);
        }
      }
    } else {
      // 浏览器不支持原生分享，显示提示消息
      showToast(t.recording.unsupportedBrowserShare);
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
      console.log('组件还未完全挂载，跳过摄像头预览');
      return;
    }
    
    console.log('摄像头状态变化:', { includeCamera, isRecording: recordingState.isRecording, isMounted });
    
    if (includeCamera) {
      // 开启摄像头时启动预览（录制时也保持开启）
      if (!cameraPreviewStream) {
        console.log('启动摄像头预览...');
        startCameraPreview();
      } else if (recordingState.isRecording) {
        console.log('录制中，保持摄像头画中画开启...');
      }
    } else {
      // 关闭摄像头时停止预览
      console.log('停止摄像头预览...');
      stopCameraPreview();
    }
  }, [includeCamera, recordingState.isRecording, isMounted]);

  // 自动关闭摄像头当选择不支持的录制源时
  useEffect(() => {
    if ((screenSource === 'window' || screenSource === 'browser') && 
        source !== 'camera-only' && 
        includeCamera) {
      console.log(`如选择${screenSource === 'window' ? '应用窗口' : '浏览器标签页'}，自动关闭摄像头`);
      setIncludeCamera(false);
    }
  }, [screenSource, source, includeCamera]);

  // 组件挂载状态管理
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      stopCameraPreview();
    };
  }, []);

  // 状态变化监控 - 用于调试Firefox问题
  useEffect(() => {
    console.log('=== RecordingState 变化 ===', {
      isRecording: recordingState.isRecording,
      isPaused: recordingState.isPaused,
      hasBlob: !!recordingState.recordedBlob,
      blobSize: recordingState.recordedBlob?.size || 0,
      duration: recordingState.duration,
      timestamp: new Date().toISOString()
    });
    
    if (recordingState.recordedBlob && !recordingState.isRecording) {
      console.log('🎆 录制完成！预览页应该显示。');
      console.log('Blob 详情:', {
        size: recordingState.recordedBlob.size,
        type: recordingState.recordedBlob.type,
        sizeInKB: Math.round(recordingState.recordedBlob.size / 1024)
      });
      
      // 检查预览页显示条件
      const shouldShowPreview = recordingState.recordedBlob && !uploadedVideo;
      console.log('预览页显示条件:', {
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
            showToast(t.recording.timeLimitWarning);
          }
          
          // Stop recording when time limit is reached
          if (newDuration >= recordingConfig.maxDurationSeconds) {
            stopRecording();
            showToast(t.recording.timeLimitReached);
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
  const detectPiPSupport = useCallback(() => {
    // 检测浏览器类型
    const isFirefox = navigator.userAgent.includes('Firefox');
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    const isChrome = navigator.userAgent.includes('Chrome');
    
    // 对Firefox做特殊处理 - Firefox可能不提供document.pictureInPictureEnabled
    let supported = false;
    
    if (isFirefox) {
      // Firefox: Firefox有原生画中画按钮，不依赖JS API
      // Firefox的画中画是通过视频控件实现，而不是通过requestPictureInPicture API
      const userAgent = navigator.userAgent;
      const firefoxVersionMatch = userAgent.match(/Firefox\/(\d+)/);
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
      canAutoStart: isChrome, // 只有Chrome支持自动启动
      needsUserInteraction: isSafari || isFirefox,
      browser: isFirefox ? 'Firefox' : isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Other'
    };
  }, []);
  
  // 启动摄像头预览 - 重写画中画逻辑
  const startCameraPreview = async () => {
    console.log('开始启动摄像头预览...');
    
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能');
      }

      console.log('请求摄像头权限...');
      
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
        console.log('尝试理想设置:', idealConstraints);
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
          console.log('尝试基本设置:', basicConstraints);
          stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        } catch (secondError) {
          console.warn('基本设置失败，尝试最简单设置:', secondError);
          
          // 第三次尝试：最简单设置
          const minimalConstraints: MediaStreamConstraints = {
            video: true,
            audio: false
          };
          console.log('尝试最简单设置:', minimalConstraints);
          stream = await navigator.mediaDevices.getUserMedia(minimalConstraints);
        }
      }
      
      console.log('摄像头流获取成功:', {
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
          console.log('设置视频元素...');
          cameraPreviewRef.current.srcObject = stream;
          
          // 根据画中画支持情况决定显示策略
          if (!pipSupport.supported) {
            // 不支持画中画，显示普通视频预览
            console.log('浏览器不支持画中画，显示普通视频预览');
            showToast('摄像头预览已启动（普通模式）');
          } else if (pipSupport.canAutoStart) {
            // Chrome - 尝试自动启动画中画
            cameraPreviewRef.current.onloadedmetadata = async () => {
              console.log('Chrome检测到，尝试自动启动画中画');
              try {
                if (!document.pictureInPictureElement && !isPiPRequesting) {
                  setIsPiPRequestingWithTimeout(true);
                  await cameraPreviewRef.current!.requestPictureInPicture();
                  console.log('Chrome画中画自动启动成功');
                  showToast('摄像头画中画预览已启动');
                }
              } catch (error: any) {
                console.log('Chrome自动启动失败，回退到手动模式:', error.message);
                showToast('摄像头预览已启动，请点击按钮启用画中画');
              } finally {
                setIsPiPRequestingWithTimeout(false);
              }
            };
          } else {
            // Safari/Firefox - 显示引导信息
            console.log(`${pipSupport.browser}检测到，需要用户手动启动画中画`);
            showToast(`摄像头预览已启动，请点击下方按钮启用画中画`);
          }
          
          // 设置通用事件监听器
          cameraPreviewRef.current.onenterpictureinpicture = () => {
            console.log('进入画中画模式');
            setIsPiPRequestingWithTimeout(false);
          };
          
          cameraPreviewRef.current.onleavepictureinpicture = () => {
            console.log('退出画中画模式');
            setIsPiPRequestingWithTimeout(false);
          };
          
          cameraPreviewRef.current.onerror = (e) => {
            console.error('视频元素错误:', e);
          };
          
          // 播放视频
          cameraPreviewRef.current.play().then(() => {
            console.log('视频播放成功');
          }).catch((playError) => {
            console.error('视频播放失败:', playError);
          });
          
        } else if (retryCount < maxRetries) {
          console.log(`视频元素还未渲染，稍后重试 (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => {
            setupVideoElement(retryCount + 1);
          }, 200);
        } else {
          console.error('达到最大重试次数，放弃设置视频元素');
          showToast('摄像头预览初始化失败，请稍后重试');
        }
      };
      
      setupVideoElement();
      
    } catch (error: any) {
      console.error('摄像头预览启动失败:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      let errorMessage = '无法启动摄像头预览';
      if (error.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝，请允许摄像头访问';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '摄像头正被其他应用程序使用';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = `摄像头不支持请求的设置（${error.constraint}），已自动降级，请重试`;
      } else if (error.name === 'TypeError') {
        errorMessage = '浏览器不支持摄像头功能或缺少必要的权限';
      }
      
      showToast(errorMessage);
    }
  };

  // 手动启动画中画模式 - 重写支持所有浏览器
  const startPictureInPictureManually = async () => {
    if (!cameraPreviewRef.current || !cameraPreviewStream) {
      showToast('请先开启摄像头预览');
      return;
    }

    if (document.pictureInPictureElement) {
      showToast('画中画已经在运行中');
      return;
    }

    if (isPiPRequesting) {
      showToast('画中画请求正在进行中，请稍后...');
      return;
    }
    
    // 检测浏览器和画中画支持
    const pipSupport = detectPiPSupport();
    
    if (!pipSupport.supported) {
      showToast('当前浏览器不支持画中画功能');
      return;
    }
    
    // Firefox特别检查 - 确保可用
    if (pipSupport.browser === 'Firefox') {
      // 检查Firefox版本和设置
      const userAgent = navigator.userAgent;
      const firefoxVersionMatch = userAgent.match(/Firefox\/(\d+)/);
      const firefoxVersion = firefoxVersionMatch ? parseInt(firefoxVersionMatch[1]) : 0;
      
      if (firefoxVersion < 71) {
        showToast('Firefox 71+才支持画中画功能，请更新浏览器');
        return;
      }
      
      if (!document.pictureInPictureEnabled) {
        showToast('Firefox画中画被禁用，请在about:config中检查media.videocontrols.picture-in-picture.enabled');
        return;
      }
    }
    
    // 确保video元素有requestPictureInPicture方法
    if (typeof cameraPreviewRef.current.requestPictureInPicture !== 'function') {
      console.error('video元素缺少requestPictureInPicture方法');
      if (pipSupport.browser === 'Firefox') {
        showToast('Firefox画中画API不可用，请检查浏览器设置或更新版本');
      } else {
        showToast(`${pipSupport.browser}浏览器画中画API不可用，请更新浏览器`);
      }
      return;
    }

    console.log(`开始${pipSupport.browser}浏览器手动画中画启动`);
    setIsPiPRequestingWithTimeout(true);
    
    try {
      await cameraPreviewRef.current.requestPictureInPicture();
      console.log('手动启动画中画成功');
      showToast('画中画模式已启动');
    } catch (error: any) {
      console.error('手动启动画中画失败:', error);
      
      // 浏览器特定错误处理
      if (error.name === 'NotAllowedError') {
        if (pipSupport.browser === 'Safari') {
          showToast('Safari需要用户直接与视频交互，请点击上方视频画面');
        } else if (pipSupport.browser === 'Firefox') {
          showToast('Firefox请使用视频右下角的原生画中画按钮');
        } else {
          showToast('浏览器阻止了画中画请求，请检查权限设置');
        }
      } else if (error.name === 'InvalidStateError') {
        if (pipSupport.browser === 'Firefox') {
          showToast('Firefox请使用视频控件的画中画按钮');
        } else {
          showToast('视频状态不正确，请稍后重试');
        }
      } else if (error.message.includes('processing')) {
        showToast('画中画请求正在处理中，请稍等片刻');
      } else if (error.name === 'NotSupportedError') {
        showToast(`${pipSupport.browser}不支持该视频类型的画中画`);
      } else {
        showToast(`画中画启动失败: ${error.message}`);
      }
    } finally {
      setIsPiPRequestingWithTimeout(false);
    }
  };

  // 停止摄像头预览 - 退出画中画模式
  const stopCameraPreview = async () => {
    console.log('停止摄像头画中画预览...');
    
    try {
      // 所有模式都尝试退出画中画模式
      if (document.pictureInPictureElement) {
        console.log('退出画中画模式...');
        await document.exitPictureInPicture();
        console.log('画中画模式退出成功');
      }
    } catch (error) {
      console.warn('退出画中画模式失败:', error);
      // 不阻塞后续清理操作
    }
    
    if (cameraPreviewStream) {
      console.log('停止摄像头流...');
      cameraPreviewStream.getTracks().forEach(track => {
        console.log('停止轨道:', track.label);
        track.stop();
      });
      setCameraPreviewStream(null);
    }
    
    if (cameraPreviewRef.current) {
      console.log('清理画中画视频元素...');
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
    

    
    console.log('摄像头画中画预览停止完成');
  };

  const getScreenStream = async (): Promise<MediaStream> => {
    const constraints = getQualityConstraints(quality);
    
    // Configure display media constraints based on screen source type
    const displayConstraints: any = {
      video: {
        ...constraints,
        frameRate: { ideal: 30, max: 60 }
      },
      audio: includeAudio // 支持独立的音频控制
    };
    
    console.log('屏幕音频状态:', includeAudio ? '开启' : '关闭');

    // Add source-specific constraints using proper MediaTrackConstraints
    if (screenSource === 'window') {
      console.log('Requesting window capture...');
      // @ts-ignore - Chrome/Edge experimental API
      if ('getDisplayMedia' in navigator.mediaDevices) {
        displayConstraints.video = {
          ...displayConstraints.video,
          // @ts-ignore
          displaySurface: 'window'
        };
      }
    } else if (screenSource === 'browser') {
      console.log('Requesting browser tab capture...');
      // @ts-ignore - Chrome/Edge experimental API  
      if ('getDisplayMedia' in navigator.mediaDevices) {
        displayConstraints.video = {
          ...displayConstraints.video,
          // @ts-ignore
          displaySurface: 'browser'
        };
      }
    } else {
      console.log('Requesting monitor capture...');
      // @ts-ignore - Chrome/Edge experimental API
      if ('getDisplayMedia' in navigator.mediaDevices) {
        displayConstraints.video = {
          ...displayConstraints.video,
          // @ts-ignore
          displaySurface: 'monitor'
        };
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
            monitor: '整个屏幕',
            window: '应用窗口', 
            browser: '浏览器标签页'
          };
          console.log(`实际捕获类型: ${surfaceMap[surfaceType] || surfaceType}`);
          
          // Show user what's actually being captured
          const actualType = surfaceMap[surfaceType] || surfaceType;
          const expectedType = surfaceMap[screenSource] || screenSource;
          
          if (surfaceType !== screenSource) {
            console.warn(`用户选择: ${expectedType}, 实际捕获: ${actualType}`);
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
      console.log('获取独立音频流...');
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      
      console.log('音频流获取成功:', {
        id: audioStream.id,
        audioTracks: audioStream.getAudioTracks().length
      });
      
      return audioStream;
    } catch (error) {
      console.error('音频流获取失败:', error);
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
      // 录制时保持画中画开启，屏幕录制会包含画中画内容
      console.log('开始录制，保持摄像头画中画开启...');
      
      chunksRef.current = [];
      const streams: MediaStream[] = [];

      // Request permissions and get streams based on source
      if (source === 'screen' || source === 'both') {
        const sourceNames: Record<string, string> = {
          monitor: '整个屏幕',
          window: '应用窗口',
          browser: '浏览器标签页'
        };
        
        console.log(`请求屏幕录制权限 (${sourceNames[screenSource]})...`);
        try {
          const screenStream = await getScreenStream();
          screenStreamRef.current = screenStream;
          streams.push(screenStream);
          console.log(`屏幕录制权限获取成功 - 目标: ${sourceNames[screenSource]}`);
        } catch (error: any) {
          console.error('Screen recording permission denied:', error);
          if (error.name === 'NotAllowedError') {
            showToast(t.permissions.screenDenied);
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
            showToast(t.permissions.cameraDenied);
            return;
          } else if (error.name === 'NotFoundError') {
            showToast(t.permissions.cameraNotFound);
            return;
          }
          throw error;
        }
      }
      
      // 对于屏幕录制模式，根据摄像头开启状态决定使用哪种模式获取音频
      if ((source === 'screen' || source === 'both')) {
        if (includeCamera) {
          // 如果开启了摄像头，使用摄像头流获取音频和画中画视频
          console.log('添加摄像头流以获取音频（画中画提供视频）');
          try {
            const cameraStream = await getCameraStream();
            cameraStreamRef.current = cameraStream;
            streams.push(cameraStream);
            console.log('摄像头流添加成功，包含音频轨道:', {
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
          console.log('获取独立音频流...');
          try {
            const audioStream = await getAudioOnlyStream();
            if (audioStream) {
              streams.push(audioStream);
              console.log('独立音频流添加成功:', {
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
      
      // Firefox 兼容性增强
      const isFirefoxRecording = navigator.userAgent.includes('Firefox');
      let options: MediaRecorderOptions = {};
      
      if (isFirefoxRecording) {
        console.log('🤊 Firefox 检测到，使用优化设置...');
        
        // Firefox 兼容性检查
        const firefoxSupportedTypes = [
          'video/webm;codecs=vp8',
          'video/webm', 
          'video/mp4',
          ''
        ];
        
        for (const mimeType of firefoxSupportedTypes) {
          const isSupported = mimeType === '' || MediaRecorder.isTypeSupported(mimeType);
          console.log(`Firefox 检查 MIME 类型: ${mimeType || 'default'} - ${isSupported ? '支持' : '不支持'}`);
          
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
      } else {
        // 其他浏览器使用高质量设置
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
      
      console.log('🎥 MediaRecorder 配置:', {
        options,
        isFirefox: isFirefoxRecording,
        streamActive: finalStream.active,
        videoTracks: finalStream.getVideoTracks().length,
        audioTracks: finalStream.getAudioTracks().length
      });

      mediaRecorderRef.current = new MediaRecorder(finalStream, options);

      // 增强的数据收集事件
      mediaRecorderRef.current.ondataavailable = (event) => {
        const timestamp = new Date().toISOString();
        console.log(`=== 数据可用事件 [${timestamp}] ===`, { 
          size: event.data.size, 
          type: event.data.type,
          browser: isFirefoxRecording ? 'Firefox' : 'Other'
        });
        
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          
          console.log('✅ 成功收集数据块:', {
            currentSize: event.data.size,
            totalChunks: chunksRef.current.length,
            totalSizeKB: Math.round(totalSize / 1024),
            isFirefox: isFirefoxRecording
          });
          
          if (isFirefoxRecording) {
            console.log('🤊 Firefox 数据收集进展:', {
              chunkIndex: chunksRef.current.length,
              chunkType: event.data.type,
              chunkSize: event.data.size,
              totalAccumulated: totalSize,
              allSizes: chunksRef.current.map(c => c.size)
            });
          }
        } else {
          console.error('❌ 收到空数据块！这是一个严重问题。');
          
          if (isFirefoxRecording) {
            console.error('🤊 Firefox 检测到空数据块，可能原因:');
            console.error('1. 媒体流不活跃或已停止');
            console.error('2. 编码器不支持当前格式');
            console.error('3. Firefox 版本兼容性问题');
            
            // 检查媒体流状态
            console.log('Firefox 媒体流状态检查:', {
              streamActive: finalStream.active,
              videoTracks: finalStream.getVideoTracks().map(t => ({ label: t.label, enabled: t.enabled, readyState: t.readyState })),
              audioTracks: finalStream.getAudioTracks().map(t => ({ label: t.label, enabled: t.enabled, readyState: t.readyState }))
            });
          }
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('=== MediaRecorder 停止事件 ===');
        console.log('📀 可用数据块数量:', chunksRef.current.length);
        console.log('📄 数据块大小列表:', chunksRef.current.map(c => c.size));
        
        if (chunksRef.current.length === 0) {
          console.error('❌ 致命错误: 没有收集到任何数据！');
          
          if (isFirefoxRecording) {
            console.error('🤊 Firefox 没有数据块，可能原因:');
            console.error('- 媒体流没有正确启动或已被停止');
            console.error('- MediaRecorder 不支持当前媒体格式');
            console.error('- Firefox 特定的权限或安全策略限制');
            console.error('- 网络或性能问题导致数据丢失');
            
            // 检查 MediaRecorder 状态
            console.log('MediaRecorder 状态:', {
              state: mediaRecorderRef.current?.state,
              mimeType: mediaRecorderRef.current?.mimeType,
              videoBitsPerSecond: mediaRecorderRef.current?.videoBitsPerSecond,
              audioBitsPerSecond: mediaRecorderRef.current?.audioBitsPerSecond
            });
          }
          
          // 为了避免完全失败，创建一个空 blob
          console.warn('⚠️ 创建空 blob 作为备用方案');
          const emptyBlob = new Blob([], { type: options.mimeType || 'video/webm' });
          setRecordingState(prev => {
            console.log('设置空 blob 防止完全失败');
            return { ...prev, recordedBlob: emptyBlob };
          });
          return;
        }
        
        // 使用正确的 MIME 类型创建 blob
        const blobType = options.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        
        console.log('✅ 成功创建录制 Blob:', { 
          size: blob.size, 
          type: blob.type,
          sizeInKB: Math.round(blob.size / 1024),
          sizeInMB: Math.round(blob.size / 1024 / 1024 * 100) / 100,
          chunksUsed: chunksRef.current.length,
          isFirefox: isFirefoxRecording
        });
        
        if (blob.size === 0) {
          console.warn('⚠️ 创建的 blob 大小为 0！这可能会导致预览问题。');
        }
        
        // 立即设置 blob，不等待清理完成
        setRecordingState(prev => {
          console.log('设置 recordedBlob:', blob);
          return { ...prev, recordedBlob: blob };
        });
        
        console.log('录制停止，开始清理媒体流...');
        
        // 全面清理所有媒体流
        if (screenStreamRef.current) {
          console.log('停止屏幕/桌面共享流...');
          screenStreamRef.current.getTracks().forEach(track => {
            console.log(`停止屏幕轨道: ${track.kind} - ${track.label}`);
            track.stop();
          });
          screenStreamRef.current = null;
        }
        
        if (cameraStreamRef.current) {
          console.log('停止录制中的摄像头流...');
          cameraStreamRef.current.getTracks().forEach(track => {
            console.log(`停止录制摄像头轨道: ${track.kind} - ${track.label}`);
            track.stop();
          });
          cameraStreamRef.current = null;
        }
        
        // 对于Firefox，需要特殊处理以确保全面清理
        const isFirefox = navigator.userAgent.includes('Firefox');
        if (isFirefox) {
          console.log('Firefox检测到，执行增强清理...');
          
          // 尝试停止所有可能的媒体轨道
          const allTracks = [...(navigator.mediaDevices as any).getAllActiveTracks?.() || []];
          allTracks.forEach((track: MediaStreamTrack) => {
            if (track.readyState === 'live') {
              console.log(`停止活动轨道: ${track.kind} - ${track.label}`);
              track.stop();
            }
          });
          
          // Firefox特殊处理：尝试停止所有活动的屏幕共享
          try {
            // 检查是否有活动的屏幕共享
            if (navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia) {
              console.log('Firefox检查并停止所有活动的显示流...');
              
              // 在Firefox中，尝试通过检查document.hidden和视频轨道状态来确保清理
              const videoTracks = document.querySelectorAll('video');
              videoTracks.forEach((video, index) => {
                if (video !== cameraPreviewRef.current && video.srcObject) {
                  console.log(`停止视频元素 ${index} 的流`);
                  const stream = video.srcObject as MediaStream;
                  if (stream) {
                    stream.getTracks().forEach(track => {
                      console.log(`停止视频元素轨道: ${track.kind} - ${track.label}`);
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
              console.log('Firefox延迟重启摄像头预览...');
              startCameraPreview();
            }
          }, 2000); // Firefox需要更长的延迟
        } else {
          // 其他浏览器的正常处理
          console.log('录制完成，摄像头画中画预览继续保持开启状态');
        }
        
        // 确保预览页能够立即显示
        console.log('Recording stopped, preview should now be available');
        
        // 对于Firefox，添加额外的状态检查和强制更新
        if (isFirefox) {
          // 多次尝试设置blob以确保Firefox正确更新状态
          const attempts = [100, 300, 600, 1000];
          attempts.forEach((delay, index) => {
            setTimeout(() => {
              console.log(`Firefox: 第${index + 1}次尝试检查和设置blob`);
              
              setRecordingState(prev => {
                const hasValidBlob = prev.recordedBlob && prev.recordedBlob.size > 0;
                console.log('Firefox 状态检查:', {
                  isRecording: prev.isRecording,
                  hasBlob: !!prev.recordedBlob,
                  blobSize: prev.recordedBlob?.size || 0,
                  shouldShowPreview: hasValidBlob && !recordingState.isRecording
                });
                
                if (!hasValidBlob) {
                  console.log('Firefox: 重新设置 blob');
                  return { ...prev, recordedBlob: blob };
                }
                return prev;
              });
            }, delay);
          });
        }
      };

      // Firefox 优化: 使用更短的时间片段来提高数据收集频率
      const timeSlice = isFirefoxRecording ? 100 : 1000; // Firefox 使用 100ms，其他 1000ms
      console.log(`🎥 开始录制 - 时间片段: ${timeSlice}ms, 浏览器: ${isFirefoxRecording ? 'Firefox' : 'Other'}`);
      
      try {
        mediaRecorderRef.current.start(timeSlice);
        console.log('✅ MediaRecorder 启动成功');
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
      showToast(t.recording.startFailed || '录制启动失败，请检查权限设置后重试。');
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
            console.log('非Firefox浏览器重启摄像头预览...');
            startCameraPreview();
          }
        }, 500); // 稍微延迟以确保录制完全停止
      } else {
        console.log('Firefox检测到，在onstop中延迟处理摄像头预览');
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
      showToast(t.recording.noRecording || '没有可保存的录制！');
      return;
    }
    
    if (!user) {
      showToast(t.recording.loginRequired || '请登录后保存录制。');
      return;
    }

    console.log('User authenticated:', {
      userId: user.$id,
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
      
      // Generate thumbnail for the newly uploaded video
      if (result.data?.videoId && result.data?.fileId) {
        try {
          console.log('Getting file URL and generating thumbnail...');
          
          // Get file URL
          const urlResult = await getFileUrlAction(result.data.fileId);
          if (urlResult.success && urlResult.data?.url) {
            const thumbnailResult = await generateThumbnailOnUploadAction(
              result.data.videoId,
              urlResult.data.url
            );
            
            if (thumbnailResult.success) {
              console.log('✅ Thumbnail generated successfully for new video');
            } else {
              console.warn('⚠️ Thumbnail generation failed:', thumbnailResult.error);
            }
          }
        } catch (thumbnailError) {
          console.warn('⚠️ Thumbnail generation failed (video upload still successful):', thumbnailError);
        }
      }
      
      showToast(t.recording.saveSuccess || '视频保存成功！');
      
      // Save uploaded video data for display
      setUploadedVideo({ $id: result.data?.videoId, title: videoTitle.trim() || getDefaultTitle() });
      
      // Keep recording blob for preview, don't clear it yet
      // The blob will be cleared when starting new recording

    } catch (error: any) {
      console.error('Upload failed. Error details:', error);
      showToast(`保存失败: ${error.message || '未知错误'}。`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      {!recordingState.isRecording && !recordingState.recordedBlob && (
        <div className="space-y-6">
          {/* 第一行：录制质量和录制源 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="select-container">
              <Label className="text-sm font-medium mb-3 block">{t.recording.recordingQuality}</Label>
              <Select value={quality} onValueChange={(value) => setQuality(value as RecordingQuality)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.recording.selectRecordingQuality} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p (1280x720)</SelectItem>
                  <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="select-container">
              <Label className="text-sm font-medium mb-3 block">{t.recording.recordingSource}</Label>
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
                  <SelectValue placeholder={t.recording.selectRecordingSource} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monitor">
                    <div>
                      <div className="flex items-center">
                        <Monitor className="h-4 w-4 mr-2" />
                        <span className="font-medium">{t.recording.entireScreen}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t.recording.entireScreenDesc}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="window">
                    <div>
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="font-medium">{t.recording.applicationWindow}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t.recording.applicationWindowDesc}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="browser">
                    <div>
                      <div className="flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        <span className="font-medium">{t.recording.browserTab}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t.recording.browserTabDesc}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="camera-only">
                    <div>
                      <div className="flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        <span className="font-medium">{t.recording.cameraOnly}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t.recording.cameraOnlyDesc}
                      </div>
                    </div>
                  </SelectItem>
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
                  <Label>{t.recording.openMicrophone}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t.recording.microphoneDescription}
                  </p>
                </div>
                {/* 麦克风状态指示器 */}
                {includeAudio && (
                  <div 
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    title={t.recording.microphoneEnabled}
                  ></div>
                )}
              </div>
              <Switch
                checked={includeAudio}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    // 用户开启麦克风时立即申请权限
                    try {
                      await navigator.mediaDevices.getUserMedia({ audio: true });
                      setIncludeAudio(true);
                      showToast(t.recording.microphonePermissionGranted || '麦克风权限已获取');
                    } catch (error) {
                      console.error('麦克风权限申请失败:', error);
                      showToast(t.recording.microphonePermissionDenied || '麦克风权限被拒绝');
                      setIncludeAudio(false);
                    }
                  } else {
                    setIncludeAudio(false);
                  }
                }}
              />
      
      {/* Firefox专用CSS - 只显示画中画按钮 */}
      <style jsx global>{`
        /* Firefox 媒体控件全面隐藏策略 */
        .firefox-pip-video {
          position: relative !important;
          background: #000 !important;
        }
        
        /* 通过多重方式隐藏 Firefox 原生控件 */
        .firefox-pip-video[controls] {
          /* 尝试隐藏整个控制栏 */
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
        
        /* Firefox 控件面板隐藏 */
        .firefox-pip-video::-moz-media-controls-panel {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* 隐藏播放/暂停按钮 */
        .firefox-pip-video::-moz-media-controls-play-button,
        .firefox-pip-video::-moz-media-controls-overlay-play-button {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* 隐藏时间控件 */
        .firefox-pip-video::-moz-media-controls-scrubber,
        .firefox-pip-video::-moz-media-controls-time-display,
        .firefox-pip-video::-moz-media-controls-current-time,
        .firefox-pip-video::-moz-media-controls-duration {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* 隐藏音量控件 */
        .firefox-pip-video::-moz-media-controls-volume-control,
        .firefox-pip-video::-moz-media-controls-mute-button,
        .firefox-pip-video::-moz-media-controls-volume-slider {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* 隐藏全屏按钮 */
        .firefox-pip-video::-moz-media-controls-fullscreen-button {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* Firefox 最新版本的控件结构 */
        .firefox-pip-video video::-moz-media-controls,
        .firefox-pip-video::-moz-media-controls-button-panel,
        .firefox-pip-video::-moz-media-controls-statusbar {
          visibility: hidden !important;
          opacity: 0 !important;
          display: none !important;
          height: 0 !important;
        }
        
        /* Firefox 130+ 新控件选择器 */
        .firefox-pip-video div[role="group"],
        .firefox-pip-video div[class*="control"],
        .firefox-pip-video button:not([title*="picture"]):not([title*="Picture"]) {
          visibility: hidden !important;
          opacity: 0 !important;
          display: none !important;
        }
        
        /* 显示并优化画中画按钮 - Firefox */
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
        
        /* 隐藏 Firefox 覆盖层和其他元素 */
        .firefox-pip-video::-moz-media-controls-overlay {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          display: none !important;
        }
        
        /* 隐藏其他可能的控件 */
        .firefox-pip-video::-moz-media-controls > *:not(button[title*="Picture-in-Picture"]):not([aria-label*="Picture-in-Picture"]) {
          visibility: hidden !important;
          opacity: 0 !important;
          display: none !important;
        }
        
        /* 兼容 WebKit 浏览器（如果Firefox使用WebKit引擎） */
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
                  <Label>{t.subtitles.enableSubtitles || '开启字幕'}</Label>
                  {t.subtitles.subtitleDescription && (
                    <p className="text-xs text-muted-foreground">
                      {t.subtitles.subtitleDescription}
                    </p>
                  )}
                  {!includeAudio && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {t.subtitles.needMicrophoneForSubtitles || '需要开启麦克风才能生成字幕'}
                    </span>
                  )}
                </div>
                {/* 字幕状态指示器 */}
                {subtitleState.isListening && (
                  <div 
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    title={t.subtitles.listeningForSpeech || '正在监听语音'}
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
                      showToast(t.subtitles.microphoneRequiredForSubtitles || '请先开启麦克风才能使用字幕功能');
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
                  <Label>{t.recording.enableCamera}</Label>
                  {/* 不支持摄像头的提示 */}
                  {(screenSource === 'window' || screenSource === 'browser') && source !== 'camera-only' && (
                    <span className="text-xs text-muted-foreground">
                      {screenSource === 'window' ? t.recording.windowNotSupportCamera : t.recording.browserTabNotSupportCamera}
                    </span>
                  )}
                </div>
                {/* 摄像头状态指示器 */}
                {includeCamera && cameraPreviewStream && (
                  <div 
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    title={t.recording.cameraEnabled}
                  ></div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={includeCamera}
                  onCheckedChange={async (checked) => {
                    // 当选择仅录制摄像头时，不允许关闭摄像头
                    if (source === 'camera-only' && !checked) {
                      return; // 不允许关闭
                    }
                    
                    if (checked) {
                      // 用户开启摄像头时立即申请权限
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        // 立即停止测试流，实际流将在startCameraPreview中获取
                        stream.getTracks().forEach(track => track.stop());
                        setIncludeCamera(true);
                        showToast(t.recording.cameraPermissionGranted || '摄像头权限已获取');
                      } catch (error) {
                        console.error('摄像头权限申请失败:', error);
                        showToast(t.recording.cameraPermissionDenied || '摄像头权限被拒绝');
                        setIncludeCamera(false);
                      }
                    } else {
                      setIncludeCamera(false);
                    }
                  }}
                  disabled={
                    source === 'camera-only' || // 仅录制摄像头时禁用切换
                    (screenSource === 'window' || screenSource === 'browser') // 应用窗口和浏览器标签页不支持摄像头
                  }
                />
              </div>
            </div>
            
            {/* 字幕设置面板 */}
            {showSubtitleSettings && subtitleState.isEnabled && includeAudio && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {t.subtitles.subtitleLanguage || '字幕语言'}
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
                      <SelectItem value="zh-CN">中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="ja-JP">日本語</SelectItem>
                      <SelectItem value="ko-KR">한국어</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {t.subtitles.subtitleInfo || '字幕将在录制时实时生成，并可在录制结束后导出。'}
                </div>
              </div>
            )}
          </div>


        </div>
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
            console.log('Firefox点击视频尝试启动画中画');
            // 继续执行下面的逻辑，不return
          }
          
          e.preventDefault();
          if (cameraPreviewStream && !document.pictureInPictureElement && !isPiPRequesting) {
            console.log(`${pipSupport.browser}点击视频尝试启动画中画`);
            
            if (pipSupport.supported && typeof cameraPreviewRef.current?.requestPictureInPicture === 'function') {
              try {
                setIsPiPRequestingWithTimeout(true);
                await cameraPreviewRef.current.requestPictureInPicture();
                console.log(`${pipSupport.browser}点击视频启动画中画成功`);
                showToast('画中画模式已启动');
              } catch (error: any) {
                console.error(`${pipSupport.browser}点击视频启动失败:`, error);
                if (pipSupport.browser === 'Safari') {
                  showToast('Safari请先与视频交互，再点击下方按钮');
                } else if (pipSupport.browser === 'Firefox') {
                  showToast('Firefox请使用视频控件中的画中画按钮或下方按钮');
                } else {
                  showToast('请使用下方按钮启动画中画');
                }
              } finally {
                setIsPiPRequestingWithTimeout(false);
              }
            } else if (!pipSupport.supported) {
              showToast(`${pipSupport.browser}不支持画中画功能`);
            }
          }
        }}
        onLoadedData={() => console.log('视频数据加载完成')}
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
          <CardContent className="p-4">
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
        <Card className={`border-2 transition-colors ${
          isNearTimeLimit 
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <CardContent className="p-4 space-y-3">
            {/* Main Status Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    {recordingState.isPaused ? t.recording.paused : t.recording.recordingStatus}
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
                  {t.recording.stop}
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
                        : 'bg-red-500 dark:bg-red-400'
                    }`}
                    style={{
                      width: `${Math.min((recordingState.duration / recordingConfig.maxDurationSeconds) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                {isNearTimeLimit && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 text-center">
                    {t.recording.recordingWillStopAt}
                  </p>
                )}
              </div>
            )}
            
            {/* 字幕实时显示 */}
            {subtitleState.isEnabled && includeAudio && (
              <div className="bg-black/80 rounded-lg p-3 min-h-[60px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-blue-400 font-medium">
                    {t.subtitles.liveSubtitles || '实时字幕'}
                  </span>
                  {subtitleState.isListening && (
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-400">
                        {t.subtitles.listening || '监听中'}
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
                      {t.subtitles.waitingForSpeech || '等待语音输入...'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Start Recording Button */}
      {!recordingState.isRecording && !recordingState.recordedBlob && (
        <Button onClick={startRecording} className="w-full" size="lg">
          <Circle className="h-5 w-5 mr-2 fill-current" />
          {t.recording.start}
        </Button>
      )}



      {/* Recording Complete - Not Uploaded Yet */}
      {recordingState.recordedBlob && !uploadedVideo && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium">{t.recording.recordingComplete}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.recording.duration}: {formatDuration(recordingState.duration)}
                </p>
              </div>
              
              {/* Video Preview */}
              <div className="space-y-3">
                <div className="mx-auto max-w-md">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <video
                      className="w-full h-full object-cover"
                      controls
                      src={URL.createObjectURL(recordingState.recordedBlob)}
                    />
                  </div>
                </div>

              </div>
              
              {/* Video Title Input */}
              <div>
                <Label htmlFor="videoTitle" className="text-sm font-medium mb-2 block">
                  {t.recording.videoTitle}
                </Label>
                <Input
                  id="videoTitle"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder={getDefaultTitle()}
                  className="w-full"
                />
              </div>
              
              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    {t.recording.publicVideo}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isVideoPublic ? t.recording.publicVideoDesc : t.recording.privateVideoDesc}
                  </p>
                </div>
                <Switch
                  checked={isVideoPublic}
                  onCheckedChange={setIsVideoPublic}
                />
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" onClick={downloadRecording}>
                  <Download className="h-4 w-4 mr-2" />
                  {t.recording.download}
                </Button>
                <Button onClick={uploadToAppwrite} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      {t.recording.uploading}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t.recording.upload}
                    </>
                  )}
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
                  {t.recording.startNewRecording}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Recording Uploaded - Show Preview and Share Options */}
      {uploadedVideo && recordingState.recordedBlob && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-green-600">{t.recording.uploadSuccess}</h3>
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
                <Label className="text-sm font-medium mb-2 block">{t.recording.shareLink}</Label>
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
                  {t.recording.download}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => shareVideo(uploadedVideo)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t.recording.shareVideo}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const shareUrl = getShareUrl(uploadedVideo.$id);
                    window.open(shareUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t.recording.viewVideo}
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
                  {t.recording.startNewRecording}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}