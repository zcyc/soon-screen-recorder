# 录制时间限制配置环境变量化

## 概述

将硬编码在 `lib/config.ts` 文件中的录制时间限制配置提取到环境变量中，使其更加灵活和可配置。

## 修改的文件

### 1. `.env` 文件
添加了录制相关的环境变量配置：
```env
# Recording Configuration
# ==================================================
# Maximum recording duration in seconds (default: 120)
NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS=120
# Warning threshold in seconds when to show time warning (default: 100)
NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD=100
# Enable/disable recording time limit (default: true)
NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT=true
```

### 2. `.env.example` 文件
添加了相同的环境变量示例和说明，供新开发者参考。

### 3. `lib/config.ts` 文件
修改录制配置，从环境变量读取：
```typescript
export const recordingConfig = {
  // Maximum recording duration in seconds (2 minutes = 120 seconds)
  maxDurationSeconds: parseInt(process.env.NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS || '120'),
  // Warning threshold in seconds (when to show time warning)
  timeWarningThreshold: parseInt(process.env.NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD || '100'), // Show warning at 1:40
  // Enable/disable recording time limit
  enableTimeLimit: process.env.NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT !== 'false',
};
```

### 4. `lib/i18n.ts` 文件（翻译动态化）
将硬编码的时间限制消息改为动态函数：
```typescript
import { recordingConfig } from './config';

// 将字符串类型改为函数类型
timeLimitNotice: () => string;
timeLimitWarning: () => string;
timeLimitReached: () => string;
recordingWillStopAt: () => string;

// 英文版本
timeLimitNotice: () => `🕒 Free recordings are limited to ${Math.floor(recordingConfig.maxDurationSeconds / 60)} minutes`,
timeLimitWarning: () => {
  const minutes = Math.floor(recordingConfig.maxDurationSeconds / 60);
  const seconds = recordingConfig.maxDurationSeconds % 60;
  const timeStr = seconds === 0 ? `${minutes}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return `Recording will stop at ${timeStr}`;
},

// 中文版本
timeLimitNotice: () => `🕒 免费录制限制为 ${Math.floor(recordingConfig.maxDurationSeconds / 60)} 分钟`,
timeLimitWarning: () => {
  const minutes = Math.floor(recordingConfig.maxDurationSeconds / 60);
  const seconds = recordingConfig.maxDurationSeconds % 60;
  const timeStr = seconds === 0 ? `${minutes}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return `录制将在 ${timeStr} 停止`;
},
```

### 5. `app/page.tsx` 文件
添加条件性渲染和上边距，当时间限制关闭时不显示时间限制提示：
```typescript
import { recordingConfig } from '@/lib/config';

// ...

{recordingConfig.enableTimeLimit && (
  <p className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg inline-block mt-4">
    {t.home.timeLimitNotice()}
  </p>
)}
```

### 6. `components/screen-recorder.tsx` 文件
更新时间限制警告消息调用：
```typescript
{t.recording.recordingWillStopAt()}
```

## 环境变量说明

1. **NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS** (默认: 120)
   - 最大录制时长，单位为秒
   - 例如：120 = 2分钟

2. **NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD** (默认: 100)
   - 时间警告阈值，单位为秒
   - 例如：100 = 在录制到1分40秒时显示警告

3. **NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT** (默认: true)
   - 是否启用录制时间限制
   - 设置为 `false` 时将禁用时间限制功能
   - 同时首页将不显示"🕒 免费录制限制为 2 分钟"的提示

## 技术实现要点

1. **客户端访问**: 使用 `NEXT_PUBLIC_` 前缀确保环境变量在客户端可访问
2. **类型转换**: 使用 `parseInt()` 将字符串转换为数字
3. **默认值**: 通过 `||` 运算符提供默认值，确保向后兼容性
4. **布尔值处理**: 使用 `!== 'false'` 逻辑，默认为启用状态
5. **条件渲染**: 根据配置状态条件性显示UI元素

## 主要修改亮点

1. **完全动态化**: 所有时间限制相关的消息都从环境变量动态读取
2. **多语言支持**: 中英文翻译都支持动态时间显示
3. **智能格式化**: 自动处理分钟和秒的显示格式（如 2:00, 2:30）
4. **UI优化**: 时间限制提示增加了上边距，改善视觉效果
5. **条件显示**: 当禁用时间限制时，首页不显示相关提示

## 测试场景

可以通过修改 `.env` 文件来测试不同配置：

1. **修改时长**: `NEXT_PUBLIC_RECORDING_MAX_DURATION_SECONDS=180` (3分钟)
2. **禁用限制**: `NEXT_PUBLIC_RECORDING_ENABLE_TIME_LIMIT=false`
3. **自定义警告**: `NEXT_PUBLIC_RECORDING_TIME_WARNING_THRESHOLD=150` (2:30警告)

## 验证结果

- ✅ 项目构建成功
- ✅ 项目启动正常
- ✅ 环境变量正确加载
- ✅ 配置灵活可调整
- ✅ 保持向后兼容性
- ✅ 翻译消息完全动态化
- ✅ UI体验优化完成
- ✅ 多语言同步支持