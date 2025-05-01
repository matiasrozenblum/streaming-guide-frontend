import { useMediaQuery, useTheme } from '@mui/material';
import { ScheduleGridDesktop } from '../ScheduleGridDesktop';
import { ScheduleGridMobile } from '../ScheduleGridMobile';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
  isHoliday: boolean; 
}

export const ScheduleGrid = ({ channels, schedules, isHoliday }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? (
    <ScheduleGridMobile isHoliday={isHoliday} channels={channels} schedules={schedules} />
  ) : (
    <ScheduleGridDesktop isHoliday={isHoliday} channels={channels} schedules={schedules} />
  );
};
