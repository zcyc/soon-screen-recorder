'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Loader2, Github } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/lib/i18n';
// import { OAuthFallbackGuide } from '@/components/oauth-fallback-guide';

function LoginForm({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const { login, register, loginWithGitHub, user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle OAuth errors and redirect if already authenticated
  useEffect(() => {
    // Check for OAuth errors
    const oauthError = searchParams.get('error');
    if (oauthError === 'oauth_cancelled') {
      setError(t.auth.githubAuthCancelled);
    } else if (oauthError) {
      setError(t.auth.authenticationFailed);
    }
    
    if (user) {
      router.push(redirect);
    }
  }, [user, router, redirect, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error(t.auth.nameRequired);
        }
        await register(email, password, name);
      }
      router.push(redirect);
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || t.auth.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setGithubLoading(true);
    setError('');
    
    try {
      await loginWithGitHub();
    } catch (error: any) {
      console.error('GitHub OAuth error:', error);
      setError(error.message || t.auth.githubLoginFailed);
      setGithubLoading(false);
    }
  };

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
              disabled={loading}
            >
              {loading ? (
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

          {/* Third-party cookie notice */}
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t.auth.thirdPartyCookieTitle}
                </h3>
                <div className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                  <p>
                    {t.auth.thirdPartyCookieDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {/* GitHub OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={handleGitHubLogin}
              disabled={githubLoading || loading}
            >
              {githubLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {t.auth.connectingToGitHub}
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  {t.auth.continueWithGitHub}
                </>
              )}
            </Button>
          </div>
          
          {/* OAuth Fallback Guide - temporarily disabled */}
          {/* <div className="mt-6">
            <OAuthFallbackGuide />
          </div> */}
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  {mode === 'signin'
                    ? t.auth.newToSoon
                    : t.auth.alreadyHaveAccount}
                </span>
              </div>
            </div>
            
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
          </div>
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