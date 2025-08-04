import { Login } from '../appwrite-login';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return <Login mode="signin" />;
}