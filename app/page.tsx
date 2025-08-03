'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Video, Monitor, Camera, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

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
            {t.home.heroTitle}
            <span className="block text-primary">{t.home.heroSubtitle}</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.home.heroDescription}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg rounded-full px-8 py-3"
            >
              <a href="/sign-up">
                {t.home.startRecording}
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
                {t.home.signIn}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t.home.featuresTitle}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t.home.featuresSubtitle}
            </p>
            <p className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg inline-block">
              {t.home.timeLimitNotice}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Monitor className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.home.screenRecordingTitle}</h3>
              <p className="text-muted-foreground">
                {t.home.screenRecordingDesc}
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.home.cameraRecordingTitle}</h3>
              <p className="text-muted-foreground">
                {t.home.cameraRecordingDesc}
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Mic className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.home.audioRecordingTitle}</h3>
              <p className="text-muted-foreground">
                {t.home.audioRecordingDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t.home.ctaTitle}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t.home.ctaDescription}
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg rounded-full px-8 py-3"
          >
            <a href="/sign-up">
              {t.home.getStarted}
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}