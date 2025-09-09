'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function OAuthCompletePage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { t } = useI18n();

  useEffect(() => {
    if (window.opener) {
      if (error) {
        // 如果有错误，通知父窗口错误信息
        console.log('OAuth: Notifying parent window of error:', error);
        let errorMessage = t.auth.authenticationFailed;
        
        switch (error) {
          case 'registration_disabled':
            errorMessage = t.auth.registrationDisabled;
            break;
          case 'oauth_failed':
            errorMessage = t.auth.authenticationFailed;
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
        // 通知父窗口OAuth已成功完成
        console.log('OAuth: Notifying parent window of success');
        window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin);
      }
      
      // 短暂延迟后关闭窗口
      setTimeout(() => {
        console.log('OAuth: Closing popup window');
        window.close();
      }, 500);
    } else {
      // 如果不是在弹窗中打开，重定向到主页或登录页
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
          <p className="text-sm text-destructive">{t.auth.authenticationFailedClosing}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t.auth.loginSuccessfulClosing}</p>
        )}
      </div>
    </div>
  );
}