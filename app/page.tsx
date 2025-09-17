'use client';

import { Button } from '@/components/ui/button';

import { ArrowRight, Video, Download, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DASHBOARD, HOME, COMMON } from '@/lib/constants';
import LoginModal from '@/components/login-modal';
import { recordingConfig } from '@/lib/config';
import ScreenRecorder from '@/components/screen-recorder';
import VideoGalleryWrapper from '@/components/video-gallery-wrapper';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [previousUser, setPreviousUser] = useState(user);
  
  // Listen to login state changes to ensure recording state is not lost
  useEffect(() => {
    if (!loading) {
      // Detect login state changes
      if (!previousUser && user) {
        console.log('User login detected successfully:', {
          userId: user.id,
          userName: user.name,
          userEmail: user.email
        });
        
        // After successful login, don't reset the page, maintain current recording state
        console.log('Login successful, continuing to maintain current recording session state');
      } else if (previousUser && !user) {
        console.log('User logout detected');
      }
      
      setPreviousUser(user);
    }
  }, [user, loading, previousUser]);

  // Remove auto-redirect logic, let homepage support all user states
  // useEffect(() => {
  //   // Only redirect when logged in and not in loading state
  //   if (!loading && user) {
  //     router.push('/dashboard');
  //   }
  // }, [user, loading, router]);

  // Show loading state to avoid content flickering
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{COMMON.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 content-container">
        {/* Welcome Section - Only for logged in users */}
        {user && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{DASHBOARD.welcomeBack}, {user.name || 'User'}!</h1>
            <p className="text-muted-foreground mt-2">
              {DASHBOARD.welcomeDescription}
            </p>
          </div>
        )}



        {/* Recording Section */}
        <div className="mb-8">
          <ScreenRecorder />
        </div>

        {/* Conditional Content Based on User Status */}
        {user ? (
          /* Logged in users: show my videos */
          <VideoGalleryWrapper />
        ) : (
          /* Non-logged in users: show feature introduction */
          <>
            {/* Features Section */}
            <section className="py-12 mb-8">
              <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    {HOME.featuresTitle}
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    {HOME.featuresSubtitle}
                  </p>

                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Download className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{HOME.screenRecordingTitle}</h3>
                    <p className="text-muted-foreground">
                      {HOME.screenRecordingDesc}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Globe className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{HOME.cameraRecordingTitle}</h3>
                    <p className="text-muted-foreground">
                      {HOME.cameraRecordingDesc}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Video className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{HOME.audioRecordingTitle}</h3>
                    <p className="text-muted-foreground">
                      {HOME.audioRecordingDesc}
                    </p>
                  </div>
                </div>
              </div>
            </section>


          </>
        )}
      </div>
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          console.log('Page level: login success callback called');
          // Don't do any special handling, let state update naturally
        }}
      />
    </main>
  );
}