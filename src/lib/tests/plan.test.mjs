import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { parseMedication, computeEndDate, splitActiveDone, getTodayInJakarta } from '../plan.ts';

// Mock getTodayInJakarta to return a fixed date for testing
jest.mock('../plan.ts', () => {
  const actual = jest.requireActual('../plan.ts');
  return {
    ...actual,
    getTodayInJakarta: jest.fn(() => '2025-01-15')
  };
});

describe('Plan Utilities', () => {
  describe('parseMedication', () => {
    it('should parse simple medication text', () => {
      const result = parseMedication('Paracetamol 500mg PO bid 3 hari');
      expect(result).toEqual({
        drug: 'Paracetamol',
        dose: '500mg',
        route: 'PO',
        freq: 'bid',
        days: 3
      });
    });

    it('should parse injection medication with prefix', () => {
      const result = parseMedication('Inj. Cefotaxime 1g IV q8h 2 hari');
      expect(result).toEqual({
        drug: 'Cefotaxime',
        dose: '1g',
        route: 'IV',
        freq: 'q8h',
        days: 2
      });
    });

    it('should parse medication with start date (day + month format)', () => {
      const result = parseMedication('Paracetamol 500mg PO bid 3 hari mulai 26 Aug');
      expect(result).toEqual({
        drug: 'Paracetamol',
        dose: '500mg',
        route: 'PO',
        freq: 'bid',
        days: 3,
        start_date: expect.stringMatching(/^\d{4}-08-26$/) // Should be current year, August 26
      });
    });

    it('should parse medication with start date (ISO format)', () => {
      const result = parseMedication('Paracetamol 500mg PO bid 3 hari mulai 2025-01-20');
      expect(result).toEqual({
        drug: 'Paracetamol',
        dose: '500mg',
        route: 'PO',
        freq: 'bid',
        days: 3,
        start_date: '2025-01-20'
      });
    });

    it('should parse medication with Indonesian month names', () => {
      const result = parseMedication('Paracetamol untuk 3 hari mulai 15 Mei');
      expect(result).toEqual({
        drug: 'Paracetamol',
        days: 3,
        start_date: expect.stringMatching(/^\d{4}-05-15$/) // Should be current year, May 15
      });
    });

    it('should handle various route abbreviations', () => {
      const testCases = [
        { input: 'Paracetamol IV', expected: 'IV' },
        { input: 'Paracetamol PO', expected: 'PO' },
        { input: 'Paracetamol IM', expected: 'IM' },
        { input: 'Paracetamol SC', expected: 'SC' },
        { input: 'Paracetamol oral', expected: 'ORAL' },
        { input: 'Paracetamol intravenous', expected: 'INTRAVENOUS' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseMedication(input);
        expect(result.route).toBe(expected);
      });
    });

    it('should handle various frequency patterns', () => {
      const testCases = [
        { input: 'Paracetamol q8h', expected: 'q8h' },
        { input: 'Paracetamol bid', expected: 'bid' },
        { input: 'Paracetamol tid', expected: 'tid' },
        { input: 'Paracetamol qid', expected: 'qid' },
        { input: 'Paracetamol od', expected: 'od' },
        { input: 'Paracetamol once daily', expected: 'once daily' },
        { input: 'Paracetamol setiap 6 jam', expected: 'setiap 6 jam' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseMedication(input);
        expect(result.freq).toBe(expected);
      });
    });

    it('should handle various dose formats', () => {
      const testCases = [
        { input: 'Paracetamol 500mg', expected: '500mg' },
        { input: 'Paracetamol 1g', expected: '1g' },
        { input: 'Paracetamol 0.5ml', expected: '0.5ml' },
        { input: 'Paracetamol 100mcg', expected: '100mcg' },
        { input: 'Paracetamol 2 tablets', expected: '2 tablets' },
        { input: 'Paracetamol 1 capsule', expected: '1 capsule' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseMedication(input);
        expect(result.dose).toBe(expected);
      });
    });

    it('should fall back to original text if drug name cannot be parsed', () => {
      const result = parseMedication('some complex unparseable text');
      expect(result.drug).toBe('some complex unparseable text');
    });

    it('should handle empty or whitespace input', () => {
      const result = parseMedication('   ');
      expect(result.drug).toBe('');
    });
  });

  describe('computeEndDate', () => {
    it('should compute end date correctly for positive days', () => {
      const result = computeEndDate('2025-01-15', 3);
      expect(result).toBe('2025-01-17'); // 15 + 3 - 1 = 17 (inclusive)
    });

    it('should return start date if days is 0', () => {
      const result = computeEndDate('2025-01-15', 0);
      expect(result).toBe('2025-01-15');
    });

    it('should return start date if days is undefined', () => {
      const result = computeEndDate('2025-01-15');
      expect(result).toBe('2025-01-15');
    });

    it('should handle month boundaries correctly', () => {
      const result = computeEndDate('2025-01-30', 5);
      expect(result).toBe('2025-02-03'); // Should cross to February
    });
  });

  describe('splitActiveDone', () => {
    const mockItems = [
      {
        drug: 'Paracetamol',
        route: 'PO',
        dose: '500mg',
        freq: 'bid',
        days: 3,
        start_date: '2025-01-13',
        end_date: '2025-01-15',
        status: 'active'
      },
      {
        drug: 'Cefotaxime',
        route: 'IV',
        dose: '1g',
        freq: 'q8h',
        days: 2,
        start_date: '2025-01-12',
        end_date: '2025-01-13',
        status: 'active'
      },
      {
        drug: 'Vitamin C',
        route: 'PO',
        dose: '100mg',
        freq: 'od',
        days: 5,
        start_date: '2025-01-16',
        end_date: '2025-01-20',
        status: 'active'
      }
    ];

    it('should split items based on end date vs today (2025-01-15)', () => {
      const result = splitActiveDone(mockItems, '2025-01-15');
      
      // Items with end_date >= 2025-01-15 should be active
      expect(result.plan_active).toHaveLength(2);
      expect(result.plan_active.map(item => item.drug)).toEqual(['Paracetamol', 'Vitamin C']);
      expect(result.plan_active.every(item => item.status === 'active')).toBe(true);
      
      // Items with end_date < 2025-01-15 should be done
      expect(result.plan_done).toHaveLength(1);
      expect(result.plan_done[0].drug).toBe('Cefotaxime');
      expect(result.plan_done[0].status).toBe('done');
    });

    it('should use getTodayInJakarta if no date provided', () => {
      const result = splitActiveDone(mockItems);
      
      // With mocked date of 2025-01-15, same result as above
      expect(result.plan_active).toHaveLength(2);
      expect(result.plan_done).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = splitActiveDone([], '2025-01-15');
      expect(result.plan_active).toEqual([]);
      expect(result.plan_done).toEqual([]);
    });

    it('should handle all active items', () => {
      const futureItems = mockItems.map(item => ({
        ...item,
        end_date: '2025-01-20'
      }));
      
      const result = splitActiveDone(futureItems, '2025-01-15');
      expect(result.plan_active).toHaveLength(3);
      expect(result.plan_done).toHaveLength(0);
    });

    it('should handle all done items', () => {
      const pastItems = mockItems.map(item => ({
        ...item,
        end_date: '2025-01-10'
      }));
      
      const result = splitActiveDone(pastItems, '2025-01-15');
      expect(result.plan_active).toHaveLength(0);
      expect(result.plan_done).toHaveLength(3);
    });
  });
});