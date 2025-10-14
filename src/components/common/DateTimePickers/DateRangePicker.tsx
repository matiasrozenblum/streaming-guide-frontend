'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Dayjs } from 'dayjs';
import { StandardDatePicker } from './StandardDatePicker';

/**
 * DateRangePicker
 * 
 * A component that combines two StandardDatePickers for selecting a date range.
 * Automatically validates that the end date is after the start date.
 * 
 * Usage:
 * ```tsx
 * const [startDate, setStartDate] = useState<Dayjs | null>(null);
 * const [endDate, setEndDate] = useState<Dayjs | null>(null);
 * 
 * <DateRangePicker
 *   startValue={startDate}
 *   endValue={endDate}
 *   onStartChange={setStartDate}
 *   onEndChange={setEndDate}
 * />
 * ```
 */

export interface DateRangePickerProps {
  /** Label for the start date picker */
  startLabel?: string;
  /** Label for the end date picker */
  endLabel?: string;
  /** Current start date value */
  startValue: Dayjs | null;
  /** Current end date value */
  endValue: Dayjs | null;
  /** Callback when start date changes */
  onStartChange: (value: Dayjs | null) => void;
  /** Callback when end date changes */
  onEndChange: (value: Dayjs | null) => void;
  /** Show error state */
  error?: boolean;
  /** Custom error message (overrides default validation message) */
  helperText?: string;
  /** Make both fields required */
  required?: boolean;
  /** Disable both pickers */
  disabled?: boolean;
  /** Make pickers full width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Gap between pickers (in theme spacing units) */
  gap?: number;
  /** Minimum selectable date for start picker */
  minDate?: Dayjs;
  /** Maximum selectable date for end picker */
  maxDate?: Dayjs;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startLabel = 'Desde',
  endLabel = 'Hasta',
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  error: externalError = false,
  helperText: externalHelperText,
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
  gap = 2,
  minDate,
  maxDate,
}) => {
  const [internalError, setInternalError] = useState(false);
  const [internalHelperText, setInternalHelperText] = useState('');

  // Validate date range whenever values change
  useEffect(() => {
    if (startValue && endValue) {
      if (endValue.isBefore(startValue)) {
        setInternalError(true);
        setInternalHelperText('La fecha de fin debe ser posterior a la fecha de inicio');
      } else {
        setInternalError(false);
        setInternalHelperText('');
      }
    } else {
      setInternalError(false);
      setInternalHelperText('');
    }
  }, [startValue, endValue]);

  // Use external error/helperText if provided, otherwise use internal validation
  const showError = externalError || internalError;
  const showHelperText = externalHelperText || internalHelperText;

  return (
    <Box sx={{ display: 'flex', gap, width: fullWidth ? '100%' : 'auto', alignItems: 'flex-start' }}>
      <StandardDatePicker
        label={startLabel}
        value={startValue}
        onChange={onStartChange}
        error={showError}
        helperText={showError && showHelperText ? showHelperText : undefined}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        minDate={minDate}
        maxDate={endValue || maxDate}
      />
      <StandardDatePicker
        label={endLabel}
        value={endValue}
        onChange={onEndChange}
        error={showError}
        helperText={showError && showHelperText ? ' ' : undefined} // Space to maintain alignment
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        minDate={startValue || minDate}
        maxDate={maxDate}
      />
    </Box>
  );
};

