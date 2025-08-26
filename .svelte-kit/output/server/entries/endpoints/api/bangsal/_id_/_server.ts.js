import { json } from "@sveltejs/kit";
import { g as generateRequestId, U as UuidSchema, c as createErrorResponse, a as getUserFromRequest, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse, e as UpdateBangsalSchema } from "../../../../../chunks/db.js";
const GET = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid bangsal ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: bangsal, error } = await supabase.from("bangsal").select(`
        *,
        hospital (
          id,
          name,
          owner_id
        )
      `).eq("id", idValidation.data).single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    if (bangsal.hospital?.owner_id !== user.id) {
      return json(createErrorResponse("Access denied", requestId), { status: 403 });
    }
    return json(createSuccessResponse(bangsal, requestId));
  } catch (error) {
    console.error("Bangsal GET error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
const PUT = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid bangsal ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const body = await request.json();
    const validationResult = UpdateBangsalSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse("Invalid request data", requestId), { status: 400 });
    }
    if (Object.keys(validationResult.data).length === 0) {
      return json(createErrorResponse("No fields to update", requestId), { status: 400 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: existingBangsal, error: fetchError } = await supabase.from("bangsal").select(`
        id,
        hospital (
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
    if (existingBangsal.hospital?.owner_id !== user.id) {
      return json(createErrorResponse("Access denied", requestId), { status: 403 });
    }
    const { data: bangsal, error } = await supabase.from("bangsal").update(validationResult.data).eq("id", idValidation.data).select().single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource already exists" ? 409 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(bangsal, requestId));
  } catch (error) {
    console.error("Bangsal PUT error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
const DELETE = async ({ params, request }) => {
  const requestId = generateRequestId();
  try {
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid bangsal ID", requestId), { status: 400 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { data: existingBangsal, error: fetchError } = await supabase.from("bangsal").select(`
        id,
        hospital (
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
    if (existingBangsal.hospital?.owner_id !== user.id) {
      return json(createErrorResponse("Access denied", requestId), { status: 403 });
    }
    const { error: deleteError } = await supabase.from("bangsal").delete().eq("id", idValidation.data);
    if (deleteError) {
      const errorResponse = mapSupabaseError(deleteError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse({ deleted: true }, requestId));
  } catch (error) {
    console.error("Bangsal DELETE error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  DELETE,
  GET,
  PUT
};
