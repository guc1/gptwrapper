// app/(auth)/register/page.tsx
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState, useRef } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogoGoogle } from '@/components/icons';

import { register } from '../actions';
import { toast } from '@/components/toast';
import { useSession, signIn } from 'next-auth/react';
import { useSWRConfig } from 'swr';

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

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: globalSWRMutate } = useSWRConfig();

  const chatIdToResume = searchParams.get('chatIdToResume');
  const guestUserId = searchParams.get('guestUserId');
  const unsentPrompt = searchParams.get('unsentPrompt');

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const hasShownSuccessToastRef = useRef(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: 'Account already exists!' });
      if (state.redirectTo) {
        const loginLink = new URL(state.redirectTo, window.location.origin);
        if (chatIdToResume) loginLink.searchParams.set('chatIdToResume', chatIdToResume);
        if (guestUserId) loginLink.searchParams.set('guestUserId', guestUserId);
        if (unsentPrompt) loginLink.searchParams.set('unsentPrompt', unsentPrompt);
        router.replace(loginLink.toString());
      }
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
      hasShownSuccessToastRef.current = false;
      setIsSuccessful(false); // Reset button state
    } else if (state.status === 'invalid_data') {
      toast({ type: 'error', description: 'Failed validating your submission!' });
      hasShownSuccessToastRef.current = false;
      setIsSuccessful(false); // Reset button state
    } else if (state.status === 'success') {
      if (!hasShownSuccessToastRef.current) {
        toast({ type: 'success', description: 'Account created successfully!' });
        hasShownSuccessToastRef.current = true;
      }
      setIsSuccessful(true);
      
      const performRedirectAndRefresh = async () => {
        await updateSession(); 
        
        // Revalidate SWR caches that might depend on the new session
        await globalSWRMutate((key) => typeof key === 'string' && key.startsWith('/api/message-status'), undefined, { revalidate: true });
        await globalSWRMutate((key) => typeof key === 'string' && key.startsWith('/api/auth/session'), undefined, { revalidate: true });


        if (state.redirectTo) {
          router.replace(state.redirectTo);
        } else {
          router.replace('/');
        }
      };
      
      const timer = setTimeout(() => {
        performRedirectAndRefresh();
      }, 300); // Adjusted delay
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]); // Simplified dependencies if router, updateSession, etc. are stable

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    if (chatIdToResume) formData.append('chatIdToResume', chatIdToResume);
    if (guestUserId) formData.append('guestUserId', guestUserId);
    if (unsentPrompt) formData.append('unsentPrompt', unsentPrompt);
    hasShownSuccessToastRef.current = false;
    setIsSuccessful(false); // Reset for new submission
    formAction(formData);
  };

  const handleGoogleSignIn = () => {
    const params = new URLSearchParams();
    if (chatIdToResume) params.set('chatIdToResume', chatIdToResume);
    if (guestUserId) params.set('guestUserId', guestUserId);
    if (unsentPrompt) params.set('unsentPrompt', unsentPrompt);
    const callbackUrl = params.size ? `/?${params.toString()}` : '/';
    signIn('google', { callbackUrl });
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <div className="px-4 sm:px-16">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <LogoGoogle /> Continue with Google
          </Button>
        </div>
        <Separator className="my-6" />
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Already have an account? '}
            <Link
              href={`/login${chatIdToResume ? `?chatIdToResume=${chatIdToResume}&guestUserId=${guestUserId || ''}&unsentPrompt=${encodeURIComponent(unsentPrompt || '')}` : ''}`}
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}