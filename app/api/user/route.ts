import { getCurrentUser } from '@/lib/auth/server-auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json(user);
  } catch (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}