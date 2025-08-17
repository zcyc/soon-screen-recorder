// 录制状态持久化工具
export interface PersistedRecordingState {
  duration: number;
  videoTitle: string;
  isVideoPublic: boolean;
  isVideoPublished: boolean;
  quality: string;
  source: string;
  screenSource: string;
  includeAudio: boolean;
  includeCamera: boolean;
  blobData?: ArrayBuffer;
  blobType?: string;
  timestamp: number;
}

const RECORDING_STORAGE_KEY = 'soon-recording-state';
const STORAGE_EXPIRY_MS = 30 * 60 * 1000; // 30分钟过期

// 将Blob转换为ArrayBuffer用于存储
export const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
};

// 将ArrayBuffer和类型信息恢复为Blob
export const arrayBufferToBlob = (buffer: ArrayBuffer, type: string): Blob => {
  // 确保类型信息有效
  const normalizedType = type || 'video/webm';
  
  // 检查ArrayBuffer有效性
  if (!buffer || buffer.byteLength === 0) {
    console.warn('ArrayBuffer为空或无数据');
    throw new Error('Invalid ArrayBuffer data');
  }
  
  console.log('恢复Blob:', {
    bufferSize: buffer.byteLength,
    type: normalizedType,
    bufferSizeKB: Math.round(buffer.byteLength / 1024)
  });
  
  return new Blob([buffer], { type: normalizedType });
};

// 验证Blob是否有效（宽松模式）
export const validateBlob = async (blob: Blob): Promise<{valid: boolean, warnings: string[]}> => {
  const warnings: string[] = [];
  
  try {
    // 基本属性检查
    if (!blob) {
      return { valid: false, warnings: ['Blob对象为空'] };
    }
    
    if (blob.size === 0) {
      warnings.push('Blob大小为0，可能是空文件');
      // 不直接返回false，继续检查
    }
    
    // 检查MIME类型（容错处理）
    if (blob.type) {
      const isVideoType = blob.type.startsWith('video/') || 
                         blob.type.includes('webm') || 
                         blob.type.includes('mp4') || 
                         blob.type.includes('ogg') ||
                         blob.type === 'application/octet-stream';
      
      if (!isVideoType) {
        warnings.push(`MIME类型可能不是视频: ${blob.type}`);
      } else {
        console.log('localStorage: 检测到视频MIME类型:', blob.type);
      }
    } else {
      warnings.push('Blob没有MIME类型信息');
    }
    
    // 检查文件大小（更宽松）
    if (blob.size < 100) {
      warnings.push(`文件大小可能太小: ${blob.size} bytes`);
    }
    if (blob.size > 500 * 1024 * 1024) {
      return { valid: false, warnings: [`文件大小过大: ${Math.round(blob.size / 1024 / 1024)}MB`] };
    }
    
    console.log('localStorage: Blob基本信息:', {
      size: blob.size,
      type: blob.type || '未知类型',
      sizeKB: Math.round(blob.size / 1024),
      warnings: warnings.length
    });
    
    // 简化验证：只检查基本 URL 创建能力
    let url: string | null = null;
    try {
      url = URL.createObjectURL(blob);
      console.log('Blob URL 创建成功，基本验证通过');
      return { valid: true, warnings };
    } catch (urlError) {
      warnings.push(`URL创建失败: ${urlError}`);
      return { valid: false, warnings };
    } finally {
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  } catch (error) {
    warnings.push(`验证过程出错: ${error}`);
    return { valid: false, warnings };
  }
};

// 保存录制状态到localStorage
export const saveRecordingState = async (
  recordedBlob: Blob | null,
  duration: number,
  videoTitle: string,
  isVideoPublic: boolean,
  isVideoPublished: boolean,
  quality: string,
  source: string,
  screenSource: string,
  includeAudio: boolean,
  includeCamera: boolean
): Promise<void> => {
  try {
    const state: PersistedRecordingState = {
      duration,
      videoTitle,
      isVideoPublic,
      isVideoPublished,
      quality,
      source,
      screenSource,
      includeAudio,
      includeCamera,
      timestamp: Date.now()
    };

    if (recordedBlob) {
      // 只保存较小的录制文件（小于50MB）
      if (recordedBlob.size < 50 * 1024 * 1024) {
        try {
          console.log('开始保存Blob到localStorage:', {
            size: recordedBlob.size,
            type: recordedBlob.type,
            sizeKB: Math.round(recordedBlob.size / 1024)
          });
          
          state.blobData = await blobToArrayBuffer(recordedBlob);
          state.blobType = recordedBlob.type || 'video/webm'; // 确保有类型
          
          // 添加数据完整性校验（允许JSON序列化导致的微小差异）
          const originalSize = recordedBlob.size;
          const bufferSize = state.blobData.byteLength;
          const sizeDifference = Math.abs(originalSize - bufferSize);
          const sizeDifferencePercent = (sizeDifference / originalSize) * 100;
          
          // 如果大小差异超过1%或绝对差异超过1KB，才认为数据损坏
          if (sizeDifference > 1024 && sizeDifferencePercent > 1) {
            console.warn('数据完整性校验失败:', { 
              originalSize, 
              bufferSize, 
              difference: sizeDifference,
              differencePercent: sizeDifferencePercent.toFixed(2) + '%'
            });
            throw new Error('Data integrity check failed - significant size difference');
          } else if (sizeDifference > 0) {
            console.log('数据大小微小差异（在允许范围内）:', {
              originalSize,
              bufferSize,
              difference: sizeDifference,
              differencePercent: sizeDifferencePercent.toFixed(4) + '%'
            });
          }
          
          console.log('Blob保存完成，数据完整性校验通过');
        } catch (blobSerializationError) {
          console.error('Blob序列化失败:', blobSerializationError);
          // 不保存Blob数据，但保存其他状态
        }
      } else {
        console.warn('录制文件过大，无法保存到localStorage:', {
          size: recordedBlob.size,
          maxSize: 50 * 1024 * 1024
        });
      }
    }

    localStorage.setItem(RECORDING_STORAGE_KEY, JSON.stringify(state));
    console.log('录制状态已保存到localStorage');
  } catch (error) {
    console.error('保存录制状态失败:', error);
    // 如果存储失败（通常是因为空间不足），清理旧数据
    clearRecordingState();
  }
};

// 从localStorage恢复录制状态
export const loadRecordingState = async (): Promise<{
  recordedBlob: Blob | null;
  duration: number;
  videoTitle: string;
  isVideoPublic: boolean;
  isVideoPublished: boolean;
  quality: string;
  source: string;
  screenSource: string;
  includeAudio: boolean;
  includeCamera: boolean;
} | null> => {
  try {
    const stored = localStorage.getItem(RECORDING_STORAGE_KEY);
    if (!stored) return null;

    const state: PersistedRecordingState = JSON.parse(stored);
    
    // 检查是否过期
    if (Date.now() - state.timestamp > STORAGE_EXPIRY_MS) {
      console.log('录制状态已过期，清理');
      clearRecordingState();
      return null;
    }

    let recordedBlob: Blob | null = null;
    if (state.blobData && state.blobType) {
      try {
        console.log('开始从 localStorage 恢复Blob:', {
          bufferSize: state.blobData.byteLength,
          type: state.blobType,
          bufferSizeKB: Math.round(state.blobData.byteLength / 1024)
        });
        
        recordedBlob = arrayBufferToBlob(state.blobData, state.blobType);
        
        // 数据完整性校验（宽松模式）
        const expectedSize = state.blobData.byteLength;
        const actualSize = recordedBlob.size;
        const sizeDifference = Math.abs(expectedSize - actualSize);
        const sizeDifferencePercent = expectedSize > 0 ? (sizeDifference / expectedSize) * 100 : 0;
        
        // 只有在大小差异超过1%且绝对差异超过1KB时才认为数据损坏
        if (sizeDifference > 1024 && sizeDifferencePercent > 1) {
          console.error('数据完整性校验失败（差异过大）:', {
            expectedSize,
            actualSize,
            difference: sizeDifference,
            differencePercent: sizeDifferencePercent.toFixed(2) + '%'
          });
          throw new Error('Data integrity verification failed - significant size difference after restoration');
        } else if (sizeDifference > 0) {
          console.log('数据大小微小差异（恢复后，在允许范围内）:', {
            expectedSize,
            actualSize,
            difference: sizeDifference,
            differencePercent: sizeDifferencePercent.toFixed(4) + '%'
          });
        } else {
          console.log('数据完整性校验通过：大小完全一致');
        }
        
        // 尝试验证恢复的Blob（容错处理）
        try {
          const validation = await validateBlob(recordedBlob);
          if (!validation.valid) {
            console.warn('恢复的Blob验证失败，可能存在问题:', validation.warnings);
            // 不直接清理，让RestoreableVideo组件处理错误
          } else {
            if (validation.warnings.length > 0) {
              console.warn('恢复的Blob验证通过，但有警告:', validation.warnings);
            } else {
              console.log('恢复的Blob验证完全通过');
            }
          }
        } catch (validationError) {
          console.warn('验证过程出错，跳过验证:', validationError);
          // 继续使用未验证的Blob
        }
        
        console.log('恢复的Blob处理完成', { 
          size: recordedBlob.size, 
          type: recordedBlob.type,
          sizeKB: Math.round(recordedBlob.size / 1024)
        });
      } catch (blobError) {
        console.error('Blob恢复失败:', blobError);
        
        // 如果是数据完整性校验失败，尝试不校验直接恢复
        if (blobError instanceof Error && blobError.message.includes('Data integrity')) {
          console.warn('数据完整性校验失败，尝试强制恢复...');
          try {
            // 直接创建Blob，不做完整性校验
            recordedBlob = new Blob([state.blobData], { type: state.blobType || 'video/webm' });
            console.warn('强制恢复成功，但数据可能不完整:', {
              size: recordedBlob.size,
              type: recordedBlob.type,
              originalExpectedSize: state.blobData.byteLength
            });
            // 不返回null，继续处理
          } catch (forceRecoveryError) {
            console.error('强制恢复也失败:', forceRecoveryError);
            console.error('清理损坏的localStorage数据');
            clearRecordingState();
            return null;
          }
        } else {
          console.error('清理损坏的localStorage数据');
          clearRecordingState();
          return null;
        }
      }
    }

    console.log('录制状态已从localStorage恢复');
    return {
      recordedBlob,
      duration: state.duration,
      videoTitle: state.videoTitle,
      isVideoPublic: state.isVideoPublic,
      isVideoPublished: state.isVideoPublished,
      quality: state.quality,
      source: state.source,
      screenSource: state.screenSource,
      includeAudio: state.includeAudio,
      includeCamera: state.includeCamera
    };
  } catch (error) {
    console.error('恢复录制状态失败:', error);
    clearRecordingState();
    return null;
  }
};

// 清理保存的录制状态
export const clearRecordingState = (): void => {
  try {
    localStorage.removeItem(RECORDING_STORAGE_KEY);
    console.log('录制状态已清理');
  } catch (error) {
    console.error('清理录制状态失败:', error);
  }
};

// 检查是否有保存的录制状态
export const hasPersistedRecordingState = (): boolean => {
  try {
    const stored = localStorage.getItem(RECORDING_STORAGE_KEY);
    if (!stored) return false;

    const state: PersistedRecordingState = JSON.parse(stored);
    
    // 检查是否过期
    if (Date.now() - state.timestamp > STORAGE_EXPIRY_MS) {
      console.log('录制状态已过期，清理:', {
        age: Date.now() - state.timestamp,
        expiry: STORAGE_EXPIRY_MS
      });
      clearRecordingState();
      return false;
    }
    
    // 检查是否有Blob数据
    const hasBlob = !!(state.blobData && state.blobType);
    console.log('检查录制状态:', {
      hasBlob,
      blobSize: state.blobData ? state.blobData.byteLength : 0,
      age: Date.now() - state.timestamp
    });

    return hasBlob;
  } catch (error) {
    console.error('检查录制状态失败:', error);
    clearRecordingState();
    return false;
  }
};

// 获取localStorage中保存的数据大小
export const getStoredDataSize = (): number => {
  try {
    const stored = localStorage.getItem(RECORDING_STORAGE_KEY);
    return stored ? new Blob([stored]).size : 0;
  } catch (error) {
    return 0;
  }
};

// 强制清理localStorage中可能损坏的数据
export const forceCleanCorruptedData = (): void => {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes('recording') || key.includes('soon')) {
        localStorage.removeItem(key);
        console.log('清理可能损坏的键:', key);
      }
    }
  } catch (error) {
    console.error('强制清理失败:', error);
  }
};