'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, LogOut, User as UserIcon, Languages } from 'lucide-react';
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


function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="rounded-full p-2 h-9 w-9"
          title="Change language"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="z-50"
        sideOffset={5}
        avoidCollisions={true}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLocale('zh');
          }}
          onMouseDown={(e) => e.preventDefault()}
          className={`cursor-pointer ${locale === 'zh' ? 'bg-accent' : ''}`}
        >
          <span className="mr-2">🇨🇳</span>
          中文
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLocale('en');
          }}
          onMouseDown={(e) => e.preventDefault()}
          className={`cursor-pointer ${locale === 'en' ? 'bg-accent' : ''}`}
        >
          <span className="mr-2">🇺🇸</span>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const { t } = useI18n();

  async function handleSignOut() {
    await logout();
  }

  if (loading) {
    return (
      <div className="h-9 w-9 animate-pulse bg-muted rounded-full" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/sign-in">{t.auth.signIn}</Link>
        </Button>
        <Button asChild className="rounded-full">
          <Link href="/sign-up">{t.auth.signUp}</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
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
      <DropdownMenuContent align="end" className="w-48">
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
        <Link href="/" className="flex items-center">
          <Video className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold text-foreground">soon</span>
        </Link>
        <div className="flex items-center space-x-4">
          {user && (
            <nav className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.dashboard}
              </Link>
              <Link
                href="/discover"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.discover}
              </Link>
              <Link
                href="/devices"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.devices}
              </Link>
            </nav>
          )}
          <div className="header-user-menu flex items-center space-x-4">
            <ThemeControls />
            <LanguageToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}