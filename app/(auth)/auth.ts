import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { randomUUID } from 'node:crypto';
import {
  createGuestUser,
  getUser,
  createUser,
  getUserById,
} from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';

/* ─── Type augmentations ───────────────────────────────────────────── */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

/* ─── Auth.js configuration  ──────────────────────────────────────── */
/* Determine available authentication providers */
const providers = [
  /* 1. Regular e‑mail/password users  */
  Credentials({
    id: 'credentials', // explicit id
    name: 'Credentials',
    credentials: {},
    async authorize({ email, password }: any) {
      /* Look up the user */
      const users = await getUser(email);
      if (users.length === 0) {
        /* Dummy hash to equalise timing */
        await compare(password, DUMMY_PASSWORD);
        return null;
      }

      const [user] = users;
      if (!user.password) {
        await compare(password, DUMMY_PASSWORD);
        return null;
      }

      const passwordsMatch = await compare(password, user.password);
      if (!passwordsMatch) return null;

      return { ...user, type: 'regular' };
    },
  }),

  /* 2. One‑click guest users  */
  Credentials({
    id: 'guest', // matches signIn('guest')
    name: 'Guest account',
    credentials: {
      id: { label: 'Guest ID', type: 'text', required: false },
    },
    async authorize(credentials) {
      if (credentials?.id) {
        const [existingUser] = await getUserById(credentials.id);
        if (existingUser) {
          return { ...existingUser, type: 'guest' };
        }
      }
      const [guestUser] = await createGuestUser();
      return { ...guestUser, type: 'guest' };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  /** ENV: set AUTH_SECRET & (optionally) AUTH_URL  */
  trustHost:
    !!process.env.AUTH_TRUST_HOST || process.env.NODE_ENV !== 'production',

  ...authConfig,

  providers,

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        const [existingUser] = await getUser(user.email);
        if (existingUser) {
          user.id = existingUser.id;
        } else {
          const newUser = await createUser(user.email, randomUUID());
          user.id = newUser.id;
        }
        (user as any).type = 'regular';
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.type = (user as any).type;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.type = token.type as UserType;
      }
      return session;
    },
  },
});
