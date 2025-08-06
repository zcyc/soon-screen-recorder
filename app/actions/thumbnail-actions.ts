'use server';

import { ThumbnailService, ThumbnailGenerationOptions } from '@/lib/thumbnail-service';
import { getCurrentUser } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';

export type ActionResult = {
  success?: boolean;
  error?: string;
  data?: any;
};

// Generate thumbnail on upload
export async function generateThumbnailOnUploadAction(
  videoId: string,
  videoUrl: string,
  options: ThumbnailGenerationOptions = {}
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    const thumbnailUrl = await ThumbnailService.generateThumbnailOnUpload(
      videoId,
      videoUrl,
      user.$id,
      options
    );

    if (!thumbnailUrl) {
      return { error: 'Failed to generate thumbnail' };
    }

    revalidatePath('/dashboard');

    return { success: true, data: { thumbnailUrl } };
  } catch (error: any) {
    console.error('Generate thumbnail on upload error:', error);
    return { error: error.message || 'Failed to generate thumbnail' };
  }
}

// Batch generate thumbnails
export async function batchGenerateThumbnailsAction(
  options: ThumbnailGenerationOptions = {}
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    const result = await ThumbnailService.batchGenerateThumbnails(user.$id, options);

    revalidatePath('/dashboard');
    revalidatePath('/admin/thumbnails');

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Batch generate thumbnails error:', error);
    return { error: error.message || 'Failed to batch generate thumbnails' };
  }
}

// Ensure thumbnail exists
export async function ensureThumbnailExistsAction(
  video: any,
  options: ThumbnailGenerationOptions = {}
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    const thumbnailUrl = await ThumbnailService.ensureThumbnailExists(
      video,
      user.$id,
      options
    );

    return { success: true, data: { thumbnailUrl } };
  } catch (error: any) {
    console.error('Ensure thumbnail exists error:', error);
    return { error: error.message || 'Failed to ensure thumbnail exists' };
  }
}

// Delete thumbnail on video delete
export async function deleteThumbnailOnVideoDeleteAction(
  thumbnailUrl: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    const success = await ThumbnailService.deleteThumbnailOnVideoDelete(thumbnailUrl);

    return { success: true, data: { deleted: success } };
  } catch (error: any) {
    console.error('Delete thumbnail on video delete error:', error);
    return { error: error.message || 'Failed to delete thumbnail' };
  }
}

// Get thumbnail stats
export async function getThumbnailStatsAction(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    const stats = await ThumbnailService.getThumbnailStats(user.$id);

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('Get thumbnail stats error:', error);
    return { error: error.message || 'Failed to get thumbnail stats' };
  }
}