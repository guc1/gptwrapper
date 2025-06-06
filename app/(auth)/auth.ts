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
import { cookies } from 'next/headers';

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
    credentials: {},
    async authorize(credentials, request) {
      const cookieStore = cookies();
      const credentialId = (credentials as any)?.guestUserId;
      const cookieId = cookieStore.get('guest_user_id')?.value;

      const candidateId =
        credentialId && credentialId !== 'undefined' ? credentialId : cookieId;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (candidateId && uuidRegex.test(candidateId)) {
        const existingUser = await getUserById(candidateId);
        if (existingUser) {
          const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
          cookieStore.set('guest_user_id', existingUser.id, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            expires,
          });
          return { ...existingUser, type: 'guest' };
        }
      }

      const [guestUser] = await createGuestUser();
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
      cookieStore.set('guest_user_id', guestUser.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires,
      });
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
