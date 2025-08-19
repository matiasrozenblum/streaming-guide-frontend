/**
 * Utility functions to handle overlapping program schedules
 * This prevents visual overlaps in the grid while maintaining accurate program data
 */

export interface BaseProgram {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  panelists?: { id: string; name: string }[];
  logo_url?: string;
  stream_url?: string | null;
  is_live?: boolean;
  subscribed?: boolean;
  isWeeklyOverride?: boolean;
  overrideType?: string;
  style_override?: string | null;
}

export interface AdjustedProgram extends BaseProgram {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  display_start_time: string;
  display_end_time: string;
  original_start_time: string;
  original_end_time: string;
  hasOverlap: boolean;
  overlapPriority: number; // Higher number = higher priority (later programs win)
  description?: string;
  panelists?: { id: string; name: string }[];
  logo_url?: string;
  stream_url?: string | null;
  is_live?: boolean;
  subscribed?: boolean;
  isWeeklyOverride?: boolean;
  overrideType?: string;
  style_override?: string | null;
}

/**
 * Convert time string (HH:MM) to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 */
function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  return start1Min < end2Min && start2Min < end1Min;
}

/**
 * Process programs for a channel to handle overlaps
 * Later programs get priority in overlap periods
 */
export function processOverlappingPrograms(programs: BaseProgram[]): AdjustedProgram[] {
  if (programs.length <= 1) {
    // No overlaps possible with 0 or 1 program
    return programs.map(p => ({
      ...p,
      display_start_time: p.start_time,
      display_end_time: p.end_time,
      original_start_time: p.start_time,
      original_end_time: p.end_time,
      hasOverlap: false,
      overlapPriority: 0,
    }));
  }

  // Sort programs by start time
  const sortedPrograms = [...programs].sort((a, b) => 
    timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );

  const adjustedPrograms: AdjustedProgram[] = [];
  
  for (let i = 0; i < sortedPrograms.length; i++) {
    const current = sortedPrograms[i];
    const currentStart = timeToMinutes(current.start_time);
    const currentEnd = timeToMinutes(current.end_time);
    
    let displayStart = currentStart;
    let displayEnd = currentEnd;
    let hasOverlap = false;
    const overlapPriority = i; // Later programs have higher priority
    
    // Check for overlaps with previous programs
    for (let j = 0; j < i; j++) {
      const previous = sortedPrograms[j];
      const previousEnd = timeToMinutes(previous.end_time);
      
      if (hasTimeOverlap(
        previous.start_time,
        previous.end_time,
        current.start_time,
        current.end_time
      )) {
        hasOverlap = true;
        
        // Current program gets priority over previous ones
        // Adjust display start time to end of previous program
        if (previousEnd > displayStart) {
          displayStart = previousEnd;
        }
      }
    }
    
    // Check for overlaps with next programs
    for (let j = i + 1; j < sortedPrograms.length; j++) {
      const next = sortedPrograms[j];
      const nextStart = timeToMinutes(next.start_time);
      
      if (hasTimeOverlap(
        current.start_time,
        current.end_time,
        next.start_time,
        next.end_time
      )) {
        hasOverlap = true;
        
        // Next program gets priority over current one
        // Adjust display end time to start of next program
        if (nextStart < displayEnd) {
          displayEnd = nextStart;
        }
      }
    }
    
    adjustedPrograms.push({
      ...current,
      display_start_time: minutesToTime(displayStart),
      display_end_time: minutesToTime(displayEnd),
      original_start_time: current.start_time,
      original_end_time: current.end_time,
      hasOverlap,
      overlapPriority,
    });
  }
  
  return adjustedPrograms;
}

/**
 * Debug function to log overlap information
 */
export function logOverlapInfo(programs: AdjustedProgram[]): void {
  const overlapping = programs.filter(p => p.hasOverlap);
  
  if (overlapping.length > 0) {
    console.log('🔄 Overlapping programs detected:');
    overlapping.forEach(p => {
      console.log(`   - ${p.name}: ${p.original_start_time}-${p.original_end_time} → ${p.display_start_time}-${p.display_end_time}`);
    });
  }
}
