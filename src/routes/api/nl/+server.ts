import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { processNLRequest } from '$lib/nl.js';
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId, 
  getUserFromRequest 
} from '$lib/db.js';

// Request schema
const NLRequestSchema = z.object({
  text: z.string().min(1).max(1000),
  context: z.object({
    patientId: z.string().uuid().optional(),
  }).optional(),
});

export const POST: RequestHandler = async ({ request }) => {
  const requestId = generateRequestId();
  
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return json(createErrorResponse('Invalid JSON', requestId), { status: 400 });
    }

    const validation = NLRequestSchema.safeParse(body);
    if (!validation.success) {
      return json(
        createErrorResponse(
          `Validation error: ${validation.error.issues.map(i => i.message).join(', ')}`,
          requestId
        ), 
        { status: 400 }
      );
    }

    const { text, context } = validation.data;

    // Process natural language request
    const result = await processNLRequest(text, user.id);

    return json(createSuccessResponse({
      ...result,
      context,
      processedText: text,
    }, requestId));

  } catch (error) {
    console.error('NL API error:', error);
    return json(
      createErrorResponse('Internal server error', requestId), 
      { status: 500 }
    );
  }
};

// Handle specific patient disambiguation
export const PUT: RequestHandler = async ({ request }) => {
  const requestId = generateRequestId();
  
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return json(createErrorResponse('Unauthorized', requestId), { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return json(createErrorResponse('Invalid JSON', requestId), { status: 400 });
    }

    const validation = z.object({
      patientId: z.string().uuid(),
      originalIntent: z.object({
        type: z.enum(['ask_diagnosis', 'add_medication']),
        patientName: z.string(),
        medication: z.object({
          drug: z.string(),
          route: z.string().optional(),
          dose: z.string().optional(),
          freq: z.string().optional(),
          days: z.number().optional(),
          start_date: z.string().optional(),
        }).optional(),
      }),
    }).safeParse(body);

    if (!validation.success) {
      return json(
        createErrorResponse(
          `Validation error: ${validation.error.issues.map(i => i.message).join(', ')}`,
          requestId
        ), 
        { status: 400 }
      );
    }

    const { patientId, originalIntent } = validation.data;

    // Process the intent with the specific patient
    if (originalIntent.type === 'ask_diagnosis') {
      const { getLatestSoap } = await import('$lib/nl.js');
      const soap = await getLatestSoap(patientId, user.id);
      
      if (!soap || !soap.a) {
        return json(createSuccessResponse({
          success: true,
          result: `Belum ada diagnosis untuk pasien ini.`,
        }, requestId));
      }
      
      return json(createSuccessResponse({
        success: true,
        result: `Diagnosis:\n${soap.a}`,
      }, requestId));
      
    } else if (originalIntent.type === 'add_medication' && originalIntent.medication) {
      const { addMedicationToPlan } = await import('$lib/nl.js');
      const { planSummary } = await addMedicationToPlan(patientId, user.id, originalIntent.medication);
      
      return json(createSuccessResponse({
        success: true,
        result: `Obat berhasil ditambahkan:\n\n${planSummary}`,
      }, requestId));
    }

    return json(createErrorResponse('Invalid intent type', requestId), { status: 400 });

  } catch (error) {
    console.error('NL disambiguation error:', error);
    return json(
      createErrorResponse('Internal server error', requestId), 
      { status: 500 }
    );
  }
};