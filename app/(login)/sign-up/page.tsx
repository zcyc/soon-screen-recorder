import { Login } from '../appwrite-login';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return <Login mode="signup" />;
}