'use client';

import React from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

dayjs.extend(customParseFormat);

/**
 * StandardTimePicker
 * 
 * A standardized time picker component that enforces:
 * - 24-hour format (HH:mm)
 * - No AM/PM option
 * - Spanish (es) locale
 * - Consistent styling across the application
 * 
 * The component works with string values in HH:mm format (e.g., "14:30")
 * to match backend expectations and avoid timezone issues.
 * 
 * Usage:
 * ```tsx
 * const [time, setTime] = useState('14:30');
 * 
 * <StandardTimePicker
 *   label="Hora de inicio"
 *   value={time}
 *   onChange={(newTime) => setTime(newTime)}
 * />
 * ```
 */

export interface StandardTimePickerProps {
  /** Label for the time picker */
  label: string;
  /** Current time value as HH:mm string */
  value: string;
  /** Callback when time changes, returns HH:mm string */
  onChange: (value: string) => void;
  /** Show error state */
  error?: boolean;
  /** Helper text or error message */
  helperText?: string;
  /** Make the field required */
  required?: boolean;
  /** Minimum selectable time (HH:mm format) */
  minTime?: string;
  /** Maximum selectable time (HH:mm format) */
  maxTime?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Make the picker full width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
}

export const StandardTimePicker: React.FC<StandardTimePickerProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  minTime,
  maxTime,
  disabled = false,
  fullWidth = true,
  size = 'medium',
}) => {
  // Convert string time to Dayjs for the picker
  const dayjsValue = value ? dayjs(value, 'HH:mm') : null;

  // Convert minTime/maxTime strings to Dayjs
  const minTimeValue = minTime ? dayjs(minTime, 'HH:mm') : undefined;
  const maxTimeValue = maxTime ? dayjs(maxTime, 'HH:mm') : undefined;

  const handleChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      onChange(newValue.format('HH:mm'));
    } else {
      onChange('');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <TimePicker
        label={label}
        value={dayjsValue}
        onChange={handleChange}
        format="HH:mm"
        ampm={false}
        minTime={minTimeValue}
        maxTime={maxTimeValue}
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth,
            size,
            error,
            helperText,
            required,
            placeholder: 'HH:mm',
            InputLabelProps: {
              shrink: true,
            },
          },
          popper: {
            sx: {
              '& .MuiPaper-root': {
                margin: 0,
                minWidth: 'auto',
                marginLeft: 0,
                marginRight: 0,
              },
              '& .MuiTimePickerToolbar-root': {
                paddingLeft: 0,
                paddingRight: 0,
              },
              '& .MuiTimePicker-root': {
                paddingLeft: 0,
                paddingRight: 0,
              },
              // Fix the 3-column grid layout issue
              '& .MuiPickersLayout-root': {
                display: 'grid !important',
                gridAutoColumns: '1fr 1fr !important', // Only 2 columns: hours and minutes
                gridAutoRows: 'max-content auto max-content !important',
              },
              // Target the MultiSectionDigitalClock specifically
              '& .MuiMultiSectionDigitalClock-root': {
                display: 'flex !important',
                flexDirection: 'row !important',
                justifyContent: 'center !important',
                padding: '0 !important',
                margin: '0 !important',
                gap: '8px !important',
              },
              // Style the individual sections (hours/minutes)
              '& .MuiMultiSectionDigitalClockSection-root': {
                padding: '0 !important',
                margin: '0 !important',
                minWidth: 'auto !important',
                flex: '1 1 auto !important',
                display: 'flex !important',
                flexDirection: 'column !important',
                alignItems: 'center !important',
              },
              // Style the lists within sections
              '& .MuiList-root': {
                padding: '0 !important',
                margin: '0 !important',
                minWidth: '60px !important',
              },
            },
            placement: 'bottom-start',
          },
        }}
      />
    </LocalizationProvider>
  );
};

/**
 * Utility function to format time string to HH:mm
 */
export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

/**
 * Utility function to validate time format
 */
export const isValidTimeFormat = (time: string): boolean => {
  if (!time) return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Utility function to compare two times
 * Returns true if time1 < time2
 */
export const isTimeBefore = (time1: string, time2: string): boolean => {
  if (!time1 || !time2) return false;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return h1 * 60 + m1 < h2 * 60 + m2;
};

