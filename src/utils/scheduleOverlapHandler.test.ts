/**
 * Tests for schedule overlap handling logic
 */

import { processOverlappingPrograms, BaseProgram } from './scheduleOverlapHandler';

// Mock programs for testing
const createMockProgram = (
  id: string,
  name: string,
  start: string,
  end: string
): BaseProgram => ({
  id,
  name,
  start_time: start,
  end_time: end,
});

describe('scheduleOverlapHandler', () => {
  describe('processOverlappingPrograms', () => {
    it('should handle no programs', () => {
      const result = processOverlappingPrograms([]);
      expect(result).toEqual([]);
    });

    it('should handle single program', () => {
      const program = createMockProgram('1', 'Test Program', '15:30', '18:30');
      const result = processOverlappingPrograms([program]);
      
      expect(result).toHaveLength(1);
      expect(result[0].display_start_time).toBe('15:30');
      expect(result[0].display_end_time).toBe('18:30');
      expect(result[0].hasOverlap).toBe(false);
    });

    it('should handle non-overlapping programs', () => {
      const programs = [
        createMockProgram('1', 'Program 1', '15:30', '17:30'),
        createMockProgram('2', 'Program 2', '18:00', '20:00'),
      ];
      
      const result = processOverlappingPrograms(programs);
      
      expect(result).toHaveLength(2);
      expect(result[0].display_start_time).toBe('15:30');
      expect(result[0].display_end_time).toBe('17:30');
      expect(result[0].hasOverlap).toBe(false);
      expect(result[1].display_start_time).toBe('18:00');
      expect(result[1].display_end_time).toBe('20:00');
      expect(result[1].hasOverlap).toBe(false);
    });

    it('should handle overlapping programs with later program priority', () => {
      const programs = [
        createMockProgram('1', 'Program 1', '15:30', '18:30'),
        createMockProgram('2', 'Program 2', '17:30', '20:30'),
      ];
      
      const result = processOverlappingPrograms(programs);
      
      expect(result).toHaveLength(2);
      
      // First program: original 15:30-18:30, display 15:30-17:30 (cut short)
      expect(result[0].display_start_time).toBe('15:30');
      expect(result[0].display_end_time).toBe('17:30');
      expect(result[0].hasOverlap).toBe(true);
      expect(result[0].original_start_time).toBe('15:30');
      expect(result[0].original_end_time).toBe('18:30');
      
      // Second program: original 17:30-20:30, display 17:30-20:30 (full time, gets priority)
      expect(result[1].display_start_time).toBe('17:30');
      expect(result[1].display_end_time).toBe('20:30');
      expect(result[1].hasOverlap).toBe(true);
      expect(result[1].original_start_time).toBe('17:30');
      expect(result[1].original_end_time).toBe('20:30');
    });

    it('should handle chain of overlapping programs', () => {
      const programs = [
        createMockProgram('1', 'Program 1', '15:30', '18:30'),
        createMockProgram('2', 'Program 2', '17:30', '20:30'),
        createMockProgram('3', 'Program 3', '19:00', '22:00'),
      ];
      
      const result = processOverlappingPrograms(programs);
      
      expect(result).toHaveLength(3);
      
      // First program: 15:30-17:30 (cut short by second)
      expect(result[0].display_start_time).toBe('15:30');
      expect(result[0].display_end_time).toBe('17:30');
      expect(result[0].hasOverlap).toBe(true);
      
      // Second program: 17:30-19:00 (cut short by third)
      expect(result[1].display_start_time).toBe('17:30');
      expect(result[1].display_end_time).toBe('19:00');
      expect(result[1].hasOverlap).toBe(true);
      
      // Third program: 19:00-22:00 (full time, highest priority)
      expect(result[2].display_start_time).toBe('19:00');
      expect(result[2].display_end_time).toBe('22:00');
      expect(result[2].hasOverlap).toBe(true);
    });

    it('should handle programs with same start time', () => {
      const programs = [
        createMockProgram('1', 'Program 1', '15:30', '17:30'),
        createMockProgram('2', 'Program 2', '15:30', '18:30'),
      ];
      
      const result = processOverlappingPrograms(programs);
      
      expect(result).toHaveLength(2);
      
      // First program: 15:30-15:30 (no display time, completely overlapped)
      expect(result[0].display_start_time).toBe('15:30');
      expect(result[0].display_end_time).toBe('15:30');
      expect(result[0].hasOverlap).toBe(true);
      
      // Second program: 15:30-18:30 (full time, gets priority)
      expect(result[1].display_start_time).toBe('15:30');
      expect(result[1].display_end_time).toBe('18:30');
      expect(result[1].hasOverlap).toBe(true);
    });

    it('should preserve all original program data', () => {
      const originalProgram = createMockProgram('1', 'Test Program', '15:30', '18:30');
      originalProgram.description = 'Test description';
      originalProgram.is_live = true;
      originalProgram.subscribed = true;
      
      const result = processOverlappingPrograms([originalProgram]);
      
      expect(result[0].description).toBe('Test description');
      expect(result[0].is_live).toBe(true);
      expect(result[0].subscribed).toBe(true);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Test Program');
    });
  });
});
