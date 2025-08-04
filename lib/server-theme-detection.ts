import { headers } from 'next/headers';

// 默认主题颜色（绿色）
const defaultThemeColor = {
  primary: '142 76% 36%', // green-500 in HSL
  primaryForeground: '0 0% 98%'
};

// 获取基于时间的主题模式
function getTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
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
  // 在服务器端，我们无法访问 localStorage，所以默认使用 auto 模式
  // 客户端稍后会从 localStorage 读取用户偏好并更新
  const mode = 'auto';
  const actualMode = getTimeBasedTheme();
  const shouldApplyDarkClass = actualMode === 'dark';
  
  return {
    mode,
    actualMode,
    shouldApplyDarkClass,
    themeColor: defaultThemeColor
  };
}