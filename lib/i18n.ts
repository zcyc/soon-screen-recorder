import { createContext, useContext } from 'react';

export type Locale = 'en' | 'zh';

export interface Translations {
  // Navigation
  nav: {
    dashboard: string;
    discover: string;
    devices: string;
    profile: string;
    signOut: string;
  };
  
  // Dashboard
  dashboard: {
    recordVideo: string;
    myVideos: string;
    publicVideos: string;
    startRecording: string;
    noVideosYet: string;
    noMatchingVideos: string;
    noPublicVideos: string;
    welcomeBack: string;
    welcomeDescription: string;
  };
  
  // Recording
  recording: {
    recordingQuality: string;
    recordingSource: string;
    screenSource: string;
    screenOnly: string;
    cameraOnly: string;
    screenAndCamera: string;
    entireScreen: string;
    applicationWindow: string;
    browserTab: string;
    includeAudio: string;
    includeCamera: string;
    cameraIncluded: string;
    videoTitle: string;
    videoTitlePlaceholder: string;
    uploadSuccess: string;
    shareLink: string;
    shareVideo: string;
    viewVideo: string;
    copyShareLink: string;
    linkCopied: string;
    copyFailed: string;
    shareFailed: string;
    watchVideo: string;
    publicVideo: string;
    publicVideoDesc: string;
    privateVideoDesc: string;
    recording: string;
    paused: string;
    stop: string;
    start: string;
    pause: string;
    resume: string;
    recordingComplete: string;
    duration: string;
    download: string;
    upload: string;
    uploading: string;
    startNewRecording: string;
    on: string;
    off: string;
    // Source descriptions
    entireScreenDesc: string;
    applicationWindowDesc: string;
    browserTabDesc: string;
  };
  
  // Devices
  devices: {
    title: string;
    recordingEnvironment: string;
    httpsStatus: string;
    httpsEnabled: string;
    httpsRequired: string;
    mediaRecorderSupport: string;
    supported: string;
    notSupported: string;
    cameraPermission: string;
    microphonePermission: string;
    granted: string;
    denied: string;
    notRequested: string;
    requestPermissions: string;
  };
  
  // Video Gallery
  videos: {
    searchPlaceholder: string;
    views: string;
    public: string;
    share: string;
  };
  
  // Common
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    confirm: string;
    yes: string;
    no: string;
  };
  
  // Permissions & Errors
  permissions: {
    screenDenied: string;
    cameraDenied: string;
    cameraNotFound: string;
    microphoneDenied: string;
    microphoneNotFound: string;
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      discover: 'Discover',
      devices: 'Devices', 
      profile: 'Profile',
      signOut: 'Sign Out',
    },
    dashboard: {
      recordVideo: 'Record Video',
      myVideos: 'My Videos',
      publicVideos: 'Public Videos',
      startRecording: 'Start Recording',
      noVideosYet: 'You haven\'t recorded any videos yet',
      noMatchingVideos: 'No matching videos found',
      noPublicVideos: 'No public videos yet',
      welcomeBack: 'Welcome back',
      welcomeDescription: 'Start recording your screen or manage your existing recordings.',
    },
    recording: {
      recordingQuality: 'Recording Quality',
      recordingSource: 'Recording Source',
      screenSource: 'Screen Source',
      screenOnly: 'Screen Only',
      cameraOnly: 'Camera Only', 
      screenAndCamera: 'Screen + Camera',
      entireScreen: 'Entire Screen',
      applicationWindow: 'Application Window',
      browserTab: 'Browser Tab',
      includeAudio: 'Include Audio',
      includeCamera: 'Include Camera',
      cameraIncluded: 'Camera will be automatically included in recording',
    videoTitle: 'Video Title',
    videoTitlePlaceholder: 'Enter video title...',
    uploadSuccess: 'Upload successful!',
    shareLink: 'Share Link',
    shareVideo: 'Share Video',
    viewVideo: 'View Video',
    copyShareLink: 'Copy Share Link',
    linkCopied: 'Link copied to clipboard!',
    copyFailed: 'Copy failed',
    shareFailed: 'Share failed',
    watchVideo: 'Watch video',
    publicVideo: 'Public Video',
    publicVideoDesc: 'Anyone can access the share link',
    privateVideoDesc: 'Only you can access the video',
      recording: 'Recording',
      paused: 'Paused',
      stop: 'Stop',
      start: 'Start Recording',
      pause: 'Pause',
      resume: 'Resume',
      recordingComplete: 'Recording Complete!',
      duration: 'Duration',
      download: 'Download',
      upload: 'Upload',
      uploading: 'Uploading...',
      startNewRecording: 'Start New Recording',
      on: 'On',
      off: 'Off',
      // Source descriptions
      entireScreenDesc: 'Record everything on your screen',
      applicationWindowDesc: 'Record a specific application window',
      browserTabDesc: 'Record a specific browser tab',
    },
    devices: {
      title: 'Recording Devices',
      recordingEnvironment: 'Recording Environment',
      httpsStatus: 'HTTPS Status',
      httpsEnabled: 'HTTPS Enabled',
      httpsRequired: 'HTTPS Required for recording',
      mediaRecorderSupport: 'MediaRecorder Support',
      supported: 'Supported',
      notSupported: 'Not Supported',
      cameraPermission: 'Camera Permission',
      microphonePermission: 'Microphone Permission',
      granted: 'Granted',
      denied: 'Denied',
      notRequested: 'Not Requested',
      requestPermissions: 'Request Permissions',
    },
    videos: {
      searchPlaceholder: 'Search videos...',
      views: 'views',
      public: 'Public',
      share: 'Share',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
    },
    permissions: {
      screenDenied: 'Screen recording permission denied. Please allow screen sharing and try again.',
      cameraDenied: 'Camera permission denied. Please allow camera access in browser settings.',
      cameraNotFound: 'Camera device not found. Please check if your camera is properly connected.',
      microphoneDenied: 'Microphone permission denied. Please allow microphone access in browser settings.',
      microphoneNotFound: 'Microphone device not found. Please check if your microphone is properly connected.',
    },
  },
  zh: {
    nav: {
      dashboard: '仪表盘',
      discover: '发现',
      devices: '设备',
      profile: '个人资料', 
      signOut: '退出登录',
    },
    dashboard: {
      recordVideo: '录制视频',
      myVideos: '我的视频',
      publicVideos: '公共视频',
      startRecording: '开始录制',
      noVideosYet: '你还没有录制任何视频',
      noMatchingVideos: '没有找到匹配的视频',
      noPublicVideos: '暂无公共视频',
      welcomeBack: '欢迎回来',
      welcomeDescription: '开始录制您的屏幕或管理您现有的录制内容。',
    },
    recording: {
      recordingQuality: '录制质量',
      recordingSource: '录制源',
      screenSource: '屏幕录制源',
      screenOnly: '仅屏幕录制',
      cameraOnly: '仅摄像头录制',
      screenAndCamera: '屏幕 + 摄像头',
      entireScreen: '整个屏幕',
      applicationWindow: '应用窗口',
      browserTab: '浏览器标签页',
      includeAudio: '录制音频',
      includeCamera: '同时录制摄像头',
      cameraIncluded: '摄像头将自动包含在录制中',
    videoTitle: '视频标题',
    videoTitlePlaceholder: '请输入视频标题...',
    uploadSuccess: '上传成功！',
    shareLink: '分享链接',
    shareVideo: '分享视频',
    viewVideo: '查看视频',
    copyShareLink: '复制分享链接',
    linkCopied: '链接已复制到剪贴板！',
    copyFailed: '复制失败',
    shareFailed: '分享失败',
    watchVideo: '观看视频',
    publicVideo: '公开视频',
    publicVideoDesc: '任何人都可以访问分享链接',
    privateVideoDesc: '只有您可以访问视频',
      recording: '录制中',
      paused: '已暂停',
      stop: '停止',
      start: '开始录制',
      pause: '暂停',
      resume: '继续',
      recordingComplete: '录制完成!',
      duration: '时长',
      download: '下载',
      upload: '上传',
      uploading: '上传中...',
      startNewRecording: '开始新录制',
      on: '开启',
      off: '关闭',
      // Source descriptions
      entireScreenDesc: '录制您的整个屏幕内容',
      applicationWindowDesc: '录制特定应用程序窗口',
      browserTabDesc: '录制特定浏览器标签页内容',
    },
    devices: {
      title: '录制设备',
      recordingEnvironment: '录制环境',
      httpsStatus: 'HTTPS 状态',
      httpsEnabled: 'HTTPS 已启用',
      httpsRequired: '录制需要 HTTPS',
      mediaRecorderSupport: 'MediaRecorder 支持',
      supported: '支持',
      notSupported: '不支持',
      cameraPermission: '摄像头权限',
      microphonePermission: '麦克风权限',
      granted: '已授权',
      denied: '已拒绝',
      notRequested: '未请求',
      requestPermissions: '请求权限',
    },
    videos: {
      searchPlaceholder: '搜索视频...',
      views: '观看',
      public: '公开',
      share: '分享',
    },
    common: {
      loading: '加载中...',
      error: '错误',
      retry: '重试',
      cancel: '取消',
      confirm: '确认',
      yes: '是',
      no: '否',
    },
    permissions: {
      screenDenied: '屏幕录制权限被拒绝。请允许屏幕共享权限后重试。',
      cameraDenied: '摄像头权限被拒绝。请在浏览器设置中允许摄像头访问权限。',
      cameraNotFound: '未找到摄像头设备。请检查您的摄像头是否正常连接。',
      microphoneDenied: '麦克风权限被拒绝。请在浏览器设置中允许麦克风访问权限。',
      microphoneNotFound: '未找到麦克风设备。请检查您的麦克风是否正常连接。',
    },
  },
};

// Language Context
export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

export const I18nContext = createContext<I18nContextType>({
  locale: 'zh',
  setLocale: () => {},
  t: translations['zh'],
});

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};