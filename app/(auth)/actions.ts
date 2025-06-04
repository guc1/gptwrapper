// app/(auth)/actions.ts
'use server';

import { z } from 'zod';
import { createUser, getUser, transferChatOwnership } from '@/lib/db/queries';
import { signIn } from './auth';
import type { User } from '@/lib/db/schema';
import { ChatSDKError } from '@/lib/errors';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
  redirectTo?: string;
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const chatIdToResume = formData.get('chatIdToResume') as string | null;
    const guestUserId = formData.get('guestUserId') as string | null;
    const unsentPrompt = formData.get('unsentPrompt') as string | null;

    // Attempt to sign in first. If successful, NextAuth.js will handle session creation.
    // The user object will be available in the session callback.
    // We will handle chat transfer *after* successful sign-in, possibly in a session callback or a subsequent step.
    // For now, let's assume signIn itself returns the user or we fetch it right after.

    const signInResult = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false, // We handle redirection client-side
      // Note: signIn with redirect:false might not throw for invalid creds directly in a way that's catchable here,
      // but rather return an error object or null. This behavior can vary.
      // Let's assume it throws an error that can be caught.
    });


    // If signIn doesn't throw and we reach here, it means authentication was successful
    // (or NextAuth handled the error internally and returned null/undefined without throwing to this scope)
    // We need the logged-in user's ID.
    // A robust way is to fetch the user again *after* signIn if signIn doesn't return it.
    // Or, rely on the session callback in auth.ts to have populated the session.
    // For simplicity in this action, we'll assume a successful signIn means the user exists.
    
    const [loggedInUserArr] = await getUser(validatedData.email); // Fetch user *after* successful auth attempt
    if (!loggedInUserArr) {
      // This case should ideally be caught by signIn throwing an error
      return { status: 'failed' };
    }
    const loggedInUser = loggedInUserArr;


    if (chatIdToResume && guestUserId && loggedInUser.id) {
      if (loggedInUser.id !== guestUserId) {
        await transferChatOwnership(chatIdToResume, guestUserId, loggedInUser.id);
      }
    }
    
    const redirectTo = chatIdToResume 
      ? `/chat/${chatIdToResume}${unsentPrompt ? `?prompt=${encodeURIComponent(unsentPrompt)}` : ''}`
      : '/';

    return { status: 'success', redirectTo };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    // Check if it's a NextAuth specific error for credentials
    if (error.type === 'CredentialsSignin') { // NextAuth might throw specific error types
        return { status: 'failed' }; // "Invalid credentials!"
    }
    console.error("Login Action Error:", error); // Log other errors
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
  redirectTo?: string;
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const chatIdToResume = formData.get('chatIdToResume') as string | null;
    const guestUserId = formData.get('guestUserId') as string | null;
    const unsentPrompt = formData.get('unsentPrompt') as string | null;

    const [existingUser] = await getUser(validatedData.email);
    if (existingUser) {
      // If user exists, redirect to login but preserve chat context in query params for login page
      const loginRedirectParams = new URLSearchParams();
      if (chatIdToResume) loginRedirectParams.set('chatIdToResume', chatIdToResume);
      if (guestUserId) loginRedirectParams.set('guestUserId', guestUserId);
      if (unsentPrompt) loginRedirectParams.set('unsentPrompt', unsentPrompt);
      
      return { status: 'user_exists', redirectTo: `/login?${loginRedirectParams.toString()}` };
    }

    const newUser: User = await createUser(validatedData.email, validatedData.password);
    if (!newUser || !newUser.id) {
        return { status: 'failed' };
    }

    if (chatIdToResume && guestUserId) {
       // newUser.id will always be different from guestUserId for a genuinely new registration
       await transferChatOwnership(chatIdToResume, guestUserId, newUser.id);
    }
    
    // Sign in the new user
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password, // Use the original password for sign-in
      redirect: false,
    });
    
    const redirectTo = chatIdToResume 
      ? `/chat/${chatIdToResume}${unsentPrompt ? `?prompt=${encodeURIComponent(unsentPrompt)}` : ''}`
      : '/';

    return { status: 'success', redirectTo };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    console.error("Register Action Error:", error);
    return { status: 'failed' };
  }
};