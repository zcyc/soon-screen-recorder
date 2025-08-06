'use client';

import RecordingStatus from '@/components/recording-status';
import FileVideoUpload from '@/components/file-video-upload';
import { useI18n } from '@/lib/i18n';

export default function DevicesPage() {
  const { t } = useI18n();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t.devices.title}</h1>
          <p className="text-muted-foreground mt-2">
            {t.devices.description}
          </p>
        </div>
        
        <div className="space-y-8">
          <RecordingStatus />
          
          <div className="border-t pt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">文件上传</h2>
              <p className="text-muted-foreground mt-2">
                上传本地视频文件，自动生成缩略图
              </p>
            </div>
            <FileVideoUpload />
          </div>
        </div>
      </div>
    </div>
  );
}