// ═══════════════════════════════════════════════════════════
// Next.js Middleware — Session refresh + route protection
//
// Runs on every matched request:
//   1. Refreshes the Supabase JWT via cookies (extends session)
//   2. Redirects unauthenticated users to /login
//   3. Passes through for public routes and static assets
// ═══════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PUBLIC_PATHS = ['/login', '/fixtures', '/teams', '/'];
const API_PUBLIC_PATHS = ['/api/leaderboard', '/api/pool/deadline'];

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // This call refreshes the session if the JWT is close to expiry.
  // IMPORTANT: must happen before any auth checks.
  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // Public routes — allow always
  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
  const isApiPublic = API_PUBLIC_PATHS.some(p => path.startsWith(p));
  if (isPublic || isApiPublic) return response;

  // Auth callback — allow always
  if (path.startsWith('/auth/callback')) return response;

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.ico|sw\\.js|manifest\\.json|offline\\.html|api/auth).*)',
  ],
};
