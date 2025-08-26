import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createServerClient,
  UpdateSoapSchema,
  UuidSchema,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  mapSupabaseError,
  getUserFromRequest
} from '$lib/db.js';

// GET /api/soap/[soap_id] - Get a specific SOAP entry
export const GET: RequestHandler = async ({ params, request }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate SOAP ID
    const idValidation = UuidSchema.safeParse(params.soap_id);
    if (!idValidation.success) {
      return json(createErrorResponse('Invalid SOAP ID', requestId), { status: 400 });
    }

    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // Get SOAP with patient information to verify ownership
    const { data: soap, error } = await supabase
      .from('soap')
      .select(`
        *,
        patient (
          id,
          full_name,
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

    // Check if user owns the patient
    if (soap.patient?.owner_id !== user.id) {
      return json(createErrorResponse('Access denied', requestId), { status: 403 });
    }

    return json(createSuccessResponse(soap, requestId));

  } catch (error) {
    console.error('SOAP GET error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};

// PUT /api/soap/[soap_id] - Update S/O/A fields of a SOAP entry
export const PUT: RequestHandler = async ({ params, request }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate SOAP ID
    const idValidation = UuidSchema.safeParse(params.soap_id);
    if (!idValidation.success) {
      return json(createErrorResponse('Invalid SOAP ID', requestId), { status: 400 });
    }

    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = UpdateSoapSchema.safeParse(body);
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

    // First verify that the user owns the patient this SOAP belongs to
    const { data: existingSoap, error: fetchError } = await supabase
      .from('soap')
      .select(`
        id,
        patient (
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

    // Check if user owns the patient
    if (existingSoap.patient?.owner_id !== user.id) {
      return json(createErrorResponse('Access denied', requestId), { status: 403 });
    }

    // Update the SOAP entry with current timestamp
    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString()
    };

    const { data: soap, error } = await supabase
      .from('soap')
      .update(updateData)
      .eq('id', idValidation.data)
      .select(`
        *,
        patient (
          id,
          full_name,
          owner_id
        )
      `)
      .single();

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Access denied' ? 403 : 500
      });
    }

    return json(createSuccessResponse(soap, requestId));

  } catch (error) {
    console.error('SOAP PUT error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};