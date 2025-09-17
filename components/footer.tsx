'use client';

import Link from 'next/link';
import { FOOTER } from '@/lib/constants';

export default function Footer() {

  return (
    <footer className="bg-background border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            {FOOTER.copyright} {FOOTER.allRightsReserved}
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/terms-of-service" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {FOOTER.termsOfService}
            </Link>
            <Link 
              href="/privacy-policy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {FOOTER.privacyPolicy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}