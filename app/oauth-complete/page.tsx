'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AUTH } from '@/lib/constants';

export default function OAuthCompletePage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (window.opener) {
      if (error) {
        // If there's an error, notify parent window of error information
        console.log('OAuth: Notifying parent window of error:', error);
        let errorMessage: string = AUTH.authenticationFailed;
        
        switch (error) {
          case 'registration_disabled':
            errorMessage = AUTH.registrationDisabled;
            break;
          case 'oauth_failed':
            errorMessage = AUTH.authenticationFailed;
            break;
          default:
            errorMessage = `OAuth error: ${error}`;
            break;
        }
        
        window.opener.postMessage({ 
          type: 'OAUTH_ERROR', 
          error: errorMessage 
        }, window.location.origin);
      } else {
        // Notify parent window that OAuth has completed successfully
        console.log('OAuth: Notifying parent window of success');
        window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin);
      }
      
      // Close window after short delay
      setTimeout(() => {
        console.log('OAuth: Closing popup window');
        window.close();
      }, 500);
    } else {
      // If not opened in popup, redirect to main page or login page
      if (error) {
        console.log('OAuth: Not in popup, redirecting to sign-in with error');
        window.location.href = `/sign-in?error=${error}`;
      } else {
        console.log('OAuth: Not in popup, redirecting to main page');
        window.location.href = '/';
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        {error ? (
          <p className="text-sm text-destructive">{AUTH.authenticationFailedClosing}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{AUTH.loginSuccessfulClosing}</p>
        )}
      </div>
    </div>
  );
}