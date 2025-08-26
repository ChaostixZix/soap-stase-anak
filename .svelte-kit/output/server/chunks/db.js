import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { P as PUBLIC_SUPABASE_URL } from "./public.js";
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_lmGO-gIQmDJm9PMV3d0KzQ_VBr-ASR8";
function createServerClient() {
  return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
const UuidSchema = z.string().uuid();
const DateTimeSchema = z.string().datetime();
z.object({
  id: UuidSchema,
  owner_id: UuidSchema,
  name: z.string().min(1).max(255)
});
const CreateHospitalSchema = z.object({
  name: z.string().min(1).max(255)
});
const UpdateHospitalSchema = z.object({
  name: z.string().min(1).max(255).optional()
});
z.object({
  id: UuidSchema,
  hospital_id: UuidSchema,
  name: z.string().min(1).max(255)
});
const CreateBangsalSchema = z.object({
  hospital_id: UuidSchema,
  name: z.string().min(1).max(255)
});
const UpdateBangsalSchema = z.object({
  name: z.string().min(1).max(255).optional()
});
z.object({
  id: UuidSchema,
  owner_id: UuidSchema,
  hospital_id: UuidSchema,
  bangsal_id: UuidSchema,
  room_number: z.string().nullable(),
  full_name: z.string().min(1).max(255),
  mrn: z.string().nullable(),
  created_at: DateTimeSchema
});
const CreatePatientSchema = z.object({
  hospital_id: UuidSchema,
  bangsal_id: UuidSchema,
  room_number: z.string().min(1).max(50).optional(),
  full_name: z.string().min(1).max(255),
  mrn: z.string().min(1).max(50).optional()
});
const UpdatePatientSchema = z.object({
  hospital_id: UuidSchema.optional(),
  bangsal_id: UuidSchema.optional(),
  room_number: z.string().min(1).max(50).optional().nullable(),
  full_name: z.string().min(1).max(255).optional(),
  mrn: z.string().min(1).max(50).optional().nullable()
});
const PlanItemSchema = z.object({
  drug: z.string().min(1),
  route: z.string().optional(),
  dose: z.string().optional(),
  freq: z.string().optional(),
  days: z.number().int().positive().optional(),
  start_date: z.string().date(),
  end_date: z.string().date(),
  status: z.enum(["active", "done"])
});
const CreatePlanItemSchema = z.object({
  drug: z.string().min(1),
  route: z.string().optional(),
  dose: z.string().optional(),
  freq: z.string().optional(),
  days: z.number().int().positive().optional(),
  start_date: z.string().date().optional()
  // Will default to today if not provided
});
z.object({
  id: UuidSchema,
  patient_id: UuidSchema,
  s: z.string().nullable(),
  o: z.string().nullable(),
  a: z.string().nullable(),
  p: z.array(PlanItemSchema),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema
});
const CreateSoapSchema = z.object({
  patient_id: UuidSchema,
  s: z.string().optional(),
  o: z.string().optional(),
  a: z.string().optional(),
  p: z.array(CreatePlanItemSchema).default([])
});
const UpdateSoapSchema = z.object({
  s: z.string().optional(),
  o: z.string().optional(),
  a: z.string().optional()
});
z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  requestId: z.string().optional()
});
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function createSuccessResponse(data, requestId) {
  return {
    ok: true,
    data,
    requestId
  };
}
function createErrorResponse(error, requestId) {
  return {
    ok: false,
    error,
    requestId
  };
}
function mapSupabaseError(error, requestId) {
  console.error("Supabase error:", error);
  const err = error;
  if (err?.code === "42501" || typeof err?.message === "string" && err.message.includes("row-level security")) {
    return createErrorResponse("Access denied", requestId);
  }
  if (err?.code === "PGRST116" || err?.status === 404) {
    return createErrorResponse("Resource not found", requestId);
  }
  if (err?.code === "23514" || err?.code === "23502") {
    return createErrorResponse("Validation error", requestId);
  }
  if (err?.code === "23505") {
    return createErrorResponse("Resource already exists", requestId);
  }
  if (err?.code === "23503") {
    return createErrorResponse("Invalid reference", requestId);
  }
  return createErrorResponse(typeof err?.message === "string" ? err.message : "Internal server error", requestId);
}
async function getUserFromRequest(request) {
  const supabase = createServerClient();
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}
export {
  CreateBangsalSchema as C,
  UuidSchema as U,
  getUserFromRequest as a,
  createServerClient as b,
  createErrorResponse as c,
  createSuccessResponse as d,
  UpdateBangsalSchema as e,
  CreateHospitalSchema as f,
  generateRequestId as g,
  UpdateHospitalSchema as h,
  CreatePatientSchema as i,
  UpdatePatientSchema as j,
  CreateSoapSchema as k,
  UpdateSoapSchema as l,
  mapSupabaseError as m,
  CreatePlanItemSchema as n
};
