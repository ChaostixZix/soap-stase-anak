import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createServerClient,
  UuidSchema,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  mapSupabaseError,
  getUserFromRequest
} from '$lib/db.js';

// GET /api/patients/[patient_id]/soap/latest - Get latest SOAP for a patient
export const GET: RequestHandler = async ({ params, request }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate patient ID
    const idValidation = UuidSchema.safeParse(params.patient_id);
    if (!idValidation.success) {
      return json(createErrorResponse('Invalid patient ID', requestId), { status: 400 });
    }

    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // First verify that the patient belongs to the user
    const { error: patientError } = await supabase
      .from('patient')
      .select('id')
      .eq('id', idValidation.data)
      .eq('owner_id', user.id)
      .single();

    if (patientError) {
      const errorResponse = mapSupabaseError(patientError, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource not found' ? 404 :
                errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    // Get the latest SOAP entry
    const { data: soap, error } = await supabase
      .from('soap')
      .select('*')
      .eq('patient_id', idValidation.data)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no SOAP entries exist, return null data instead of error
      if (error.code === 'PGRST116') {
        return json(createSuccessResponse(null, requestId));
      }
      
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    return json(createSuccessResponse(soap, requestId));

  } catch (error) {
    console.error('Latest SOAP GET error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};