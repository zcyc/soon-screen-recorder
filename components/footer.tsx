'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-background border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            {t.footer.copyright} {t.footer.allRightsReserved}
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/terms-of-service" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.footer.termsOfService}
            </Link>
            <Link 
              href="/privacy-policy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.footer.privacyPolicy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}