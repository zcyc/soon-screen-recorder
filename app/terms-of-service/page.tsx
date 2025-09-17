'use client';

import { TERMS } from '@/lib/constants';

export default function TermsOfServicePage() {

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-2">{TERMS.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">{TERMS.lastUpdated}</p>
        
        <div className="space-y-8">
          <section>
            <p className="text-lg leading-relaxed">{TERMS.introduction}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.acceptanceTitle}</h2>
            <p className="leading-relaxed">{TERMS.acceptanceContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.serviceDescriptionTitle}</h2>
            <p className="leading-relaxed">{TERMS.serviceDescriptionContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.userAccountsTitle}</h2>
            <p className="leading-relaxed">{TERMS.userAccountsContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.privacyTitle}</h2>
            <p className="leading-relaxed">{TERMS.privacyContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.prohibitedUsesTitle}</h2>
            <p className="leading-relaxed">{TERMS.prohibitedUsesContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.intellectualPropertyTitle}</h2>
            <p className="leading-relaxed">{TERMS.intellectualPropertyContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.terminationTitle}</h2>
            <p className="leading-relaxed">{TERMS.terminationContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.disclaimerTitle}</h2>
            <p className="leading-relaxed">{TERMS.disclaimerContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.limitationTitle}</h2>
            <p className="leading-relaxed">{TERMS.limitationContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.changesTitle}</h2>
            <p className="leading-relaxed">{TERMS.changesContent}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{TERMS.contactTitle}</h2>
            <p className="leading-relaxed">{TERMS.contactContent}</p>
          </section>
        </div>
      </div>
    </div>
  );
}