'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import { ScheduleGridDesktop } from '../ScheduleGridDesktop';
import { ScheduleGridMobileHorizontal } from '../ScheduleGridMobileHorizontal';
import { ScheduleGridMobileVertical } from '../ScheduleGridMobileVertical';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { usePathname } from 'next/navigation';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGrid = ({ channels, schedules }: Props) => {
  console.log('hola schedule grid');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();

  if (!isMobile) {
    return <ScheduleGridDesktop channels={channels} schedules={schedules} />;
  }

  console.log('pathname', pathname);
  return pathname === '/vertical' ? (
    <ScheduleGridMobileVertical channels={channels} schedules={schedules} />
  ) : (
    <ScheduleGridMobileHorizontal channels={channels} schedules={schedules} />
  );
};