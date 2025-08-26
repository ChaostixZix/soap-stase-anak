import type { PageServerLoad } from './$types';
import { 
  createServerClient, 
  UuidSchema, 
  getUserFromRequest 
} from '$lib/db.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, request }) => {
  // Validate patient ID
  const idValidation = UuidSchema.safeParse(params.id);
  if (!idValidation.success) {
    throw error(400, 'Invalid patient ID');
  }

  try {
    // Get user from request (development mode with auth disabled)
    const user = await getUserFromRequest(request);
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // Fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from('patient')
      .select(`
        *,
        hospital (
          id,
          name
        ),
        bangsal (
          id,
          name
        )
      `)
      .eq('id', idValidation.data)
      .eq('owner_id', user.id)
      .single();

    if (patientError) {
      if (patientError.code === 'PGRST116') {
        throw error(404, 'Patient not found');
      }
      console.error('Database error:', patientError);
      throw error(500, 'Failed to load patient');
    }

    return {
      patient
    };

  } catch (e) {
    if (e instanceof Error && 'status' in e) {
      throw e; // Re-throw SvelteKit errors
    }
    console.error('Unexpected error in patient page load:', e);
    throw error(500, 'Internal server error');
  }
};