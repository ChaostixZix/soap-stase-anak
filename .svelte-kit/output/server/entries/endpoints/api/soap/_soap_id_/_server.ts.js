import { json } from "@sveltejs/kit";
import { g as generateRequestId, U as UuidSchema, c as createErrorResponse, a as getUserFromRequest, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse, l as UpdateSoapSchema } from "../../../../../chunks/db.js";
const GET = async ({ params, request }) => {
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
    const { data: soap, error } = await supabase.from("soap").select(`
        *,
        patient (
          id,
          full_name,
          owner_id
        )
      `).eq("id", idValidation.data).single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    if (soap.patient?.owner_id !== user.id) {
      return json(createErrorResponse("Access denied", requestId), { status: 403 });
    }
    return json(createSuccessResponse(soap, requestId));
  } catch (error) {
    console.error("SOAP GET error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
const PUT = async ({ params, request }) => {
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
    const validationResult = UpdateSoapSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse("Invalid request data", requestId), { status: 400 });
    }
    if (Object.keys(validationResult.data).length === 0) {
      return json(createErrorResponse("No fields to update", requestId), { status: 400 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: existingSoap, error: fetchError } = await supabase.from("soap").select(`
        id,
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
    const updateData = {
      ...validationResult.data,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { data: soap, error } = await supabase.from("soap").update(updateData).eq("id", idValidation.data).select(`
        *,
        patient (
          id,
          full_name,
          owner_id
        )
      `).single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(soap, requestId));
  } catch (error) {
    console.error("SOAP PUT error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  GET,
  PUT
};
