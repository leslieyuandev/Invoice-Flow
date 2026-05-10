"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Zap, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { registerAction } from "@/actions/auth";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError("");
    const fd = new FormData(e.currentTarget);

    const password = fd.get("password") as string;
    const confirmPassword = fd.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }

    setLoading(true);
    const email = fd.get("email") as string;

    const result = await registerAction({
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      email,
      phone: fd.get("phone") || undefined,
      password,
      confirmPassword,
    });

    if ("error" in result && result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">InvoiceFlow</h1>
          <p className="text-sm text-surface-500">Create your account — it&apos;s free</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card-lg p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName" required>First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <Input id="firstName" name="firstName" type="text" autoComplete="given-name" required placeholder="Jane" className="pl-9" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName" required>Last name</Label>
                <Input id="lastName" name="lastName" type="text" autoComplete="family-name" required placeholder="Smith" />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" required>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="pl-9" />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone number <span className="text-surface-400 font-normal">(optional)</span></Label>
              <PhoneInput name="phone" />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" required>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="8+ characters"
                  className="pl-9"
                  onChange={() => pwError && setPwError("")}
                />
              </div>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" required>Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your password"
                  className="pl-9"
                  onChange={() => pwError && setPwError("")}
                />
              </div>
              {pwError && <p className="text-xs text-red-600">{pwError}</p>}
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          {googleEnabled && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase text-surface-400">
                  <span className="bg-white px-2">or sign up with</span>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} loading={googleLoading}>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-surface-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
