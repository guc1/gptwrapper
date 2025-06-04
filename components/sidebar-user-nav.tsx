import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { DefaultJWT } from 'next-auth/jwt';
import { compare } from 'bcryptjs';

import { createGuestUser, getUser, getUserById } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD, guestRegex } from '@/lib/constants';

export type UserType = 'guest' | 'regular';

/* ─── Type‑script module augmentations ─────────────────────────────── */
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

/* ─── NextAuth configuration ──────────────────────────────────────── */
export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  ...authConfig,

  providers: [
    /* 1. Regular email/password users */
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize({ email, password }) {
        if (!email || !password) return null;

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

        /* Successful login */
        return { ...user, type: 'regular' } as any;
      },
    }),

    /* 2. One‑click guest users */
    Credentials({
      id: 'guest',          // matches signIn('guest')
      name: 'Guest account',
      credentials: {
        guestId: { label: 'Guest ID', type: 'text', optional: true },
      },
      async authorize(credentials) {
        /* If a guestId was passed, try to reuse that user */
        if (credentials?.guestId) {
          const existingUser = await getUserById(credentials.guestId);
          if (existingUser && guestRegex.test(existingUser.email)) {
            return { ...existingUser, type: 'guest' } as any;
          }
        }

        /* Otherwise create a fresh guest */
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: 'guest' } as any;
      },
    }),
  ],

  callbacks: {
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

