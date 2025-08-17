'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Video, Download, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import LoginModal from '@/components/login-modal';
import { recordingConfig } from '@/lib/config';
import ScreenRecorder from '@/components/screen-recorder';
import VideoGalleryWrapper from '@/components/video-gallery-wrapper';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [previousUser, setPreviousUser] = useState(user);
  
  // 监听登录状态变化，确保录制状态不丢失
  useEffect(() => {
    if (!loading) {
      // 检测登录状态变化
      if (!previousUser && user) {
        console.log('检测到用户登录成功:', {
          userId: user.$id,
          userName: user.name,
          userEmail: user.email
        });
        
        // 登录成功后不重置页面，保持当前的录制状态
        console.log('登录成功，继续保持当前录制会话状态');
      } else if (previousUser && !user) {
        console.log('检测到用户登出');
      }
      
      setPreviousUser(user);
    }
  }, [user, loading, previousUser]);

  // 移除自动跳转逻辑，让主页支持所有用户状态
  // useEffect(() => {
  //   // 只有在已登录且不在加载状态时才跳转
  //   if (!loading && user) {
  //     router.push('/dashboard');
  //   }
  // }, [user, loading, router]);

  // 显示加载状态，避免内容闪烁
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t.common?.loading || '加载中...'}</p>
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
            <h1 className="text-3xl font-bold">{t.dashboard.welcomeBack}, {user.name || 'User'}!</h1>
            <p className="text-muted-foreground mt-2">
              {t.dashboard.welcomeDescription}
            </p>
          </div>
        )}



        {/* Recording Section */}
        <div className="mb-8">
          <Card>
            <CardContent>
              <ScreenRecorder />
            </CardContent>
          </Card>
        </div>

        {/* Conditional Content Based on User Status */}
        {user ? (
          /* 已登录用户：显示我的视频 */
          <VideoGalleryWrapper />
        ) : (
          /* 未登录用户：显示功能介绍 */
          <>
            {/* Features Section */}
            <section className="py-12 mb-8">
              <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    {t.home.featuresTitle}
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    {t.home.featuresSubtitle}
                  </p>
                  {recordingConfig.enableTimeLimit && (
                    <p className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg inline-block mt-4">
                      {t.home.timeLimitNotice()}
                    </p>
                  )}
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Download className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t.home.screenRecordingTitle}</h3>
                    <p className="text-muted-foreground">
                      {t.home.screenRecordingDesc}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Globe className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t.home.cameraRecordingTitle}</h3>
                    <p className="text-muted-foreground">
                      {t.home.cameraRecordingDesc}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Video className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t.home.audioRecordingTitle}</h3>
                    <p className="text-muted-foreground">
                      {t.home.audioRecordingDesc}
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
          console.log('页面级别: 登录成功回调被调用');
          // 不做任何特殊处理，让状态自然更新
        }}
      />
    </main>
  );
}