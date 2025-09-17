'use client';

import { PRIVACY } from '@/lib/constants';

export default function PrivacyPolicyPage() {
  // Removed useI18n, using PRIVACY constants directly

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-2">{PRIVACY.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">{PRIVACY.lastUpdated}</p>
        
        <div className="space-y-8">
          <section>
            <p className="text-lg leading-relaxed">{PRIVACY.introduction}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.informationCollectionTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.informationCollectionContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.informationUseTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.informationUseContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.informationSharingTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.informationSharingContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.cookiesTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.cookiesContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.securityTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.securityContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.dataRetentionTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.dataRetentionContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.userRightsTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.userRightsContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.thirdPartyTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.thirdPartyContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.changesTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.changesContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{PRIVACY.contactTitle}</h2>
            <p className="leading-relaxed">{PRIVACY.contactContent}</p>
          </section>
        </div>
      </div>
    </div>
  );
}