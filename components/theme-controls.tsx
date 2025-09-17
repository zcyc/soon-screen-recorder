'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
export default function ThemeControls() {
  const [mounted, setMounted] = useState(false);
  
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
    </div>
  );
}