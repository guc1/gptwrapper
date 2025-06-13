import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { ManageSubscriptions } from '@/components/manage-subscriptions';

export default async function Page() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <h2 className="text-xl font-semibold mb-2">Manage Subscriptions</h2>
      <ManageSubscriptions />
    </div>
  );
}
