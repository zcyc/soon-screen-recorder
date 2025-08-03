# Soon - Appwrite 数据库设置指南

## 概述

由于客户端 Appwrite SDK 的安全限制，无法自动创建数据库集合。请按照以下步骤在 Appwrite 控制台中手动设置数据库。

## 快速设置步骤

### 1. 访问 Appwrite 控制台
- 访问：https://nyc.cloud.appwrite.io
- 登录您的账户
- 选择项目 ID 为 `soon` 的项目

### 2. 创建数据库
- 点击左侧菜单 "Databases"
- 点击 "Create Database"
- 数据库 ID: `soon`
- 数据库名称: `Soon Database`

### 3. 创建 Videos 集合
- 在数据库中点击 "Create Collection"
- 集合 ID: `videos`
- 集合名称: `Videos`

#### Videos 集合属性：
**字符串属性 (String):**
- `title` - 大小: 255, 必需: 是
- `fileId` - 大小: 255, 必需: 是
- `userId` - 大小: 255, 必需: 是
- `userName` - 大小: 255, 必需: 是
- `quality` - 大小: 10, 必需: 是
- `thumbnailUrl` - 大小: 500, 必需: 否

**整数属性 (Integer):**
- `duration` - 默认值: 0, 必需: 是
- `views` - 默认值: 0, 必需: 是

**布尔属性 (Boolean):**
- `isPublic` - 默认值: false, 必需: 是

### 4. 创建 Reactions 集合
- 集合 ID: `reactions`
- 集合名称: `Video Reactions`

#### Reactions 集合属性：
**字符串属性 (String) - 所有属性大小: 255, 必需: 是:**
- `videoId`
- `userId`
- `userName`
- `emoji` (大小: 10)

### 5. 配置集合权限 🔑
**重要：这一步是解决 "401 Unauthorized" 错误的关键！**

#### 为两个集合都配置以下权限：
- 进入集合（videos 或 reactions）
- 点击 "Settings" 标签  
- 在 "Permissions" 部分点击 "Update Permissions"
- 添加以下权限：
  - **Read**: `Any`
  - **Create**: `Users` 
  - **Update**: `Users`
  - **Delete**: `Users`
- 点击 "Update" 保存

### 6. 创建存储桶
- 点击左侧菜单 "Storage"
- 点击 "Create Bucket"
- 桶 ID: `videos`
- 桶名称: `Videos`
- 配置:
  - 文件安全: 禁用
  - 最大文件大小: 104857600 (100MB)
  - 允许文件类型: `video/webm, video/mp4, video/quicktime`
  - 压缩: gzip
  - 加密: 禁用
  - 防病毒: 禁用

## 验证设置

完成所有步骤后：
1. 访问 `/dashboard` 页面
2. 如果设置正确，您将看到录制界面和视频列表
3. 如果仍有错误，请检查集合名称和属性是否完全匹配

## 环境变量

确保 `.env` 文件包含：
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=soon
NEXT_PUBLIC_APPWRITE_DATABASE_ID=soon
NEXT_PUBLIC_APPWRITE_BUCKET_ID=videos
```

## 故障排除

- **"Attribute not found in schema: userId"** - 检查 videos 集合是否有 userId 属性
- **"Collection not found"** - 确认集合 ID 完全匹配 (videos, reactions)
- **存储错误** - 检查存储桶 ID 是否为 "videos"

完成设置后，应用将完全正常工作！🎬