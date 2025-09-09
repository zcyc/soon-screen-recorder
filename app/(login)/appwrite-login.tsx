'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Github, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/lib/i18n';
import { registrationConfig } from '@/lib/config';
import { loginAction, registerAction } from '@/app/actions/user-actions';
import { signInWithGithub, signUpWithGithub, signInWithGoogle, signUpWithGoogle } from '@/lib/server/oauth';
// import { OAuthFallbackGuide } from '@/components/oauth-fallback-guide';

// Google 图标组件
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function LoginForm({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const [isPending, startTransition] = useTransition();

  // Handle OAuth errors and redirect if already authenticated
  useEffect(() => {
    // Check for OAuth errors
    const oauthError = searchParams.get('error');
    if (oauthError) {
      let errorMessage;
      switch (oauthError) {
        case 'oauth_cancelled':
          errorMessage = t.auth.githubAuthCancelled || 'GitHub authentication was cancelled';
          break;
        case 'oauth_failed':
          errorMessage = t.auth.authenticationFailed || 'OAuth authentication failed';
          break;
        case 'oauth_incomplete':
          errorMessage = 'OAuth callback parameters were incomplete';
          break;
        case 'oauth_session_failed':
          errorMessage = 'Failed to establish session after OAuth';
          break;
        case 'oauth_processing_failed':
          errorMessage = 'OAuth callback processing failed';
          break;
        case 'registration_disabled':
          errorMessage = 'User registration is currently disabled';
          break;
        default:
          errorMessage = `OAuth error: ${oauthError}`;
          break;
      }
      setError(errorMessage);
      console.error('OAuth error from URL:', oauthError);
    }
    
    if (user) {
      router.push(redirect);
    }
  }, [user, router, redirect, searchParams, t.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        let result;
        
        if (mode === 'signin') {
          result = await loginAction(email, password);
        } else {
          if (!name.trim()) {
            throw new Error(t.auth.nameRequired);
          }
          result = await registerAction(email, password, name);
        }
        
        if (result.error) {
          setError(result.error);
        } else {
          // 刷新用户信息并重定向
          await refreshUser();
          router.push(redirect);
        }
      } catch (error: any) {
        console.error('Auth error:', error);
        setError(error.message || t.auth.errorOccurred);
      }
    });
  };

  // 使用 Server Action 处理 OAuth - 如果注册被禁用，强制使用登录模式
  const effectiveMode = (!registrationConfig.enableRegistration && mode === 'signup') ? 'signin' : mode;
  const handleGitHubOAuth = effectiveMode === 'signin' ? signInWithGithub : signUpWithGithub;
  const handleGoogleOAuth = effectiveMode === 'signin' ? signInWithGoogle : signUpWithGoogle;

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Video className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {mode === 'signin'
            ? t.auth.signInToSoon
            : t.auth.createSoonAccount}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === 'signin'
            ? t.auth.signInDescription
            : t.auth.signUpDescription}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div>
              <Label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                {t.auth.fullName}
              </Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={50}
                  className="rounded-full"
                  placeholder={t.auth.enterFullName}
                />
              </div>
            </div>
          )}

          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              {t.auth.email}
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={50}
                className="rounded-full"
                placeholder={t.auth.enterEmail}
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              {t.auth.password}
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={100}
                className="rounded-full"
                placeholder={t.auth.enterPassword}
              />
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {t.auth.loading}
                </>
              ) : mode === 'signin' ? (
                t.auth.signIn
              ) : (
                t.auth.signUp
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                {t.auth.orContinueWith}
              </span>
            </div>
          </div>



          <div className="mt-6 space-y-3">
            {/* GitHub OAuth Button */}
            <form action={handleGitHubOAuth}>
              <Button
                type="submit"
                variant="outline"
                className="w-full rounded-full"
                disabled={isPending}
              >
                <Github className="mr-2 h-4 w-4" />
                {t.auth.continueWithGitHub}
              </Button>
            </form>
            
            {/* Google OAuth Button */}
            <form action={handleGoogleOAuth}>
              <Button
                type="submit"
                variant="outline"
                className="w-full rounded-full"
                disabled={isPending}
              >
                <GoogleIcon className="mr-2 h-4 w-4" />
                {t.auth.continueWithGoogle}
              </Button>
            </form>
          </div>
          
          {/* OAuth Fallback Guide - temporarily disabled */}
          {/* <div className="mt-6">
            <OAuthFallbackGuide />
          </div> */}
          
          {/* Only show signup/signin toggle if registration is enabled or if we're in signin mode */}
          {(registrationConfig.enableRegistration || mode === 'signin') && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    {mode === 'signin'
                      ? (registrationConfig.enableRegistration ? t.auth.newToSoon : '')
                      : t.auth.alreadyHaveAccount}
                  </span>
                </div>
              </div>
              
              {/* Show sign up link only if registration is enabled, or always show sign in link */}
              {((mode === 'signin' && registrationConfig.enableRegistration) || mode === 'signup') && (
                <div className="mt-6">
                  <Link
                    href={mode === 'signin' ? '/sign-up' : '/sign-in'}
                    className="w-full flex justify-center py-2 px-4 border border-input rounded-full shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    {mode === 'signin'
                      ? t.auth.createAccount
                      : t.auth.signInToExistingAccount}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm mode={mode} />
    </Suspense>
  );
}