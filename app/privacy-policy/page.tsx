'use client';

import { useI18n } from '@/lib/i18n';

export default function PrivacyPolicyPage() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-2">{t.privacy.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t.privacy.lastUpdated}</p>
        
        <div className="space-y-8">
          <section>
            <p className="text-lg leading-relaxed">{t.privacy.introduction}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.informationCollectionTitle}</h2>
            <p className="leading-relaxed">{t.privacy.informationCollectionContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.informationUseTitle}</h2>
            <p className="leading-relaxed">{t.privacy.informationUseContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.informationSharingTitle}</h2>
            <p className="leading-relaxed">{t.privacy.informationSharingContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.cookiesTitle}</h2>
            <p className="leading-relaxed">{t.privacy.cookiesContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.securityTitle}</h2>
            <p className="leading-relaxed">{t.privacy.securityContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.dataRetentionTitle}</h2>
            <p className="leading-relaxed">{t.privacy.dataRetentionContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.userRightsTitle}</h2>
            <p className="leading-relaxed">{t.privacy.userRightsContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.thirdPartyTitle}</h2>
            <p className="leading-relaxed">{t.privacy.thirdPartyContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.changesTitle}</h2>
            <p className="leading-relaxed">{t.privacy.changesContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.privacy.contactTitle}</h2>
            <p className="leading-relaxed">{t.privacy.contactContent}</p>
          </section>
        </div>
      </div>
    </div>
  );
}