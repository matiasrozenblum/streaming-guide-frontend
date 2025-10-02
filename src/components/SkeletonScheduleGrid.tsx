'use client';

import { Box, useMediaQuery, useTheme } from '@mui/material';
import { SkeletonScheduleGridDesktop } from './SkeletonScheduleGridDesktop';
import { SkeletonScheduleGridMobile } from './SkeletonScheduleGridMobile';

interface Props {
  rowCount: number;
}

export const SkeletonScheduleGrid = ({ rowCount }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isMobile ? (
        <SkeletonScheduleGridMobile rowCount={rowCount} />
      ) : (
        <SkeletonScheduleGridDesktop rowCount={rowCount} />
      )}
    </Box>
  );
};
