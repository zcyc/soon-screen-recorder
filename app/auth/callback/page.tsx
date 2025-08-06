'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleOAuthCallbackAction, logOAuthActivityAction } from '@/app/actions/user-actions';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 显示调试信息
        const debugData = {
          url: window.location.href,
          searchParams: Array.from(searchParams.entries()),
          timestamp: new Date().toISOString()
        };
        setDebugInfo(debugData);
        
        console.log('OAuth callback page loaded with:', debugData);
        
        // 提取回调参数
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');
        const error = searchParams.get('error');

        // 检查是否有错误
        if (error) {
          console.error('OAuth callback error from URL:', error);
          setError(`OAuth error: ${error}`);
          setStatus('error');
          
          // 3秒后重定向到登录页
          setTimeout(() => {
            router.push('/sign-in?error=oauth_failed');
          }, 3000);
          return;
        }

        // 检查必需参数
        if (!userId || !secret) {
          console.error('Missing OAuth callback parameters:', { userId: !!userId, secret: !!secret });
          setError('Missing OAuth callback parameters');
          setStatus('error');
          
          // 3秒后重定向到登录页
          setTimeout(() => {
            router.push('/sign-in?error=oauth_incomplete');
          }, 3000);
          return;
        }

        // 处理 OAuth 回调
        console.log('Processing OAuth callback...');
        const result = await handleOAuthCallbackAction(userId, secret);
        
        if (result.success && result.data?.user) {
          console.log('OAuth callback successful, user:', result.data.user.$id);
          
          // 记录登录活动
          try {
            const activityResult = await logOAuthActivityAction(result.data.user.$id, 'GitHub OAuth login');
            if (activityResult.data?.warning) {
              console.warn('Activity logging warning:', activityResult.data.warning);
            }
          } catch (activityError) {
            console.warn('Failed to log OAuth activity:', activityError);
            // 不阻止登录流程
          }
          
          setStatus('success');
          
          // 1秒后重定向到仪表板
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
          
        } else {
          console.error('OAuth callback failed:', result.error);
          setError(result.error || 'Failed to establish session');
          setStatus('error');
          
          // 3秒后重定向到登录页
          setTimeout(() => {
            router.push('/sign-in?error=oauth_session_failed');
          }, 3000);
        }
        
      } catch (error: any) {
        console.error('OAuth callback processing error:', error);
        setError(error.message || 'Unexpected error during OAuth callback');
        setStatus('error');
        
        // 3秒后重定向到登录页
        setTimeout(() => {
          router.push('/sign-in?error=oauth_processing_failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Processing OAuth Login...</h1>
            <p className="text-gray-600">
              Please wait while we complete your GitHub authentication...
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="rounded-full bg-green-100 p-3 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Login Successful!</h1>
            <p className="text-gray-600">
              Redirecting to your dashboard...
            </p>
          </>
        );

      case 'error':
        return (
          <>
            <div className="rounded-full bg-red-100 p-3 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h1>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to sign in page...
            </p>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {renderContent()}
          </div>
          
          {/* Debug information (only in development) */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information:</h3>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}