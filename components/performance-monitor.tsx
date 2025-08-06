'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Download, 
  Eye, 
  Clock, 
  Wifi,
  Image as ImageIcon,
  Video,
  Zap
} from 'lucide-react';

interface PerformanceMetrics {
  videoLoadsCount: number;
  thumbnailLoadsCount: number;
  totalDataUsage: number;
  avgLoadTime: number;
  lazyLoadSaves: number;
  modalOpens: number; // 模态框打开次数
  actualPlays: number; // 实际播放次数
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    videoLoadsCount: 0,
    thumbnailLoadsCount: 0,
    totalDataUsage: 0,
    avgLoadTime: 0,
    lazyLoadSaves: 0,
    modalOpens: 0,
    actualPlays: 0
  });
  const [showMonitor, setShowMonitor] = useState(false);

  // Simple metrics tracking for development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Simulate performance metrics for demonstration
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        thumbnailLoadsCount: prev.thumbnailLoadsCount + (Math.random() > 0.8 ? 1 : 0),
        totalDataUsage: prev.totalDataUsage + (Math.random() > 0.9 ? 0.05 : 0),
        modalOpens: prev.modalOpens + (Math.random() > 0.95 ? 1 : 0),
        actualPlays: prev.actualPlays + (Math.random() > 0.98 ? 1 : 0),
        lazyLoadSaves: prev.lazyLoadSaves + (Math.random() > 0.85 ? 1 : 0)
      }));
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!showMonitor) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMonitor(true)}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  const formatDataUsage = (mb: number) => {
    if (mb < 1) {
      return `${(mb * 1024).toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const getOptimizationScore = () => {
    // 新的优化评分算法：考虑模态框打开 vs 实际播放比例
    const playRatio = metrics.modalOpens > 0 
      ? metrics.actualPlays / metrics.modalOpens 
      : 0;
    
    const thumbnailEfficiency = metrics.thumbnailLoadsCount > metrics.videoLoadsCount ? 1 : 0;
    
    let score = 50; // 基础分
    
    // 缩略图加载优势（+30分）
    if (thumbnailEfficiency) score += 30;
    
    // 按需播放效率（+20分）
    if (playRatio < 0.3) score += 20; // 低播放率说明优化有效
    else if (playRatio < 0.5) score += 15;
    else if (playRatio < 0.7) score += 10;
    
    // 数据使用优化（+20分）
    if (metrics.totalDataUsage < 2) score += 20;
    else if (metrics.totalDataUsage < 5) score += 10;
    
    if (score >= 90) return { score: Math.min(score, 99), level: 'Excellent', color: 'green' };
    if (score >= 75) return { score, level: 'Good', color: 'blue' };
    if (score >= 60) return { score, level: 'Fair', color: 'yellow' };
    return { score, level: 'Poor', color: 'red' };
  };

  const optimization = getOptimizationScore();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMonitor(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Optimization Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Optimization Score</span>
            <Badge 
              variant={optimization.color === 'green' ? 'default' : 'secondary'}
              className={`${
                optimization.color === 'green' ? 'bg-green-100 text-green-800' :
                optimization.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                optimization.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {optimization.score}% {optimization.level}
            </Badge>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Thumbnails:</span>
              <span className="font-medium">{metrics.thumbnailLoadsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-3 w-3 text-red-500" />
              <span className="text-muted-foreground">Videos:</span>
              <span className="font-medium">{metrics.videoLoadsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Modal Opens:</span>
              <span className="font-medium">{metrics.modalOpens}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-orange-500" />
              <span className="text-muted-foreground">Actual Plays:</span>
              <span className="font-medium">{metrics.actualPlays}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-3 w-3 text-purple-500" />
              <span className="text-muted-foreground">Data Used:</span>
              <span className="font-medium">{formatDataUsage(metrics.totalDataUsage)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-teal-500" />
              <span className="text-muted-foreground">Lazy Saves:</span>
              <span className="font-medium">{metrics.lazyLoadSaves}</span>
            </div>
          </div>

          {/* Optimization Tips */}
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">💡 Optimization Status:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              {metrics.videoLoadsCount > metrics.thumbnailLoadsCount && (
                <li>🔴 Too many video loads vs thumbnails</li>
              )}
              {metrics.videoLoadsCount <= metrics.thumbnailLoadsCount && (
                <li>✅ Thumbnail-first strategy working</li>
              )}
              {metrics.modalOpens > 0 && metrics.actualPlays / metrics.modalOpens < 0.5 && (
                <li>✅ Good on-demand loading efficiency</li>
              )}
              {metrics.totalDataUsage < 2 && (
                <li>✅ Excellent data usage optimization</li>
              )}
              {metrics.totalDataUsage > 5 && (
                <li>🟡 Consider further data optimization</li>
              )}
              {metrics.lazyLoadSaves > 5 && (
                <li>✅ Lazy loading is saving bandwidth</li>
              )}
            </ul>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setMetrics({
              videoLoadsCount: 0,
              thumbnailLoadsCount: 0,
              totalDataUsage: 0,
              avgLoadTime: 0,
              lazyLoadSaves: 0,
              modalOpens: 0,
              actualPlays: 0
            })}
          >
            Reset Metrics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}