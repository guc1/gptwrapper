import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { randomUUID } from 'node:crypto';
import {
  createGuestUser,
  getUserById,
  getUser,
  createUser,
  getUserModelIds,
  getUserTypeById,
} from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import { isValidUUID } from '@/lib/utils';
import { cookies } from 'next/headers';
import type { DefaultJWT } from 'next-auth/jwt';
import type { UserType } from '@/lib/user-types';

/* ─── Type augmentations ───────────────────────────────────────────── */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      models: string[];
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    models?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    models: string[];
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

      const [dbUser] = users;
      if (!dbUser.password) {
        await compare(password, DUMMY_PASSWORD);
        return null;
      }

      const passwordsMatch = await compare(password, dbUser.password);
      if (!passwordsMatch) return null;

      const models = await getUserModelIds({ userId: dbUser.id });

      return { ...dbUser, models };
    },
  }),

  /* 2. One‑click guest users  */
  Credentials({
    id: 'guest', // matches signIn('guest')
    name: 'Guest account',
    credentials: { guestUserId: { label: 'guestUserId', type: 'text' } },
    async authorize(credentials) {
      if (isValidUUID(credentials?.guestUserId)) {
        const existing = await getUserById(credentials?.guestUserId);
        if (existing) {
          return { ...existing, type: 'guest', models: [] } as any;
        }
        const [guestUser] = await createGuestUser(credentials?.guestUserId);
        return { ...guestUser, type: 'guest', models: [] } as any;
      }

      const [guestUser] = await createGuestUser();
      return { ...guestUser, type: 'guest', models: [] } as any;
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
  unstable_update,
} = NextAuth({
  /** ENV: set AUTH_SECRET & (optionally) AUTH_URL  */
  trustHost:
    !!process.env.AUTH_TRUST_HOST || process.env.NODE_ENV !== 'production',

  ...authConfig,

  providers,

  callbacks: {
    async signIn({ user, account }) {
      if ((user as any).id && (user as any).type === 'guest') {
        const store = await cookies();
        store.set('guestUserId', (user as any).id, {
          path: '/',
          maxAge: 60 * 60 * 24,
        });
      }

      if (account?.provider === 'google') {
        if (!user.email) return false;
        const [existingUser] = await getUser(user.email);
        if (existingUser) {
          user.id = existingUser.id;
          (user as any).type = existingUser.type;
          (user as any).models = await getUserModelIds({ userId: existingUser.id });
        } else {
          const newUser = await createUser(user.email, randomUUID());
          user.id = newUser.id;
          (user as any).type = newUser.type;
          (user as any).models = [];
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
      }

      if (token.id) {
        const existing = await getUserById(token.id as string);
        if (!existing) {
          await createGuestUser(token.id as string);
        }

        token.type = await getUserTypeById({ userId: token.id as string });
        token.models = await getUserModelIds({ userId: token.id as string });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.type = token.type as UserType;
        session.user.models = (token.models as string[]) ?? [];
      }
      return session;
    },
  },
});
