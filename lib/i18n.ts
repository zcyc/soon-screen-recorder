import { createContext, useContext } from 'react';

export type Locale = 'en' | 'zh';

export interface Translations {
  // App name
  appName: string;
  // Navigation
  nav: {
    dashboard: string;
    discover: string;
    devices: string;
    profile: string;
    signOut: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription: string;
    startRecording: string;
    signIn: string;
    featuresTitle: string;
    featuresSubtitle: string;
    timeLimitNotice: string;
    screenRecordingTitle: string;
    screenRecordingDesc: string;
    cameraRecordingTitle: string;
    cameraRecordingDesc: string;
    audioRecordingTitle: string;
    audioRecordingDesc: string;
    ctaTitle: string;
    ctaDescription: string;
    getStarted: string;
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
  
  // Discover
  discover: {
    title: string;
    description: string;
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
    recordingStatus: string;
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
    // Toast messages
    saveSuccess: string;
    startFailed: string;
    noRecording: string;
    loginRequired: string;
    // Additional UI elements
    selectRecordingQuality: string;
    selectRecordingSource: string;
    cameraOnlyDesc: string;
    openMicrophone: string;
    microphoneDescription: string;
    enableCamera: string;
    windowNotSupportCamera: string;
    browserTabNotSupportCamera: string;
    microphoneEnabled: string;
    cameraEnabled: string;
    unsupportedBrowserShare: string;
    // Time limit related
    timeLimitWarning: string;
    timeLimitReached: string;
    recordingWillStopAt: string;
    // Permission related
    microphonePermissionGranted: string;
    microphonePermissionDenied: string;
    cameraPermissionGranted: string;
    cameraPermissionDenied: string;
  };
  
  // Subtitles
  subtitles: {
    enableSubtitles: string;
    subtitleDescription: string;
    needMicrophoneForSubtitles: string;
    listeningForSpeech: string;
    microphoneRequiredForSubtitles: string;
    subtitleLanguage: string;
    subtitleInfo: string;
    liveSubtitles: string;
    listening: string;
    waitingForSpeech: string;
    speechNotSupported: string;
    microphonePermissionNeeded: string;
    recognitionStartFailed: string;
    noSubtitlesToExport: string;
    subtitlesExported: string;
    showSubtitles: string;
    hideSubtitles: string;
  };
  
  // Authentication
  auth: {
    signInToSoon: string;
    createSoonAccount: string;
    welcomeBack: string;
    signInDescription: string;
    signUpDescription: string;
    fullName: string;
    email: string;
    password: string;
    enterFullName: string;
    enterEmail: string;
    enterPassword: string;
    signIn: string;
    signUp: string;
    loading: string;
    orContinueWith: string;
    continueWithGitHub: string;
    connectingToGitHub: string;
    newToSoon: string;
    alreadyHaveAccount: string;
    createAccount: string;
    signInToExistingAccount: string;
    nameRequired: string;
    errorOccurred: string;
    githubLoginFailed: string;
    githubAuthCancelled: string;
    authenticationFailed: string;
    // Third-party cookie related
    thirdPartyCookieNotice: string;
    thirdPartyCookieTitle: string;
    thirdPartyCookieDescription: string;
  };
  
  // Devices
  devices: {
    title: string;
    description: string;
    recordingEnvironment: string;
    recordingEnvironmentStatus: string;
    httpsConnection: string;
    httpsSecure: string;
    httpsInsecure: string;
    httpsWarning: string;
    screenRecording: string;
    cameraRecording: string;
    microphoneRecording: string;
    supported: string;
    granted: string;
    denied: string;
    needsPermission: string;
    unknown: string;
    unsupported: string;
    authorize: string;
    refreshPermissionStatus: string;
    checkingPermissions: string;
    permissionTroubleshooting: string;
  };
  
  // Video Gallery
  videos: {
    searchPlaceholder: string;
    views: string;
    public: string;
    share: string;
  };
  share: {
    loading: string;
    videoNotFound: string;
    videoNotFoundDesc: string;
    privateVideoError: string;
    backToHome: string;
    browserNotSupported: string;
    download: string;
    views: string;
    reactions: string;
    recentReactions: string;
    andMore: string;
    signInToReact: string;
    signIn: string;
    signUp: string;
    like: string;
    love: string;
    happy: string;
    applause: string;
    awesome: string;
    dislike: string;
    confused: string;
    boring: string;
    disappointed: string;
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
    appName: 'soon',
    nav: {
      dashboard: 'Dashboard',
      discover: 'Discover',
      devices: 'Devices', 
      profile: 'Profile',
      signOut: 'Sign Out',
    },
    home: {
      heroTitle: 'Screen Recording',
      heroSubtitle: 'Simple. Soon.',
      heroDescription: 'No Install, One-Click Record',
      startRecording: 'Start Recording',
      signIn: 'Sign In',
      featuresTitle: 'Everything You Need to Record',
      featuresSubtitle: 'Professional-quality recordings with just a few clicks',
      timeLimitNotice: '🕒 Free recordings are limited to 2 minutes',
      screenRecordingTitle: 'Screen Recording',
      screenRecordingDesc: 'Capture your entire screen or specific windows with crystal clear quality up to 1080p.',
      cameraRecordingTitle: 'Camera Recording',
      cameraRecordingDesc: 'Include your webcam in recordings for personal touch and better engagement.',
      audioRecordingTitle: 'Audio Recording',
      audioRecordingDesc: 'Capture system audio and microphone input for complete recording experience.',
      ctaTitle: 'Ready to Start Recording?',
      ctaDescription: 'Join soon today and start creating amazing screen recordings in minutes.',
      getStarted: 'Get Started for Free',
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
    discover: {
      title: 'Discover Recordings',
      description: 'Browse public recordings shared by the Soon community.',
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
      recordingStatus: 'Recording',
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
      // Toast messages
      saveSuccess: 'Recording saved successfully!',
      startFailed: 'Failed to start recording. Please check your permissions and try again.',
      noRecording: 'No recording to save!',
      loginRequired: 'Please sign in to save recordings.',
      // Additional UI elements
      selectRecordingQuality: 'Select recording quality',
      selectRecordingSource: 'Select recording source',
      cameraOnlyDesc: 'Record using camera only, no screen content',
      openMicrophone: 'Open Microphone',
      microphoneDescription: 'Record audio independently, not affected by camera switch',
      enableCamera: 'Enable Camera',
      windowNotSupportCamera: 'Application window does not support camera',
      browserTabNotSupportCamera: 'Browser tab does not support camera',
      microphoneEnabled: 'Microphone enabled',
      cameraEnabled: 'Camera picture-in-picture enabled',
      unsupportedBrowserShare: 'Your browser does not support sharing, please use the copy link button',
      // Time limit related
      timeLimitWarning: 'Recording will stop at 2:00',
      timeLimitReached: 'Recording stopped: Time limit reached (2 minutes)',
      recordingWillStopAt: '⚠️ Recording will automatically stop at 2:00',
      // Permission related
      microphonePermissionGranted: 'Microphone permission granted',
      microphonePermissionDenied: 'Microphone permission denied',
      cameraPermissionGranted: 'Camera permission granted',
      cameraPermissionDenied: 'Camera permission denied',
    },
    subtitles: {
      enableSubtitles: 'Enable Speech to Subtitles',
      subtitleDescription: '',
      needMicrophoneForSubtitles: 'Enable microphone to generate subtitles',
      listeningForSpeech: 'Listening for speech',
      microphoneRequiredForSubtitles: 'Please enable microphone to use subtitle feature',
      subtitleLanguage: 'Subtitle Language',
      subtitleInfo: 'Subtitles will be generated in real-time during recording and can be exported afterwards.',
      liveSubtitles: 'Live Subtitles',
      listening: 'Listening',
      waitingForSpeech: 'Waiting for speech input...',
      speechNotSupported: 'Browser does not support speech recognition',
      microphonePermissionNeeded: 'Microphone permission needed to generate subtitles',
      recognitionStartFailed: 'Failed to start speech recognition',
      noSubtitlesToExport: 'No subtitles to export',
      subtitlesExported: 'Subtitles exported successfully',
      showSubtitles: 'Show Subtitles',
      hideSubtitles: 'Hide Subtitles',
    },
    auth: {
      signInToSoon: 'Sign in to soon',
      createSoonAccount: 'Create your soon account',
      welcomeBack: 'Welcome back! Please sign in to continue.',
      signInDescription: 'Welcome back! Please sign in to continue.',
      signUpDescription: 'Start recording and sharing your screen instantly.',
      fullName: 'Full Name',
      email: 'Email',
      password: 'Password',
      enterFullName: 'Enter your full name',
      enterEmail: 'Enter your email',
      enterPassword: 'Enter your password',
      signIn: 'Sign in',
      signUp: 'Sign up',
      loading: 'Loading...',
      orContinueWith: 'Or continue with',
      continueWithGitHub: 'Continue with GitHub',
      connectingToGitHub: 'Connecting to GitHub...',
      newToSoon: 'New to soon?',
      alreadyHaveAccount: 'Already have an account?',
      createAccount: 'Create an account',
      signInToExistingAccount: 'Sign in to existing account',
      nameRequired: 'Name is required',
      errorOccurred: 'An error occurred',
      githubLoginFailed: 'GitHub login failed',
      githubAuthCancelled: 'GitHub authentication was cancelled',
      authenticationFailed: 'Authentication failed. Please try again.',
      // Third-party cookie related
      thirdPartyCookieNotice: 'Third-party Cookie Notice',
      thirdPartyCookieTitle: 'Third-party Cookie Notice',
      thirdPartyCookieDescription: 'GitHub login requires third-party cookies. If it doesn\'t work, enable cookies in your browser settings or use email/password login.',
    },
    devices: {
      title: 'Devices',
      description: 'Check recording device permissions and browser compatibility status',
      recordingEnvironment: 'Recording Environment',
      recordingEnvironmentStatus: 'Recording Environment Status',
      httpsConnection: 'HTTPS Connection',
      httpsSecure: 'Secure',
      httpsInsecure: 'Insecure',
      httpsWarning: '⚠️ Screen recording requires HTTPS connection. Please enable HTTPS in production.',
      screenRecording: 'Screen Recording',
      cameraRecording: 'Camera Recording',
      microphoneRecording: 'Microphone Recording',
      supported: 'Supported',
      granted: 'Granted',
      denied: 'Denied',
      needsPermission: 'Needs Permission',
      unknown: 'Unknown',
      unsupported: 'Unsupported',
      authorize: 'Authorize',
      refreshPermissionStatus: 'Refresh Permission Status',
      checkingPermissions: 'Checking recording permissions...',
      permissionTroubleshooting: '💡 If permissions are denied, click the camera/microphone icon next to the address bar to re-authorize, or manage site permissions in browser settings.',
    },
    videos: {
      searchPlaceholder: 'Search videos...',
      views: 'views',
      public: 'Public',
      share: 'Share',
    },
    share: {
      loading: 'Loading video...',
      videoNotFound: 'Video Not Found',
      videoNotFoundDesc: 'The video you\'re looking for doesn\'t exist or is no longer available.',
      privateVideoError: 'This video is private or not found.',
      backToHome: 'Back to Home',
    browserNotSupported: 'Your browser does not support video playback.',
      download: 'Download',
      views: 'views',
      reactions: 'Feedback',
      recentReactions: 'Recent feedback:',
      andMore: 'and {count} more...',
      signInToReact: 'Sign in to give feedback on this video',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      like: 'Like',
      love: 'Love',
      happy: 'Happy',
      applause: 'Applause',
      awesome: 'Awesome',
      dislike: 'Dislike',
      confused: 'Confused',
      boring: 'Boring',
      disappointed: 'Disappointed',
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
    appName: '快录',
    nav: {
      dashboard: '仪表盘',
      discover: '发现',
      devices: '设备',
      profile: '个人资料', 
      signOut: '退出登录',
    },
    home: {
      heroTitle: '录制屏幕',
      heroSubtitle: '简单快速',
      heroDescription: '免安装，一键录',
      startRecording: '开始录制',
      signIn: '登录',
      featuresTitle: '满足您的录制需求',
      featuresSubtitle: '仅需几次点击就能获得专业品质的录制',
      timeLimitNotice: '🕒 免费录制限制为 2 分钟',
      screenRecordingTitle: '屏幕录制',
      screenRecordingDesc: '捕获整个屏幕或特定窗口，提供高达 1080p 的清晰画质。',
      cameraRecordingTitle: '摄像头录制',
      cameraRecordingDesc: '在录制中包含您的网络摄像头，增加个人化触感和更好的互动效果。',
      audioRecordingTitle: '音频录制',
      audioRecordingDesc: '捕获系统音频和麦克风输入，提供完整的录制体验。',
      ctaTitle: '准备开始录制了吗？',
      ctaDescription: '立即加入快录，在几分钟内开始创建令人惊叹的屏幕录制。',
      getStarted: '免费开始使用',
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
    discover: {
      title: '发现视频',
      description: '浏览快录社区分享的公开录像。',
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
      recordingStatus: '录制中',
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
      // Toast messages
      saveSuccess: '视频保存成功！',
      startFailed: '录制启动失败，请检查权限设置后重试。',
      noRecording: '没有可保存的录制！',
      loginRequired: '请登录后保存录制。',
      // Additional UI elements
      selectRecordingQuality: '选择录制质量',
      selectRecordingSource: '选择录制源',
      cameraOnlyDesc: '仅使用摄像头进行录制，不包含屏幕内容',
      openMicrophone: '开启麦克风',
      microphoneDescription: '独立录制声音，不受摄像头开关影响',
      enableCamera: '开启摄像头',
      windowNotSupportCamera: '应用窗口不支持摄像头',
      browserTabNotSupportCamera: '浏览器标签页不支持摄像头',
      microphoneEnabled: '麦克风已开启',
      cameraEnabled: '摄像头画中画已启动',
      unsupportedBrowserShare: '您的浏览器不支持分享功能，请使用复制链接按钮',
      // Time limit related
      timeLimitWarning: '录制将在 2:00 停止',
      timeLimitReached: '录制已停止：达到时间限制（2分钟）',
      recordingWillStopAt: '⚠️ 录制将在 2:00 自动停止',
      // Permission related
      microphonePermissionGranted: '麦克风权限已获取',
      microphonePermissionDenied: '麦克风权限被拒绝',
      cameraPermissionGranted: '摄像头权限已获取',
      cameraPermissionDenied: '摄像头权限被拒绝',
    },
    subtitles: {
      enableSubtitles: '开启语音转字幕',
      subtitleDescription: '',
      needMicrophoneForSubtitles: '需要开启麦克风才能生成字幕',
      listeningForSpeech: '正在监听语音',
      microphoneRequiredForSubtitles: '请先开启麦克风才能使用字幕功能',
      subtitleLanguage: '字幕语言',
      subtitleInfo: '字幕将在录制时实时生成，并可在录制结束后导出。',
      liveSubtitles: '实时字幕',
      listening: '监听中',
      waitingForSpeech: '等待语音输入...',
      speechNotSupported: '浏览器不支持语音识别功能',
      microphonePermissionNeeded: '需要麦克风权限才能生成字幕',
      recognitionStartFailed: '语音识别启动失败',
      noSubtitlesToExport: '没有字幕可以导出',
      subtitlesExported: '字幕导出成功',
      showSubtitles: '显示字幕',
      hideSubtitles: '隐藏字幕',
    },
    auth: {
      signInToSoon: '登录快录',
      createSoonAccount: '创建您的快录账户',
      welcomeBack: '欢迎回来！请登录以继续。',
      signInDescription: '欢迎回来！请登录以继续。',
      signUpDescription: '立即开始录制和分享您的屏幕。',
      fullName: '全名',
      email: '邮箱',
      password: '密码',
      enterFullName: '请输入您的全名',
      enterEmail: '请输入您的邮箱',
      enterPassword: '请输入您的密码',
      signIn: '登录',
      signUp: '注册',
      loading: '加载中...',
      orContinueWith: '或继续使用',
      continueWithGitHub: '使用 GitHub 继续',
      connectingToGitHub: '正在连接到 GitHub...',
      newToSoon: '初次使用快录?',
      alreadyHaveAccount: '已有账户？',
      createAccount: '创建账户',
      signInToExistingAccount: '登录现有账户',
      nameRequired: '姓名为必填项',
      errorOccurred: '发生错误',
      githubLoginFailed: 'GitHub 登录失败',
      githubAuthCancelled: 'GitHub 认证已取消',
      authenticationFailed: '认证失败，请重试。',
      // Third-party cookie related
      thirdPartyCookieNotice: '第三方Cookie提醒',
      thirdPartyCookieTitle: '第三方Cookie提醒',
      thirdPartyCookieDescription: 'GitHub 登录需要第三方Cookie支持。如果无法正常使用，请在浏览器设置中启用Cookie或使用邮箱密码登录。',
    },
    devices: {
      title: '设备',
      description: '检查录制设备权限和浏览器兼容性状态',
      recordingEnvironment: '录制环境',
      recordingEnvironmentStatus: '录制环境状态',
      httpsConnection: 'HTTPS 连接',
      httpsSecure: '安全',
      httpsInsecure: '不安全',
      httpsWarning: '⚠️ 屏幕录制需要 HTTPS 连接。请在生产环境中启用 HTTPS。',
      screenRecording: '屏幕录制',
      cameraRecording: '摄像头录制',
      microphoneRecording: '麦克风录制',
      supported: '支持',
      granted: '已授权',
      denied: '已拒绝',
      needsPermission: '需要授权',
      unknown: '未知',
      unsupported: '不支持',
      authorize: '授权',
      refreshPermissionStatus: '刷新权限状态',
      checkingPermissions: '检查录制权限...',
      permissionTroubleshooting: '💡 如果权限被拒绝，请点击地址栏旁的摄像头/麦克风图标重新授权，或在浏览器设置中管理网站权限。',
    },
    videos: {
      searchPlaceholder: '搜索视频...',
      views: '观看',
      public: '公开',
      share: '分享',
    },
    share: {
      loading: '加载视频中...',
      videoNotFound: '视频未找到',
      videoNotFoundDesc: '您要查找的视频不存在或已不可用。',
      privateVideoError: '此视频为私有或未找到。',
      backToHome: '返回首页',
      browserNotSupported: '您的浏览器不支持视频播放。',
      download: '下载',
      views: '次观看',
      reactions: '反馈',
      recentReactions: '最近的反馈：',
      andMore: '还有 {count} 个...',
      signInToReact: '登录以对此视频给出反馈',
      signIn: '登录',
      signUp: '注册',
      like: '点赞',
      love: '喜爱',
      happy: '开心',
      applause: '鼓掌',
      awesome: '精彩',
      dislike: '不喜欢',
      confused: '困惑',
      boring: '无聊',
      disappointed: '失望',
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
  locale: 'en',
  setLocale: () => {},
  t: translations['en'],
});

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};