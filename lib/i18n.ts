import { createContext, useContext } from 'react';
import { recordingConfig } from './config';

export type Locale = 'en' | 'zh';

export interface Translations {
  // App name
  appName: string;
  // Navigation
  nav: {
    record: string;
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
    timeLimitNotice: () => string;
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
    timeLimitWarning: () => string;
    timeLimitReached: () => string;
    recordingWillStopAt: () => string;
    // Permission related
    microphonePermissionGranted: string;
    microphonePermissionDenied: string;
    cameraPermissionGranted: string;
    cameraPermissionDenied: string;
    // Safari/Firefox specific options
    systemSettings: string;
    systemSettingsDesc: string;
    delete: string;
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
    continueWithGoogle: string;
    connectingToGitHub: string;
    connectingToGoogle: string;
    newToSoon: string;
    alreadyHaveAccount: string;
    createAccount: string;
    signInToExistingAccount: string;
    nameRequired: string;
    errorOccurred: string;
    githubLoginFailed: string;
    githubAuthCancelled: string;
    authenticationFailed: string;

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
    private: string;
    share: string;
    togglePrivacy: string;
    makePrivate: string;
    makePublic: string;
    privacyUpdated: string;
    privacyUpdateFailed: string;
    created: string;
    duration: string;
    quality: string;
    delete: string;
    copyLink: string;
    download: string;
    deleteConfirmation: string;
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
  
  // Publish/Discovery
  publish: {
    publishToDiscovery: string;
    removeFromDiscovery: string;
    publishedToDiscovery: string;
    removedFromDiscovery: string;
    publishedDescription: string;
    unpublishedDescription: string;
  };
  
  // Guest mode
  guest: {
    status: string;
    notification: string;
    loginPrompt: string;
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
  
  // File Upload
  fileUpload: {
    invalidFileType: string;
    fileSizeExceeded: string;
    uploadFailed: string;
    selectVideoFile: string;
    uploading: string;
    uploadSuccess: string;
    maxFileSize: string;
  };
  
  // Thumbnail
  thumbnail: {
    generating: string;
    uploading: string;
    updatingRecord: string;
    generateSuccess: string;
    generateFailed: string;
    ready: string;
    generated: string;
  };

  // Footer
  footer: {
    copyright: string;
    allRightsReserved: string;
    termsOfService: string;
    privacyPolicy: string;
  };

  // Terms of Service
  terms: {
    title: string;
    lastUpdated: string;
    introduction: string;
    acceptanceTitle: string;
    acceptanceContent: string;
    serviceDescriptionTitle: string;
    serviceDescriptionContent: string;
    userAccountsTitle: string;
    userAccountsContent: string;
    privacyTitle: string;
    privacyContent: string;
    prohibitedUsesTitle: string;
    prohibitedUsesContent: string;
    intellectualPropertyTitle: string;
    intellectualPropertyContent: string;
    terminationTitle: string;
    terminationContent: string;
    disclaimerTitle: string;
    disclaimerContent: string;
    limitationTitle: string;
    limitationContent: string;
    changesTitle: string;
    changesContent: string;
    contactTitle: string;
    contactContent: string;
  };

  // Privacy Policy
  privacy: {
    title: string;
    lastUpdated: string;
    introduction: string;
    informationCollectionTitle: string;
    informationCollectionContent: string;
    informationUseTitle: string;
    informationUseContent: string;
    informationSharingTitle: string;
    informationSharingContent: string;
    cookiesTitle: string;
    cookiesContent: string;
    securityTitle: string;
    securityContent: string;
    dataRetentionTitle: string;
    dataRetentionContent: string;
    userRightsTitle: string;
    userRightsContent: string;
    thirdPartyTitle: string;
    thirdPartyContent: string;
    changesTitle: string;
    changesContent: string;
    contactTitle: string;
    contactContent: string;
  };

}

export const translations: Record<Locale, Translations> = {
  en: {
    appName: 'SOON',
    nav: {
      record: 'Record',
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
      featuresTitle: 'New Screen Recording Experience',
      featuresSubtitle: 'Simple and Fast, Open and Record',
      timeLimitNotice: () => `🕒 Every recording is limited to ${Math.floor(recordingConfig.maxDurationSeconds / 60)} minutes`,
      screenRecordingTitle: 'No Installation Required',
      screenRecordingDesc: 'Record directly in your browser without downloading plugins or installing desktop clients.',
      cameraRecordingTitle: 'Chrome • Firefox • Safari',
      cameraRecordingDesc: 'Works seamlessly across all major browsers with full cross-platform compatibility.',
      audioRecordingTitle: 'Desktop • Camera • Audio',
      audioRecordingDesc: 'Comprehensive recording capabilities including screen capture, webcam, and high-quality audio.',
      ctaTitle: 'Ready to Start Recording?',
      ctaDescription: 'Join SOON today and start creating amazing screen recordings in minutes.',
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
      description: 'Browse public recordings shared by the SOON community.',
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
      timeLimitWarning: () => {
        const minutes = Math.floor(recordingConfig.maxDurationSeconds / 60);
        const seconds = recordingConfig.maxDurationSeconds % 60;
        const timeStr = seconds === 0 ? `${minutes}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return `Recording will stop at ${timeStr}`;
      },
      timeLimitReached: () => `Recording stopped: Time limit reached (${Math.floor(recordingConfig.maxDurationSeconds / 60)} minutes)`,
      recordingWillStopAt: () => {
        const minutes = Math.floor(recordingConfig.maxDurationSeconds / 60);
        const seconds = recordingConfig.maxDurationSeconds % 60;
        const timeStr = seconds === 0 ? `${minutes}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return `⚠️ Recording will automatically stop at ${timeStr}`;
      },
      // Permission related
      microphonePermissionGranted: 'Microphone permission granted',
      microphonePermissionDenied: 'Microphone permission denied',
      cameraPermissionGranted: 'Camera permission granted',
      cameraPermissionDenied: 'Camera permission denied',
      // Safari/Firefox specific options
      systemSettings: 'Use System Settings',
      systemSettingsDesc: 'Use system default screen sharing selection, browser will show all available options',
      delete: 'Delete',
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
      signInToSoon: 'Sign in to SOON',
      createSoonAccount: 'Create your SOON account',
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
      continueWithGoogle: 'Continue with Google',
      connectingToGitHub: 'Connecting to GitHub...',
      connectingToGoogle: 'Connecting to Google...',
      newToSoon: 'New to SOON?',
      alreadyHaveAccount: 'Already have an account?',
      createAccount: 'Create an account',
      signInToExistingAccount: 'Sign in to existing account',
      nameRequired: 'Name is required',
      errorOccurred: 'An error occurred',
      githubLoginFailed: 'GitHub login failed',
      githubAuthCancelled: 'GitHub authentication was cancelled',
      authenticationFailed: 'Authentication failed. Please try again.',

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
      private: 'Private',
      share: 'Share',
      togglePrivacy: 'Toggle Privacy',
      makePrivate: 'Make Private',
      makePublic: 'Make Public',
      privacyUpdated: 'Privacy setting updated successfully!',
      privacyUpdateFailed: 'Failed to update privacy setting',
      created: 'Created',
      duration: 'Duration',
      quality: 'Quality',
      delete: 'Delete',
      copyLink: 'Copy Link',
      download: 'Download',
      deleteConfirmation: 'This action cannot be undone. The video will be permanently deleted.',
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
    publish: {
      publishToDiscovery: 'Publish to Discovery Page',
      removeFromDiscovery: 'Remove from Discovery Page',
      publishedToDiscovery: 'Published to Discovery Page',
      removedFromDiscovery: 'Removed from Discovery Page',
      publishedDescription: 'Video will appear on the Discovery Page for other users to browse',
      unpublishedDescription: 'Video will only be saved to your personal media library',
    },
    guest: {
      status: 'Guest',
      notification: 'You are recording as a guest. You can record and download videos, but need to sign in to upload and share them.',
      loginPrompt: 'Sign in to upload videos',
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
    fileUpload: {
      invalidFileType: 'Please select a video file',
      fileSizeExceeded: 'File size cannot exceed 1000MB',
      uploadFailed: 'Upload failed',
      selectVideoFile: 'Select video file',
      uploading: 'Uploading...',
      uploadSuccess: 'Video uploaded successfully!',
      maxFileSize: 'Maximum file size: 1000MB',
    },
    thumbnail: {
      generating: 'Generating thumbnail...',
      uploading: 'Uploading thumbnail...',
      updatingRecord: 'Updating video record...',
      generateSuccess: 'Thumbnail generated successfully!',
      generateFailed: 'Thumbnail generation failed',
      ready: '🎬 Thumbnail ready',
      generated: 'Thumbnail generated',
    },
    footer: {
      copyright: '© 2025 SOON',
      allRightsReserved: 'All rights reserved.',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
    },
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: August 2025',
      introduction: 'Welcome to SOON. These Terms of Service ("Terms") govern your use of our screen recording service ("Service") operated by SOON ("us", "we", or "our").',
      acceptanceTitle: '1. Acceptance of Terms',
      acceptanceContent: 'By accessing and using our Service, you accept and agree to be bound by the terms and provision of this agreement.',
      serviceDescriptionTitle: '2. Service Description',
      serviceDescriptionContent: 'SOON provides a web-based screen recording service that allows users to capture screen content, camera feeds, and audio. The service is accessible through modern web browsers without requiring additional software installation.',
      userAccountsTitle: '3. User Accounts',
      userAccountsContent: 'You may create an account to access additional features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
      privacyTitle: '4. Privacy',
      privacyContent: 'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.',
      prohibitedUsesTitle: '5. Prohibited Uses',
      prohibitedUsesContent: 'You may not use our Service for any illegal purposes or to violate any laws. You agree not to record copyrighted content without permission, engage in harassment, or distribute malicious content.',
      intellectualPropertyTitle: '6. Intellectual Property',
      intellectualPropertyContent: 'The Service and its original content, features, and functionality are owned by SOON and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.',
      terminationTitle: '7. Termination',
      terminationContent: 'We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.',
      disclaimerTitle: '8. Disclaimer',
      disclaimerContent: 'The information on this Service is provided on an "as is" basis. To the fullest extent permitted by law, SOON excludes all warranties, express or implied.',
      limitationTitle: '9. Limitation of Liability',
      limitationContent: 'In no event shall SOON, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.',
      changesTitle: '10. Changes to Terms',
      changesContent: 'We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.',
      contactTitle: '11. Contact Information',
      contactContent: 'If you have any questions about these Terms, please contact us through our support channels.',
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: December 2024',
      introduction: 'SOON ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our screen recording service.',
      informationCollectionTitle: '1. Information We Collect',
      informationCollectionContent: 'We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include your name, email address, and usage data.',
      informationUseTitle: '2. How We Use Your Information',
      informationUseContent: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send communications, and comply with legal obligations.',
      informationSharingTitle: '3. Information Sharing',
      informationSharingContent: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.',
      cookiesTitle: '4. Cookies and Tracking',
      cookiesContent: 'We use cookies and similar tracking technologies to track activity on our service and store certain information to improve your experience.',
      securityTitle: '5. Data Security',
      securityContent: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
      dataRetentionTitle: '6. Data Retention',
      dataRetentionContent: 'We retain your personal information only for as long as necessary to provide you with our services and as described in this policy.',
      userRightsTitle: '7. Your Rights',
      userRightsContent: 'You have the right to access, update, or delete your personal information. You may also object to certain processing of your data.',
      thirdPartyTitle: '8. Third-Party Services',
      thirdPartyContent: 'Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties.',
      changesTitle: '9. Changes to This Policy',
      changesContent: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.',
      contactTitle: '10. Contact Us',
      contactContent: 'If you have any questions about this Privacy Policy, please contact us through our support channels.',
    },

  },
  zh: {
    appName: 'SOON',
    nav: {
      record: '录制',
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
      featuresTitle: '录屏分享新体验',
      featuresSubtitle: '简单快速，打开就录',
      timeLimitNotice: () => `🕒 每条录像的限制为 ${Math.floor(recordingConfig.maxDurationSeconds / 60)} 分钟`,
      screenRecordingTitle: '无需安装',
      screenRecordingDesc: '直接在浏览器中使用，无需下载插件或安装客户端应用程序。',
      cameraRecordingTitle: '支持 Chrome • Firefox • Safari',
      cameraRecordingDesc: '完美兼容所有主流浏览器，提供跨平台一致体验。',
      audioRecordingTitle: '支持录制桌面、摄像头、语音',
      audioRecordingDesc: '全方位录制功能，支持屏幕捕获、摄像头录制和高质量音频采集。',
      ctaTitle: '准备开始录制了吗？',
      ctaDescription: '立即加入 SOON，在几分钟内开始创建令人惊叹的屏幕录制。',
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
      description: '浏览SOON社区分享的公开录像。',
    },
    recording: {
      recordingQuality: '录制质量',
      recordingSource: '录制源',
      screenSource: '屏幕录制源',
      screenOnly: '仅屏幕录制',
      cameraOnly: '仅录制摄像头',
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
      timeLimitWarning: () => {
        const minutes = Math.floor(recordingConfig.maxDurationSeconds / 60);
        const seconds = recordingConfig.maxDurationSeconds % 60;
        const timeStr = seconds === 0 ? `${minutes}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return `录制将在 ${timeStr} 停止`;
      },
      timeLimitReached: () => `录制已停止：达到时间限制（${Math.floor(recordingConfig.maxDurationSeconds / 60)}分钟）`,
      recordingWillStopAt: () => {
        const minutes = Math.floor(recordingConfig.maxDurationSeconds / 60);
        const seconds = recordingConfig.maxDurationSeconds % 60;
        const timeStr = seconds === 0 ? `${minutes}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return `⚠️ 录制将在 ${timeStr} 自动停止`;
      },
      // Permission related
      microphonePermissionGranted: '麦克风权限已获取',
      microphonePermissionDenied: '麦克风权限被拒绝',
      cameraPermissionGranted: '摄像头权限已获取',
      cameraPermissionDenied: '摄像头权限被拒绝',
      // Safari/Firefox specific options
      systemSettings: '使用系统设置',
      systemSettingsDesc: '使用系统默认录屏选择，浏览器将显示所有可用选项',
      delete: '删除',
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
      signInToSoon: '登录SOON',
      createSoonAccount: '创建您的SOON账户',
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
      continueWithGoogle: '使用 Google 继续',
      connectingToGitHub: '正在连接到 GitHub...',
      connectingToGoogle: '正在连接到 Google...',
      newToSoon: '初次使用SOON?',
      alreadyHaveAccount: '已有账户？',
      createAccount: '创建账户',
      signInToExistingAccount: '登录现有账户',
      nameRequired: '姓名为必填项',
      errorOccurred: '发生错误',
      githubLoginFailed: 'GitHub 登录失败',
      githubAuthCancelled: 'GitHub 认证已取消',
      authenticationFailed: '认证失败，请重试。',

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
      private: '私有',
      share: '分享',
      togglePrivacy: '切换隐私设置',
      makePrivate: '设为私有',
      makePublic: '设为公开',
      privacyUpdated: '隐私设置更新成功！',
      privacyUpdateFailed: '隐私设置更新失败',
      created: '创建时间',
      duration: '时长',
      quality: '质量',
      delete: '删除',
      copyLink: '复制链接',
      download: '下载',
      deleteConfirmation: '此操作不可逆转。视频将被永久删除。',
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
    publish: {
      publishToDiscovery: '发布到发现页面',
      removeFromDiscovery: '从发现页面移除',
      publishedToDiscovery: '已发布到发现页面',
      removedFromDiscovery: '已从发现页面移除',
      publishedDescription: '视频将出现在发现页面供其他用户浏览',
      unpublishedDescription: '仅保存至个人媒体库',
    },
    guest: {
      status: '游客',
      notification: '您正在以游客身份录制。您可以录制和下载视频，但需要登录才能上传和分享视频。',
      loginPrompt: '请登录以上传视频',
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
    fileUpload: {
      invalidFileType: '请选择视频文件',
      fileSizeExceeded: '文件大小不能超过 1000MB',
      uploadFailed: '上传失败',
      selectVideoFile: '选择视频文件',
      uploading: '上传中...',
      uploadSuccess: '视频上传成功！',
      maxFileSize: '最大文件大小: 1000MB',
    },
    thumbnail: {
      generating: '正在生成缩略图...',
      uploading: '正在上传缩略图...',
      updatingRecord: '正在更新视频记录...',
      generateSuccess: '缩略图生成成功！',
      generateFailed: '缩略图生成失败',
      ready: '🎬 缩略图已准备就绪',
      generated: '缩略图已生成',
    },
    footer: {
      copyright: '© 2025 SOON',
      allRightsReserved: '版权所有。',
      termsOfService: '服务条款',
      privacyPolicy: '隐私政策',
    },
    terms: {
      title: '服务条款',
      lastUpdated: '最后更新：2025年8月',
      introduction: '欢迎使用SOON。本服务条款（"条款"）管理您对我们由SOON（"我们"、"我们的"或"本公司"）运营的屏幕录制服务（"服务"）的使用。',
      acceptanceTitle: '1. 接受条款',
      acceptanceContent: '通过访问和使用我们的服务，您接受并同意受本协议条款和条件的约束。',
      serviceDescriptionTitle: '2. 服务描述',
      serviceDescriptionContent: 'SOON提供基于Web的屏幕录制服务，允许用户捕获屏幕内容、摄像头和音频。该服务可通过现代Web浏览器访问，无需安装额外软件。',
      userAccountsTitle: '3. 用户账户',
      userAccountsContent: '您可以创建账户以访问额外功能。您有责任保持账户凭据的机密性，并对您账户下发生的所有活动负责。',
      privacyTitle: '4. 隐私',
      privacyContent: '您的隐私对我们很重要。请查看我们的隐私政策，该政策也管理您对服务的使用，以了解我们的做法。',
      prohibitedUsesTitle: '5. 禁止使用',
      prohibitedUsesContent: '您不得将我们的服务用于任何非法目的或违反任何法律。您同意不在未经许可的情况下录制受版权保护的内容，不进行骚扰，不分发恶意内容。',
      intellectualPropertyTitle: '6. 知识产权',
      intellectualPropertyContent: '服务及其原创内容、功能和功能性属于Soon所有，受国际版权、商标、专利、商业秘密和其他知识产权法律保护。',
      terminationTitle: '7. 终止',
      terminationContent: '我们可以立即终止或暂停您的账户和对服务的访问，无需事先通知或承担责任，无论出于任何原因，包括但不限于您违反条款。',
      disclaimerTitle: '8. 免责声明',
      disclaimerContent: '本服务上的信息按"现状"提供。在法律允许的最大范围内，SOON排除所有明示或默示的保证。',
      limitationTitle: '9. 责任限制',
      limitationContent: '在任何情况下，SOON及其董事、员工、合作伙伴、代理人、供应商或关联公司均不对任何间接、附带、特殊、后果性或惩罚性损害承担责任。',
      changesTitle: '10. 条款变更',
      changesContent: '我们保留随时修改或更换这些条款的权利。如果修订内容重大，我们将尝试在新条款生效前至少提前30天通知。',
      contactTitle: '11. 联系信息',
      contactContent: '如果您对这些条款有任何疑问，请通过我们的支持渠道联系我们。',
    },
    privacy: {
      title: '隐私政策',
      lastUpdated: '最后更新：2024年12月',
      introduction: 'SOON（"我们"、"我们的"或"本公司"）致力于保护您的隐私。本隐私政策解释了当您使用我们的屏幕录制服务时，我们如何收集、使用和共享有关您的信息。',
      informationCollectionTitle: '1. 我们收集的信息',
      informationCollectionContent: '我们收集您直接向我们提供的信息，比如当您创建账户、使用我们的服务或联系我们寻求支持时。这可能包括您的姓名、电子邮件地址和使用数据。',
      informationUseTitle: '2. 我们如何使用您的信息',
      informationUseContent: '我们使用所收集的信息来提供、维护和改进我们的服务，处理交易，发送通信，并遵守法律义务。',
      informationSharingTitle: '3. 信息共享',
      informationSharingContent: '未经您的同意，我们不会向第三方出售、交易或以其他方式转移您的个人信息，除本政策中所述或法律要求的情况外。',
      cookiesTitle: '4. Cookie和跟踪',
      cookiesContent: '我们使用Cookie和类似的跟踪技术来跟踪我们服务上的活动并存储某些信息以改善您的体验。',
      securityTitle: '5. 数据安全',
      securityContent: '我们实施适当的安全措施来保护您的个人信息免受未经授权的访问、更改、披露或销毁。',
      dataRetentionTitle: '6. 数据保留',
      dataRetentionContent: '我们仅在为您提供服务所必需的时间内保留您的个人信息，并按本政策所述进行。',
      userRightsTitle: '7. 您的权利',
      userRightsContent: '您有权访问、更新或删除您的个人信息。您也可以反对对您数据的某些处理。',
      thirdPartyTitle: '8. 第三方服务',
      thirdPartyContent: '我们的服务可能包含指向第三方网站或服务的链接。我们不对这些第三方的隐私做法负责。',
      changesTitle: '9. 政策变更',
      changesContent: '我们可能会不时更新此隐私政策。我们将通过在此页面上发布新政策来通知您任何变更。',
      contactTitle: '10. 联系我们',
      contactContent: '如果您对此隐私政策有任何疑问，请通过我们的支持渠道联系我们。',
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