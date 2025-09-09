import { Login } from '../appwrite-login';
import { registrationConfig } from '@/lib/config';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  // Redirect to sign-in if registration is disabled
  if (!registrationConfig.enableRegistration) {
    redirect('/sign-in?error=registration_disabled');
  }
  
  return <Login mode="signup" />;
}