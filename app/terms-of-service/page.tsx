'use client';

import { useI18n } from '@/lib/i18n';

export default function TermsOfServicePage() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-2">{t.terms.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t.terms.lastUpdated}</p>
        
        <div className="space-y-8">
          <section>
            <p className="text-lg leading-relaxed">{t.terms.introduction}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.acceptanceTitle}</h2>
            <p className="leading-relaxed">{t.terms.acceptanceContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.serviceDescriptionTitle}</h2>
            <p className="leading-relaxed">{t.terms.serviceDescriptionContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.userAccountsTitle}</h2>
            <p className="leading-relaxed">{t.terms.userAccountsContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.privacyTitle}</h2>
            <p className="leading-relaxed">{t.terms.privacyContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.prohibitedUsesTitle}</h2>
            <p className="leading-relaxed">{t.terms.prohibitedUsesContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.intellectualPropertyTitle}</h2>
            <p className="leading-relaxed">{t.terms.intellectualPropertyContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.terminationTitle}</h2>
            <p className="leading-relaxed">{t.terms.terminationContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.disclaimerTitle}</h2>
            <p className="leading-relaxed">{t.terms.disclaimerContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.limitationTitle}</h2>
            <p className="leading-relaxed">{t.terms.limitationContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.changesTitle}</h2>
            <p className="leading-relaxed">{t.terms.changesContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t.terms.contactTitle}</h2>
            <p className="leading-relaxed">{t.terms.contactContent}</p>
          </section>
        </div>
      </div>
    </div>
  );
}