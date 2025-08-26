import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  getUserFromRequest
} from '$lib/db.js';
import { z } from 'zod';

// Request schema for NL commands
const NLRequestSchema = z.object({
  command: z.string().min(1),
  patient_id: z.string().uuid().optional()
});

// POST /api/nl - Process natural language commands
export const POST: RequestHandler = async ({ request }) => {
  const requestId = generateRequestId();
  
  try {
    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = NLRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return json(createErrorResponse('Invalid request data', requestId), { status: 400 });
    }

    const { command, patient_id } = validationResult.data;

    // For now, implement a basic mock response system
    // In production, this would orchestrate calls to the MCP server with Gemini API
    let response = await processNLCommand(command, patient_id, user.id);

    return json(createSuccessResponse({ 
      response,
      command: command,
      processed_at: new Date().toISOString()
    }, requestId));

  } catch (error) {
    console.error('NL API error:', error);
    return json(createErrorResponse('Internal server error', requestId), { status: 500 });
  }
};

// Mock NL command processing
// TODO: Replace with actual MCP server orchestration using Gemini API
async function processNLCommand(command: string, patientId: string | undefined, userId: string): Promise<string> {
  const lowerCommand = command.toLowerCase();

  // Diagnosis queries
  if (lowerCommand.includes('diagnosis') || lowerCommand.includes('apa diagnosis')) {
    if (!patientId) {
      return 'Please specify a patient ID or use this command from a patient\'s SOAP page.';
    }
    
    // Mock diagnosis response
    return `Mock Diagnosis Response:
For patient ${patientId}:
- Primary: Acute bronchitis
- Secondary: Mild dehydration
- Status: Under observation

(This is a mock response. In production, this would query the actual patient's Assessment field from the latest SOAP entry.)`;
  }

  // Add medication commands
  if (lowerCommand.includes('tambah') && lowerCommand.includes('obat')) {
    if (!patientId) {
      return 'Please specify a patient ID or use this command from a patient\'s SOAP page.';
    }

    // Mock medication addition
    return `Mock Medication Addition:
Added medication for patient ${patientId}:
- Drug: Extracted from command
- Route: IV (assumed)
- Frequency: As parsed
- Duration: As specified

Plan Aktif:
- Mock Cefotaxime 1g IV q8h (3 hari, sampai 29 Aug)

━━━━ Plan Selesai
- Mock Paracetamol 500mg PO bid (2 hari, selesai 27 Aug)

(This is a mock response. In production, this would parse the medication details, add them to the SOAP plan, and recompute statuses.)`;
  }

  // General medication queries
  if (lowerCommand.includes('obat') || lowerCommand.includes('medication')) {
    return `Mock Medication Query Response:
Current medications for this patient include common pediatric treatments.

(This is a mock response. In production, this would show current active medications from the patient's plan.)`;
  }

  // Default response for unrecognized commands
  return `Natural Language Command Processing (Mock Mode):
Received: "${command}"

Supported commands:
- "Apa diagnosis [pasien]?" - Get patient diagnosis
- "Tambahkan obat [drug] [dose] [route] untuk [days] hari" - Add medication
- "Obat apa yang sedang diberikan?" - List current medications

Note: This is currently in mock mode. In production, this endpoint would:
1. Send your command to the Gemini API with MCP tool definitions
2. Let the AI determine the appropriate tools to call
3. Execute the selected tools on the MCP server
4. Return structured results

Patient ID: ${patientId || 'Not specified'}
User ID: ${userId}`;
}