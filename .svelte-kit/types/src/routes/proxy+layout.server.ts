// @ts-nocheck
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { createServerClient } from '$lib/db';

const PUBLIC_ROUTES = new Set(['/login', '/auth/callback']);

export const load = async ({ request, cookies, url }: Parameters<LayoutServerLoad>[0]) => {
  const pathname = url.pathname;

  if (PUBLIC_ROUTES.has(pathname)) {
    return {};
  }

  const supabase = createServerClient();

  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '');
  } else {
    token = cookies.get('sb-access-token') || null;
  }

  if (!token) {
    throw redirect(302, '/login');
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw redirect(302, '/login');
  }

  return {};
};


