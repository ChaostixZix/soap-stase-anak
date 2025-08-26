import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

// Server-side Supabase client factory
export function createServerClient() {
  if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase server environment variables');
  }
  
  return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Core Zod schemas
export const UuidSchema = z.string().uuid();
export const DateTimeSchema = z.string().datetime();

// Hospital schema
export const HospitalSchema = z.object({
  id: UuidSchema,
  owner_id: UuidSchema,
  name: z.string().min(1).max(255),
});

export const CreateHospitalSchema = z.object({
  name: z.string().min(1).max(255),
});

export const UpdateHospitalSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

// Bangsal schema
export const BangsalSchema = z.object({
  id: UuidSchema,
  hospital_id: UuidSchema,
  name: z.string().min(1).max(255),
});

export const CreateBangsalSchema = z.object({
  hospital_id: UuidSchema,
  name: z.string().min(1).max(255),
});

export const UpdateBangsalSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

// Patient schema
export const PatientSchema = z.object({
  id: UuidSchema,
  owner_id: UuidSchema,
  hospital_id: UuidSchema,
  bangsal_id: UuidSchema,
  room_number: z.string().nullable(),
  full_name: z.string().min(1).max(255),
  mrn: z.string().nullable(),
  created_at: DateTimeSchema,
});

export const CreatePatientSchema = z.object({
  hospital_id: UuidSchema,
  bangsal_id: UuidSchema,
  room_number: z.string().min(1).max(50).optional(),
  full_name: z.string().min(1).max(255),
  mrn: z.string().min(1).max(50).optional(),
});

export const UpdatePatientSchema = z.object({
  hospital_id: UuidSchema.optional(),
  bangsal_id: UuidSchema.optional(),
  room_number: z.string().min(1).max(50).optional().nullable(),
  full_name: z.string().min(1).max(255).optional(),
  mrn: z.string().min(1).max(50).optional().nullable(),
});

// Plan Item schema
export const PlanItemSchema = z.object({
  drug: z.string().min(1),
  route: z.string().optional(),
  dose: z.string().optional(),
  freq: z.string().optional(),
  days: z.number().int().positive().optional(),
  start_date: z.string().date(),
  end_date: z.string().date(),
  status: z.enum(['active', 'done']),
});

export const CreatePlanItemSchema = z.object({
  drug: z.string().min(1),
  route: z.string().optional(),
  dose: z.string().optional(),
  freq: z.string().optional(),
  days: z.number().int().positive().optional(),
  start_date: z.string().date().optional(), // Will default to today if not provided
});

// SOAP schema
export const SoapSchema = z.object({
  id: UuidSchema,
  patient_id: UuidSchema,
  s: z.string().nullable(),
  o: z.string().nullable(),
  a: z.string().nullable(),
  p: z.array(PlanItemSchema),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export const CreateSoapSchema = z.object({
  patient_id: UuidSchema,
  s: z.string().optional(),
  o: z.string().optional(),
  a: z.string().optional(),
  p: z.array(CreatePlanItemSchema).default([]),
});

export const UpdateSoapSchema = z.object({
  s: z.string().optional(),
  o: z.string().optional(),
  a: z.string().optional(),
});

// API Response schemas
export const ApiResponseSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  requestId: z.string().optional(),
});

// Type exports
export type Hospital = z.infer<typeof HospitalSchema>;
export type CreateHospital = z.infer<typeof CreateHospitalSchema>;
export type UpdateHospital = z.infer<typeof UpdateHospitalSchema>;

export type Bangsal = z.infer<typeof BangsalSchema>;
export type CreateBangsal = z.infer<typeof CreateBangsalSchema>;
export type UpdateBangsal = z.infer<typeof UpdateBangsalSchema>;

export type Patient = z.infer<typeof PatientSchema>;
export type CreatePatient = z.infer<typeof CreatePatientSchema>;
export type UpdatePatient = z.infer<typeof UpdatePatientSchema>;

export type PlanItem = z.infer<typeof PlanItemSchema>;
export type CreatePlanItem = z.infer<typeof CreatePlanItemSchema>;

export type Soap = z.infer<typeof SoapSchema>;
export type CreateSoap = z.infer<typeof CreateSoapSchema>;
export type UpdateSoap = z.infer<typeof UpdateSoapSchema>;

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Helper functions
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createSuccessResponse<T>(data: T, requestId?: string): ApiResponse {
  return {
    ok: true,
    data,
    requestId,
  };
}

export function createErrorResponse(error: string, requestId?: string): ApiResponse {
  return {
    ok: false,
    error,
    requestId,
  };
}

// Error mapping helper
export function mapSupabaseError(error: unknown, requestId?: string): ApiResponse {
  console.error('Supabase error:', error);
  
  const err = error as Record<string, unknown>;
  
  // RLS violations
  if (err?.code === '42501' || (typeof err?.message === 'string' && err.message.includes('row-level security'))) {
    return createErrorResponse('Access denied', requestId);
  }
  
  // Not found (typically from RLS or genuine not found)
  if (err?.code === 'PGRST116' || err?.status === 404) {
    return createErrorResponse('Resource not found', requestId);
  }
  
  // Validation errors
  if (err?.code === '23514' || err?.code === '23502') {
    return createErrorResponse('Validation error', requestId);
  }
  
  // Unique constraint violations
  if (err?.code === '23505') {
    return createErrorResponse('Resource already exists', requestId);
  }
  
  // Foreign key violations
  if (err?.code === '23503') {
    return createErrorResponse('Invalid reference', requestId);
  }
  
  // Generic error
  return createErrorResponse((typeof err?.message === 'string' ? err.message : 'Internal server error'), requestId);
}

// Auth helper to get user session from request
export async function getUserFromRequest(request: globalThis.Request) {
  // Development mode: bypass auth and return test user
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (isDevelopment) {
    // Return hardcoded test user for development
    return {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test-owner@example.com'
    };
  }

  const supabase = createServerClient();
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}