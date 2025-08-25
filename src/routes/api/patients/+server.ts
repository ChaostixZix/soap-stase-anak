import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createServerClient,
  CreatePatientSchema,
  UuidSchema,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  mapSupabaseError,
  getUserFromRequest
} from '$lib/db.js';

// GET /api/patients?hospital_id=...&bangsal_id=...&search=... - List patients with filters
export const GET: RequestHandler = async ({ request, url }) => {
  const requestId = generateRequestId();
  
  try {
    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // Build query
    let query = supabase
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
      .eq('owner_id', user.id);

    // Apply filters
    const hospitalId = url.searchParams.get('hospital_id');
    if (hospitalId) {
      const idValidation = UuidSchema.safeParse(hospitalId);
      if (!idValidation.success) {
        return json(createErrorResponse('Invalid hospital_id', requestId), { status: 400 });
      }
      query = query.eq('hospital_id', idValidation.data);
    }

    const bangsalId = url.searchParams.get('bangsal_id');
    if (bangsalId) {
      const idValidation = UuidSchema.safeParse(bangsalId);
      if (!idValidation.success) {
        return json(createErrorResponse('Invalid bangsal_id', requestId), { status: 400 });
      }
      query = query.eq('bangsal_id', idValidation.data);
    }

    const search = url.searchParams.get('search');
    if (search && search.trim().length > 0) {
      // Use ILIKE for case-insensitive search with pg_trgm similarity
      query = query.ilike('full_name', `%${search.trim()}%`);
    }

    // Apply ordering
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: patients, error } = await query;

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    return json(createSuccessResponse(patients, requestId));

  } catch (error) {
    console.error('Patients GET error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};

// POST /api/patients - Create a new patient
export const POST: RequestHandler = async ({ request }) => {
  const requestId = generateRequestId();
  
  try {
    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = CreatePatientSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse('Invalid request data', requestId), { status: 400 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // Verify that the hospital belongs to the user
    const { error: hospitalError } = await supabase
      .from('hospital')
      .select('id')
      .eq('id', validationResult.data.hospital_id)
      .eq('owner_id', user.id)
      .single();

    if (hospitalError) {
      const errorResponse = mapSupabaseError(hospitalError, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource not found' ? 404 :
                errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    // Verify that the bangsal belongs to the hospital
    const { error: bangsalError } = await supabase
      .from('bangsal')
      .select('id')
      .eq('id', validationResult.data.bangsal_id)
      .eq('hospital_id', validationResult.data.hospital_id)
      .single();

    if (bangsalError) {
      const errorResponse = mapSupabaseError(bangsalError, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource not found' ? 
          createErrorResponse('Invalid bangsal for this hospital', requestId).error === 'Invalid bangsal for this hospital' ? 400 : 404 :
                errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    // Create the patient
    const { data: _patient, error } = await supabase
      .from('patient')
      .insert({
        owner_id: user.id,
        hospital_id: validationResult.data.hospital_id,
        bangsal_id: validationResult.data.bangsal_id,
        room_number: validationResult.data.room_number || null,
        full_name: validationResult.data.full_name,
        mrn: validationResult.data.mrn || null
      })
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
      .single();

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Access denied' ? 403 : 500
      });
    }

    return json(createSuccessResponse(_patient, requestId), { status: 201 });

  } catch (error) {
    console.error('Patients POST error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};