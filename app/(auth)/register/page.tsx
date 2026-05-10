import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  return <RegisterForm googleEnabled={googleEnabled} />;
}
