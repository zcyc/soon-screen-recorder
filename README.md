# Soon - Screen Recording Made Simple

**Soon** is a modern, web-based screen recording application built with Next.js that allows users to easily record their screen, camera, and audio with professional-quality output. Record, manage, and share your videos with a beautiful, intuitive interface.

## 🎬 Features

### Core Recording Features
- **Multi-source Recording**: Record screen, camera, or both simultaneously
- **High Quality Output**: Support for 720p and 1080p recording with customizable bitrates
- **Audio Recording**: Capture system audio, microphone, or both
- **Flexible Screen Sources**: Record entire screen, specific windows, or browser tabs
- **Real-time Subtitles**: AI-powered speech recognition with subtitle generation (SRT/VTT export)
- **Recording Controls**: Pause/resume functionality with real-time duration tracking

### Video Management
- **Video Gallery**: Organized grid and list views of all recordings
- **Video Player**: Custom video player with subtitle support
- **Public/Private Videos**: Control video visibility and sharing permissions
- **Video Metadata**: Track views, duration, quality, and creation dates
- **Search & Filter**: Find videos by title, quality, or other attributes

### Sharing & Collaboration
- **Public Sharing**: Generate shareable links for public videos
- **Video Reactions**: Emoji-based reaction system for viewer engagement
- **Download Options**: Export videos in WebM format
- **Responsive Player**: Optimized video display across all devices

### User Experience
- **Authentication System**: Secure user registration and login with Appwrite
- **Multi-language Support**: Built-in internationalization (English/Chinese)
- **Theme Support**: Light and dark mode with customizable themes
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Notifications**: Toast notifications for user feedback

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router and Turbopack
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend Services**: [Appwrite](https://appwrite.io/) for authentication, database, and file storage
- **Recording API**: Web APIs (MediaRecorder, Screen Capture, getUserMedia)
- **Styling**: Tailwind CSS 4.0 with CSS variables and theme system
- **TypeScript**: Full type safety throughout the application
- **Icons**: [Lucide React](https://lucide.dev/) icon library

## 🏗️ Architecture Overview

Soon uses Appwrite as the primary backend service:
- **Appwrite**: Authentication, database operations, video storage, metadata management
- **Next.js**: Frontend and API routes
- **Client-side APIs**: Web recording APIs for media capture

## 🚀 Complete Setup Guide

### 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed
- **Appwrite project** created and accessible
- **Git** for version control

### ☁️ Step 1: Appwrite Setup

#### 1. Create Appwrite Project

1. **Access Appwrite Console**
   - Visit: https://cloud.appwrite.io (or your self-hosted instance)
   - Create an account or sign in
   - Click "Create Project"
   - Project Name: `Soon Screen Recorder`
   - Project ID: `soon`

#### 2. Configure Authentication

1. **Navigate to Auth > Settings**
2. **Enable Auth Methods**:
   - ✅ Email/Password
   - ✅ Session Limit: 10
   - ✅ Password History: 5
3. **Security Settings**:
   - Session Length: 1 year
   - Password Dictionary: Enable

#### 3. Create Database Collections

##### 🎬 Videos Collection

1. **Create Collection**
   - Navigate to **Databases**
   - Click "Create Database"
   - Database ID: `soon`
   - Database Name: `Soon Database`

2. **Create Videos Collection**
   - Collection ID: `videos`
   - Collection Name: `Videos`

3. **Add Attributes**:
   
   **String Attributes:**
   ```
   • title - Size: 255, Required: ✅
   • fileId - Size: 255, Required: ✅
   • userId - Size: 255, Required: ✅
   • userName - Size: 255, Required: ✅
   • quality - Size: 10, Required: ✅
   • thumbnailUrl - Size: 500, Required: ❌
   • subtitleFileId - Size: 255, Required: ❌
   ```
   
   **Integer Attributes:**
   ```
   • duration - Default: 0, Required: ✅
   • views - Default: 0, Required: ✅
   ```
   
   **Boolean Attributes:**
   ```
   • isPublic - Default: false, Required: ✅
   ```

##### 👥 Reactions Collection

1. **Create Collection**
   - Collection ID: `reactions`  
   - Collection Name: `Video Reactions`

2. **Add Attributes**:
   
   **String Attributes (All Required):**
   ```
   • videoId - Size: 255
   • userId - Size: 255  
   • userName - Size: 255
   • emoji - Size: 10
   ```

#### 4. Configure Permissions 🔐

**Critical Step** - For both collections:

1. **Videos Collection**:
   - Click `videos` → `Settings` → `Permissions`
   - **Read**: `users`, `any` (for public videos)
   - **Create**: `users`
   - **Update**: `users`
   - **Delete**: `users`

2. **Reactions Collection**:
   - Click `reactions` → `Settings` → `Permissions`
   - **Read**: `any`
   - **Create**: `users`
   - **Update**: `users`
   - **Delete**: `users`

#### 5. Create Storage Bucket

1. **Navigate to Storage**
2. **Create Bucket**:
   - Bucket ID: `videos`
   - Bucket Name: `Video Storage`
   - File Size Limit: 1000MB (or your preference)
   - Allowed Extensions: `webm,mp4,mov,avi`

3. **Configure Bucket Permissions**:
   - **Read**: `any` (for public access)
   - **Create**: `users`
   - **Update**: `users`
   - **Delete**: `users`

#### 6. Get API Keys

1. **Navigate to Overview**
2. **Copy Project Details**:
   - Endpoint URL
   - Project ID
   - API Key (for server-side operations)

### 📦 Step 2: Application Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soon-screen-recorder
   npm install
   ```

2. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Appwrite Configuration
   NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
   NEXT_PUBLIC_APPWRITE_PROJECT_ID="soon"
   NEXT_PUBLIC_APPWRITE_DATABASE_ID="soon"
   NEXT_PUBLIC_APPWRITE_BUCKET_ID="videos"
   
   # Collection IDs
   NEXT_PUBLIC_APPWRITE_COLLECTION_VIDEO_ID="videos"
   NEXT_PUBLIC_APPWRITE_COLLECTION_VIDEO_REACTIONS_ID="reactions"
   
   # Server-side API Key (DO NOT expose to client-side)
   APPWRITE_API_KEY="your_server_api_key"
   
   # Optional: Analytics & Monitoring
   NEXT_PUBLIC_ANALYTICS_ID="your_analytics_id"
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to see the application.

### 🔧 Troubleshooting

#### Common Issues

1. **Appwrite 401 Unauthorized**
   - Verify Appwrite endpoint URL
   - Check project ID and API key
   - Ensure permissions are set correctly

2. **Video Upload Fails**
   - Check bucket permissions
   - Verify file size limits
   - Ensure allowed file extensions

3. **Recording Not Working**
   - Check browser permissions for camera/microphone
   - Test in Chrome/Edge for best compatibility
   - Ensure HTTPS for production deployment

#### Environment Variables Checklist

Ensure these variables are properly set:
- ✅ `NEXT_PUBLIC_APPWRITE_ENDPOINT` - Appwrite endpoint
- ✅ `NEXT_PUBLIC_APPWRITE_STORAGE_ENDPOINT` - Appwrite storage endpoint (for file URLs)
- ✅ `NEXT_PUBLIC_APPWRITE_PROJECT_ID` - Your project ID
- ✅ `NEXT_PUBLIC_APPWRITE_DATABASE_ID` - Database ID
- ✅ `NEXT_PUBLIC_APPWRITE_BUCKET_ID` - Storage bucket ID
- ✅ `APPWRITE_API_KEY` - Server-side API key

## 📝 Usage

### Recording Videos
1. **Navigate to Dashboard**: Log in and go to the dashboard
2. **Configure Recording**: Choose your recording source (screen/camera/both)
3. **Set Quality**: Select between 720p and 1080p output
4. **Enable Features**: Toggle audio recording and subtitles as needed
5. **Start Recording**: Click the record button and grant necessary permissions
6. **Control Recording**: Use pause/resume controls during recording
7. **Save & Share**: Add a title, set privacy, and upload your video

### Managing Videos
- **View Library**: Browse all your recordings in the dashboard
- **Share Videos**: Copy share links or use the built-in sharing features
- **Download Videos**: Export your recordings in WebM format
- **Delete Videos**: Remove unwanted recordings from your library

### Advanced Features
- **Subtitle Export**: Download generated subtitles in SRT or VTT format
- **Public Gallery**: Browse public videos from other users
- **Reactions**: Add emoji reactions to videos you watch
- **Responsive Viewing**: Videos automatically adapt to container sizes

## 🎨 Theming

The application includes a comprehensive theming system supporting light and dark modes. When developing:

- Use CSS custom properties like `var(--color-primary)` 
- Utilize Tailwind theme classes like `bg-primary text-primary-foreground`
- Avoid hardcoded colors to ensure proper theme switching
- Customize themes in `contexts/theme-context.tsx`

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── (login)/           # Authentication pages
│   ├── dashboard/         # Main recording interface
│   ├── discover/          # Public video gallery
│   ├── devices/           # Device management
│   ├── share/[videoId]/   # Public video sharing
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── screen-recorder.tsx # Main recording component
│   ├── video-gallery.tsx  # Video management interface
│   └── header.tsx        # Navigation header
├── contexts/             # React contexts
├── lib/                  # Utility libraries
│   ├── auth/            # Authentication services
│   ├── services/        # Business logic services
│   ├── database.ts       # Appwrite database operations
│   ├── appwrite.ts      # Appwrite configuration
│   └── config.ts        # App configuration
└── public/              # Static assets
```

## 🔧 Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production  
- `npm run start` - Start production server

## 🌐 Browser Support

- **Chrome/Edge**: Full support with optimal performance
- **Firefox**: Full support with slightly reduced performance
- **Safari**: Partial support (some recording features limited)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For support and questions:
- Create an issue on GitHub
- Join our community discussions
- Check the troubleshooting section above

---

Built with ❤️ using Next.js and Appwrite