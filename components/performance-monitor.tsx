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
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    videoLoadsCount: 0,
    thumbnailLoadsCount: 0,
    totalDataUsage: 0,
    avgLoadTime: 0,
    lazyLoadSaves: 0
  });
  const [showMonitor, setShowMonitor] = useState(false);

  // Simple metrics tracking for development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Simulate performance metrics for demonstration
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        thumbnailLoadsCount: prev.thumbnailLoadsCount + Math.random() > 0.7 ? 1 : 0,
        totalDataUsage: prev.totalDataUsage + (Math.random() > 0.8 ? 0.05 : 0),
        lazyLoadSaves: prev.lazyLoadSaves + (Math.random() > 0.9 ? 1 : 0)
      }));
    }, 2000);

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
    const thumbnailRatio = metrics.videoLoadsCount > 0 
      ? metrics.thumbnailLoadsCount / metrics.videoLoadsCount 
      : 0;
    
    if (thumbnailRatio > 3) return { score: 95, level: 'Excellent', color: 'green' };
    if (thumbnailRatio > 2) return { score: 85, level: 'Good', color: 'blue' };
    if (thumbnailRatio > 1) return { score: 70, level: 'Fair', color: 'yellow' };
    return { score: 50, level: 'Poor', color: 'red' };
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
              <Video className="h-3 w-3 text-red-500" />
              <span className="text-muted-foreground">Videos:</span>
              <span className="font-medium">{metrics.videoLoadsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Thumbnails:</span>
              <span className="font-medium">{metrics.thumbnailLoadsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Data Used:</span>
              <span className="font-medium">{formatDataUsage(metrics.totalDataUsage)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-purple-500" />
              <span className="text-muted-foreground">Lazy Saves:</span>
              <span className="font-medium">{metrics.lazyLoadSaves}</span>
            </div>
          </div>

          {/* Optimization Tips */}
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">💡 Optimization Tips:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              {metrics.videoLoadsCount > metrics.thumbnailLoadsCount && (
                <li>Too many video loads vs thumbnails</li>
              )}
              {metrics.totalDataUsage > 10 && (
                <li>High data usage detected</li>
              )}
              {metrics.lazyLoadSaves === 0 && (
                <li>Enable lazy loading for better performance</li>
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
              lazyLoadSaves: 0
            })}
          >
            Reset Metrics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}