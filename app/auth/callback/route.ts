import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { syncUserToPrisma } from '@/lib/supabase/user-sync';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const type = searchParams.get('type');
  
  // Also check redirect_to for type=recovery
  const redirectTo = searchParams.get('redirect_to') ?? '';
  const isRecovery = type === 'recovery' || redirectTo.includes('type=recovery');

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await syncUserToPrisma({
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        });
      }

      // If this is a password reset, redirect to reset page
      if (isRecovery) {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}