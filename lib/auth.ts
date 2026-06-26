import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { verifySsoToken } from "@/lib/sso";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // Trust the deployment's own host header when self-hosting (behind your own
  // proxy/VPS). Vercel sets this automatically; bare Node/Docker hosts do not,
  // which otherwise throws "UntrustedHost" on /api/auth/*.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    // Cross-domain SSO: the main app mints a short-lived signed token (see lib/sso.ts)
    // for an already-authenticated user; this provider verifies it and starts a session
    // on the self-hosted maps domain so the user isn't asked to log in twice.
    CredentialsProvider({
      id: "sso",
      name: "sso",
      credentials: { ssoToken: { label: "SSO Token", type: "text" } },
      async authorize(credentials) {
        const payload = verifySsoToken(credentials?.ssoToken as string | undefined);
        if (!payload) return null;

        const user = await db.user.findUnique({ where: { id: payload.sub } });
        if (!user || user.email !== payload.email) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
