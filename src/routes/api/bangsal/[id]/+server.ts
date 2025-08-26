import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createServerClient,
  UpdateBangsalSchema,
  UuidSchema,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  mapSupabaseError,
  getUserFromRequest
} from '$lib/db.js';

// GET /api/bangsal/[id] - Get a specific bangsal
export const GET: RequestHandler = async ({ params, request }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate bangsal ID
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse('Invalid bangsal ID', requestId), { status: 400 });
    }

    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // Get bangsal with hospital information to verify ownership
    const { data: bangsal, error } = await supabase
      .from('bangsal')
      .select(`
        *,
        hospital (
          id,
          name,
          owner_id
        )
      `)
      .eq('id', idValidation.data)
      .single();

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource not found' ? 404 :
                errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    // Check if user owns the hospital
    if (bangsal.hospital?.owner_id !== user.id) {
      return json(createErrorResponse('Access denied', requestId), { status: 403 });
    }

    return json(createSuccessResponse(bangsal, requestId));

  } catch (error) {
    console.error('Bangsal GET error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};

// PUT /api/bangsal/[id] - Update a bangsal
export const PUT: RequestHandler = async ({ params, request }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate bangsal ID
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse('Invalid bangsal ID', requestId), { status: 400 });
    }

    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = UpdateBangsalSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse('Invalid request data', requestId), { status: 400 });
    }

    // Check if there are actually fields to update
    if (Object.keys(validationResult.data).length === 0) {
      return json(createErrorResponse('No fields to update', requestId), { status: 400 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // First verify that the user owns the hospital this bangsal belongs to
    const { data: existingBangsal, error: fetchError } = await supabase
      .from('bangsal')
      .select(`
        id,
        hospital (
          id,
          owner_id
        )
      `)
      .eq('id', idValidation.data)
      .single();

    if (fetchError) {
      const errorResponse = mapSupabaseError(fetchError, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource not found' ? 404 :
                errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    // Check if user owns the hospital
    if (existingBangsal.hospital?.owner_id !== user.id) {
      return json(createErrorResponse('Access denied', requestId), { status: 403 });
    }

    // Update the bangsal
    const { data: bangsal, error } = await supabase
      .from('bangsal')
      .update(validationResult.data)
      .eq('id', idValidation.data)
      .select()
      .single();

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource already exists' ? 409 :
                errorResponse.error === 'Access denied' ? 403 : 500
      });
    }

    return json(createSuccessResponse(bangsal, requestId));

  } catch (error) {
    console.error('Bangsal PUT error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};

// DELETE /api/bangsal/[id] - Delete a bangsal
export const DELETE: RequestHandler = async ({ params, request }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate bangsal ID
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse('Invalid bangsal ID', requestId), { status: 400 });
    }

    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // First check if bangsal exists and user owns the hospital
    const { data: existingBangsal, error: fetchError } = await supabase
      .from('bangsal')
      .select(`
        id,
        hospital (
          id,
          owner_id
        )
      `)
      .eq('id', idValidation.data)
      .single();

    if (fetchError) {
      const errorResponse = mapSupabaseError(fetchError, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Resource not found' ? 404 :
                errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    // Check if user owns the hospital
    if (existingBangsal.hospital?.owner_id !== user.id) {
      return json(createErrorResponse('Access denied', requestId), { status: 403 });
    }

    // Delete the bangsal
    const { error: deleteError } = await supabase
      .from('bangsal')
      .delete()
      .eq('id', idValidation.data);

    if (deleteError) {
      const errorResponse = mapSupabaseError(deleteError, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Access denied' ? 403 : 500 
      });
    }

    return json(createSuccessResponse({ deleted: true }, requestId));

  } catch (error) {
    console.error('Bangsal DELETE error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};