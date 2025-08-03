'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Database, 
  FolderOpen, 
  Settings, 
  CheckCircle,
  Copy,
  AlertCircle
} from 'lucide-react';

export default function SetupGuide() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepNumber) 
        ? prev.filter(n => n !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isCompleted = (stepNumber: number) => completedSteps.includes(stepNumber);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-6 w-6 mr-3" />
            🛠️ Appwrite 数据库设置指南
          </CardTitle>
          <p className="text-muted-foreground">
            由于客户端SDK的限制，需要手动在 Appwrite 控制台中创建数据库集合。请按照以下步骤操作：
          </p>
        </CardHeader>
      </Card>

      {/* Step 1: Access Appwrite Console */}
      <Card className={isCompleted(1) ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3">
                1
              </span>
              访问 Appwrite 控制台
            </CardTitle>
            <Button
              variant={isCompleted(1) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStep(1)}
            >
              {isCompleted(1) ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
              {isCompleted(1) ? '已完成' : '标记完成'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-2 text-sm">
            <li>1. 访问 <a href="https://nyc.cloud.appwrite.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center inline-flex">https://nyc.cloud.appwrite.io <ExternalLink className="h-4 w-4 ml-1" /></a></li>
            <li>2. 登录您的 Appwrite 账户</li>
            <li>3. 选择项目 ID 为 <Badge variant="outline">soon</Badge> 的项目</li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 2: Create Database */}
      <Card className={isCompleted(2) ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3">
                2
              </span>
              创建数据库
            </CardTitle>
            <Button
              variant={isCompleted(2) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStep(2)}
            >
              {isCompleted(2) ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
              {isCompleted(2) ? '已完成' : '标记完成'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-2 text-sm">
            <li>1. 在左侧菜单中点击 "Databases"</li>
            <li>2. 点击 "Create Database" 按钮</li>
            <li>3. 输入数据库 ID: <Badge variant="outline">soon</Badge></li>
            <li>4. 输入数据库名称: <code>Soon Database</code></li>
            <li>5. 点击 "Create"</li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 3: Create Videos Collection */}
      <Card className={isCompleted(3) ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3">
                3
              </span>
              创建 Videos 集合
            </CardTitle>
            <Button
              variant={isCompleted(3) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStep(3)}
            >
              {isCompleted(3) ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
              {isCompleted(3) ? '已完成' : '标记完成'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              在 soon 数据库中创建集合:
            </p>
          </div>
          <ol className="space-y-2 text-sm">
            <li>1. 在数据库页面点击 "Create Collection"</li>
            <li>2. 集合 ID: <Badge variant="outline">videos</Badge></li>
            <li>3. 集合名称: <code>Videos</code></li>
            <li>4. 点击 "Create"</li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 4: Create Videos Attributes */}
      <Card className={isCompleted(4) ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3">
                4
              </span>
              为 Videos 集合添加属性
            </CardTitle>
            <Button
              variant={isCompleted(4) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStep(4)}
            >
              {isCompleted(4) ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
              {isCompleted(4) ? '已完成' : '标记完成'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            在 videos 集合中，点击 "Attributes" 标签，然后添加以下属性：
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* String Attributes */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">字符串属性 (String)</h4>
              {[
                { key: 'title', size: '255', required: true },
                { key: 'fileId', size: '255', required: true },
                { key: 'userId', size: '255', required: true },
                { key: 'userName', size: '255', required: true },
                { key: 'quality', size: '10', required: true },
                { key: 'thumbnailUrl', size: '500', required: false },
              ].map((attr) => (
                <div key={attr.key} className="bg-muted p-2 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{attr.key}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(attr.key, attr.key)}
                    >
                      {copiedKey === attr.key ? '✓' : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="text-muted-foreground">
                    大小: {attr.size} | 必需: {attr.required ? '是' : '否'}
                  </div>
                </div>
              ))}
            </div>

            {/* Integer and Boolean Attributes */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">整数属性 (Integer)</h4>
              {[
                { key: 'duration', default: '0', required: true },
                { key: 'views', default: '0', required: true },
              ].map((attr) => (
                <div key={attr.key} className="bg-muted p-2 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{attr.key}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(attr.key, attr.key)}
                    >
                      {copiedKey === attr.key ? '✓' : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="text-muted-foreground">
                    默认值: {attr.default} | 必需: {attr.required ? '是' : '否'}
                  </div>
                </div>
              ))}

              <h4 className="font-semibold text-sm mt-4">布尔属性 (Boolean)</h4>
              <div className="bg-muted p-2 rounded text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono">isPublic</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('isPublic', 'isPublic')}
                  >
                    {copiedKey === 'isPublic' ? '✓' : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="text-muted-foreground">
                  默认值: false | 必需: 是
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 5: Create Reactions Collection */}
      <Card className={isCompleted(5) ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3">
                5
              </span>
              创建 Reactions 集合
            </CardTitle>
            <Button
              variant={isCompleted(5) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStep(5)}
            >
              {isCompleted(5) ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
              {isCompleted(5) ? '已完成' : '标记完成'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-2 text-sm">
            <li>1. 在数据库页面点击 "Create Collection"</li>
            <li>2. 集合 ID: <Badge variant="outline">reactions</Badge></li>
            <li>3. 集合名称: <code>Video Reactions</code></li>
            <li>4. 点击 "Create"</li>
          </ol>

          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2">添加字符串属性：</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {[
                { key: 'videoId', size: '255' },
                { key: 'userId', size: '255' },
                { key: 'userName', size: '255' },
                { key: 'emoji', size: '10' },
              ].map((attr) => (
                <div key={attr.key} className="bg-muted p-2 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{attr.key}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(attr.key, `reaction_${attr.key}`)}
                    >
                      {copiedKey === `reaction_${attr.key}` ? '✓' : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="text-muted-foreground">
                    大小: {attr.size} | 必需: 是
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 6: Set Collection Permissions */}
      <Card className={isCompleted(6) ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3">
                6
              </span>
              配置集合权限 🔑
            </CardTitle>
            <Button
              variant={isCompleted(6) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStep(6)}
            >
              {isCompleted(6) ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
              {isCompleted(6) ? '已完成' : '标记完成'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              ⚠️ 重要：这一步是解决 "401 Unauthorized" 错误的关键！
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">为 Videos 集合配置权限：</h4>
              <ol className="space-y-2 text-sm">
                <li>1. 进入 <Badge variant="outline">videos</Badge> 集合</li>
                <li>2. 点击 "Settings" 标签</li>
                <li>3. 在 "Permissions" 部分点击 "Update Permissions"</li>
                <li>4. 添加以下权限：</li>
                <ul className="ml-6 space-y-1 mt-2">
                  <li className="bg-muted p-2 rounded flex justify-between items-center">
                    <code className="text-xs">Read - Any</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('Any', 'read_any')}
                    >
                      {copiedKey === 'read_any' ? '✓' : <Copy className="h-3 w-3" />}
                    </Button>
                  </li>
                  <li className="bg-muted p-2 rounded flex justify-between items-center">
                    <code className="text-xs">Create - Users</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('Users', 'create_users')}
                    >
                      {copiedKey === 'create_users' ? '✓' : <Copy className="h-3 w-3" />}
                    </Button>
                  </li>
                  <li className="bg-muted p-2 rounded flex justify-between items-center">
                    <code className="text-xs">Update - Users</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('Users', 'update_users')}
                    >
                      {copiedKey === 'update_users' ? '✓' : <Copy className="h-3 w-3" />}
                    </Button>
                  </li>
                  <li className="bg-muted p-2 rounded flex justify-between items-center">
                    <code className="text-xs">Delete - Users</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('Users', 'delete_users')}
                    >
                      {copiedKey === 'delete_users' ? '✓' : <Copy className="h-3 w-3" />}
                    </Button>
                  </li>
                </ul>
                <li>5. 点击 "Update" 保存权限</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">为 Reactions 集合配置相同权限：</h4>
              <p className="text-sm text-muted-foreground">
                对 <Badge variant="outline">reactions</Badge> 集合重复上述步骤 1-5
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 7: Create Storage Bucket */}
      <Card className={isCompleted(7) ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3">
                7
              </span>
              创建视频存储桶
            </CardTitle>
            <Button
              variant={isCompleted(7) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStep(7)}
            >
              {isCompleted(7) ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
              {isCompleted(7) ? '已完成' : '标记完成'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-2 text-sm">
            <li>1. 在左侧菜单中点击 "Storage"</li>
            <li>2. 点击 "Create Bucket"</li>
            <li>3. 桶 ID: <Badge variant="outline">videos</Badge></li>
            <li>4. 桶名称: <code>Videos</code></li>
            <li>5. 设置以下配置：</li>
            <ul className="ml-6 space-y-1">
              <li>• 文件安全：<code>禁用</code></li>
              <li>• 最大文件大小：<code>104857600</code> (100MB)</li>
              <li>• 允许的文件类型：<code>video/webm, video/mp4, video/quicktime</code></li>
              <li>• 压缩：<code>gzip</code></li>
              <li>• 加密：<code>禁用</code></li>
              <li>• 防病毒：<code>禁用</code></li>
            </ul>
            <li>6. 点击 "Create"</li>
          </ol>
        </CardContent>
      </Card>

      {/* Final Status */}
      <Card className={completedSteps.length === 7 ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-amber-500 bg-amber-50 dark:bg-amber-950'}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {completedSteps.length === 6 ? (
              <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 mr-3 text-amber-600" />
            )}
            设置状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                已完成步骤: <span className="font-bold">{completedSteps.length}/7</span>
              </p>
              {completedSteps.length === 7 ? (
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                  🎉 设置完成！现在可以正常使用 Soon 应用了。
                </p>
              ) : (
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">
                  请完成所有步骤以使用 Soon 应用。特别注意步骤6的权限配置！
                </p>
              )}
            </div>
            {completedSteps.length === 7 && (
              <Button asChild>
                <a href="/dashboard">前往仪表板</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}