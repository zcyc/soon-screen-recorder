'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Github, Chrome } from 'lucide-react';
import { AUTH } from '@/lib/constants';
import { registrationConfig } from '@/lib/config';
import { useAuth } from '@/contexts/auth-context';
import { signInWithEmailPassword, signInWithGithub, signInWithGoogle } from '@/lib/auth/client-auth-local';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { refreshUser } = useAuth();
  // Enable signup mode with local authentication
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Field-level error states
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: ''
  });

  if (!isOpen) return null;

  // Field validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    return '';
  };

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters long';
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear general error when user types
    setError('');
    
    // Clear field-specific error when user types
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateForm = (): boolean => {
    const errors = {
      name: isSignUp ? validateName(formData.name) : '',
      email: validateEmail(formData.email),
      password: validatePassword(formData.password)
    };

    setFieldErrors(errors);

    // Return true if no errors
    return !errors.email && !errors.password && (!isSignUp || !errors.name);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return; // Stop if validation fails
    }
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signInWithEmailPassword(
        formData.email, 
        formData.password, 
        isSignUp ? formData.name : undefined
      );
      
      if (!result.success) {
        setError(result.error || AUTH.errorOccurred);
      } else {
        // Login successful - don't refresh page, only update state
        console.log('Email login successful, updating authentication state');
        
        // Refresh user state
        await refreshUser();
        
        // Wait a moment for authentication state to update
        setTimeout(() => {
          onSuccess?.();
          onClose();
          console.log('Login modal closed, user state updated');
        }, 100);
      }
    } catch (error: any) {
      setError(error.message || AUTH.errorOccurred);
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
        setError(result.error || AUTH.githubLoginFailed);
      } else if (result.url) {
        // Open GitHub login in new window
        const popup = window.open(result.url, 'github-login', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        // Listen for messages from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin === window.location.origin) {
            if (event.data.type === 'OAUTH_SUCCESS') {
              console.log('GitHub OAuth success message received');
              window.removeEventListener('message', messageListener);
              clearInterval(checkClosed);
              
              // Login success handling - don't refresh page
              console.log('GitHub OAuth login successful, updating authentication state');
              setTimeout(async () => {
                await refreshUser();
                onSuccess?.();
                onClose();
                console.log('GitHub login modal closed, user state updated');
              }, 500);
            } else if (event.data.type === 'OAUTH_ERROR') {
              console.log('GitHub OAuth error message received:', event.data.error);
              window.removeEventListener('message', messageListener);
              clearInterval(checkClosed);
              
              // Show error message
              setError(event.data.error || AUTH.githubLoginFailed);
              setIsLoading(false);
            }
          }
        };
        
        // messageListener already added in wrappedMessageListener above
        
        // Backup check: listen for window close (prevent messages not received)
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
            
            // Only check login status when no message is received
            if (!hasReceivedMessage) {
              console.log('GitHub OAuth popup closed without receiving message, checking login status');
              setTimeout(async () => {
                await refreshUser();
                // Check if user is logged in (through simple API call)
                try {
                  const response = await fetch('/api/user');
                  if (response.ok) {
                    onSuccess?.();
                    onClose();
                    console.log('GitHub login processing completed, user state updated');
                  } else {
                    setIsLoading(false);
                    console.log('GitHub OAuth popup closed but login not successful');
                  }
                } catch (error) {
                  setIsLoading(false);
                  console.log('GitHub OAuth login status check failed');
                }
              }, 1000);
            }
          }
        }, 1000);
      }
    } catch (error: any) {
      setError(error.message || AUTH.githubLoginFailed);
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
        // Open Google login in new window
        const popup = window.open(result.url, 'google-login', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        // Listen for messages from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin === window.location.origin) {
            if (event.data.type === 'OAUTH_SUCCESS') {
              console.log('Google OAuth success message received');
              window.removeEventListener('message', messageListener);
              clearInterval(checkClosed);
              
              // Login success handling - don't refresh page
              console.log('Google OAuth login successful, updating authentication state');
              setTimeout(async () => {
                await refreshUser();
                onSuccess?.();
                onClose();
                console.log('Google login modal closed, user state updated');
              }, 500);
            } else if (event.data.type === 'OAUTH_ERROR') {
              console.log('Google OAuth error message received:', event.data.error);
              window.removeEventListener('message', messageListener);
              clearInterval(checkClosed);
              
              // Show error message
              setError(event.data.error || 'Google login failed');
              setIsLoading(false);
            }
          }
        };
        
        // messageListener already added in wrappedMessageListener above
        
        // Backup check: listen for window close (prevent messages not received)
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
            
            // Only check login status when no message is received
            if (!hasReceivedMessage) {
              console.log('Google OAuth popup closed without receiving message, checking login status');
              setTimeout(async () => {
                await refreshUser();
                // Check if user is logged in (through simple API call)
                try {
                  const response = await fetch('/api/user');
                  if (response.ok) {
                    onSuccess?.();
                    onClose();
                    console.log('Google login processing completed, user state updated');
                  } else {
                    setIsLoading(false);
                    console.log('Google OAuth popup closed but login not successful');
                  }
                } catch (error) {
                  setIsLoading(false);
                  console.log('Google OAuth login status check failed');
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
      className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 dark:bg-black/70 flex items-center justify-center z-50 p-4"
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
      <div className="bg-card dark:bg-card rounded-lg shadow-2xl border border-border dark:border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="relative">
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 p-2 hover:bg-muted hover:bg-opacity-80 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isLoading}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
            <CardTitle className="text-center">
              {isSignUp ? AUTH.createSoonAccount : AUTH.signInToSoon}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {isSignUp ? AUTH.signUpDescription : AUTH.signInDescription}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 rounded-lg p-3 shadow-sm">
                <p className="text-sm text-destructive dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-4" noValidate>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">{AUTH.fullName}</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={AUTH.enterFullName}
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-950/20' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">{AUTH.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={AUTH.enterEmail}
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-950/20' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{AUTH.password}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={AUTH.enterPassword}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-950/20' : ''}
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? AUTH.loading : (isSignUp ? AUTH.signUp : AUTH.signIn)}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card dark:bg-card px-2 text-muted-foreground">
                  {AUTH.orContinueWith}
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

            {/* Show signup toggle with local authentication */}
            <div className="text-center text-sm">
              {isSignUp ? (
                <>
                  {AUTH.alreadyHaveAccount}{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setIsSignUp(false);
                      setFieldErrors({ name: '', email: '', password: '' });
                      setError('');
                    }}
                    disabled={isLoading}
                  >
                    {AUTH.signInToExistingAccount}
                  </button>
                </>
              ) : (
                <>
                  {AUTH.newToSoon}{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setIsSignUp(true);
                      setFieldErrors({ name: '', email: '', password: '' });
                      setError('');
                    }}
                    disabled={isLoading}
                  >
                    {AUTH.createAccount}
                  </button>
                </>
              )}
            </div>
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