import { json, error as svelteError } from '@sveltejs/kit';
import { z } from 'zod';
import { detectIntent } from '$lib/nl.js';
import { splitActiveDone, getTodayInJakarta } from '$lib/plan.js';
import { generateRequestId, createSuccessResponse, createErrorResponse, getUserFromRequest } from '$lib/db.js';
import type { RequestHandler } from './$types.js';

// Request schema validation
const NLRequestSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty')
});

// Response type definitions
interface AskDiagnosisResult {
  patient_id: string;
  name: string;
  a: string;
}

interface AddMedicationResult {
  patient_id: string;
  name: string;
  plan_active: Array<{
    drug: string;
    route?: string | null;
    dose?: string | null;
    freq?: string | null;
    days?: number | null;
    start_date: string;
    end_date: string;
    status: string;
  }>;
  plan_done: Array<{
    drug: string;
    route?: string | null;
    dose?: string | null;
    freq?: string | null;
    days?: number | null;
    start_date: string;
    end_date: string;
    status: string;
  }>;
}

interface DisambiguationCandidate {
  id: string;
  name: string;
  hospital: string;
  bangsal: string;
  room?: string | null;
}

interface DisambiguationResult {
  candidates: DisambiguationCandidate[];
}

interface ErrorResult {
  code: string;
  message: string;
}

type NLResponse = 
  | { type: 'ask_diagnosis'; result: AskDiagnosisResult }
  | { type: 'add_medication'; result: AddMedicationResult }
  | { type: 'disambiguation'; result: DisambiguationResult }
  | { type: 'error'; result: ErrorResult };

// MCP tool simulation functions (these would call actual MCP tools in production)
async function callMCPTool(toolName: string, args: any): Promise<any> {
  // In a real implementation, this would make calls to the MCP server
  // For now, we'll simulate the responses based on the MCP server implementation
  
  // This is a placeholder - in production, you would use the actual MCP client
  // to call the soap-tools.mjs server
  
  switch (toolName) {
    case 'patient_searchByName':
      // Simulate patient search - in production this would call the MCP tool
      return simulatePatientSearch(args.name);
      
    case 'soap_getLatest':
      // Simulate getting latest SOAP - in production this would call the MCP tool
      return simulateGetLatestSOAP(args.patient_id, args.select);
      
    case 'soap_appendPlanItem':
      // Simulate appending plan item - in production this would call the MCP tool
      return simulateAppendPlanItem(args.patient_id, args.item);
      
    case 'soap_recomputePlanStatuses':
      // Simulate recomputing plan statuses - in production this would call the MCP tool
      return simulateRecomputePlanStatuses(args.patient_id);
      
    default:
      throw new Error(`Unknown MCP tool: ${toolName}`);
  }
}

// Simulation functions (replace with actual MCP calls in production)
async function simulatePatientSearch(name: string) {
  // This would be replaced with actual MCP tool call
  // For demonstration, return some sample data
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('bintang')) {
    if (lowerName === 'bintang') {
      // Multiple matches for disambiguation
      return [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Bintang Putra',
          hospital: 'RSUD Central',
          bangsal: 'Anak',
          room: '101'
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Bintang Sari',
          hospital: 'RSU Harapan',
          bangsal: 'Dewasa',
          room: '202'
        }
      ];
    } else if (lowerName.includes('putra')) {
      // Single match
      return [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Bintang Putra',
          hospital: 'RSUD Central',
          bangsal: 'Anak',
          room: '101'
        }
      ];
    }
  }
  
  if (lowerName.includes('nisa')) {
    return [
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Nisa Amelia',
        hospital: 'RSU Husada',
        bangsal: 'Dewasa',
        room: '301'
      }
    ];
  }
  
  return [];
}

async function simulateGetLatestSOAP(patientId: string, select?: string[]) {
  // This would be replaced with actual MCP tool call
  const selectFields = select || ['a', 'p'];
  const result: any = {};
  
  if (selectFields.includes('a')) {
    result.a = 'Demam berdarah dengue (A91)';
  }
  
  if (selectFields.includes('p')) {
    result.p = [
      {
        drug: 'Paracetamol',
        route: 'PO',
        dose: '500mg',
        freq: 'q6h',
        days: 3,
        start_date: '2025-01-15',
        end_date: '2025-01-17',
        status: 'active'
      }
    ];
  }
  
  return result;
}

async function simulateAppendPlanItem(patientId: string, item: any) {
  // This would be replaced with actual MCP tool call
  const startDate = item.start_date || getTodayInJakarta();
  const endDate = item.days ? 
    new Date(new Date(startDate).getTime() + (item.days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
    startDate;
  
  return {
    ok: true,
    soap_id: '44444444-4444-4444-4444-444444444444',
    added: {
      drug: item.drug,
      route: item.route || null,
      dose: item.dose || null,
      freq: item.freq || null,
      days: item.days || null,
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    }
  };
}

async function simulateRecomputePlanStatuses(patientId: string) {
  // This would be replaced with actual MCP tool call
  return {
    ok: true,
    counts: {
      active: 2,
      done: 1
    }
  };
}

export const POST: RequestHandler = async ({ request }) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // Validate user authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Authentication required', requestId), { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const { text } = NLRequestSchema.parse(body);
    
    console.log(`[${requestId}] NL request: "${text.substring(0, 50)}..."`);
    
    // Detect intent
    const intent = detectIntent(text);
    if (!intent) {
      return json({
        type: 'error',
        result: {
          code: 'INTENT_NOT_RECOGNIZED',
          message: 'Tidak dapat memahami perintah. Coba gunakan format seperti "Apa diagnosis Bintang?" atau "Pasien Bintang tambahkan obat Cefotaxime untuk 2 hari".'
        },
        requestId
      });
    }
    
    console.log(`[${requestId}] Detected intent: ${intent.kind} for patient: ${intent.name}`);
    
    try {
      // Search for patient
      const searchResults = await callMCPTool('patient_searchByName', { name: intent.name });
      
      // Handle disambiguation
      if (searchResults.length === 0) {
        return json({
          type: 'error',
          result: {
            code: 'NOT_FOUND',
            message: `Pasien dengan nama "${intent.name}" tidak ditemukan.`
          },
          requestId
        });
      }
      
      if (searchResults.length > 1) {
        // Return disambiguation options (max 5 candidates)
        const candidates = searchResults.slice(0, 5).map((patient: any) => ({
          id: patient.id,
          name: patient.name,
          hospital: patient.hospital,
          bangsal: patient.bangsal,
          room: patient.room
        }));
        
        return json({
          type: 'disambiguation',
          result: { candidates },
          requestId
        });
      }
      
      // Single patient found
      const patient = searchResults[0];
      console.log(`[${requestId}] Found patient: ${patient.name} (${patient.id})`);
      
      // Handle different intents
      if (intent.kind === 'ask_diagnosis') {
        // Get latest SOAP with assessment only
        const soapData = await callMCPTool('soap_getLatest', {
          patient_id: patient.id,
          select: ['a']
        });
        
        const result: AskDiagnosisResult = {
          patient_id: patient.id,
          name: patient.name,
          a: soapData.a || 'Belum ada diagnosis'
        };
        
        console.log(`[${requestId}] Diagnosis query completed in ${Date.now() - startTime}ms`);
        
        return json({
          type: 'ask_diagnosis',
          result,
          requestId
        });
        
      } else if (intent.kind === 'add_medication') {
        // Append plan item
        const appendResult = await callMCPTool('soap_appendPlanItem', {
          patient_id: patient.id,
          item: {
            drug: intent.item.drug,
            route: intent.item.route,
            dose: intent.item.dose,
            freq: intent.item.freq,
            days: intent.item.days,
            start_date: intent.item.start_date
          }
        });
        
        // Recompute plan statuses
        await callMCPTool('soap_recomputePlanStatuses', {
          patient_id: patient.id
        });
        
        // Get updated plan with both active and done items
        const soapData = await callMCPTool('soap_getLatest', {
          patient_id: patient.id,
          select: ['p']
        });
        
        // Split into active and done using the current date
        const today = getTodayInJakarta();
        const allItems = soapData.p || [];
        const { plan_active, plan_done } = splitActiveDone(allItems, today);
        
        const result: AddMedicationResult = {
          patient_id: patient.id,
          name: patient.name,
          plan_active,
          plan_done
        };
        
        console.log(`[${requestId}] Medication addition completed in ${Date.now() - startTime}ms`);
        
        return json({
          type: 'add_medication',
          result,
          requestId
        });
      }
      
    } catch (mcpError: any) {
      console.error(`[${requestId}] MCP tool error:`, mcpError);
      
      // Map common MCP errors to user-friendly messages
      let errorCode = 'MCP_TOOL_ERROR';
      let errorMessage = 'Terjadi kesalahan sistem';
      
      if (mcpError.message?.includes('not found') || mcpError.message?.includes('No SOAP records')) {
        errorCode = 'NOT_FOUND';
        errorMessage = 'Data pasien atau rekam medis tidak ditemukan';
      } else if (mcpError.message?.includes('validation') || mcpError.message?.includes('Invalid')) {
        errorCode = 'VALIDATION';
        errorMessage = 'Format data tidak valid';
      }
      
      return json({
        type: 'error',
        result: {
          code: errorCode,
          message: errorMessage
        },
        requestId
      }, { status: 500 });
    }
    
  } catch (validationError: any) {
    console.error(`[${requestId}] Validation error:`, validationError);
    
    return json({
      type: 'error',
      result: {
        code: 'VALIDATION',
        message: 'Format permintaan tidak valid'
      },
      requestId
    }, { status: 400 });
    
  } catch (systemError: any) {
    console.error(`[${requestId}] System error:`, systemError);
    
    return json({
      type: 'error',
      result: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan sistem'
      },
      requestId
    }, { status: 500 });
  }
};

// GET method is not supported
export const GET: RequestHandler = async () => {
  return json({
    type: 'error',
    result: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is supported'
    }
  }, { status: 405 });
};