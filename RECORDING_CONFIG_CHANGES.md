# Recording Time Limit Configuration Environment Variables

## Overview

Extracted the hard-coded recording time limit configuration from the `lib/config.ts` file into environment variables, making it more flexible and configurable.

## Modified Files

### 1. `.env` File
Added recording-related environment variable configuration:
```env
# Recording Configuration
# ==================================================
# Maximum recording duration in seconds (default: 120)
NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS=120
# Warning threshold in seconds when to show time warning (default: 100)
NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD=100
# Enable/disable recording time limit (default: true)
NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT=true
```

### 2. `.env.example` File
Added the same environment variable examples and descriptions for new developers to reference.

### 3. `lib/config.ts` File
Modified recording configuration to read from environment variables:
```typescript
export const recordingConfig = {
  // Maximum recording duration in seconds (2 minutes = 120 seconds)
  maxDurationSeconds: parseInt(process.env.NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS || '120'),
  // Warning threshold in seconds (when to show time warning)
  timeWarningThreshold: parseInt(process.env.NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD || '100'), // Show warning at 1:40
  // Enable/disable recording time limit
  enableTimeLimit: process.env.NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT !== 'false',
};
```

### 4. Translation System (Now using constants)
Changed hard-coded time limit messages to dynamic functions:
```typescript
import { recordingConfig } from './config';

// Changed string types to function types
timeLimitNotice: () => string;
timeLimitWarning: () => string;
timeLimitReached: () => string;
recordingWillStopAt: () => string;

// English version
timeLimitNotice: () => `🕒 Free recordings are limited to ${Math.floor(recordingConfig.maxDurationSeconds / 60)} minutes`,
timeLimitWarning: () => {
  const minutes = Math.floor(recordingConfig.maxDurationSeconds / 60);
  const seconds = recordingConfig.maxDurationSeconds % 60;
  const timeStr = seconds === 0 ? `${minutes}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return `Recording will stop at ${timeStr}`;
},

// Chinese version
timeLimitNotice: () => `🕒 Free recordings are limited to ${Math.floor(recordingConfig.maxDurationSeconds / 60)} minutes`,
timeLimitWarning: () => {
  const minutes = Math.floor(recordingConfig.maxDurationSeconds / 60);
  const seconds = recordingConfig.maxDurationSeconds % 60;
  const timeStr = seconds === 0 ? `${minutes}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return `Recording will stop at ${timeStr}`;
},
```

### 5. `app/page.tsx` File
Added conditional rendering and top margin, hiding time limit notice when time limit is disabled:
```typescript
import { recordingConfig } from '@/lib/config';

// ...

{recordingConfig.enableTimeLimit && (
  <p className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg inline-block mt-4">
    {t.home.timeLimitNotice()}
  </p>
)}
```

### 6. `components/screen-recorder.tsx` File
Updated time limit warning message calls:
```typescript
{t.recording.recordingWillStopAt()}
```

## Environment Variable Descriptions

1. **NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS** (default: 120)
   - Maximum recording duration in seconds
   - Example: 120 = 2 minutes

2. **NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD** (default: 100)
   - Time warning threshold in seconds
   - Example: 100 = show warning at 1 minute 40 seconds

3. **NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT** (default: true)
   - Whether to enable recording time limit
   - When set to `false`, time limit functionality is disabled
   - The homepage will not display the "🕒 Free recordings are limited to 2 minutes" notice

## Technical Implementation Details

1. **Client-side Access**: Use `NEXT_PUBLIC_` prefix to ensure environment variables are accessible on the client side
2. **Type Conversion**: Use `parseInt()` to convert strings to numbers
3. **Default Values**: Provide default values through `||` operator for backward compatibility
4. **Boolean Handling**: Use `!== 'false'` logic, defaulting to enabled state
5. **Conditional Rendering**: Conditionally display UI elements based on configuration state

## Key Enhancement Highlights

1. **Complete Dynamization**: All time limit related messages are dynamically read from environment variables
2. **Multi-language Support**: Both Chinese and English translations support dynamic time display
3. **Smart Formatting**: Automatically handle minute and second display formats (e.g., 2:00, 2:30)
4. **UI Optimization**: Time limit notice includes top margin for improved visual effect
5. **Conditional Display**: When time limit is disabled, the homepage doesn't show related notices

## Testing Scenarios

You can test different configurations by modifying the `.env` file:

1. **Change Duration**: `NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS=180` (3 minutes)
2. **Disable Limit**: `NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT=false`
3. **Custom Warning**: `NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD=150` (2:30 warning)

## Verification Results

- ✅ Project builds successfully
- ✅ Project starts normally  
- ✅ Environment variables load correctly
- ✅ Configuration is flexible and adjustable
- ✅ Maintains backward compatibility
- ✅ Translation messages fully dynamized
- ✅ UI experience optimization completed
- ✅ Multi-language synchronization support