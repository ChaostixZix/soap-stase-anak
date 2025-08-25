#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { format, parseISO, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Environment validation
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`Missing required environment variable: ${env}`);
    process.exit(1);
  }
}

// Timezone configuration - default to Asia/Jakarta
const TIMEZONE = process.env.TZ || 'Asia/Jakarta';

// Supabase client with service role key (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting map - tool name -> { userId -> { count, windowStart } }
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 50; // 50 requests per minute per tool per user

// Structured logging
function logToolCall(toolName, userId, inputs, duration, resultSize, error = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    tool: toolName,
    userId,
    inputs: redactPHI(inputs),
    duration,
    resultSize,
    timezone: TIMEZONE
  };
  
  if (error) {
    logEntry.error = error.message;
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// PHI redaction for logging
function redactPHI(obj) {
  const redacted = { ...obj };
  // Redact potentially sensitive fields
  if (redacted.name && redacted.name.length > 2) {
    redacted.name = redacted.name.slice(0, 2) + '***';
  }
  if (redacted.patient_id) {
    redacted.patient_id = '***-redacted-***';
  }
  return redacted;
}

// Rate limiting check
function checkRateLimit(toolName, userId) {
  if (!rateLimits.has(toolName)) {
    rateLimits.set(toolName, new Map());
  }
  
  const toolLimits = rateLimits.get(toolName);
  const now = Date.now();
  
  if (!toolLimits.has(userId)) {
    toolLimits.set(userId, { count: 1, windowStart: now });
    return true;
  }
  
  const userLimit = toolLimits.get(userId);
  
  // Reset window if expired
  if (now - userLimit.windowStart > RATE_LIMIT_WINDOW) {
    userLimit.count = 1;
    userLimit.windowStart = now;
    return true;
  }
  
  // Check if limit exceeded
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Get current date in Jakarta timezone
function getCurrentDate() {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
}

// Zod schemas for input validation
const SearchByNameInput = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters')
});

const GetLatestSOAPInput = z.object({
  patient_id: z.string().uuid('Invalid patient ID format'),
  select: z.array(z.enum(['a', 'p', 'summary'])).optional()
});

const PlanItemSchema = z.object({
  drug: z.string().min(1, 'Drug name is required'),
  route: z.string().optional(),
  dose: z.string().optional(),
  freq: z.string().optional(),
  days: z.number().int().min(1).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, use YYYY-MM-DD').optional()
});

const AppendPlanItemInput = z.object({
  patient_id: z.string().uuid('Invalid patient ID format'),
  item: PlanItemSchema
});

const RecomputePlanStatusesInput = z.object({
  patient_id: z.string().uuid('Invalid patient ID format')
});

// Output schemas for validation
const PatientSearchResult = z.object({
  id: z.string().uuid(),
  name: z.string(),
  hospital: z.string(),
  bangsal: z.string(),
  room: z.string().nullable()
});

const PlanItemResult = z.object({
  drug: z.string(),
  route: z.string().nullable(),
  dose: z.string().nullable(),
  freq: z.string().nullable(),
  days: z.number().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.enum(['active', 'done'])
});

const SOAPResult = z.object({
  a: z.string().optional(),
  p: z.array(PlanItemResult).optional(),
  summary: z.string().optional()
});

const AppendPlanItemResult = z.object({
  ok: z.literal(true),
  soap_id: z.string().uuid(),
  added: PlanItemResult
});

const RecomputePlanStatusesResult = z.object({
  ok: z.literal(true),
  counts: z.object({
    active: z.number(),
    done: z.number()
  })
});

// MCP Server setup
const server = new Server(
  {
    name: 'soap-tools',
    version: '1.0.0',
    description: 'SOAP Manager tools for patient search and SOAP operations'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'patient_searchByName',
        description: 'Fuzzy search for patients by name, returns up to 5 matches with basic info',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Patient name to search for (minimum 2 characters)',
              minLength: 2
            }
          },
          required: ['name']
        }
      },
      {
        name: 'soap_getLatest',
        description: 'Get latest SOAP record for a patient with optional field selection',
        inputSchema: {
          type: 'object',
          properties: {
            patient_id: {
              type: 'string',
              description: 'Patient UUID',
              format: 'uuid'
            },
            select: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['a', 'p', 'summary']
              },
              description: 'Fields to include: a=assessment, p=plan items, summary=Indonesian summary'
            }
          },
          required: ['patient_id']
        }
      },
      {
        name: 'soap_appendPlanItem',
        description: 'Add a new plan item to the latest SOAP record',
        inputSchema: {
          type: 'object',
          properties: {
            patient_id: {
              type: 'string',
              description: 'Patient UUID',
              format: 'uuid'
            },
            item: {
              type: 'object',
              properties: {
                drug: {
                  type: 'string',
                  description: 'Drug name'
                },
                route: {
                  type: 'string',
                  description: 'Route of administration (optional)'
                },
                dose: {
                  type: 'string',
                  description: 'Dosage (optional)'
                },
                freq: {
                  type: 'string',
                  description: 'Frequency (optional)'
                },
                days: {
                  type: 'integer',
                  description: 'Number of days (optional)',
                  minimum: 1
                },
                start_date: {
                  type: 'string',
                  description: 'Start date in YYYY-MM-DD format (optional, defaults to today)',
                  pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                }
              },
              required: ['drug']
            }
          },
          required: ['patient_id', 'item']
        }
      },
      {
        name: 'soap_recomputePlanStatuses',
        description: 'Recompute status of all plan items for a patient based on current date',
        inputSchema: {
          type: 'object',
          properties: {
            patient_id: {
              type: 'string',
              description: 'Patient UUID',
              format: 'uuid'
            }
          },
          required: ['patient_id']
        }
      }
    ]
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();
  let result;
  let error = null;
  
  // For now, use a dummy user ID - this should be extracted from auth context
  const userId = 'demo-user';
  
  try {
    // Rate limiting check
    if (!checkRateLimit(name, userId)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    switch (name) {
      case 'patient_searchByName':
        result = await searchPatientsByName(args);
        break;
      case 'soap_getLatest':
        result = await getLatestSOAP(args);
        break;
      case 'soap_appendPlanItem':
        result = await appendPlanItem(args);
        break;
      case 'soap_recomputePlanStatuses':
        result = await recomputePlanStatuses(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    const duration = Date.now() - startTime;
    const resultSize = JSON.stringify(result).length;
    logToolCall(name, userId, args, duration, resultSize);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
    
  } catch (err) {
    error = err;
    const duration = Date.now() - startTime;
    logToolCall(name, userId, args, duration, 0, error);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: err.message,
            code: err.code || 'TOOL_ERROR'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Tool implementation functions
async function searchPatientsByName(args) {
  const input = SearchByNameInput.parse(args);
  
  // Fuzzy search with pg_trgm similarity
  const { data: patients, error } = await supabase
    .from('patient')
    .select(`
      id,
      full_name,
      room_number,
      hospital:hospital_id (name),
      bangsal:bangsal_id (name)
    `)
    .ilike('full_name', `%${input.name}%`)
    .order('full_name')
    .limit(5);
    
  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  const results = patients.map(patient => ({
    id: patient.id,
    name: patient.full_name,
    hospital: patient.hospital?.name || 'Unknown',
    bangsal: patient.bangsal?.name || 'Unknown',
    room: patient.room_number || null
  }));
  
  // Validate output
  return z.array(PatientSearchResult).max(5).parse(results);
}

async function getLatestSOAP(args) {
  const input = GetLatestSOAPInput.parse(args);
  const select = input.select || ['a', 'p'];
  
  // Get latest SOAP record
  const { data: soaps, error } = await supabase
    .from('soap')
    .select('*')
    .eq('patient_id', input.patient_id)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  if (!soaps || soaps.length === 0) {
    throw new Error('No SOAP records found for this patient');
  }
  
  const soap = soaps[0];
  const result = {};
  
  if (select.includes('a')) {
    result.a = soap.a || '';
  }
  
  if (select.includes('p')) {
    const planItems = soap.p || [];
    const today = getCurrentDate();
    
    // Only return active items by default, or all if specifically requested
    const filteredItems = planItems.map(item => ({
      drug: item.drug,
      route: item.route || null,
      dose: item.dose || null,
      freq: item.freq || null,
      days: item.days || null,
      start_date: item.start_date,
      end_date: item.end_date,
      status: item.status
    }));
    
    result.p = filteredItems.filter(item => item.status === 'active');
  }
  
  if (select.includes('summary')) {
    const planItems = soap.p || [];
    const activeCount = planItems.filter(item => item.status === 'active').length;
    const doneCount = planItems.filter(item => item.status === 'done').length;
    
    result.summary = `Diagnosis: ${soap.a || 'Belum ada'}. Plan aktif: ${activeCount}, selesai: ${doneCount}.`;
  }
  
  return SOAPResult.parse(result);
}

async function appendPlanItem(args) {
  const input = AppendPlanItemInput.parse(args);
  const today = getCurrentDate();
  
  // Compute dates
  const startDate = input.item.start_date || today;
  const days = input.item.days || 1;
  const endDate = format(addDays(parseISO(startDate), days - 1), 'yyyy-MM-dd');
  
  // Determine status based on end date
  const status = isBefore(parseISO(endDate), parseISO(today)) ? 'done' : 'active';
  
  const newPlanItem = {
    drug: input.item.drug,
    route: input.item.route || null,
    dose: input.item.dose || null,
    freq: input.item.freq || null,
    days: input.item.days || null,
    start_date: startDate,
    end_date: endDate,
    status
  };
  
  // Get or create latest SOAP
  let { data: soaps, error } = await supabase
    .from('soap')
    .select('*')
    .eq('patient_id', input.patient_id)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  let soapId;
  let currentPlanItems = [];
  
  if (!soaps || soaps.length === 0) {
    // Create new SOAP record
    const { data: newSOAP, error: createError } = await supabase
      .from('soap')
      .insert({
        patient_id: input.patient_id,
        p: [newPlanItem]
      })
      .select('id')
      .single();
      
    if (createError) {
      throw new Error(`Failed to create SOAP: ${createError.message}`);
    }
    
    soapId = newSOAP.id;
  } else {
    // Update existing SOAP
    const existingSOAP = soaps[0];
    currentPlanItems = existingSOAP.p || [];
    currentPlanItems.push(newPlanItem);
    
    const { error: updateError } = await supabase
      .from('soap')
      .update({ 
        p: currentPlanItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSOAP.id);
      
    if (updateError) {
      throw new Error(`Failed to update SOAP: ${updateError.message}`);
    }
    
    soapId = existingSOAP.id;
  }
  
  const result = {
    ok: true,
    soap_id: soapId,
    added: newPlanItem
  };
  
  return AppendPlanItemResult.parse(result);
}

async function recomputePlanStatuses(args) {
  const input = RecomputePlanStatusesInput.parse(args);
  const today = getCurrentDate();
  
  // Get latest SOAP record
  const { data: soaps, error } = await supabase
    .from('soap')
    .select('*')
    .eq('patient_id', input.patient_id)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  if (!soaps || soaps.length === 0) {
    throw new Error('No SOAP records found for this patient');
  }
  
  const soap = soaps[0];
  const planItems = soap.p || [];
  
  // Recompute statuses
  let activeCount = 0;
  let doneCount = 0;
  
  const updatedPlanItems = planItems.map(item => {
    const endDate = parseISO(item.end_date);
    const todayDate = parseISO(today);
    
    const newStatus = isBefore(endDate, todayDate) ? 'done' : 'active';
    
    if (newStatus === 'active') {
      activeCount++;
    } else {
      doneCount++;
    }
    
    return {
      ...item,
      status: newStatus
    };
  });
  
  // Update SOAP record
  const { error: updateError } = await supabase
    .from('soap')
    .update({ 
      p: updatedPlanItems,
      updated_at: new Date().toISOString()
    })
    .eq('id', soap.id);
    
  if (updateError) {
    throw new Error(`Failed to update SOAP: ${updateError.message}`);
  }
  
  const result = {
    ok: true,
    counts: {
      active: activeCount,
      done: doneCount
    }
  };
  
  return RecomputePlanStatusesResult.parse(result);
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Keep the process alive
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});