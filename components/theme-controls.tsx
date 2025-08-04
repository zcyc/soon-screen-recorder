'use client';

import { useState, useEffect } from 'react';
import { Check, Languages, Moon, Sun, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/theme-context';
export default function ThemeControls() {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { locale, setLocale, t } = useI18n();
  
  // Theme context variables
  let mode, actualMode, toggleMode;
  
  try {
    const themeContext = useTheme();
    mode = themeContext.mode;
    actualMode = themeContext.actualMode;
    toggleMode = themeContext.toggleMode;
  } catch (error) {
    // If theme context is not available, use defaults
    mode = 'auto';
    actualMode = 'light';
    toggleMode = () => {};
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder with icons until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        {/* Theme Mode Toggle Placeholder - show clock as auto default */}
        <Button
          variant="outline"
          size="sm"
          className="rounded-full p-2 h-9 w-9 pointer-events-none"
          disabled
        >
          <Clock className="h-4 w-4" />
        </Button>

        {/* Language Toggle Placeholder */}
        <Button
          variant="outline"
          size="sm"
          className="rounded-full p-2 h-9 w-9 pointer-events-none"
          disabled
        >
          <Languages className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Theme Mode Toggle */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleMode();
        }}
        onMouseDown={(e) => e.preventDefault()}
        className="rounded-full p-2 h-9 w-9"
        title={
          mode === 'auto' 
            ? 'Auto mode (based on time) - Click to switch to light mode' 
            : mode === 'light' 
            ? 'Light mode - Click to switch to dark mode'
            : 'Dark mode - Click to switch to auto mode'
        }
      >
        {mode === 'auto' ? (
          <Clock className="h-4 w-4" />
        ) : mode === 'light' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>

      {/* Language Toggle */}
      <DropdownMenu 
        open={isLanguageOpen} 
        onOpenChange={(open) => {
          setIsLanguageOpen(open);
        }}
        modal={false}
      >
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
          className="w-48 z-50"
          sideOffset={5}
          avoidCollisions={true}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocale('zh');
              setIsLanguageOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
            className={`cursor-pointer flex items-center justify-between ${locale === 'zh' ? 'bg-accent' : ''}`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🇨🇳</span>
              <span>中文</span>
            </div>
            {locale === 'zh' && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocale('en');
              setIsLanguageOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
            className={`cursor-pointer flex items-center justify-between ${locale === 'en' ? 'bg-accent' : ''}`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🇺🇸</span>
              <span>English</span>
            </div>
            {locale === 'en' && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}