'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColor {
  name: string;
  value: string;
  primary: string;
  primaryForeground: string;
}

export const themeColors: ThemeColor[] = [
  {
    name: 'Green',  
    value: 'green',
    primary: '142 76% 36%', // green-500 in HSL
    primaryForeground: '0 0% 98%'
  },
  {
    name: 'Blue',
    value: 'blue',
    primary: '217 91% 59%', // blue-500 in HSL
    primaryForeground: '0 0% 98%'
  },
  {
    name: 'Orange',
    value: 'orange', 
    primary: '25 95% 53%', // orange-500 in HSL
    primaryForeground: '0 0% 98%'
  },
  {
    name: 'Red',
    value: 'red',
    primary: '0 84% 60%', // red-500 in HSL
    primaryForeground: '0 0% 98%'
  }
];

interface ThemeContextType {
  mode: ThemeMode;
  actualMode: 'light' | 'dark'; // 实际生效的模式
  themeColor: ThemeColor;
  toggleMode: () => void;
  setThemeColor: (color: ThemeColor) => void;
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

// 获取基于时间的主题模式
function getTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  // 6:00 - 18:00 为浅色模式，18:00 - 6:00 为深色模式
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Read initial theme from server-side rendered data attribute
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof document !== 'undefined') {
      const serverTheme = document.documentElement.getAttribute('data-initial-theme');
      if (serverTheme === 'dark' || serverTheme === 'light') {
        return serverTheme;
      }
    }
    // Fallback to time-based theme
    return getTimeBasedTheme();
  };

  const [mode, setMode] = useState<ThemeMode>('auto');
  const [actualMode, setActualMode] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [themeColor, setThemeColorState] = useState<ThemeColor>(themeColors[0]);
  const [mounted, setMounted] = useState(false);

  // Load theme preferences from localStorage
  useEffect(() => {
    const savedMode = (localStorage.getItem('theme-mode') as ThemeMode) || 'auto';
    const savedColor = localStorage.getItem('theme-color');
    
    setMode(savedMode);
    
    if (savedColor) {
      const color = themeColors.find(c => c.value === savedColor);
      if (color) {
        setThemeColorState(color);
      }
    }
    
    setMounted(true);
  }, []); 

  // Apply theme changes to document and handle auto mode
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // 计算实际应该应用的模式
    let effectiveMode: 'light' | 'dark';
    if (mode === 'auto') {
      effectiveMode = getTimeBasedTheme();
    } else {
      effectiveMode = mode as 'light' | 'dark';
    }
    
    // 只在模式真的改变时更新 actualMode
    if (effectiveMode !== actualMode) {
      setActualMode(effectiveMode);
    }
    
    // Apply dark/light mode - 只在需要时修改，避免不必要的闪烁
    const hasDarkClass = root.classList.contains('dark');
    if (effectiveMode === 'dark' && !hasDarkClass) {
      root.classList.add('dark');
    } else if (effectiveMode === 'light' && hasDarkClass) {
      root.classList.remove('dark');
    }
    
    // Apply theme color as CSS variables - 只在颜色确实改变时更新
    const currentPrimary = root.style.getPropertyValue('--primary');
    if (currentPrimary !== themeColor.primary) {
      root.style.setProperty('--primary', themeColor.primary);
      root.style.setProperty('--primary-foreground', themeColor.primaryForeground);
    }
    
    // Save to localStorage
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('theme-color', themeColor.value);
  }, [mode, themeColor, mounted, actualMode]);

  // 自动更新基于时间的主题（仅在 auto 模式下）
  useEffect(() => {
    if (!mounted || mode !== 'auto') return;
    
    const updateTimeBasedTheme = () => {
      const newActualMode = getTimeBasedTheme();
      if (newActualMode !== actualMode) {
        setActualMode(newActualMode);
      }
    };
    
    // 立即检查一次，确保与服务器端保持同步
    updateTimeBasedTheme();
    
    // 每分钟检查一次时间变化
    const interval = setInterval(updateTimeBasedTheme, 60000);
    
    return () => clearInterval(interval);
  }, [mounted, mode, actualMode]);

  const toggleMode = () => {
    setMode(prev => {
      if (prev === 'auto') return 'light';
      if (prev === 'light') return 'dark';
      return 'auto';
    });
  };

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
  };

  return (
    <ThemeContext.Provider value={{ mode, actualMode, themeColor, toggleMode, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};