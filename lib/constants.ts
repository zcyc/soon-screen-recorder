import { recordingConfig } from './config';

// App name constant
export const APP_NAME = 'SOON';

// Navigation constants
export const NAV = {
  record: 'Record',
  dashboard: 'Dashboard',
  discover: 'Discover',
  devices: 'Devices', 
  profile: 'Profile',
  signOut: 'Sign Out',
} as const;

// Home page constants
export const HOME = {
  heroTitle: 'Screen Recording',
  heroSubtitle: 'Simple and Fast',
  heroDescription: 'No installation required, record with one click',
  startRecording: 'Start Recording',
  signIn: 'Sign In',
  featuresTitle: 'New Screen Recording Experience',
  featuresSubtitle: 'Simple and fast, record as you go',
  timeLimitNotice: () => `🕒 Each recording is limited to ${Math.floor(recordingConfig.maxDurationSeconds / 60)} minutes`,
  screenRecordingTitle: 'No Installation Required',
  screenRecordingDesc: 'Use directly in your browser without downloading plugins or installing client applications.',
  cameraRecordingTitle: 'Supports Chrome • Firefox • Safari',
  cameraRecordingDesc: 'Perfect compatibility with all major browsers, providing a consistent cross-platform experience.',
  audioRecordingTitle: 'Supports Desktop, Camera, and Voice Recording',
  audioRecordingDesc: 'Comprehensive recording capabilities supporting screen capture, camera recording, and high-quality audio capture.',
  ctaTitle: 'Ready to Start Recording?',
  ctaDescription: 'Join SOON now and start creating stunning screen recordings in minutes.',
  getStarted: 'Get Started for Free',
} as const;

// Dashboard constants
export const DASHBOARD = {
  recordVideo: 'Record Video',
  myVideos: 'My Videos',
  publicVideos: 'Public Videos',
  startRecording: 'Start Recording',
  noVideosYet: 'You haven\'t recorded any videos yet',
  noMatchingVideos: 'No matching videos found',
  noPublicVideos: 'No public videos available',
  welcomeBack: 'Welcome Back',
  welcomeDescription: 'Start recording your screen or manage your existing recordings.',
} as const;

// Discover page constants
export const DISCOVER = {
  title: 'Discover Videos',
  description: 'Browse public recordings shared by the SOON community.',
} as const;

// Recording constants
export const RECORDING = {
  recordingQuality: 'Recording Quality',
  recordingSource: 'Recording Source',
  screenSource: 'Screen Recording Source',
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
  uploadSuccess: 'Upload Successful!',
  shareLink: 'Share Link',
  shareVideo: 'Share Video',
  viewVideo: 'View Video',
  copyShareLink: 'Copy Share Link',
  linkCopied: 'Link copied to clipboard!',
  copyFailed: 'Copy failed',
  shareFailed: 'Share failed',
  watchVideo: 'Watch Video',
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
  uploadNotSupported: 'Upload feature is temporarily disabled',
  startNewRecording: 'Start New Recording',
  on: 'On',
  off: 'Off',
  entireScreenDesc: 'Record your entire screen content',
  applicationWindowDesc: 'Record specific application window',
  browserTabDesc: 'Record specific browser tab content',
  saveSuccess: 'Video saved successfully!',
  startFailed: 'Failed to start recording, please check permissions and try again.',
  noRecording: 'No recording to save!',
  loginRequired: 'Please log in to save recording.',
  selectRecordingQuality: 'Select Recording Quality',
  selectRecordingSource: 'Select Recording Source',
  cameraOnlyDesc: 'Record using camera only, no screen content included',
  openMicrophone: 'Enable Microphone',
  microphoneDescription: 'Record audio independently, unaffected by camera toggle',
  enableCamera: 'Enable Camera',
  windowNotSupportCamera: 'Application window does not support camera',
  browserTabNotSupportCamera: 'Browser tab does not support camera',
  microphoneEnabled: 'Microphone enabled',
  cameraEnabled: 'Camera picture-in-picture enabled',
  unsupportedBrowserShare: 'Your browser does not support sharing, please use the copy link button',
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
  microphonePermissionGranted: 'Microphone permission granted',
  microphonePermissionDenied: 'Microphone permission denied',
  cameraPermissionGranted: 'Camera permission granted',
  cameraPermissionDenied: 'Camera permission denied',
  systemSettings: 'Use System Settings',
  systemSettingsDesc: 'Use system default screen recording selection, browser will show all available options',
  delete: 'Delete',
} as const;

// Subtitles constants
export const SUBTITLES = {
  enableSubtitles: 'Enable Voice-to-Subtitles',
  subtitleDescription: '',
  needMicrophoneForSubtitles: 'Microphone must be enabled to generate subtitles',
  listeningForSpeech: 'Listening for speech',
  microphoneRequiredForSubtitles: 'Please enable microphone first to use subtitle feature',
  subtitleLanguage: 'Subtitle Language',
  subtitleInfo: 'Subtitles will be generated in real-time during recording and can be exported after recording ends.',
  liveSubtitles: 'Live Subtitles',
  listening: 'Listening',
  waitingForSpeech: 'Waiting for speech input...',
  speechNotSupported: 'Browser does not support speech recognition',
  microphonePermissionNeeded: 'Microphone permission needed to generate subtitles',
  recognitionStartFailed: 'Speech recognition failed to start',
  noSubtitlesToExport: 'No subtitles to export',
  exportSubtitles: 'Export Subtitles',
  hideSubtitles: 'Hide Subtitles',
  showSubtitles: 'Show Subtitles',
} as const;

// Device permissions constants
export const DEVICES = {
  title: 'Device Status',
  description: 'Check your device permissions and browser compatibility',
  httpsConnection: 'HTTPS Connection',
  cameraAccess: 'Camera Access',
  microphoneAccess: 'Microphone Access',
  screenRecording: 'Screen Recording',
  granted: 'Granted',
  supported: 'Supported',
  denied: 'Denied',
  unsupported: 'Unsupported',
  needsPermission: 'Needs Permission',
  unknown: 'Unknown',
  checkingPermissions: 'Checking permissions...',
  requestCamera: 'Request Camera Permission',
  requestMicrophone: 'Request Microphone Permission',
  httpsRequired: 'HTTPS connection required for screen recording',
  permissionInstructions: 'Click to grant permission when prompted by your browser.',
  microphoneAccessInstructions: 'To enable microphone access:\n1. Click "Allow" when your browser asks for permission\n2. If you accidentally denied permission, click the camera/microphone icon in your address bar\n3. Make sure no other applications are using your microphone\n4. For Chrome: Go to Settings > Privacy and security > Site settings > Microphone',
  iframeRestriction: 'This page is running in an embedded frame, which prevents microphone access for security reasons.',
  openInNewWindow: 'Open in New Window',
  iframeMediaBlocked: 'Media access is blocked in embedded frames. Please open this page in a new window to use microphone features.',
} as const;

// Video management constants
export const VIDEOS = {
  created: 'Created',
  duration: 'Duration',
  quality: 'Quality',
  views: 'Views',
  share: 'Share',
  copyLink: 'Copy Link',
  download: 'Download',
  makePublic: 'Make Public',
  makePrivate: 'Make Private',
  publishToDiscovery: 'Publish to Discovery',
  removeFromDiscovery: 'Remove from Discovery',
  deleteConfirmation: 'Are you sure you want to delete this video? This action cannot be undone.',
  searchPlaceholder: 'Search videos...',
} as const;

// Authentication constants
export const AUTH = {
  signInToSoon: 'Sign in to SOON',
  createSoonAccount: 'Create SOON Account',
  signInDescription: 'Welcome back! Please sign in to your account.',
  signUpDescription: 'Create an account to start recording and sharing videos.',
  fullName: 'Full Name',
  enterFullName: 'Enter your full name',
  emailAddress: 'Email Address',
  enterEmail: 'Enter your email address',
  password: 'Password',
  enterPassword: 'Enter your password',
  signingIn: 'Signing in...',
  signIn: 'Sign In',
  creatingAccount: 'Creating account...',
  signUp: 'Sign Up',
  signInWithGithub: 'Sign in with GitHub',
  signUpWithGithub: 'Sign up with GitHub',
  signInWithGoogle: 'Sign in with Google',
  signUpWithGoogle: 'Sign up with Google',
  alreadyHaveAccount: 'Already have an account?',
  dontHaveAccount: 'Don\'t have an account?',
  nameRequired: 'Name is required',
  emailRequired: 'Email is required',
  passwordRequired: 'Password is required',
  invalidEmail: 'Invalid email format',
  passwordTooShort: 'Password must be at least 8 characters',
  errorOccurred: 'An error occurred',
  authenticationFailed: 'Authentication failed',
  registrationDisabled: 'New user registration is currently disabled. Please contact support if you need access.',
  githubAuthCancelled: 'GitHub authentication was cancelled',
  githubLoginFailed: 'GitHub login failed',
  authenticationFailedClosing: 'Authentication failed. Closing window...',
  email: 'Email',
  loading: 'Loading...',
  orContinueWith: 'Or continue with',
  continueWithGitHub: 'Continue with GitHub',
  continueWithGoogle: 'Continue with Google',
  newToSoon: 'New to Soon?',
  createAccount: 'Create Account',
  signInToExistingAccount: 'Sign in to existing account',
  loginSuccessfulClosing: 'Login successful! Closing window...',
} as const;

// Sharing constants
export const SHARE = {
  title: 'Share Video',
  description: 'Share this video with others',
  like: 'Like',
  love: 'Love',
  happy: 'Happy',
  applause: 'Applause',
  awesome: 'Awesome',
  dislike: 'Dislike',
  confused: 'Confused',
  boring: 'Boring',
  disappointed: 'Disappointed',
  loading: 'Loading...',
  videoNotFound: 'Video Not Found',
  videoNotFoundDesc: 'The video you are looking for does not exist or has been removed.',
  privateVideoError: 'This video is private and can only be viewed by the owner.',
  backToHome: 'Back to Home',
  download: 'Download',
  views: 'views',
  reactions: 'Reactions',
  signInToReact: 'Sign in to react',
  recentReactions: 'Recent Reactions',
  andMore: 'and {count} more',
  signIn: 'Sign In',
  signUp: 'Sign Up',
} as const;

// Publishing constants
export const PUBLISH = {
  publishToDiscovery: 'Publish to Discovery',
  removeFromDiscovery: 'Remove from Discovery',
  publishedToDiscovery: 'Published to Discovery',
  removedFromDiscovery: 'Removed from Discovery',
  publishedDescription: 'This video is published and visible in the Discovery section',
  unpublishedDescription: 'This video is not published to Discovery',
} as const;

// Guest mode constants
export const GUEST = {
  status: 'Guest Mode',
  notification: 'You are in guest mode. Some features may be limited.',
  loginPrompt: 'Sign in to access all features',
} as const;

// Common constants
export const COMMON = {
  loading: 'Loading...',
  error: 'Error',
  retry: 'Retry',
  cancel: 'Cancel',
  confirm: 'Confirm',
  yes: 'Yes',
  no: 'No',
} as const;

// Permission error constants
export const PERMISSIONS = {
  screenDenied: 'Screen recording permission denied',
  cameraDenied: 'Camera permission denied',
  cameraNotFound: 'No camera found',
  microphoneDenied: 'Microphone permission denied',
  microphoneNotFound: 'No microphone found',
} as const;

// File upload constants
export const FILE_UPLOAD = {
  invalidFileType: 'Please select a valid video file',
  fileSizeExceeded: 'File size exceeds the maximum limit of 1000MB',
  uploadFailed: 'Upload failed',
  selectVideoFile: 'Select Video File',
  uploading: 'Uploading',
  uploadSuccess: 'Upload Successful!',
  maxFileSize: 'Maximum file size: 1000MB',
} as const;

// Thumbnail constants
export const THUMBNAIL = {
  generating: 'Generating thumbnail...',
  uploading: 'Uploading thumbnail...',
  updatingRecord: 'Updating video record...',
  generateSuccess: 'Thumbnail generated successfully',
  generateFailed: 'Thumbnail generation failed',
  ready: 'Thumbnail ready',
  generated: 'Thumbnail generated',
} as const;

// Footer constants
export const FOOTER = {
  copyright: '© 2024 SOON',
  allRightsReserved: 'All rights reserved',
  termsOfService: 'Terms of Service',
  privacyPolicy: 'Privacy Policy',
} as const;

// Terms of Service constants
export const TERMS = {
  title: 'Terms of Service',
  lastUpdated: 'Last updated: December 2024',
  introduction: 'Welcome to SOON. These Terms of Service ("Terms") govern your use of our video recording and sharing platform.',
  acceptanceTitle: '1. Acceptance of Terms',
  acceptanceContent: 'By accessing or using SOON, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our service.',
  serviceDescriptionTitle: '2. Service Description',
  serviceDescriptionContent: 'SOON provides online video recording, editing, and sharing services. We reserve the right to modify or discontinue any part of our service at any time.',
  userAccountsTitle: '3. User Accounts',
  userAccountsContent: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
  privacyTitle: '4. Privacy',
  privacyContent: 'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.',
  prohibitedUsesTitle: '5. Prohibited Uses',
  prohibitedUsesContent: 'You may not use our service for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.',
  intellectualPropertyTitle: '6. Intellectual Property',
  intellectualPropertyContent: 'The service and its original content, features, and functionality are owned by SOON and are protected by international copyright, trademark, and other intellectual property laws.',
  terminationTitle: '7. Termination',
  terminationContent: 'We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms.',
  disclaimerTitle: '8. Disclaimer',
  disclaimerContent: 'The information on this service is provided on an "as is" basis. To the fullest extent permitted by law, we exclude all representations, warranties, and conditions.',
  limitationTitle: '9. Limitation of Liability',
  limitationContent: 'SOON shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.',
  changesTitle: '10. Changes to Terms',
  changesContent: 'We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page.',
  contactTitle: '11. Contact Us',
  contactContent: 'If you have any questions about these Terms, please contact us through our support channels.',
} as const;

// Privacy Policy constants
export const PRIVACY = {
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: December 2024',
  introduction: 'This Privacy Policy describes how SOON collects, uses, and protects your information when you use our service.',
  informationCollectionTitle: '1. Information We Collect',
  informationCollectionContent: 'We collect information you provide directly to us, such as when you create an account, record videos, or contact us for support.',
  informationUseTitle: '2. How We Use Your Information',
  informationUseContent: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.',
  informationSharingTitle: '3. Information Sharing',
  informationSharingContent: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.',
  cookiesTitle: '4. Cookies and Tracking',
  cookiesContent: 'We use cookies and similar technologies to enhance your experience, analyze usage patterns, and personalize content.',
  securityTitle: '5. Data Security',
  securityContent: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
  dataRetentionTitle: '6. Data Retention',
  dataRetentionContent: 'We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy.',
  userRightsTitle: '7. Your Rights',
  userRightsContent: 'You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.',
  thirdPartyTitle: '8. Third-Party Services',
  thirdPartyContent: 'Our service may contain links to third-party websites or services. We are not responsible for their privacy practices.',
  changesTitle: '9. Changes to Privacy Policy',
  changesContent: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.',
  contactTitle: '10. Contact Us',
  contactContent: 'If you have any questions about this Privacy Policy, please contact us through our support channels.',
} as const;