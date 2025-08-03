'use client';

import RecordingStatus from '@/components/recording-status';
import { useI18n } from '@/lib/i18n';

export default function DevicesPage() {
  const { t } = useI18n();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t.devices.title}</h1>
          <p className="text-muted-foreground mt-2">
            Check recording device permissions and browser compatibility status
          </p>
        </div>
        
        <RecordingStatus />
      </div>
    </div>
  );
}