export interface Schedule {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subscribed: boolean;
  program: {
    id: number;
    name: string;
    logo_url: string | null;
    description: string | null;
    stream_url: string | null;
    is_live: boolean;
    panelists: { id: number; name: string }[];
    channel: {
      id: number;
      name: string;
      logo_url: string | null;
    };
    style_override?: string | null;
  };
  isWeeklyOverride?: boolean;
  overrideType?: 'cancel' | 'time_change' | 'reschedule';
  // For overrides
  programId?: number;
  panelistIds?: number[];
}

export interface WeeklyOverride {
  id: string;
  scheduleId?: number;
  programId?: number;
  weekStartDate: string;
  overrideType: 'cancel' | 'time_change' | 'reschedule' | 'create';
  newStartTime?: string;
  newEndTime?: string;
  newDayOfWeek?: string;
  reason?: string;
  createdBy?: string;
  expiresAt: string;
  createdAt: string;
  panelistIds?: number[];
  specialProgram?: {
    name: string;
    description?: string;
    channelId: number;
    imageUrl?: string;
  };
}
