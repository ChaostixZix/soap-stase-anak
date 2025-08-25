import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import {
  createServerClient,
  CreatePlanItemSchema,
  UuidSchema,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  mapSupabaseError,
  getUserFromRequest,
  type PlanItem
} from '$lib/db.js';
import { addPlanItems, generatePlanSummary } from '$lib/plan.js';

// Schema for adding plan items
const AddPlanItemsSchema = z.object({
  items: z.array(CreatePlanItemSchema).min(1)
});

// POST /api/soap/[soap_id]/plan-items - Add plan items to SOAP entry
export const POST: RequestHandler = async ({ params, request }) => {
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
    const validationResult = AddPlanItemsSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse('Invalid request data', requestId), { status: 400 });
    }

    const supabase = createServerClient();
    
    // Set auth for RLS
    await supabase.auth.admin.getUserById(user.id);

    // First get the existing SOAP entry and verify ownership
    const { data: existingSoap, error: fetchError } = await supabase
      .from('soap')
      .select(`
        id,
        p,
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

    // Add new plan items to existing plan
    const existingPlan = (existingSoap.p || []) as PlanItem[];
    const updatedPlan = addPlanItems(existingPlan, validationResult.data.items);

    // Update the SOAP entry with new plan
    const { data: soap, error } = await supabase
      .from('soap')
      .update({ 
        p: updatedPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', idValidation.data)
      .select(`
        *,
        patient (
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, { 
        status: errorResponse.error === 'Access denied' ? 403 : 500
      });
    }

    // Generate plan summary for response
    const planSummary = generatePlanSummary(updatedPlan);

    return json(createSuccessResponse({
      soap,
      planSummary,
      addedItems: validationResult.data.items.length
    }, requestId), { status: 201 });

  } catch (error) {
    console.error('Plan items POST error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};