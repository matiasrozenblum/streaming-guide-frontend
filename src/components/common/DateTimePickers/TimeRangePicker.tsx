'use client';

import React from 'react';
import { Box } from '@mui/material';
import { TimeRangePicker as MuiTimeRangePicker } from '@mui/x-date-pickers-pro/TimeRangePicker';
import { MultiInputTimeRangeField } from '@mui/x-date-pickers-pro/MultiInputTimeRangeField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * TimeRangePicker
 * 
 * A component using MUI's native TimeRangePicker with MultiInputTimeRangeField
 * for selecting a time range. Uses two separate input fields for start and end times.
 * 
 * Features:
 * - 24-hour format (HH:mm)
 * - No AM/PM option
 * - Two separate input fields for better UX
 * - Consistent styling across the application
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
  /** Current start time value (HH:mm format) */
  startValue: string;
  /** Current end time value (HH:mm format) */
  endValue: string;
  /** Callback when start time changes */
  onStartChange: (value: string) => void;
  /** Callback when end time changes */
  onEndChange: (value: string) => void;
  /** Disable both pickers */
  disabled?: boolean;
  /** Make pickers full width */
  fullWidth?: boolean;
}

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  disabled = false,
  fullWidth = true,
}) => {
  // Convert string times to Dayjs for the picker
  const startDayjs = startValue ? dayjs(startValue, 'HH:mm') : null;
  const endDayjs = endValue ? dayjs(endValue, 'HH:mm') : null;
  const value = [startDayjs, endDayjs] as [Dayjs | null, Dayjs | null];

  const handleChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    const [newStart, newEnd] = newValue;
    onStartChange(newStart && newStart.isValid() ? newStart.format('HH:mm') : '');
    onEndChange(newEnd && newEnd.isValid() ? newEnd.format('HH:mm') : '');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <MuiTimeRangePicker
          value={value}
          onChange={handleChange}
          format="HH:mm"
          ampm={false}
          disabled={disabled}
          slots={{
            field: MultiInputTimeRangeField,
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

