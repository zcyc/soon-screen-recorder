'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  isLoading?: boolean;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = '此操作无法撤销，请确认要继续。',
  isLoading = false
}: DeleteModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // 防止背景滚动
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLoading, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete operation failed:', error);
      // 删除失败时不关闭模态框
    }
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              删除确认
            </h3>
          </div>
          {!isLoading && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            确定要删除视频 <strong className="font-semibold text-gray-900 dark:text-gray-100">"{title}"</strong> 吗？
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                删除中...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                删除视频
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body，完全脱离组件树
  return ReactDOM.createPortal(modalContent, document.body);
}

// Hook for managing delete modal
export function useDeleteModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [deleteData, setDeleteData] = React.useState<{
    title: string;
    onConfirm: () => void | Promise<void>;
    description?: string;
  } | null>(null);

  const openDeleteModal = (data: {
    title: string;
    onConfirm: () => void | Promise<void>;
    description?: string;
  }) => {
    setDeleteData(data);
    setIsOpen(true);
  };

  const closeDeleteModal = () => {
    setIsOpen(false);
    setTimeout(() => setDeleteData(null), 200); // 延迟清理数据，等动画完成
  };

  return {
    isOpen,
    deleteData,
    openDeleteModal,
    closeDeleteModal
  };
}