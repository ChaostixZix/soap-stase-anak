import { describe, it, expect } from '@jest/globals';
import { detectIntent, extractPatientName, isMedicationIntent, isDiagnosisIntent } from '../nl.ts';

describe('Natural Language Processing', () => {
  describe('detectIntent', () => {
    describe('diagnosis intents', () => {
      it('should detect diagnosis intent from "Apa diagnosis Bintang?"', () => {
        const result = detectIntent('Apa diagnosis Bintang?');
        expect(result).toEqual({
          kind: 'ask_diagnosis',
          name: 'Bintang'
        });
      });

      it('should detect diagnosis intent from "diagnosis pasien Nisa"', () => {
        const result = detectIntent('diagnosis pasien Nisa');
        expect(result).toEqual({
          kind: 'ask_diagnosis',
          name: 'Nisa'
        });
      });

      it('should detect diagnosis intent from "dx Bintang Putra"', () => {
        const result = detectIntent('dx Bintang Putra');
        expect(result).toEqual({
          kind: 'ask_diagnosis',
          name: 'Bintang Putra'
        });
      });

      it('should detect diagnosis intent from "Bintang diagnosis"', () => {
        const result = detectIntent('Bintang diagnosis');
        expect(result).toEqual({
          kind: 'ask_diagnosis',
          name: 'Bintang'
        });
      });

      it('should detect diagnosis intent from case insensitive input', () => {
        const result = detectIntent('APA DIAGNOSIS BINTANG?');
        expect(result).toEqual({
          kind: 'ask_diagnosis',
          name: 'Bintang'
        });
      });
    });

    describe('medication intents', () => {
      it('should detect medication intent from "Pasien Bintang tambahkan obat Cefotaxime untuk 2 hari"', () => {
        const result = detectIntent('Pasien Bintang tambahkan obat Cefotaxime untuk 2 hari');
        expect(result).toEqual({
          kind: 'add_medication',
          name: 'Bintang',
          item: expect.objectContaining({
            drug: 'Cefotaxime',
            days: 2
          })
        });
      });

      it('should detect medication intent from "Tambahkan obat Paracetamol untuk pasien Nisa"', () => {
        const result = detectIntent('Tambahkan obat Paracetamol untuk pasien Nisa');
        expect(result).toEqual({
          kind: 'add_medication',
          name: 'Nisa',
          item: expect.objectContaining({
            drug: 'Paracetamol'
          })
        });
      });

      it('should detect medication intent from "Bintang tambah obat injeksi Cefotaxime 1g IV q8h"', () => {
        const result = detectIntent('Bintang tambah obat injeksi Cefotaxime 1g IV q8h');
        expect(result).toEqual({
          kind: 'add_medication',
          name: 'Bintang',
          item: expect.objectContaining({
            drug: 'Cefotaxime',
            dose: '1g',
            route: 'IV',
            freq: 'q8h'
          })
        });
      });

      it('should detect medication intent with complex medication description', () => {
        const result = detectIntent('Pasien Bintang Putra tambahkan obat Inj. Cefotaxime 1g IV q8h 2 hari mulai 26 Aug');
        expect(result).toEqual({
          kind: 'add_medication',
          name: 'Bintang Putra',
          item: expect.objectContaining({
            drug: 'Cefotaxime',
            dose: '1g',
            route: 'IV',
            freq: 'q8h',
            days: 2,
            start_date: expect.any(String)
          })
        });
      });
    });

    describe('edge cases', () => {
      it('should return null for unrecognized input', () => {
        const result = detectIntent('Hello world');
        expect(result).toBeNull();
      });

      it('should return null for empty input', () => {
        const result = detectIntent('');
        expect(result).toBeNull();
      });

      it('should filter out common words as names', () => {
        const result = detectIntent('Apa diagnosis pasien?');
        expect(result).toBeNull();
      });

      it('should handle whitespace properly', () => {
        const result = detectIntent('  Apa diagnosis Bintang?  ');
        expect(result).toEqual({
          kind: 'ask_diagnosis',
          name: 'Bintang'
        });
      });
    });
  });

  describe('extractPatientName', () => {
    it('should extract patient name from diagnosis query', () => {
      const result = extractPatientName('Apa diagnosis Bintang?');
      expect(result).toBe('Bintang');
    });

    it('should extract patient name from medication query', () => {
      const result = extractPatientName('Pasien Nisa tambahkan obat Paracetamol');
      expect(result).toBe('Nisa');
    });

    it('should return null for unrecognized input', () => {
      const result = extractPatientName('Hello world');
      expect(result).toBeNull();
    });
  });

  describe('isMedicationIntent', () => {
    it('should return true for medication keywords', () => {
      expect(isMedicationIntent('tambah obat')).toBe(true);
      expect(isMedicationIntent('tambahkan medication')).toBe(true);
      expect(isMedicationIntent('beri injeksi')).toBe(true);
      expect(isMedicationIntent('berikan tablet')).toBe(true);
    });

    it('should return false for non-medication text', () => {
      expect(isMedicationIntent('diagnosis pasien')).toBe(false);
      expect(isMedicationIntent('hello world')).toBe(false);
    });
  });

  describe('isDiagnosisIntent', () => {
    it('should return true for diagnosis keywords', () => {
      expect(isDiagnosisIntent('apa diagnosis')).toBe(true);
      expect(isDiagnosisIntent('what is the dx')).toBe(true);
      expect(isDiagnosisIntent('diag pasien')).toBe(true);
    });

    it('should return false for non-diagnosis text', () => {
      expect(isDiagnosisIntent('tambah obat')).toBe(false);
      expect(isDiagnosisIntent('hello world')).toBe(false);
    });
  });
});