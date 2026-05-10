import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  return <LoginForm googleEnabled={googleEnabled} />;
}
