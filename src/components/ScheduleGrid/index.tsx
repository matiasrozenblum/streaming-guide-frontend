import { useMediaQuery, useTheme } from '@mui/material';
import { ScheduleGridDesktop } from '../ScheduleGridDesktop';
import { ScheduleGridMobile } from '../ScheduleGridMobile';
import { Channel, Category } from '@/types/channel';
import { Schedule } from '@/types/schedule';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
  categories: Category[];
  categoriesEnabled: boolean;
  onFetchDay: (day: string) => void;
  loadingDays: Record<string, boolean>;
}

export const ScheduleGrid = ({ channels, schedules, categories, categoriesEnabled, onFetchDay, loadingDays }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? (
    <ScheduleGridMobile channels={channels} schedules={schedules} categories={categories} categoriesEnabled={categoriesEnabled} onFetchDay={onFetchDay} loadingDays={loadingDays} />
  ) : (
    <ScheduleGridDesktop channels={channels} schedules={schedules} categories={categories} categoriesEnabled={categoriesEnabled} onFetchDay={onFetchDay} loadingDays={loadingDays} />
  );
};
