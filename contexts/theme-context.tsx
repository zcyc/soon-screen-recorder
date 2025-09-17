'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

// Fixed green theme color values
const GREEN_THEME = {
  primary: '142 76% 36%', // green-500 in HSL
  primaryForeground: '0 0% 98%'
};

interface ThemeContextType {
  mode: ThemeMode;
  actualMode: 'light' | 'dark'; // Actually effective mode
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Get time-based theme mode
function getTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  // 6:00 - 18:00 for light mode, 18:00 - 6:00 for dark mode
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Read initial theme from server-side rendered data attribute
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof document !== 'undefined') {
      // First try to get from server-rendered data attribute
      const serverTheme = document.documentElement.getAttribute('data-initial-theme');
      if (serverTheme === 'dark' || serverTheme === 'light') {
        return serverTheme;
      }
      
      // Check if dark class is already applied (for immediate sync)
      const hasDarkClass = document.documentElement.classList.contains('dark');
      if (hasDarkClass) {
        return 'dark';
      }
    }
    // Fallback to time-based theme
    return getTimeBasedTheme();
  };

  const [mode, setMode] = useState<ThemeMode>('auto');
  const [actualMode, setActualMode] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [mounted, setMounted] = useState(false);

  // Load theme preferences and sync with server
  useEffect(() => {
    const savedMode = (localStorage.getItem('theme-mode') as ThemeMode) || 'auto';
    setMode(savedMode);
    
    // Clean up old theme-color localStorage entry since we're using fixed green theme
    if (localStorage.getItem('theme-color')) {
      localStorage.removeItem('theme-color');
    }
    
    // Set client timezone and preferences in cookies for server-side detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `soon-client-timezone=${timezone}; path=/; max-age=31536000; samesite=strict`;
    document.cookie = `soon-theme-mode=${savedMode}; path=/; max-age=31536000; samesite=strict`;
    
    setMounted(true);
  }, []); 

  // Apply theme changes to document and handle auto mode
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Calculate actual mode that should be applied
    let effectiveMode: 'light' | 'dark';
    if (mode === 'auto') {
      effectiveMode = getTimeBasedTheme();
    } else {
      effectiveMode = mode as 'light' | 'dark';
    }
    
    // Only update actualMode when mode actually changes
    if (effectiveMode !== actualMode) {
      setActualMode(effectiveMode);
    }
    
    // Batch DOM updates to minimize repaints
    const updates: Array<() => void> = [];
    
    // Apply dark/light mode - only modify when needed, avoid unnecessary flickering
    const hasDarkClass = root.classList.contains('dark');
    if (effectiveMode === 'dark' && !hasDarkClass) {
      updates.push(() => root.classList.add('dark'));
    } else if (effectiveMode === 'light' && hasDarkClass) {
      updates.push(() => root.classList.remove('dark'));
    }
    
    // Apply fixed green theme color as CSS variables
    const currentPrimary = root.style.getPropertyValue('--primary');
    if (currentPrimary !== GREEN_THEME.primary) {
      updates.push(() => {
        root.style.setProperty('--primary', GREEN_THEME.primary);
        root.style.setProperty('--primary-foreground', GREEN_THEME.primaryForeground);
      });
    }
    
    // Execute all DOM updates in a single frame
    if (updates.length > 0) {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
      });
    }
    
    // Save to localStorage and cookie (only mode, color is fixed)
    localStorage.setItem('theme-mode', mode);
    if (typeof document !== 'undefined') {
      document.cookie = `soon-theme-mode=${mode}; path=/; max-age=31536000; samesite=strict`;
    }
  }, [mode, mounted, actualMode]);

  // Auto update time-based theme (only in auto mode)
  useEffect(() => {
    if (!mounted || mode !== 'auto') return;
    
    const updateTimeBasedTheme = () => {
      const newActualMode = getTimeBasedTheme();
      if (newActualMode !== actualMode) {
        setActualMode(newActualMode);
      }
    };
    
    // Check immediately once to ensure sync with server side
    updateTimeBasedTheme();
    
    // Check time changes every minute
    const interval = setInterval(updateTimeBasedTheme, 60000);
    
    return () => clearInterval(interval);
  }, [mounted, mode, actualMode]);
  
  // Mark hydration complete after everything is ready
  useEffect(() => {
    if (mounted) {
      // Enable transitions after hydration is complete
      const timer = setTimeout(() => {
        document.documentElement.setAttribute('data-hydrated', 'true');
      }, 100); // Slightly longer delay to ensure stability
      
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const toggleMode = () => {
    setMode(prev => {
      if (prev === 'auto') return 'light';
      if (prev === 'light') return 'dark';
      return 'auto';
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, actualMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};