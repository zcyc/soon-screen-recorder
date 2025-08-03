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
import { storage, config } from '@/lib/appwrite';
import { DatabaseService } from '@/lib/database';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/lib/i18n';
import { recordingConfig } from '@/lib/config';
import { ID, Permission, Role } from 'appwrite';

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
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          // Create subtitle segment
          const segment: SubtitleSegment = {
            id: `subtitle-${Date.now()}-${i}`,
            startTime: recordingState.duration,
            endTime: recordingState.duration + 3, // 估算3秒持续时间
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

  // 启动摄像头预览 - 使用画中画API（除非是仅录制摄像头模式）
  const startCameraPreview = async () => {
    const cameraOnlyMode = source === 'camera-only';
    console.log(`开始启动摄像头${cameraOnlyMode ? '预览' : '画中画预览'}...`);
    
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能');
      }

      // 仅录制摄像头模式下不需要检查画中画API支持
      if (!cameraOnlyMode && !document.pictureInPictureEnabled) {
        throw new Error('浏览器不支持画中画API');
      }

      console.log('请求摄像头权限...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          facingMode: 'user'
        },
        audio: false // 预览不需要音频
      });
      
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
      
      // 所有模式都使用画中画预览
      // 创建画中画视频元素
      const startPictureInPicture = (retryCount = 0) => {
          const maxRetries = 10;
          
          if (cameraPreviewRef.current) {
            console.log('启动画中画模式...');
            cameraPreviewRef.current.srcObject = stream;
            
            // 添加事件监听器
            cameraPreviewRef.current.onloadedmetadata = async () => {
              console.log('视频元数据加载完成，准备进入画中画模式');
              
              try {
                // 进入画中画模式
                if (!document.pictureInPictureElement) {
                  await cameraPreviewRef.current!.requestPictureInPicture();
                  console.log('画中画模式启动成功');
                  showToast('摄像头画中画预览已启动');
                }
              } catch (pipError) {
                console.error('画中画模式启动失败:', pipError);
                showToast('画中画模式启动失败，将使用默认预览');
              }
            };
            
            cameraPreviewRef.current.onenterpictureinpicture = () => {
              console.log('进入画中画模式');
            };
            
            cameraPreviewRef.current.onleavepictureinpicture = () => {
              console.log('退出画中画模式');
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
              startPictureInPicture(retryCount + 1);
            }, 200);
          } else {
            console.error('达到最大重试次数，放弃设置画中画');
            showToast('摄像头预览初始化失败，请稍后重试');
          }
        };
        
      startPictureInPicture();
      
    } catch (error: any) {
      console.error('摄像头画中画预览启动失败:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      let errorMessage = '无法启动摄像头画中画预览';
      if (error.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝，请允许摄像头访问';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '摄像头正被其他应用程序使用';
      } else if (error.message.includes('画中画')) {
        errorMessage = '浏览器不支持画中画API，请使用Chrome或Edge浏览器';
      }
      
      showToast(errorMessage);
    }
  };

  // 停止摄像头预览 - 退出画中画模式
  const stopCameraPreview = async () => {
    console.log('停止摄像头画中画预览...');
    
    try {
      // 所有模式都退出画中画模式
      if (document.pictureInPictureElement) {
        console.log('退出画中画模式...');
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error('退出画中画模式失败:', error);
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
      
      // Create MediaRecorder with optimal settings
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: quality === '1080p' ? 5000000 : 2500000
      };
      
      // Fallback for browsers that don't support VP9
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }
      
      // Final fallback
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      mediaRecorderRef.current = new MediaRecorder(finalStream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordingState(prev => ({ ...prev, recordedBlob: blob }));
        
        // Clean up streams
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(track => track.stop());
          cameraStreamRef.current = null;
        }
        
        // 录制完成后保持画中画预览开启
        console.log('录制完成，摄像头画中画预览继续保持开启状态');
      };

      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      startTimer();
      
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
      mediaRecorderRef.current.stop();
      stopTimer();
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false 
      }));
      
      // Stop speech recognition
      stopSpeechRecognition();
      
      // Reset time warning states
      setShowTimeWarning(false);
      setIsNearTimeLimit(false);
      
      // 录制结束后，如果摄像头仍然开启，重新启动预览
      setTimeout(() => {
        if (includeCamera) {
          startCameraPreview();
        }
      }, 500); // 稍微延迟以确保录制完全停止
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

      // Upload file to storage
      console.log('Uploading file to bucket:', config.bucketId);
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      const fileResponse = await storage.createFile(
        config.bucketId,
        ID.unique(),
        file,
        [
          Permission.read(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
          ...(isVideoPublic ? [Permission.read(Role.any())] : [])
        ]
      );
      console.log('File uploaded successfully:', fileResponse);
      
      // Upload subtitle file if subtitles were generated
      let subtitleFileId: string | null = null;
      if (subtitleState.segments.length > 0) {
        try {
          console.log('Uploading subtitle file...');
          const vttContent = generateVTTContent();
          const subtitleBlob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
          const subtitleFile = new File([subtitleBlob], `${timestamp}-subtitles.vtt`, { type: 'text/vtt' });
          
          const subtitleResponse = await storage.createFile(
            config.bucketId,
            ID.unique(),
            subtitleFile,
            [
              Permission.read(Role.user(user.$id)),
              Permission.delete(Role.user(user.$id)),
              ...(isVideoPublic ? [Permission.read(Role.any())] : [])
            ]
          );
          
          subtitleFileId = subtitleResponse.$id;
          console.log('Subtitle file uploaded successfully:', subtitleResponse);
        } catch (subtitleError) {
          console.error('Failed to upload subtitle file:', subtitleError);
          // Don't fail the entire upload if subtitle upload fails
        }
      }

      // Create database record - try minimal structure first
      const finalTitle = videoTitle.trim() || getDefaultTitle();
      
      console.log('Before creating record. Title:', finalTitle);
      console.log('User info:', { id: user.$id, name: user.name, email: user.email });
      console.log('Subtitle file ID:', subtitleFileId);
      
      // Create complete video record with all required fields
      const videoRecord = {
        title: String(finalTitle),
        fileId: fileResponse.$id, // Correct field name is fileId
        quality: String(quality), 
        userId: String(user.$id),
        userName: String(user.name || user.email || 'Anonymous User'),
        duration: Number(recordingState.duration),
        views: Number(0), // Default to 0 views
        isPublic: Boolean(isVideoPublic), // Use user's choice
        thumbnailUrl: String(''), // Optional field, empty string
        subtitleFileId: subtitleFileId ? String(subtitleFileId) : null // Subtitle file ID
      };
      
      console.log('Minimal video record to test:', videoRecord);
      
      console.log('Video record to create:', videoRecord);

      const createdVideo = await DatabaseService.createVideoRecord(videoRecord);
      console.log('Created video record:', createdVideo);

      console.log('Upload and database save successful!');
      showToast(t.recording.saveSuccess || '视频保存成功！');
      
      // Save uploaded video data for display
      setUploadedVideo(createdVideo);
      
      // Keep recording blob for preview, don't clear it yet
      // The blob will be cleared when starting new recording

    } catch (error: any) {
      console.error('Upload failed. Error details:', {
        error: error,
        message: error.message,
        code: error.code,
        type: error.type
      });
      showToast(`保存失败: ${error.message || '未知错误'}。请检查控制台获取详细信息。`);
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
            <div>
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
            
            <div>
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
                  <p className="text-xs text-muted-foreground">
                    {t.subtitles.subtitleDescription || '自动从音频生成字幕'}
                  </p>
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


      

      
      {/* 隐藏的视频元素用于画中画 */}
      <video
        ref={cameraPreviewRef}
        className="hidden"
        autoPlay
        muted
        playsInline
        controls={false}
        onLoadedData={() => console.log('视频数据加载完成')}
        onCanPlay={() => console.log('视频可以播放')}
        onError={(e) => console.error('视频元素错误:', e)}
      />

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