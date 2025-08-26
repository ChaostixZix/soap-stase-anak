import { json } from "@sveltejs/kit";
import { g as generateRequestId, U as UuidSchema, c as createErrorResponse, a as getUserFromRequest, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse, h as UpdateHospitalSchema } from "../../../../../chunks/db.js";
const GET = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid hospital ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: hospital, error } = await supabase.from("hospital").select("*").eq("id", idValidation.data).eq("owner_id", user.id).single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(hospital, requestId));
  } catch (error) {
    console.error("Hospital GET error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
const PUT = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid hospital ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const body = await request.json();
    const validationResult = UpdateHospitalSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse("Invalid request data", requestId), { status: 400 });
    }
    if (Object.keys(validationResult.data).length === 0) {
      return json(createErrorResponse("No fields to update", requestId), { status: 400 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: hospital, error } = await supabase.from("hospital").update(validationResult.data).eq("id", idValidation.data).eq("owner_id", user.id).select().single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : errorResponse.error === "Resource already exists" ? 409 : 500
      });
    }
    return json(createSuccessResponse(hospital, requestId));
  } catch (error) {
    console.error("Hospital PUT error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
const DELETE = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid hospital ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { error: fetchError } = await supabase.from("hospital").select("id").eq("id", idValidation.data).eq("owner_id", user.id).single();
    if (fetchError) {
      const errorResponse = mapSupabaseError(fetchError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    const { error: deleteError } = await supabase.from("hospital").delete().eq("id", idValidation.data).eq("owner_id", user.id);
    if (deleteError) {
      const errorResponse = mapSupabaseError(deleteError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse({ deleted: true }, requestId));
  } catch (error) {
    console.error("Hospital DELETE error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  DELETE,
  GET,
  PUT
};
