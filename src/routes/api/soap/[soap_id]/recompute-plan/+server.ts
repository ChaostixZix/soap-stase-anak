import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createServerClient,
  UuidSchema,
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  mapSupabaseError,
  getUserFromRequest,
  type PlanItem
} from '$lib/db.js';
import { recomputePlanStatuses, generatePlanSummary } from '$lib/plan.js';

// POST /api/soap/[soap_id]/recompute-plan - Recompute plan item statuses
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
          owner_id,
          full_name
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

    // Recompute plan statuses
    const existingPlan = (existingSoap.p || []) as PlanItem[];
    const updatedPlan = recomputePlanStatuses(existingPlan);

    // Check if anything actually changed
    const hasChanges = existingPlan.some((item, index) => 
      item.status !== updatedPlan[index]?.status
    );

    if (!hasChanges) {
      // Generate plan summary anyway for consistency
      const planSummary = generatePlanSummary(updatedPlan);
      
      return json(createSuccessResponse({
        soap: existingSoap,
        planSummary,
        changed: false,
        message: 'No status changes needed'
      }, requestId));
    }

    // Update the SOAP entry with recomputed plan
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

    // Count how many items changed status
    const statusChanges = existingPlan.reduce((count, item, index) => {
      return item.status !== updatedPlan[index]?.status ? count + 1 : count;
    }, 0);

    return json(createSuccessResponse({
      soap,
      planSummary,
      changed: true,
      statusChanges
    }, requestId));

  } catch (error) {
    console.error('Recompute plan POST error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};