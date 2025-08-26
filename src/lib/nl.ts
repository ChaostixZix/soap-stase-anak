import { createServerClient } from './db.js';
import type { CreatePlanItem, PlanItem } from './db.js';
import { addPlanItems, generatePlanSummary } from './plan.js';

/**
 * Intent detection for Indonesian natural language commands
 */
export type Intent = {
  type: 'ask_diagnosis' | 'add_medication';
  patientName: string;
  medication?: {
    drug: string;
    route?: string;
    dose?: string;
    freq?: string;
    days?: number;
    start_date?: string;
  };
};

/**
 * Patient search result for disambiguation
 */
export type PatientCandidate = {
  id: string;
  name: string;
  hospital: string;
  bangsal: string;
  room: string;
};

/**
 * Normalize Indonesian text for processing
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/[^\w\s]/g, ' ') // remove punctuation
    .trim();
}

/**
 * Detect intent from normalized Indonesian text
 */
export function detectIntent(normalizedText: string): Intent | null {
  // Patterns for diagnosis queries
  const diagnosisPatterns = [
    /(?:apa|what)\s+(?:diagnosis|dx|diagnosisnya)\s+(.+)/,
    /diagnosis\s+(.+)/,
    /dx\s+(.+)/,
    /(.+)\s+diagnosis/,
  ];

  // Patterns for medication addition
  const medicationPatterns = [
    /(?:pasien\s+)?(.+?)\s+(?:tambah|tambahkan|add)\s+(?:obat\s+)?(.+?)\s+(?:untuk\s+)?(\d+)\s*hari/,
    /(?:tambah|tambahkan|add)\s+(?:obat\s+)?(.+?)\s+(?:untuk\s+)?(.+?)\s+(\d+)\s*hari/,
    /(?:pasien\s+)?(.+?)\s+(?:beri|berikan|give)\s+(.+?)\s+(?:untuk\s+)?(\d+)\s*hari/,
  ];

  // Check diagnosis patterns
  for (const pattern of diagnosisPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      return {
        type: 'ask_diagnosis',
        patientName: match[1].trim(),
      };
    }
  }

  // Check medication patterns
  for (const pattern of medicationPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const [, patientOrMed, medOrPatient, days] = match;
      
      // Try to determine which is patient name and which is medication
      let patientName: string;
      let medicationText: string;
      
      // If first pattern matched, patient comes first
      if (pattern === medicationPatterns[0] || pattern === medicationPatterns[2]) {
        patientName = patientOrMed.trim();
        medicationText = medOrPatient.trim();
      } else {
        // For second pattern, medication comes first
        patientName = medOrPatient.trim();
        medicationText = patientOrMed.trim();
      }

      // Parse medication details
      const medication = parseMedicationText(medicationText);
      medication.days = parseInt(days);

      return {
        type: 'add_medication',
        patientName,
        medication,
      };
    }
  }

  return null;
}

/**
 * Parse medication text to extract components
 */
function parseMedicationText(medText: string): CreatePlanItem {
  const normalized = medText.toLowerCase();
  
  // Common route abbreviations
  const routes: Record<string, string> = {
    'iv': 'IV',
    'po': 'PO', 
    'im': 'IM',
    'sc': 'SC',
    'inj': 'IV',
    'injeksi': 'IV',
    'inf': 'IV',
    'infus': 'IV',
    'oral': 'PO',
    'per oral': 'PO',
  };

  // Common frequency patterns
  const frequencies: Record<string, string> = {
    'q6h': 'q6h',
    'q8h': 'q8h', 
    'q12h': 'q12h',
    'qid': 'qid',
    'tid': 'tid',
    'bid': 'bid',
    'od': 'od',
    'once daily': 'od',
    'twice daily': 'bid',
    '2x daily': 'bid',
    '3x daily': 'tid',
    '4x daily': 'qid',
  };

  let drug = medText;
  let route: string | undefined;
  let dose: string | undefined;
  let freq: string | undefined;

  // Extract route
  for (const [pattern, routeValue] of Object.entries(routes)) {
    if (normalized.includes(pattern)) {
      route = routeValue;
      drug = drug.replace(new RegExp(pattern, 'gi'), '').trim();
      break;
    }
  }

  // Extract frequency  
  for (const [pattern, freqValue] of Object.entries(frequencies)) {
    if (normalized.includes(pattern)) {
      freq = freqValue;
      drug = drug.replace(new RegExp(pattern, 'gi'), '').trim();
      break;
    }
  }

  // Extract dose (look for patterns like "1g", "500mg", "1 gram")
  const doseMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(mg|g|gram|ml|unit|u)/);
  if (doseMatch) {
    dose = doseMatch[0];
    drug = drug.replace(new RegExp(doseMatch[0], 'gi'), '').trim();
  }

  // Clean up drug name
  drug = drug.replace(/\s+/g, ' ').trim();

  return {
    drug,
    route,
    dose,
    freq,
  };
}

/**
 * Search for patients by name
 */
export async function searchPatientsByName(name: string, userId: string): Promise<PatientCandidate[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('patient')
    .select(`
      id,
      full_name,
      room_number,
      hospital:hospital(name),
      bangsal:bangsal(name)
    `)
    .eq('owner_id', userId)
    .ilike('full_name', `%${name}%`)
    .limit(5);

  if (error) {
    console.error('Error searching patients:', error);
    return [];
  }

  return (data || []).map((patient: {
    id: string;
    full_name: string;
    room_number: string | null;
    hospital?: { name: string } | null;
    bangsal?: { name: string } | null;
  }) => ({
    id: patient.id,
    name: patient.full_name,
    hospital: patient.hospital?.name || 'Unknown Hospital',
    bangsal: patient.bangsal?.name || 'Unknown Bangsal',
    room: patient.room_number || 'No room',
  }));
}

/**
 * Get latest SOAP for patient
 */
export async function getLatestSoap(patientId: string, userId: string) {
  const supabase = createServerClient();
  
  const { data: patient } = await supabase
    .from('patient')
    .select('id')
    .eq('id', patientId)
    .eq('owner_id', userId)
    .single();

  if (!patient) {
    throw new Error('Patient not found or access denied');
  }

  const { data, error } = await supabase
    .from('soap')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || null;
}

/**
 * Add medication to patient's plan
 */
export async function addMedicationToPlan(
  patientId: string, 
  userId: string, 
  medication: CreatePlanItem
): Promise<{ soap: { id: string; p: PlanItem[] }; planSummary: string }> {
  const supabase = createServerClient();
  
  // Verify patient access
  const { data: patient } = await supabase
    .from('patient')
    .select('id')
    .eq('id', patientId)
    .eq('owner_id', userId)
    .single();

  if (!patient) {
    throw new Error('Patient not found or access denied');
  }

  // Get latest SOAP or create new one
  let soap = await getLatestSoap(patientId, userId);
  
  if (!soap) {
    // Create new SOAP
    const { data: newSoap, error: createError } = await supabase
      .from('soap')
      .insert({
        patient_id: patientId,
        s: null,
        o: null, 
        a: null,
        p: [],
      })
      .select()
      .single();

    if (createError) throw createError;
    soap = newSoap;
  }

  // Add medication to existing plan
  const currentPlan: PlanItem[] = soap.p || [];
  const updatedPlan = addPlanItems(currentPlan, [medication]);

  // Update SOAP with new plan
  const { data: updatedSoap, error: updateError } = await supabase
    .from('soap')
    .update({
      p: updatedPlan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', soap.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    soap: updatedSoap,
    planSummary: generatePlanSummary(updatedPlan),
  };
}

/**
 * Process natural language request
 */
export async function processNLRequest(text: string, userId: string) {
  const normalized = normalizeText(text);
  const intent = detectIntent(normalized);
  
  if (!intent) {
    return {
      success: false,
      error: 'Maaf, saya tidak memahami perintah tersebut. Coba "diagnosis [nama pasien]" atau "tambah obat [obat] untuk [pasien] [jumlah] hari"',
    };
  }

  // Search for patients
  const candidates = await searchPatientsByName(intent.patientName, userId);
  
  if (candidates.length === 0) {
    return {
      success: false,
      error: `Pasien "${intent.patientName}" tidak ditemukan.`,
    };
  }

  if (candidates.length > 1) {
    return {
      success: false,
      needsDisambiguation: true,
      candidates,
      originalIntent: intent,
    };
  }

  // Single patient found, proceed with action
  const patient = candidates[0];

  if (intent.type === 'ask_diagnosis') {
    const soap = await getLatestSoap(patient.id, userId);
    if (!soap || !soap.a) {
      return {
        success: true,
        result: `Belum ada diagnosis untuk pasien ${patient.name}.`,
      };
    }
    
    return {
      success: true,
      result: `Diagnosis ${patient.name}:\n${soap.a}`,
    };
  }

  if (intent.type === 'add_medication' && intent.medication) {
    const { planSummary } = await addMedicationToPlan(patient.id, userId, intent.medication);
    return {
      success: true,
      result: `Obat ditambahkan untuk ${patient.name}:\n\n${planSummary}`,
    };
  }

  return {
    success: false,
    error: 'Terjadi kesalahan dalam memproses perintah.',
  };
}