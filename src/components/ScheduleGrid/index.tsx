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
  nextWeekMondaySchedules?: Schedule[];
}

export const ScheduleGrid = ({ channels, schedules, categories, categoriesEnabled, nextWeekMondaySchedules }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? (
    <ScheduleGridMobile channels={channels} schedules={schedules} categories={categories} categoriesEnabled={categoriesEnabled} nextWeekMondaySchedules={nextWeekMondaySchedules} />
  ) : (
    <ScheduleGridDesktop channels={channels} schedules={schedules} categories={categories} categoriesEnabled={categoriesEnabled} nextWeekMondaySchedules={nextWeekMondaySchedules} />
  );
};
