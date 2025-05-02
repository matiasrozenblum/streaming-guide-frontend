import { useMediaQuery, useTheme } from '@mui/material';
import { ScheduleGridDesktop } from '../ScheduleGridDesktop';
import { ScheduleGridMobile } from '../ScheduleGridMobile';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGrid = ({ channels, schedules }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? (
    <ScheduleGridMobile channels={channels} schedules={schedules} />
  ) : (
    <ScheduleGridDesktop channels={channels} schedules={schedules} />
  );
};
