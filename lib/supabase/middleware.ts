import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isLogin = request.nextUrl.pathname === '/login';
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/');

  if (!claims && !isLogin && !isAuthCallback) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (claims && !isAuthCallback) {
    const { data: portalAccess, error: accessError } = await supabase.rpc('get_my_portal_access');
    if (accessError || portalAccess !== true) {
      await supabase.auth.signOut();
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('error', 'employee_access');
      const redirect = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      return redirect;
    }
  }
  if (claims && isLogin) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    const redirect = NextResponse.redirect(homeUrl);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
