'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDeleteDialogProps {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  variant?: 'destructive' | 'warning' | 'default';
  children?: React.ReactNode;
}

export function ConfirmDeleteDialog({
  title = '确认删除',
  description = '此操作无法撤销。确定要继续吗？',
  confirmText = '删除',
  cancelText = '取消',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'destructive',
  children
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      // Don't close dialog if there's an error
      console.error('Confirm action failed:', error);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel?.();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <Trash2 className="h-6 w-6 text-red-600" />,
          confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
          headerClass: 'text-red-900'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          confirmClass: 'bg-orange-600 hover:bg-orange-700 text-white',
          headerClass: 'text-orange-900'
        };
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-gray-600" />,
          confirmClass: 'bg-gray-600 hover:bg-gray-700 text-white',
          headerClass: 'text-gray-900'
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children || (
          <Button
            variant="destructive"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
            {confirmText}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full',
              variant === 'destructive' ? 'bg-red-100' :
              variant === 'warning' ? 'bg-orange-100' : 'bg-gray-100'
            )}>
              {variantStyles.icon}
            </div>
            <div className="flex-1">
              <AlertDialogTitle className={cn('text-lg font-semibold', variantStyles.headerClass)}>
                {title}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-gray-600 text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            disabled={isLoading}
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'w-full sm:w-auto',
              variantStyles.confirmClass
            )}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                删除中...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {confirmText}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// 简化版本，专门用于视频删除
export function VideoDeleteDialog({
  videoTitle,
  onConfirm,
  isLoading = false,
  children
}: {
  videoTitle: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();     // 阻止默认行为
    e.stopPropagation();    // 阻止事件冒泡
    e.nativeEvent.stopImmediatePropagation(); // 立即停止所有事件传播
    setOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error('Delete confirmation failed:', error);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <span 
          onClick={handleTriggerClick}
          onMouseDown={handleTriggerClick}
          style={{ display: 'contents' }}
        >
          {children}
        </span>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-semibold text-red-900">
                删除视频
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-gray-600 text-left">
            确定要删除视频 <strong className="font-semibold text-gray-900">"{videoTitle}"</strong> 吗？
            <br />
            <span className="text-sm text-gray-500 mt-2 block">
              此操作无法撤销，视频将永久从您的账户中移除。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            disabled={isLoading}
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
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
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}