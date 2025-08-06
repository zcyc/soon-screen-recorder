import { Suspense } from 'react';
import ThumbnailManager from '@/components/thumbnail-manager';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function ThumbnailManagerSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ThumbnailManagementPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">缩略图管理</h1>
          <p className="text-muted-foreground mt-2">
            管理视频缩略图，优化加载性能和用户体验
          </p>
        </div>

        <Suspense fallback={<ThumbnailManagerSkeleton />}>
          <ThumbnailManager />
        </Suspense>
      </div>
    </div>
  );
}