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

    // Fetch latest SOAP for the patient
    const { data: soap, error: soapError } = await supabase
      .from('soap')
      .select('*')
      .eq('patient_id', idValidation.data)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // It's OK if there's no SOAP entry (PGRST116 error)
    let soapData = null;
    if (soapError && soapError.code !== 'PGRST116') {
      console.error('SOAP fetch error:', soapError);
      throw error(500, 'Failed to load SOAP data');
    } else if (!soapError) {
      soapData = soap;
    }

    return {
      patient,
      soap: soapData
    };

  } catch (e) {
    if (e instanceof Error && 'status' in e) {
      throw e; // Re-throw SvelteKit errors
    }
    console.error('Unexpected error in SOAP page load:', e);
    throw error(500, 'Internal server error');
  }
};