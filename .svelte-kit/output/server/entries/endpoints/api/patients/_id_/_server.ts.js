import { json } from "@sveltejs/kit";
import { g as generateRequestId, U as UuidSchema, c as createErrorResponse, a as getUserFromRequest, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse, j as UpdatePatientSchema } from "../../../../../chunks/db.js";
const GET = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid patient ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: _patient, error } = await supabase.from("patient").select(`
        *,
        hospital (
          id,
          name
        ),
        bangsal (
          id,
          name
        )
      `).eq("id", idValidation.data).eq("owner_id", user.id).single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(_patient, requestId));
  } catch (error) {
    console.error("Patient GET error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
const PUT = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid patient ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const body = await request.json();
    const validationResult = UpdatePatientSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse("Invalid request data", requestId), { status: 400 });
    }
    if (Object.keys(validationResult.data).length === 0) {
      return json(createErrorResponse("No fields to update", requestId), { status: 400 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { error: fetchError } = await supabase.from("patient").select("id, owner_id").eq("id", idValidation.data).eq("owner_id", user.id).single();
    if (fetchError) {
      const errorResponse = mapSupabaseError(fetchError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    if (validationResult.data.hospital_id) {
      const { error: hospitalError } = await supabase.from("hospital").select("id").eq("id", validationResult.data.hospital_id).eq("owner_id", user.id).single();
      if (hospitalError) {
        return json(createErrorResponse("Invalid hospital", requestId), { status: 400 });
      }
    }
    if (validationResult.data.bangsal_id) {
      const hospitalIdToCheck = validationResult.data.hospital_id || (await supabase.from("patient").select("hospital_id").eq("id", idValidation.data).single()).data?.hospital_id;
      if (!hospitalIdToCheck) {
        return json(createErrorResponse("Cannot determine hospital for bangsal validation", requestId), { status: 400 });
      }
      const { error: bangsalError } = await supabase.from("bangsal").select("id").eq("id", validationResult.data.bangsal_id).eq("hospital_id", hospitalIdToCheck).single();
      if (bangsalError) {
        return json(createErrorResponse("Invalid bangsal for this hospital", requestId), { status: 400 });
      }
    }
    const { data: _patient, error } = await supabase.from("patient").update(validationResult.data).eq("id", idValidation.data).eq("owner_id", user.id).select(`
        *,
        hospital (
          id,
          name
        ),
        bangsal (
          id,
          name
        )
      `).single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(_patient, requestId));
  } catch (error) {
    console.error("Patient PUT error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
const DELETE = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid patient ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { error: fetchError } = await supabase.from("patient").select("id").eq("id", idValidation.data).eq("owner_id", user.id).single();
    if (fetchError) {
      const errorResponse = mapSupabaseError(fetchError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    const { error: deleteError } = await supabase.from("patient").delete().eq("id", idValidation.data).eq("owner_id", user.id);
    if (deleteError) {
      const errorResponse = mapSupabaseError(deleteError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse({ deleted: true }, requestId));
  } catch (error) {
    console.error("Patient DELETE error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  DELETE,
  GET,
  PUT
};
