import Form from 'next/form';

import { signOut } from '@/app/(auth)/auth';
import { useTranslations } from 'next-intl';

export const SignOutForm = () => {
  const t = useTranslations();
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        await signOut({
          redirectTo: '/',
        });
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        {t('sign_out')}
      </button>
    </Form>
  );
};
