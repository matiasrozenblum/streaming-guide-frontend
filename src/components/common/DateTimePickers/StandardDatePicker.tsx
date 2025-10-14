'use client';

import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';

/**
 * StandardDatePicker
 * 
 * A standardized date picker component that enforces:
 * - DD/MM/YYYY format for display
 * - Spanish (es) locale
 * - YYYY-MM-DD format for backend (via value prop)
 * - Consistent styling across the application
 * 
 * Usage:
 * ```tsx
 * const [date, setDate] = useState<Dayjs | null>(null);
 * 
 * <StandardDatePicker
 *   label="Fecha de nacimiento"
 *   value={date}
 *   onChange={(newDate) => setDate(newDate)}
 * />
 * ```
 */

export interface StandardDatePickerProps {
  /** Label for the date picker */
  label: string;
  /** Current date value as Dayjs object */
  value: Dayjs | null;
  /** Callback when date changes */
  onChange: (value: Dayjs | null) => void;
  /** Show error state */
  error?: boolean;
  /** Helper text or error message */
  helperText?: string;
  /** Make the field required */
  required?: boolean;
  /** Minimum selectable date */
  minDate?: Dayjs;
  /** Maximum selectable date */
  maxDate?: Dayjs;
  /** Disable the picker */
  disabled?: boolean;
  /** Make the picker full width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Placeholder text */
  placeholder?: string;
}

export const StandardDatePicker: React.FC<StandardDatePickerProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  minDate,
  maxDate,
  disabled = false,
  fullWidth = true,
  size = 'medium',
  placeholder,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        format="DD/MM/YYYY"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth,
            size,
            error,
            helperText,
            required,
            placeholder: placeholder || dayjs().format('DD/MM/YYYY'),
            InputLabelProps: {
              shrink: true,
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};

/**
 * Utility function to convert Dayjs to YYYY-MM-DD format for backend
 */
export const dateToBackendFormat = (date: Dayjs | null): string => {
  if (!date) return '';
  return date.format('YYYY-MM-DD');
};

/**
 * Utility function to convert YYYY-MM-DD string from backend to Dayjs
 */
export const dateFromBackendFormat = (dateString: string): Dayjs | null => {
  if (!dateString) return null;
  return dayjs(dateString);
};

