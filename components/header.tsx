'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, LogOut, User as UserIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import ThemeControls from '@/components/theme-controls';
import { logoutAction } from '@/app/actions/user-actions';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/login-modal';




function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  async function handleSignOut() {
    try {
      const result = await logoutAction();
      if (result.success) {
        await refreshUser();
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Skeleton removed as requested

  if (!user) {
    return (
      <>
        <div className="flex items-center space-x-4">
          <Avatar className="cursor-pointer size-9" onClick={() => setShowLoginModal(true)}>
            <AvatarFallback className="bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
              <UserIcon className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            console.log('Header: 登录成功!');
          }}
        />
      </>
    );
  }

  return (
    <DropdownMenu 
      open={isMenuOpen} 
      onOpenChange={setIsMenuOpen}
      modal={false}
    >
      <DropdownMenuTrigger
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || user.email} />
          <AvatarFallback>
            {(user.name || user.email)
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48"
        avoidCollisions={true}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <div className="px-2 py-1.5 text-sm font-medium text-foreground">
          <div className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span className="truncate">{user.name || user.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />

        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t.nav.signOut}</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  const { user } = useAuth();
  const { t } = useI18n();
  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center">
            <Video className="h-6 w-6 text-primary" />
            <span className="ml-2 text-xl font-semibold text-foreground">{t.appName}</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.record}
            </Link>
            <Link
              href="/discover"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.discover}
            </Link>
          </nav>
        </div>
        <div className="header-user-menu flex items-center space-x-4">
          <ThemeControls />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}