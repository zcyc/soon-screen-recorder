import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth/appwrite-auth';

export async function PATCH(request: NextRequest) {
  try {
    // First authenticate the user
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing required field: videoId' },
        { status: 400 }
      );
    }

    // Use the existing toggleVideoPrivacy method
    const updatedVideo = await DatabaseService.toggleVideoPrivacy(videoId, currentUser.$id);

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      message: updatedVideo.isPublic ? 'Video is now public' : 'Video is now private'
    });

  } catch (error: any) {
    console.error('Privacy update error:', error);
    
    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update privacy setting' },
      { status: 500 }
    );
  }
}