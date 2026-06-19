import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/client';

const POOL_ID = 'pool-propanas-octavos-2026';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Check global deadline
  const deadline = await prisma.poolDeadline.findFirst({
    where: { poolId: POOL_ID, scope: 'GLOBAL' },
  });
  if (deadline && new Date() > deadline.deadlineAt) {
    return NextResponse.json({ error: 'El deadline ha pasado. No se pueden crear nuevas quinielas.' }, { status: 403 });
  }

  // Check if user is admin — admins cannot create entries
  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });

  if (membership?.role === 'ADMIN') {
    return NextResponse.json({ error: 'Los administradores no pueden crear quinielas' }, { status: 403 });
  }
  
  // Get current entry count for this user
  const existingEntries = await prisma.entry.findMany({
    where: { poolId: POOL_ID, userId: user.id },
    orderBy: { entryNumber: 'desc' },
  });

  const nextNumber = (existingEntries[0]?.entryNumber ?? 0) + 1;
  const userName = existingEntries[0]?.displayName?.replace(/\s+\d+$/, '') 
    || user.user_metadata?.display_name 
    || user.email?.split('@')[0] 
    || 'Usuario';

  const newEntry = await prisma.entry.create({
    data: {
      poolId: POOL_ID,
      userId: user.id,
      entryNumber: nextNumber,
      displayName: `${userName} ${nextNumber}`,
      status: 'DRAFT',
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ 
    success: true, 
    entryId: newEntry.id,
    entryNumber: nextNumber,
    displayName: newEntry.displayName,
  });
}