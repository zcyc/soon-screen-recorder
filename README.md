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
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Backend Services**: [Appwrite](https://appwrite.io/) for authentication and file storage
- **Recording API**: Web APIs (MediaRecorder, Screen Capture, getUserMedia)
- **Styling**: Tailwind CSS 4.0 with CSS variables and theme system
- **TypeScript**: Full type safety throughout the application
- **Icons**: [Lucide React](https://lucide.dev/) icon library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Appwrite project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soon-screen-recorder
   npm install
   ```

2. **Environment Setup**
   Create your `.env` file using the setup script:
   ```bash
   npm install
   ```

3. **Appwrite Configuration**
   Set up your Appwrite project and update the environment variables:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   NEXT_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to see the application.

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
- **Safari**: Basic support (some recording limitations)
- **Mobile Browsers**: Limited screen recording support

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience with large video previews
- **Tablet**: Adapted interface with touch-friendly controls  
- **Mobile**: Streamlined UI focusing on video playback and management

## 🔒 Security Features

- Appwrite-based authentication with secure session management
- Protected routes with authentication middleware
- Activity logging for security monitoring
- File upload validation and size limits
- XSS protection with proper content sanitization
- OAuth support (GitHub) for enhanced security

## 🚀 Deployment

The application is configured for deployment on various platforms:

- **Vercel**: Optimal with zero configuration
- **Netlify**: Supports with build adaptations
- **Railway/Render**: Full-stack deployment with database
- **Docker**: Containerization support available

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include browser version, OS, and steps to reproduce

---

**Built with ❤️ using Next.js and modern web technologies**