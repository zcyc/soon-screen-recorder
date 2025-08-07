'use server';

import { ThumbnailService } from '@/lib/thumbnail-service';
import { getCurrentUser } from '@/lib/auth/server-auth';

export type ActionResult = {
  success?: boolean;
  error?: string;
  data?: any;
};



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

