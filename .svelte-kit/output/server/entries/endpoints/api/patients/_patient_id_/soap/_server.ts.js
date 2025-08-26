import { json } from "@sveltejs/kit";
import { g as generateRequestId, U as UuidSchema, c as createErrorResponse, a as getUserFromRequest, k as CreateSoapSchema, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse } from "../../../../../../chunks/db.js";
import { p as processPlanItems } from "../../../../../../chunks/plan.js";
const POST = async ({ params, request }) => {
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
    const body = await request.json();
    const validationResult = CreateSoapSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse("Invalid request data", requestId), { status: 400 });
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
    const processedPlanItems = processPlanItems(validationResult.data.p);
    const { data: soap, error } = await supabase.from("soap").insert({
      patient_id: idValidation.data,
      s: validationResult.data.s || null,
      o: validationResult.data.o || null,
      a: validationResult.data.a || null,
      p: processedPlanItems
    }).select().single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(soap, requestId), { status: 201 });
  } catch (error) {
    console.error("SOAP POST error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  POST
};
