'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Link
} from 'lucide-react';
import { storage, config } from '@/lib/appwrite';
import { DatabaseService } from '@/lib/database';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/lib/i18n';
import { ID, Permission, Role } from 'appwrite';

type RecordingQuality = '720p' | '1080p';
type RecordingSource = 'screen' | 'camera' | 'both';
type ScreenSourceType = 'monitor' | 'window' | 'browser';

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
  
  const [quality, setQuality] = useState<RecordingQuality>('1080p');
  const [source, setSource] = useState<RecordingSource>('screen');
  const [screenSource, setScreenSource] = useState<ScreenSourceType>('monitor');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeCamera, setIncludeCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [isVideoPublic, setIsVideoPublic] = useState(true); // Default to public for sharing
  const [uploadedVideo, setUploadedVideo] = useState<any>(null); // Store uploaded video data
  const [toastMessage, setToastMessage] = useState<string | null>(null); // Toast message state
  
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
      } catch (error) {
        // User cancelled sharing or other error, don't show message
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Browser doesn't support native sharing, copy to clipboard instead
      copyShareLink(video.$id);
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const getQualityConstraints = (quality: RecordingQuality) => {
    return quality === '1080p' 
      ? { width: 1920, height: 1080 }
      : { width: 1280, height: 720 };
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
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

  const getScreenStream = async (): Promise<MediaStream> => {
    const constraints = getQualityConstraints(quality);
    
    // Configure display media constraints based on screen source type
    const displayConstraints: any = {
      video: {
        ...constraints,
        frameRate: { ideal: 30, max: 60 }
      },
      audio: includeAudio
    };

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

  const getCameraStream = async (): Promise<MediaStream> => {
    const constraints = getQualityConstraints(quality);
    
    return await navigator.mediaDevices.getUserMedia({
      video: {
        ...constraints,
        facingMode: 'user'
      },
      audio: includeAudio && (source === 'camera' || source === 'both')
    });
  };

  const combineStreams = (streams: MediaStream[]): MediaStream => {
    console.log('Combining streams:', streams.map(s => ({
      id: s.id,
      videoTracks: s.getVideoTracks().length,
      audioTracks: s.getAudioTracks().length
    })));
    
    const combinedStream = new MediaStream();
    
    streams.forEach((stream, index) => {
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      console.log(`Stream ${index}:`, {
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoEnabled: videoTracks.map(t => t.enabled),
        audioEnabled: audioTracks.map(t => t.enabled)
      });
      
      // Add all video tracks
      videoTracks.forEach(track => {
        if (track.readyState === 'live') {
          combinedStream.addTrack(track);
          console.log(`Added video track from stream ${index}:`, track.label);
        }
      });
      
      // Add all audio tracks 
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
            alert(t.permissions.screenDenied);
            return;
          }
          throw error;
        }
      }

      // Get camera stream with explicit permission request  
      if (source === 'camera' || source === 'both') {
        console.log('Request camera permission...');
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
            alert(t.permissions.cameraDenied);
            return;
          } else if (error.name === 'NotFoundError') {
            alert(t.permissions.cameraNotFound);
            return;
          }
          throw error;
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
      };

      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      startTimer();
      
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: true, 
        duration: 0,
        recordedBlob: null
      }));

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check your permissions and try again.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
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
      alert('No recording to save!');
      return;
    }
    
    if (!user) {
      alert('Please sign in to save recordings.');
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

      // Create database record - try minimal structure first
      const finalTitle = videoTitle.trim() || getDefaultTitle();
      
      console.log('Before creating record. Title:', finalTitle);
      console.log('User info:', { id: user.$id, name: user.name, email: user.email });
      
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
        thumbnailUrl: String('') // Optional field, empty string
      };
      
      console.log('Minimal video record to test:', videoRecord);
      
      console.log('Video record to create:', videoRecord);

      const createdVideo = await DatabaseService.createVideoRecord(videoRecord);
      console.log('Created video record:', createdVideo);

      console.log('Upload and database save successful!');
      alert('Recording saved successfully!');
      
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
      alert(`Failed to save recording: ${error.message || 'Unknown error'}. Please check the console for details.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      {!recordingState.isRecording && !recordingState.recordedBlob && (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">{t.recording.recordingQuality}</Label>
            <RadioGroup value={quality} onValueChange={(value) => setQuality(value as RecordingQuality)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="720p" id="720p" />
                <Label htmlFor="720p">720p (1280x720)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1080p" id="1080p" />
                <Label htmlFor="1080p">1080p (1920x1080)</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">{t.recording.recordingSource}</Label>
            <RadioGroup value={source} onValueChange={(value) => setSource(value as RecordingSource)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="screen" id="screen" />
                <Label htmlFor="screen" className="flex items-center">
                  <Monitor className="h-4 w-4 mr-2" />
                  {t.recording.screenOnly}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="camera" id="camera" />
                <Label htmlFor="camera" className="flex items-center">
                  <Camera className="h-4 w-4 mr-2" />
                  {t.recording.cameraOnly}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  {t.recording.screenAndCamera}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Screen Source Selection - only show when screen recording is enabled */}
          {(source === 'screen' || source === 'both') && (
            <div>
              <Label className="text-sm font-medium mb-3 block">{t.recording.screenSource}</Label>
              <RadioGroup value={screenSource} onValueChange={(value) => setScreenSource(value as ScreenSourceType)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monitor" id="monitor" />
                    <Label htmlFor="monitor" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <Monitor className="h-4 w-4 mr-2" />
                        <span className="font-medium">{t.recording.entireScreen}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t.recording.entireScreenDesc}
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="window" id="window" />
                    <Label htmlFor="window" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="font-medium">{t.recording.applicationWindow}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t.recording.applicationWindowDesc}
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="browser" id="browser" />
                    <Label htmlFor="browser" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        <span className="font-medium">{t.recording.browserTab}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t.recording.browserTabDesc}
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

            </div>
          )}

          <div className="flex items-center justify-between">
            <Label className="flex items-center space-x-2">
              {includeAudio ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span>{t.recording.includeAudio}</span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeAudio(!includeAudio)}
            >
              {includeAudio ? t.recording.on : t.recording.off}
            </Button>
          </div>

          {source === 'both' && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <Camera className="h-4 w-4 text-primary" />
                <span className="font-medium">{t.recording.includeCamera}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t.recording.cameraIncluded || 'Camera will be automatically included in recording'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recording Status */}
      {recordingState.isRecording && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  {recordingState.isPaused ? t.recording.paused : t.recording.recording}
                </span>
              </div>
              <span className="font-mono text-lg">
                {formatDuration(recordingState.duration)}
              </span>
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
                <Square className="h-4 w-4 mr-1" />
                {t.recording.stop}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Recording Button */}
      {!recordingState.isRecording && !recordingState.recordedBlob && (
        <Button onClick={startRecording} className="w-full" size="lg">
          <Square className="h-5 w-5 mr-2" />
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
              
              <div className="flex space-x-2 justify-center">
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
              </div>
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={startNewRecording}
                >
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
              <div className="flex space-x-2 justify-center">
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