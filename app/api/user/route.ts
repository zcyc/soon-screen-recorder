import { AuthService } from '@/lib/auth/appwrite-auth';

export async function GET() {
  try {
    const user = await AuthService.getCurrentUser();
    return Response.json(user);
  } catch (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}