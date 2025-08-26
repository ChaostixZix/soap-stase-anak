import { json } from "@sveltejs/kit";
import { z } from "zod";
import { n as CreatePlanItemSchema, g as generateRequestId, U as UuidSchema, c as createErrorResponse, a as getUserFromRequest, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse } from "../../../../../../chunks/db.js";
import { a as addPlanItems, g as generatePlanSummary } from "../../../../../../chunks/plan.js";
const AddPlanItemsSchema = z.object({
  items: z.array(CreatePlanItemSchema).min(1)
});
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
    const body = await request.json();
    const validationResult = AddPlanItemsSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse("Invalid request data", requestId), { status: 400 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: existingSoap, error: fetchError } = await supabase.from("soap").select(`
        id,
        p,
        patient (
          id,
          owner_id
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
    const updatedPlan = addPlanItems(existingPlan, validationResult.data.items);
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
    return json(createSuccessResponse({
      soap,
      planSummary,
      addedItems: validationResult.data.items.length
    }, requestId), { status: 201 });
  } catch (error) {
    console.error("Plan items POST error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  POST
};
