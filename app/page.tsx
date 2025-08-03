'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Video, Monitor, Camera, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 content-container">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-6">
            <Video className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight sm:text-5xl md:text-6xl">
            Screen Recording
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Record your screen, camera, and audio with Soon - the simple and powerful screen recording tool.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg rounded-full px-8 py-3"
            >
              <a href="/sign-up">
                Start Recording
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg rounded-full px-8 py-3"
            >
              <a href="/sign-in">
                Sign In
              </a>
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 max-w-2xl mx-auto">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">🚀 First time setup:</span> After signing up, visit{" "}
              <a href="/setup" className="underline font-medium">
                /setup
              </a>{" "}
              to initialize your database collections.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Record
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional-quality recordings with just a few clicks
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Monitor className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Screen Recording</h3>
              <p className="text-muted-foreground">
                Capture your entire screen or specific windows with crystal clear quality up to 1080p.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Camera Recording</h3>
              <p className="text-muted-foreground">
                Include your webcam in recordings for personal touch and better engagement.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Mic className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Audio Recording</h3>
              <p className="text-muted-foreground">
                Capture system audio and microphone input for complete recording experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Recording?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join Soon today and start creating amazing screen recordings in minutes.
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg rounded-full px-8 py-3"
          >
            <a href="/sign-up">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}