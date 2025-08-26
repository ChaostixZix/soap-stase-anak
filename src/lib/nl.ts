import { parseMedication, type ParsedMedication } from './plan.js';

export interface AskDiagnosisIntent {
  kind: 'ask_diagnosis';
  name: string;
}

export interface AddMedicationIntent {
  kind: 'add_medication';
  name: string;
  item: ParsedMedication;
}

export type Intent = AskDiagnosisIntent | AddMedicationIntent;

/**
 * Detect intent from Indonesian natural language text
 * Supports:
 * - Diagnosis queries: "Apa diagnosis Bintang?", "diagnosis pasien Nisa", "dx Bintang Putra"
 * - Medication additions: "Pasien Bintang tambahkan obat...", "Beri obat untuk Nisa...", "Tambahkan Cefotaxime untuk Bintang"
 */
export function detectIntent(text: string): Intent | null {
  const cleaned = text.trim().toLowerCase();
  
  // Diagnosis intent patterns
  const diagnosisPatterns = [
    // "Apa diagnosis [name]?"
    /(?:apa|what)\s+(?:diagnosis|diag|dx)\s+(.+?)[\?]?$/i,
    // "diagnosis [name]", "diag pasien [name]", "dx [name]"
    /^(?:diagnosis|diag|dx)(?:\s+pasien)?\s+(.+)$/i,
    // "[name] diagnosis", "pasien [name] diagnosis"
    /^(?:pasien\s+)?(.+?)\s+(?:diagnosis|diag|dx)$/i,
  ];

  for (const pattern of diagnosisPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common words that aren't names
      if (!['pasien', 'patient', 'nya', 'apa', 'what'].includes(name)) {
        return {
          kind: 'ask_diagnosis',
          name: capitalizeNames(name)
        };
      }
    }
  }

  // Medication intent patterns
  const medicationPatterns = [
    // "Pasien [name] tambahkan obat [medication]"
    /^(?:pasien\s+)?(.+?)\s+(?:tambahkan?|tambahin|add)\s+(?:obat\s+)?(.+)$/i,
    // "Tambahkan obat [medication] untuk [name]"
    /^(?:tambahkan?|tambahin|add|beri|berikan)\s+(?:obat\s+)?(.+?)\s+(?:untuk|to|kepada)\s+(?:pasien\s+)?(.+)$/i,
    // "[name] tambah obat [medication]"
    /^(?:pasien\s+)?(.+?)\s+(?:tambah|add)\s+(?:obat\s+)?(.+)$/i,
  ];

  for (const pattern of medicationPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      let name: string;
      let medicationText: string;
      
      // Different patterns have name and medication in different positions
      if (pattern.source.includes('untuk')) {
        // Pattern: "Tambahkan obat [medication] untuk [name]"
        medicationText = match[1].trim();
        name = match[2].trim();
      } else {
        // Patterns: "Pasien [name] tambahkan obat [medication]" or "[name] tambah obat [medication]"
        name = match[1].trim();
        medicationText = match[2].trim();
      }

      // Filter out common words that aren't names
      if (!['pasien', 'patient', 'obat', 'medication', 'untuk', 'kepada'].includes(name)) {
        const parsedMedication = parseMedication(medicationText);
        return {
          kind: 'add_medication',
          name: capitalizeNames(name),
          item: parsedMedication
        };
      }
    }
  }

  return null;
}

/**
 * Capitalize names properly (handle Indonesian names like "Bintang Putra")
 */
function capitalizeNames(name: string): string {
  return name
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract patient name from various Indonesian sentence structures
 */
export function extractPatientName(text: string): string | null {
  const intent = detectIntent(text);
  return intent?.name || null;
}

/**
 * Check if text contains medication-related keywords
 */
export function isMedicationIntent(text: string): boolean {
  const medicationKeywords = [
    'tambah', 'tambahkan', 'tambahin', 'add', 'beri', 'berikan',
    'obat', 'medication', 'injeksi', 'injection', 'infus', 'tablet'
  ];
  
  const cleaned = text.toLowerCase();
  return medicationKeywords.some(keyword => cleaned.includes(keyword));
}

/**
 * Check if text contains diagnosis-related keywords
 */
export function isDiagnosisIntent(text: string): boolean {
  const diagnosisKeywords = [
    'diagnosis', 'diag', 'dx', 'apa', 'what'
  ];
  
  const cleaned = text.toLowerCase();
  return diagnosisKeywords.some(keyword => cleaned.includes(keyword));
}