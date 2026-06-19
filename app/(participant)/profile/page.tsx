import { getSessionUser } from '@/lib/supabase/server';
// ═══════════════════════════════════════════════════════════
// Profile — Server Component with ProfileClient for interactive form
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { } from '@/lib/supabase/server';
import { getProfileData } from '@/lib/data/queries';
import { ProfileForm } from './profile-form';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const data = await getProfileData(user.id, POOL_ID);

  return <ProfileForm initialData={data} />;
}


