import { headers, cookies } from 'next/headers';

// 默认主题颜色（绿色）
const defaultThemeColor = {
  primary: '142 76% 36%', // green-500 in HSL
  primaryForeground: '0 0% 98%'
};

// 获取基于时间的主题模式（更准确的时间判断）
function getTimeBasedTheme(clientTimezone?: string): 'light' | 'dark' {
  let date: Date;
  
  if (clientTimezone) {
    // 使用客户端时区
    try {
      date = new Date(new Date().toLocaleString("en-US", {timeZone: clientTimezone}));
    } catch {
      date = new Date(); // 如果时区无效，回退到服务器时间
    }
  } else {
    date = new Date();
  }
  
  const hour = date.getHours();
  // 6:00 - 18:00 为浅色模式，18:00 - 6:00 为深色模式
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}

// 服务器端获取初始主题设置
export async function getServerInitialTheme(): Promise<{
  mode: 'auto' | 'light' | 'dark';
  actualMode: 'light' | 'dark';
  shouldApplyDarkClass: boolean;
  themeColor: { primary: string; primaryForeground: string };
}> {
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // 优先从 cookie 获取用户保存的主题偏好
  const savedThemeMode = cookieStore.get('soon-theme-mode')?.value as 'auto' | 'light' | 'dark' | undefined;
  const clientTimezone = cookieStore.get('soon-client-timezone')?.value;
  
  // 从请求头获取客户端的首选色彩方案（Windows Dark Mode 检测）
  const prefersColorScheme = headersList.get('sec-ch-prefers-color-scheme');
  
  let mode: 'auto' | 'light' | 'dark' = savedThemeMode || 'auto';
  let actualMode: 'light' | 'dark';
  
  if (mode === 'auto') {
    // 自动模式：优先使用 Windows 系统主题偏好，其次是时间
    if (prefersColorScheme === 'dark') {
      actualMode = 'dark';
    } else if (prefersColorScheme === 'light') {
      actualMode = 'light';
    } else {
      // 回退到基于时间的检测，使用客户端时区
      actualMode = getTimeBasedTheme(clientTimezone);
    }
  } else {
    actualMode = mode as 'light' | 'dark';
  }
  
  const shouldApplyDarkClass = actualMode === 'dark';
  
  return {
    mode,
    actualMode,
    shouldApplyDarkClass,
    themeColor: defaultThemeColor
  };
}