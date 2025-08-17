'use client';

import { useEffect } from 'react';

export default function OAuthCompletePage() {
  useEffect(() => {
    // 通知父窗口OAuth已完成
    if (window.opener) {
      console.log('OAuth: Notifying parent window of completion');
      window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin);
      
      // 短暂延迟后关闭窗口
      setTimeout(() => {
        console.log('OAuth: Closing popup window');
        window.close();
      }, 500);
    } else {
      // 如果不是在弹窗中打开，重定向到主页
      console.log('OAuth: Not in popup, redirecting to main page');
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">登录成功，正在关闭窗口...</p>
        <p className="text-xs text-muted-foreground">Login successful, closing window...</p>
      </div>
    </div>
  );
}