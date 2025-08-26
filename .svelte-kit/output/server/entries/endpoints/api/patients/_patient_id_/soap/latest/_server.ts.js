import { json } from "@sveltejs/kit";
import { g as generateRequestId, U as UuidSchema, c as createErrorResponse, a as getUserFromRequest, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse } from "../../../../../../../chunks/db.js";
const GET = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.patient_id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid patient ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { error: patientError } = await supabase.from("patient").select("id").eq("id", idValidation.data).eq("owner_id", user.id).single();
    if (patientError) {
      const errorResponse = mapSupabaseError(patientError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    const { data: soap, error } = await supabase.from("soap").select("*").eq("patient_id", idValidation.data).order("created_at", { ascending: false }).limit(1).single();
    if (error) {
      if (error.code === "PGRST116") {
        return json(createSuccessResponse(null, requestId));
      }
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(soap, requestId));
  } catch (error) {
    console.error("Latest SOAP GET error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  GET
};
