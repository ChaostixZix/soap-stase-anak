import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createServerClient,
  CreateHospitalSchema,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  mapSupabaseError,
  getUserFromRequest
} from '$lib/db.js';

// GET /api/hospitals - List all hospitals for the authenticated user
export const GET: RequestHandler = async ({ request }) => {
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
    
    const { data: hospitals, error } = await supabase
      .from('hospital')
      .select('*')
      .eq('owner_id', user.id)
      .order('name');

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    return json(createSuccessResponse(hospitals, requestId));

  } catch (error) {
    console.error('Hospitals GET error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};

// POST /api/hospitals - Create a new hospital
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
    const validationResult = CreateHospitalSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse('Invalid request data', requestId), { status: 400 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    const { data: hospital, error } = await supabase
      .from('hospital')
      .insert({
        owner_id: user.id,
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

    return json(createSuccessResponse(hospital, requestId), { status: 201 });

  } catch (error) {
    console.error('Hospitals POST error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};