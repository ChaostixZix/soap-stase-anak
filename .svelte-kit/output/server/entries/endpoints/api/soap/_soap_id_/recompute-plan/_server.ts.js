import { json } from "@sveltejs/kit";
import { g as generateRequestId, U as UuidSchema, c as createErrorResponse, a as getUserFromRequest, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse } from "../../../../../../chunks/db.js";
import { r as recomputePlanStatuses, g as generatePlanSummary } from "../../../../../../chunks/plan.js";
const POST = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.soap_id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid SOAP ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: existingSoap, error: fetchError } = await supabase.from("soap").select(`
        id,
        p,
        patient (
          id,
          owner_id,
          full_name
        )
      `).eq("id", idValidation.data).single();
    if (fetchError) {
      const errorResponse = mapSupabaseError(fetchError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    if (existingSoap.patient?.owner_id !== user.id) {
      return json(createErrorResponse("Access denied", requestId), { status: 403 });
    }
    const existingPlan = existingSoap.p || [];
    const updatedPlan = recomputePlanStatuses(existingPlan);
    const hasChanges = existingPlan.some(
      (item, index) => item.status !== updatedPlan[index]?.status
    );
    if (!hasChanges) {
      const planSummary2 = generatePlanSummary(updatedPlan);
      return json(createSuccessResponse({
        soap: existingSoap,
        planSummary: planSummary2,
        changed: false,
        message: "No status changes needed"
      }, requestId));
    }
    const { data: soap, error } = await supabase.from("soap").update({
      p: updatedPlan,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", idValidation.data).select(`
        *,
        patient (
          id,
          full_name
        )
      `).single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    const planSummary = generatePlanSummary(updatedPlan);
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
    console.error("Recompute plan POST error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  POST
};
