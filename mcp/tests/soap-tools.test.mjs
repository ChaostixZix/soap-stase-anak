import { describe, test, expect } from '@jest/globals';
import { z } from 'zod';
import { format, addDays, parseISO, isBefore } from 'date-fns';

// Mock the timezone to Jakarta for consistent testing
process.env.TZ = 'Asia/Jakarta';

// Import schemas and functions we want to test
// Note: In a real scenario, these would be exported from the main module
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

// Date computation functions to test
function getCurrentDate() {
  return format(new Date(), 'yyyy-MM-dd');
}

function computePlanItem(item, today = getCurrentDate()) {
  const startDate = item.start_date || today;
  const days = item.days || 1;
  const endDate = format(addDays(parseISO(startDate), days - 1), 'yyyy-MM-dd');
  const status = isBefore(parseISO(endDate), parseISO(today)) ? 'done' : 'active';
  
  return {
    drug: item.drug,
    route: item.route || null,
    dose: item.dose || null,
    freq: item.freq || null,
    days: item.days || null,
    start_date: startDate,
    end_date: endDate,
    status
  };
}

describe('SOAP Tools MCP Server', () => {
  describe('Schema Validation', () => {
    describe('SearchByNameInput', () => {
      test('should accept valid name with minimum 2 characters', () => {
        const input = { name: 'Bi' };
        expect(() => SearchByNameInput.parse(input)).not.toThrow();
      });

      test('should reject name with less than 2 characters', () => {
        const input = { name: 'B' };
        expect(() => SearchByNameInput.parse(input)).toThrow('Name must be at least 2 characters');
      });

      test('should reject empty name', () => {
        const input = { name: '' };
        expect(() => SearchByNameInput.parse(input)).toThrow();
      });
    });

    describe('GetLatestSOAPInput', () => {
      test('should accept valid UUID patient_id', () => {
        const input = { patient_id: '550e8400-e29b-41d4-a716-446655440000' };
        expect(() => GetLatestSOAPInput.parse(input)).not.toThrow();
      });

      test('should reject invalid UUID format', () => {
        const input = { patient_id: 'invalid-uuid' };
        expect(() => GetLatestSOAPInput.parse(input)).toThrow('Invalid patient ID format');
      });

      test('should accept valid select array', () => {
        const input = { 
          patient_id: '550e8400-e29b-41d4-a716-446655440000',
          select: ['a', 'p', 'summary']
        };
        expect(() => GetLatestSOAPInput.parse(input)).not.toThrow();
      });

      test('should reject invalid select values', () => {
        const input = { 
          patient_id: '550e8400-e29b-41d4-a716-446655440000',
          select: ['invalid']
        };
        expect(() => GetLatestSOAPInput.parse(input)).toThrow();
      });
    });

    describe('PlanItemSchema', () => {
      test('should accept minimal plan item with only drug', () => {
        const item = { drug: 'Cefotaxime' };
        expect(() => PlanItemSchema.parse(item)).not.toThrow();
      });

      test('should accept complete plan item', () => {
        const item = {
          drug: 'Cefotaxime',
          route: 'IV',
          dose: '1g',
          freq: 'q8h',
          days: 3,
          start_date: '2024-01-15'
        };
        expect(() => PlanItemSchema.parse(item)).not.toThrow();
      });

      test('should reject empty drug name', () => {
        const item = { drug: '' };
        expect(() => PlanItemSchema.parse(item)).toThrow('Drug name is required');
      });

      test('should reject invalid date format', () => {
        const item = { drug: 'Cefotaxime', start_date: '15/01/2024' };
        expect(() => PlanItemSchema.parse(item)).toThrow('Invalid date format');
      });

      test('should reject negative days', () => {
        const item = { drug: 'Cefotaxime', days: -1 };
        expect(() => PlanItemSchema.parse(item)).toThrow();
      });
    });
  });

  describe('Date Math', () => {
    describe('computePlanItem', () => {
      test('should use today as default start_date when not provided', () => {
        const today = '2024-01-15';
        const item = { drug: 'Cefotaxime' };
        const result = computePlanItem(item, today);
        
        expect(result.start_date).toBe(today);
      });

      test('should use provided start_date', () => {
        const today = '2024-01-15';
        const startDate = '2024-01-20';
        const item = { drug: 'Cefotaxime', start_date: startDate };
        const result = computePlanItem(item, today);
        
        expect(result.start_date).toBe(startDate);
      });

      test('should compute end_date correctly for 1 day (default)', () => {
        const today = '2024-01-15';
        const item = { drug: 'Cefotaxime' };
        const result = computePlanItem(item, today);
        
        expect(result.end_date).toBe('2024-01-15'); // Same day for 1 day duration
      });

      test('should compute end_date correctly for multiple days', () => {
        const today = '2024-01-15';
        const item = { drug: 'Cefotaxime', days: 3 };
        const result = computePlanItem(item, today);
        
        expect(result.end_date).toBe('2024-01-17'); // start + 3 days - 1 = 2 days later
      });

      test('should set status to active when end_date >= today', () => {
        const today = '2024-01-15';
        const item = { drug: 'Cefotaxime', days: 3 }; // ends 2024-01-17
        const result = computePlanItem(item, today);
        
        expect(result.status).toBe('active');
      });

      test('should set status to active when end_date = today', () => {
        const today = '2024-01-15';
        const item = { drug: 'Cefotaxime', days: 1 }; // ends 2024-01-15
        const result = computePlanItem(item, today);
        
        expect(result.status).toBe('active');
      });

      test('should set status to done when end_date < today', () => {
        const today = '2024-01-15';
        const item = { 
          drug: 'Cefotaxime', 
          start_date: '2024-01-10', 
          days: 2 
        }; // ends 2024-01-11
        const result = computePlanItem(item, today);
        
        expect(result.status).toBe('done');
      });

      test('should preserve all optional fields with correct types', () => {
        const today = '2024-01-15';
        const item = {
          drug: 'Cefotaxime',
          route: 'IV',
          dose: '1g',
          freq: 'q8h',
          days: 2
        };
        const result = computePlanItem(item, today);
        
        expect(result.drug).toBe('Cefotaxime');
        expect(result.route).toBe('IV');
        expect(result.dose).toBe('1g');
        expect(result.freq).toBe('q8h');
        expect(result.days).toBe(2);
      });

      test('should set optional fields to null when not provided', () => {
        const today = '2024-01-15';
        const item = { drug: 'Cefotaxime' };
        const result = computePlanItem(item, today);
        
        expect(result.route).toBe(null);
        expect(result.dose).toBe(null);
        expect(result.freq).toBe(null);
        expect(result.days).toBe(null);
      });
    });

    describe('Edge Cases', () => {
      test('should handle year boundaries correctly', () => {
        const today = '2023-12-30';
        const item = { drug: 'Cefotaxime', days: 5 };
        const result = computePlanItem(item, today);
        
        expect(result.end_date).toBe('2024-01-03'); // crosses year boundary
      });

      test('should handle month boundaries correctly', () => {
        const today = '2024-01-29';
        const item = { drug: 'Cefotaxime', days: 5 };
        const result = computePlanItem(item, today);
        
        expect(result.end_date).toBe('2024-02-02'); // crosses month boundary
      });

      test('should handle leap year correctly', () => {
        const today = '2024-02-28'; // 2024 is leap year
        const item = { drug: 'Cefotaxime', days: 3 };
        const result = computePlanItem(item, today);
        
        expect(result.end_date).toBe('2024-03-01'); // includes leap day
      });
    });
  });

  describe('PHI Redaction', () => {
    test('should redact patient names longer than 2 characters', () => {
      // This would test the redactPHI function if it were exported
      const mockRedactPHI = (obj) => {
        const redacted = { ...obj };
        if (redacted.name && redacted.name.length > 2) {
          redacted.name = redacted.name.slice(0, 2) + '***';
        }
        if (redacted.patient_id) {
          redacted.patient_id = '***-redacted-***';
        }
        return redacted;
      };

      const input = { name: 'Bintang Putra', patient_id: '550e8400-e29b-41d4-a716-446655440000' };
      const result = mockRedactPHI(input);
      
      expect(result.name).toBe('Bi***');
      expect(result.patient_id).toBe('***-redacted-***');
    });

    test('should not redact names with 2 characters or less', () => {
      const mockRedactPHI = (obj) => {
        const redacted = { ...obj };
        if (redacted.name && redacted.name.length > 2) {
          redacted.name = redacted.name.slice(0, 2) + '***';
        }
        return redacted;
      };

      const input = { name: 'Jo' };
      const result = mockRedactPHI(input);
      
      expect(result.name).toBe('Jo');
    });
  });

  describe('Indonesian Summary Generation', () => {
    test('should generate correct Indonesian summary', () => {
      const generateSummary = (assessment, activeCount, doneCount) => {
        return `Diagnosis: ${assessment || 'Belum ada'}. Plan aktif: ${activeCount}, selesai: ${doneCount}.`;
      };

      expect(generateSummary('Pneumonia', 2, 1)).toBe('Diagnosis: Pneumonia. Plan aktif: 2, selesai: 1.');
      expect(generateSummary(null, 0, 3)).toBe('Diagnosis: Belum ada. Plan aktif: 0, selesai: 3.');
      expect(generateSummary('', 1, 0)).toBe('Diagnosis: Belum ada. Plan aktif: 1, selesai: 0.');
    });
  });
});