'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Monitor, Camera, Mic, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface PermissionStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  screen: 'supported' | 'unsupported' | 'unknown';
}

export default function RecordingStatus() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: 'unknown',
    microphone: 'unknown',
    screen: 'unknown'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isHttps, setIsHttps] = useState(false);

  useEffect(() => {
    checkPermissions();
    setIsHttps(window.location.protocol === 'https:');
  }, []);

  const checkPermissions = async () => {
    setIsLoading(true);

    try {
      // Check if APIs are supported
      const hasGetDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

      setPermissions(prev => ({
        ...prev,
        screen: hasGetDisplayMedia ? 'supported' : 'unsupported'
      }));

      if (hasGetUserMedia && navigator.permissions) {
        // Check camera permission
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setPermissions(prev => ({ ...prev, camera: cameraPermission.state }));
        } catch (error) {
          console.log('Camera permission check not supported:', error);
          setPermissions(prev => ({ ...prev, camera: 'unknown' }));
        }

        // Check microphone permission
        try {
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissions(prev => ({ ...prev, microphone: microphonePermission.state }));
        } catch (error) {
          console.log('Microphone permission check not supported:', error);
          setPermissions(prev => ({ ...prev, microphone: 'unknown' }));
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async (type: 'camera' | 'microphone') => {
    try {
      if (type === 'camera') {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } else {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      // Refresh permissions after granting
      setTimeout(checkPermissions, 1000);
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      // Still refresh to get the latest status
      setTimeout(checkPermissions, 1000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
      case 'supported':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'denied':
      case 'unsupported':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'prompt':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted':
        return '已授权';
      case 'supported':
        return '支持';
      case 'denied':
        return '已拒绝';
      case 'unsupported':
        return '不支持';
      case 'prompt':
        return '需要授权';
      default:
        return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
      case 'supported':
        return 'text-green-600 dark:text-green-400';
      case 'denied':
      case 'unsupported':
        return 'text-red-600 dark:text-red-400';
      case 'prompt':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            录制环境检查
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>检查录制权限...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          录制环境状态
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HTTPS Status */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
          <div className="flex items-center">
            <div className="mr-2">
              {isHttps ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <span className="text-sm font-medium">HTTPS 连接</span>
          </div>
          <span className={`text-sm ${isHttps ? 'text-green-600' : 'text-red-600'}`}>
            {isHttps ? '安全' : '不安全'}
          </span>
        </div>

        {!isHttps && (
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-300 text-xs">
              ⚠️ 屏幕录制需要 HTTPS 连接。请在生产环境中启用 HTTPS。
            </p>
          </div>
        )}

        {/* Screen Recording */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Monitor className="h-4 w-4 mr-2" />
            <span className="text-sm">屏幕录制</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(permissions.screen)}
            <span className={`text-sm ${getStatusColor(permissions.screen)}`}>
              {getStatusText(permissions.screen)}
            </span>
          </div>
        </div>

        {/* Camera Recording */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            <span className="text-sm">摄像头录制</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(permissions.camera)}
            <span className={`text-sm ${getStatusColor(permissions.camera)}`}>
              {getStatusText(permissions.camera)}
            </span>
            {permissions.camera === 'prompt' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestPermission('camera')}
                className="h-6 px-2 text-xs"
              >
                授权
              </Button>
            )}
          </div>
        </div>

        {/* Audio Recording */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mic className="h-4 w-4 mr-2" />
            <span className="text-sm">麦克风录制</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(permissions.microphone)}
            <span className={`text-sm ${getStatusColor(permissions.microphone)}`}>
              {getStatusText(permissions.microphone)}
            </span>
            {permissions.microphone === 'prompt' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestPermission('microphone')}
                className="h-6 px-2 text-xs"
              >
                授权
              </Button>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={checkPermissions}
            className="w-full"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新权限状态
          </Button>
        </div>

        {/* Troubleshooting */}
        {(permissions.camera === 'denied' || permissions.microphone === 'denied') && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-amber-700 dark:text-amber-300 text-xs">
              💡 如果权限被拒绝，请点击地址栏旁的摄像头/麦克风图标重新授权，或在浏览器设置中管理网站权限。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}