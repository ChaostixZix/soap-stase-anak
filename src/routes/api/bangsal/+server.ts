import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createServerClient,
  CreateBangsalSchema,
  UuidSchema,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  mapSupabaseError,
  getUserFromRequest
} from '$lib/db.js';

// GET /api/bangsal?hospital_id=... - List bangsal for a hospital
export const GET: RequestHandler = async ({ request, url }) => {
  const requestId = generateRequestId();
  
  try {
    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    // Get hospital_id from query params
    const hospitalId = url.searchParams.get('hospital_id');
    if (!hospitalId) {
      return json(createErrorResponse('hospital_id parameter is required', requestId), { status: 400 });
    }

    // Validate hospital ID
    const idValidation = UuidSchema.safeParse(hospitalId);
    if (!idValidation.success) {
      return json(createErrorResponse('Invalid hospital_id', requestId), { status: 400 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // First verify that the hospital belongs to the user
    const { error: hospitalError } = await supabase
      .from('hospital')
      .select('id')
      .eq('id', idValidation.data)
      .eq('owner_id', user.id)
      .single();

    if (hospitalError) {
      const errorResponse = mapSupabaseError(hospitalError, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource not found' ? 404 :
                errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    // Get bangsal for the hospital
    const { data: bangsal, error } = await supabase
      .from('bangsal')
      .select('*')
      .eq('hospital_id', idValidation.data)
      .order('name');

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    return json(createSuccessResponse(bangsal, requestId));

  } catch (error) {
    console.error('Bangsal GET error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};

// POST /api/bangsal - Create a new bangsal
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
    const validationResult = CreateBangsalSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse('Invalid request data', requestId), { status: 400 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // First verify that the hospital belongs to the user
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

    // Create the bangsal
    const { data: bangsal, error } = await supabase
      .from('bangsal')
      .insert({
        hospital_id: validationResult.data.hospital_id,
        name: validationResult.data.name
      })
      .select()
      .single();

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource already exists' ? 409 :
                errorResponse.error === 'Access denied' ? 403 : 500
      });
    }

    return json(createSuccessResponse(bangsal, requestId), { status: 201 });

  } catch (error) {
    console.error('Bangsal POST error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};