'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Github, Chrome } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { registrationConfig } from '@/lib/config';
import { useAuth } from '@/contexts/auth-context';
import { signInWithEmailPassword, signInWithGithub, signInWithGoogle } from '@/lib/auth/client-auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  // Don't allow signup mode if registration is disabled
  const [isSignUp, setIsSignUp] = useState(false && registrationConfig.enableRegistration);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(''); // Clear error when user types
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signInWithEmailPassword(
        formData.email, 
        formData.password, 
        isSignUp ? formData.name : undefined
      );
      
      if (!result.success) {
        setError(result.error || t.auth.errorOccurred);
      } else {
        // 登录成功 - 不刷新页面，只更新状态
        console.log('邮箱登录成功，更新认证状态');
        
        // 刷新用户状态
        await refreshUser();
        
        // 等待片刻让认证状态更新
        setTimeout(() => {
          onSuccess?.();
          onClose();
          console.log('登录模态已关闭，用户状态已更新');
        }, 100);
      }
    } catch (error: any) {
      setError(error.message || t.auth.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signInWithGithub();
      if (!result.success) {
        setError(result.error || t.auth.githubLoginFailed);
      } else if (result.url) {
        // 在新窗口中打开GitHub登录
        const popup = window.open(result.url, 'github-login', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        // 监听来自弹窗的消息
        const messageListener = (event: MessageEvent) => {
          if (event.origin === window.location.origin) {
            if (event.data.type === 'OAUTH_SUCCESS') {
              console.log('GitHub OAuth success message received');
              window.removeEventListener('message', messageListener);
              clearInterval(checkClosed);
              
              // 登录成功处理 - 不刷新页面
              console.log('GitHub OAuth 登录成功，更新认证状态');
              setTimeout(async () => {
                await refreshUser();
                onSuccess?.();
                onClose();
                console.log('GitHub 登录模态已关闭，用户状态已更新');
              }, 500);
            } else if (event.data.type === 'OAUTH_ERROR') {
              console.log('GitHub OAuth error message received:', event.data.error);
              window.removeEventListener('message', messageListener);
              clearInterval(checkClosed);
              
              // 显示错误信息
              setError(event.data.error || t.auth.githubLoginFailed);
              setIsLoading(false);
            }
          }
        };
        
        // messageListener 已在上面的 wrappedMessageListener 中添加
        
        // 备用检查：监听窗口关闭（防止消息未收到）
        let hasReceivedMessage = false;
        
        const originalMessageListener = messageListener;
        const wrappedMessageListener = (event: MessageEvent) => {
          hasReceivedMessage = true;
          originalMessageListener(event);
        };
        
        window.addEventListener('message', wrappedMessageListener);
        
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            console.log('GitHub OAuth popup closed');
            clearInterval(checkClosed);
            window.removeEventListener('message', wrappedMessageListener);
            
            // 只有在没有收到消息时才检查登录状态
            if (!hasReceivedMessage) {
              console.log('GitHub OAuth 弹窗关闭且未收到消息，检查登录状态');
              setTimeout(async () => {
                await refreshUser();
                // 检查是否有用户登录（通过简单的API调用）
                try {
                  const response = await fetch('/api/user');
                  if (response.ok) {
                    onSuccess?.();
                    onClose();
                    console.log('GitHub 登录处理完成，用户状态已更新');
                  } else {
                    setIsLoading(false);
                    console.log('GitHub OAuth 弹窗关闭但未登录成功');
                  }
                } catch (error) {
                  setIsLoading(false);
                  console.log('GitHub OAuth 检查登录状态失败');
                }
              }, 1000);
            }
          }
        }, 1000);
      }
    } catch (error: any) {
      setError(error.message || t.auth.githubLoginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || 'Google login failed');
      } else if (result.url) {
        // 在新窗口中打开Google登录
        const popup = window.open(result.url, 'google-login', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        // 监听来自弹窗的消息
        const messageListener = (event: MessageEvent) => {
          if (event.origin === window.location.origin) {
            if (event.data.type === 'OAUTH_SUCCESS') {
              console.log('Google OAuth success message received');
              window.removeEventListener('message', messageListener);
              clearInterval(checkClosed);
              
              // 登录成功处理 - 不刷新页面
              console.log('Google OAuth 登录成功，更新认证状态');
              setTimeout(async () => {
                await refreshUser();
                onSuccess?.();
                onClose();
                console.log('Google 登录模态已关闭，用户状态已更新');
              }, 500);
            } else if (event.data.type === 'OAUTH_ERROR') {
              console.log('Google OAuth error message received:', event.data.error);
              window.removeEventListener('message', messageListener);
              clearInterval(checkClosed);
              
              // 显示错误信息
              setError(event.data.error || 'Google login failed');
              setIsLoading(false);
            }
          }
        };
        
        // messageListener 已在上面的 wrappedMessageListener 中添加
        
        // 备用检查：监听窗口关闭（防止消息未收到）
        let hasReceivedMessage = false;
        
        const originalMessageListener = messageListener;
        const wrappedMessageListener = (event: MessageEvent) => {
          hasReceivedMessage = true;
          originalMessageListener(event);
        };
        
        window.addEventListener('message', wrappedMessageListener);
        
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            console.log('Google OAuth popup closed');
            clearInterval(checkClosed);
            window.removeEventListener('message', wrappedMessageListener);
            
            // 只有在没有收到消息时才检查登录状态
            if (!hasReceivedMessage) {
              console.log('Google OAuth 弹窗关闭且未收到消息，检查登录状态');
              setTimeout(async () => {
                await refreshUser();
                // 检查是否有用户登录（通过简单的API调用）
                try {
                  const response = await fetch('/api/user');
                  if (response.ok) {
                    onSuccess?.();
                    onClose();
                    console.log('Google 登录处理完成，用户状态已更新');
                  } else {
                    setIsLoading(false);
                    console.log('Google OAuth 弹窗关闭但未登录成功');
                  }
                } catch (error) {
                  setIsLoading(false);
                  console.log('Google OAuth 检查登录状态失败');
                }
              }, 1000);
            }
          }
        }, 1000);
      }
    } catch (error: any) {
      setError(error.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 p-2 hover:bg-muted rounded-full transition-colors"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </button>
            <CardTitle className="text-center">
              {isSignUp ? t.auth.createSoonAccount : t.auth.signInToSoon}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {isSignUp ? t.auth.signUpDescription : t.auth.signInDescription}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t.auth.fullName}</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={t.auth.enterFullName}
                    value={formData.name}
                    onChange={handleInputChange}
                    required={isSignUp}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.auth.enterEmail}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t.auth.enterPassword}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t.auth.loading : (isSignUp ? t.auth.signUp : t.auth.signIn)}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t.auth.orContinueWith}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleGithubSignIn}
                disabled={isLoading}
                className="w-full"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>

            {/* Only show signup toggle if registration is enabled */}
            {registrationConfig.enableRegistration && (
              <div className="text-center text-sm">
                {isSignUp ? (
                  <>
                    {t.auth.alreadyHaveAccount}{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setIsSignUp(false)}
                      disabled={isLoading}
                    >
                      {t.auth.signInToExistingAccount}
                    </button>
                  </>
                ) : (
                  <>
                    {t.auth.newToSoon}{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setIsSignUp(true)}
                      disabled={isLoading}
                    >
                      {t.auth.createAccount}
                    </button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Use portal to render modal at document.body level
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}