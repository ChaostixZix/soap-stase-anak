import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { createServerClient } from '$lib/db';

export const load: PageServerLoad = async ({ request, cookies }) => {
  const supabase = createServerClient();

  // Try to read the auth token from the Authorization header first
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '');
  } else {
    // Fallback: Supabase JS (on client) uses sb-access-token cookie; mirror that if present
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

export const actions: Actions = {};


