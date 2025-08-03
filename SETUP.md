# Soon - Complete Setup Guide 🚀

This guide will help you set up the **Soon** screen recording application with all required services and dependencies.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL** database running (local or cloud)
- **Appwrite project** created and accessible
- **Git** for version control

## 🏗️ Architecture Overview

Soon uses a hybrid backend architecture:
- **PostgreSQL + Drizzle ORM**: User management, authentication, activity logs
- **Appwrite**: Video storage, metadata management, file operations
- **Next.js**: Frontend and API routes

---

## 🗄️ Part 1: PostgreSQL Database Setup

### Option A: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows: Download from https://www.postgresql.org/download/
   ```

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database and user
   CREATE DATABASE soon_app;
   CREATE USER soon_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE soon_app TO soon_user;
   \q
   ```

### Option B: Cloud PostgreSQL

Use services like:
- **Railway**: https://railway.app
- **Supabase**: https://supabase.com
- **Neon**: https://neon.tech
- **Render**: https://render.com

---

## ☁️ Part 2: Appwrite Setup

### 1. Create Appwrite Project

1. **Access Appwrite Console**
   - Visit: https://cloud.appwrite.io (or your self-hosted instance)
   - Create an account or sign in
   - Click "Create Project"
   - Project Name: `Soon Screen Recorder`
   - Project ID: `soon`

### 2. Configure Authentication

1. **Navigate to Auth > Settings**
2. **Enable Auth Methods**:
   - ✅ Email/Password
   - ✅ Session Limit: 10
   - ✅ Password History: 5
3. **Security Settings**:
   - Session Length: 1 year
   - Password Dictionary: Enable

### 3. Create Database Collections

#### 🎬 Videos Collection

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

#### 👥 Reactions Collection

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

### 4. Configure Permissions 🔐

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

### 5. Create Storage Bucket

1. **Navigate to Storage**
2. **Create Bucket**:
   - Bucket ID: `videos`
   - Bucket Name: `Videos Storage`
   
3. **Configure Settings**:
   ```
   • Maximum File Size: 104857600 (100MB)
   • Allowed File Types: video/webm, video/mp4, video/quicktime
   • File Security: False (for public access)
   • Compression: gzip
   • Encryption: False
   • Antivirus: False
   ```

4. **Set Bucket Permissions**:
   - **Read**: `any`
   - **Create**: `users`
   - **Update**: `users`
   - **Delete**: `users`

---

## 🔧 Part 3: Application Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd soon-screen-recorder
npm install
```

### 2. Environment Configuration

#### Automatic Setup (Recommended)

```bash
npm run db:setup
```

This will create `.env` with PostgreSQL settings.

#### Manual Setup

Create `.env` file:

```env
# PostgreSQL Database
POSTGRES_URL=postgresql://soon_user:your_password@localhost:5432/soon_app

# Application
BASE_URL=http://localhost:3000
AUTH_SECRET=your_64_character_random_string

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=soon
NEXT_PUBLIC_APPWRITE_DATABASE_ID=soon
NEXT_PUBLIC_APPWRITE_BUCKET_ID=videos
```

### 3. Database Migration

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

### 4. Test Account

The seed script creates:
- **Email**: `test@test.com`
- **Password**: `admin123`

---

## ✅ Part 4: Verification

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Checklist

Visit `http://localhost:3000` and verify:

- [ ] **Homepage loads** without errors
- [ ] **Sign in** works with test account
- [ ] **Dashboard** displays recording interface
- [ ] **Recording** permissions work (screen/camera)
- [ ] **Video upload** to Appwrite succeeds
- [ ] **Video playback** from storage works
- [ ] **Public sharing** links function
- [ ] **Reactions system** operates

---

## 🔍 Troubleshooting

### Common Issues

#### 🚫 "Collection with ID 'videos' could not be found"
```bash
# Check Appwrite database settings
• Verify database ID is exactly: soon
• Verify collection IDs are exactly: videos, reactions
```

#### 🚫 "401 Unauthorized" Errors
```bash
# Check Appwrite permissions
• Collections must have proper read/write permissions
• Storage bucket must allow public read access
• Project settings should allow your domain
```

#### 🚫 Database Connection Errors
```bash
# Test PostgreSQL connection
psql "postgresql://soon_user:password@localhost:5432/soon_app"

# Check environment variables
echo $POSTGRES_URL
```

#### 🚫 Video Upload Failures
```bash
# Check Appwrite storage configuration
• Bucket ID matches environment variable
• File size limits are sufficient (100MB+)
• Allowed file types include video/webm
• Storage permissions allow user uploads
```

#### 🚫 Screen Recording Permission Denied
```bash
# Browser requirements
• Use HTTPS in production (required for screen capture)
• Grant camera/microphone permissions
• Use supported browsers (Chrome, Edge, Firefox)
```

---

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Update these for production
BASE_URL=https://your-domain.com
POSTGRES_URL=postgresql://user:pass@production-host:5432/db

# Keep Appwrite settings, or use your own instance
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
# ... rest of Appwrite config
```

### Security Checklist

- [ ] **HTTPS enabled** (required for screen recording)
- [ ] **Database credentials** secured
- [ ] **Appwrite API keys** restricted to your domain
- [ ] **File upload limits** configured appropriately
- [ ] **CORS settings** properly configured

---

## 📞 Support

### Getting Help

1. **Check logs** in browser developer console
2. **Verify all environment variables** are set correctly
3. **Test Appwrite connection** independently
4. **Check PostgreSQL connectivity**

### Common Log Messages

```bash
✅ "Appwrite config: { endpoint: '...', projectId: '...' }"
✅ "Successfully created video record"
❌ "Collection not found" → Check Appwrite database setup
❌ "401 Unauthorized" → Check permissions configuration
```

---

## 🎉 Success!

Once setup is complete, you should have:

- ✅ **Full screen recording** functionality
- ✅ **Video management** and sharing
- ✅ **User authentication** system
- ✅ **Public video** gallery
- ✅ **Subtitle generation** with speech recognition
- ✅ **Multi-language** support (English/Chinese)

**Happy Recording!** 🎬