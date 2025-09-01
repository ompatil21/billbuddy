// central nextauth config
import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),           // persist users/accounts
  session: { strategy: "jwt" },             // use JWT sessions
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,      // from .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = (user as any).id;       // stash user id on token
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.uid) (session.user as any).id = token.uid as string; // expose id
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,      // crypto secret
};
