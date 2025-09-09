export const siteConfig = {
  name: "Demo App",
  title: "Build something from idea to application", 
  description: "Built with Next.js and modern technologies."
};

// Recording configuration
export const recordingConfig = {
  // Maximum recording duration in seconds (2 minutes = 120 seconds)
  maxDurationSeconds: parseInt(process.env.NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS || '120'),
  // Warning threshold in seconds (when to show time warning)
  timeWarningThreshold: parseInt(process.env.NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD || '100'), // Show warning at 1:40
  // Enable/disable recording time limit
  enableTimeLimit: process.env.NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT !== 'false',
};

// User registration configuration
export const registrationConfig = {
  // Enable/disable user registration functionality (default: true)
  enableRegistration: process.env.NEXT_PUBLIC_ENABLE_REGISTRATION !== 'false',
};