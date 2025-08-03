'use client';

import RecordingStatus from '@/components/recording-status';
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
        
        <RecordingStatus />
      </div>
    </div>
  );
}