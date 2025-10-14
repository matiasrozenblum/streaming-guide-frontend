/**
 * Standard Date/Time Picker Components
 * 
 * This module provides standardized date and time picker components
 * with consistent formatting, validation, and user experience across
 * the entire application.
 * 
 * Standards:
 * - Date format: DD/MM/YYYY (display), YYYY-MM-DD (backend)
 * - Time format: HH:mm (24-hour format, no AM/PM)
 * - Locale: Spanish (es)
 * - Library: MUI X Date Pickers with dayjs adapter
 */

// Main components
export { StandardDatePicker } from './StandardDatePicker';
export type { StandardDatePickerProps } from './StandardDatePicker';

export { StandardTimePicker } from './StandardTimePicker';
export type { StandardTimePickerProps } from './StandardTimePicker';

export { DateRangePicker } from './DateRangePicker';
export type { DateRangePickerProps } from './DateRangePicker';

export { TimeRangePicker } from './TimeRangePicker';
export type { TimeRangePickerProps } from './TimeRangePicker';

// Utility functions
export { 
  dateToBackendFormat,
  dateFromBackendFormat 
} from './StandardDatePicker';

export { 
  formatTime,
  isValidTimeFormat,
  isTimeBefore 
} from './StandardTimePicker';

