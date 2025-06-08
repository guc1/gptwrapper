// app/(auth)/login/page.tsx
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState, useRef } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogoGoogle } from '@/components/icons';

import { login, type LoginActionState } from '../actions';
import { toast } from '@/components/toast';
import { useSession, signIn } from 'next-auth/react';
import { useSWRConfig } from 'swr';

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: globalSWRMutate } = useSWRConfig();

  const chatIdToResume = searchParams.get('chatIdToResume');
  const guestUserId = searchParams.get('guestUserId');
  const unsentPrompt = searchParams.get('unsentPrompt');
  const planId = searchParams.get('planId');

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const hasShownSuccessToastRef = useRef(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  const { update: updateSession, data: session } = useSession();

  useEffect(() => {
    if (state.status === 'failed') {
      toast({ type: 'error', description: 'Invalid credentials!' });
      hasShownSuccessToastRef.current = false;
      setIsSuccessful(false);
    } else if (state.status === 'invalid_data') {
      toast({ type: 'error', description: 'Failed validating your submission!' });
      hasShownSuccessToastRef.current = false;
      setIsSuccessful(false);
    } else if (state.status === 'success') {
      if (!hasShownSuccessToastRef.current) {
        toast({ type: 'success', description: 'Signed in successfully!' });
        hasShownSuccessToastRef.current = true;
      }
      setIsSuccessful(true);

      const performRedirectAndRefresh = async () => {
        await updateSession();

        await globalSWRMutate((key) => typeof key === 'string' && key.startsWith('/api/message-status'), undefined, { revalidate: true });
        await globalSWRMutate((key) => typeof key === 'string' && key.startsWith('/api/auth/session'), undefined, { revalidate: true });

        if (planId) {
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId }),
          });
          const data = await res.json();
          if (data.url) {
            window.location.href = data.url as string;
            return;
          }
        }

        if (state.redirectTo) {
          router.replace(state.redirectTo);
        } else {
          router.replace('/');
        }
      };

      const timer = setTimeout(() => {
        performRedirectAndRefresh();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (session?.user && session.user.type !== 'guest' && planId && state.status === 'idle') {
      const proceed = async () => {
        await updateSession();
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url as string;
        } else {
          router.replace('/');
        }
      };
      proceed();
    }
  }, [session, planId, updateSession, router, state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    if (chatIdToResume) formData.append('chatIdToResume', chatIdToResume);
    if (guestUserId) formData.append('guestUserId', guestUserId);
    if (unsentPrompt) formData.append('unsentPrompt', unsentPrompt);
    hasShownSuccessToastRef.current = false;
    setIsSuccessful(false);
    formAction(formData);
  };

  const handleGoogleSignIn = () => {
    const params = new URLSearchParams();
    if (chatIdToResume) params.set('chatIdToResume', chatIdToResume);
    if (guestUserId) params.set('guestUserId', guestUserId);
    if (unsentPrompt) params.set('unsentPrompt', unsentPrompt);
    if (planId) params.set('planId', planId);
    const callbackUrl = `/login?${params.toString()}`;
    signIn('google', { callbackUrl });
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        {googleEnabled && (
          <div className="px-4 sm:px-16">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              <LogoGoogle /> Continue with Google
            </Button>
          </div>
        )}
        <Separator className="my-6" />
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href={`/register${chatIdToResume || guestUserId || unsentPrompt || planId ? `?${[
                chatIdToResume ? `chatIdToResume=${chatIdToResume}` : null,
                guestUserId ? `guestUserId=${guestUserId}` : null,
                unsentPrompt ? `unsentPrompt=${encodeURIComponent(unsentPrompt)}` : null,
                planId ? `planId=${planId}` : null,
              ].filter(Boolean).join('&')}` : ''}`}
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}