'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { StandardTimePicker } from './StandardTimePicker';
import { isTimeBefore } from './StandardTimePicker';

/**
 * TimeRangePicker
 * 
 * A component that combines two StandardTimePickers for selecting a time range.
 * Automatically validates that the end time is after the start time.
 * 
 * Usage:
 * ```tsx
 * const [startTime, setStartTime] = useState('09:00');
 * const [endTime, setEndTime] = useState('17:00');
 * 
 * <TimeRangePicker
 *   startValue={startTime}
 *   endValue={endTime}
 *   onStartChange={setStartTime}
 *   onEndChange={setEndTime}
 * />
 * ```
 */

export interface TimeRangePickerProps {
  /** Label for the start time picker */
  startLabel?: string;
  /** Label for the end time picker */
  endLabel?: string;
  /** Current start time value (HH:mm format) */
  startValue: string;
  /** Current end time value (HH:mm format) */
  endValue: string;
  /** Callback when start time changes */
  onStartChange: (value: string) => void;
  /** Callback when end time changes */
  onEndChange: (value: string) => void;
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
}

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  startLabel = 'Hora de inicio',
  endLabel = 'Hora de fin',
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
}) => {
  const [internalError, setInternalError] = useState(false);
  const [internalHelperText, setInternalHelperText] = useState('');

  // Validate time range whenever values change
  useEffect(() => {
    if (startValue && endValue) {
      if (!isTimeBefore(startValue, endValue)) {
        setInternalError(true);
        setInternalHelperText('La hora de fin debe ser posterior a la hora de inicio');
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
    <Box sx={{ 
      display: 'flex', 
      gap, 
      width: fullWidth ? '100%' : 'auto',
      alignItems: 'flex-start', // Align items to top to prevent height misalignment
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}> {/* Ensure equal flex distribution */}
        <StandardTimePicker
          label={startLabel}
          value={startValue}
          onChange={onStartChange}
          error={showError}
          helperText={showError && showHelperText ? showHelperText : undefined}
          required={required}
          disabled={disabled}
          fullWidth={true} // Always full width within flex container
          size={size}
          maxTime={endValue || undefined}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}> {/* Ensure equal flex distribution */}
        <StandardTimePicker
          label={endLabel}
          value={endValue}
          onChange={onEndChange}
          error={showError}
          helperText={showError && showHelperText ? ' ' : undefined} // Space to maintain alignment
          required={required}
          disabled={disabled}
          fullWidth={true} // Always full width within flex container
          size={size}
          minTime={startValue || undefined}
        />
      </Box>
    </Box>
  );
};

