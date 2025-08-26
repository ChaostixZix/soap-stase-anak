import { json } from "@sveltejs/kit";
import { g as generateRequestId, a as getUserFromRequest, c as createErrorResponse, U as UuidSchema, b as createServerClient, m as mapSupabaseError, d as createSuccessResponse, C as CreateBangsalSchema } from "../../../../chunks/db.js";
const GET = async ({ request, url }) => {
  const requestId = generateRequestId();
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const hospitalId = url.searchParams.get("hospital_id");
    if (!hospitalId) {
      return json(createErrorResponse("hospital_id parameter is required", requestId), { status: 400 });
    }
    const idValidation = UuidSchema.safeParse(hospitalId);
    if (!idValidation.success) {
      return json(createErrorResponse("Invalid hospital_id", requestId), { status: 400 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { error: hospitalError } = await supabase.from("hospital").select("id").eq("id", idValidation.data).eq("owner_id", user.id).single();
    if (hospitalError) {
      const errorResponse = mapSupabaseError(hospitalError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    const { data: bangsal, error } = await supabase.from("bangsal").select("*").eq("hospital_id", idValidation.data).order("name");
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(bangsal, requestId));
  } catch (error) {
    console.error("Bangsal GET error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
const POST = async ({ request }) => {
  const requestId = generateRequestId();
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse("Unauthorized", requestId), { status: 401 });
    }
    const body = await request.json();
    const validationResult = CreateBangsalSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse("Invalid request data", requestId), { status: 400 });
    }
    const supabase = createServerClient();
    await supabase.auth.admin.getUserById(user.id);
    const { error: hospitalError } = await supabase.from("hospital").select("id").eq("id", validationResult.data.hospital_id).eq("owner_id", user.id).single();
    if (hospitalError) {
      const errorResponse = mapSupabaseError(hospitalError, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource not found" ? 404 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    const { data: bangsal, error } = await supabase.from("bangsal").insert({
      hospital_id: validationResult.data.hospital_id,
      name: validationResult.data.name
    }).select().single();
    if (error) {
      const errorResponse = mapSupabaseError(error, requestId);
      return json(errorResponse, {
        status: errorResponse.error === "Resource already exists" ? 409 : errorResponse.error === "Access denied" ? 403 : 500
      });
    }
    return json(createSuccessResponse(bangsal, requestId), { status: 201 });
  } catch (error) {
    console.error("Bangsal POST error:", error);
    return json(createErrorResponse("Internal server error", requestId), { status: 500 });
  }
};
export {
  GET,
  POST
};
