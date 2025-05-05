import { useMediaQuery, useTheme } from '@mui/material';
import { SkeletonScheduleGridMobile } from '../SkeletonScheduleGridMobile';
import { SkeletonScheduleGridDesktop } from '../SkeletonScheduleGridDesktop';

interface Props {
  rowCount: number;
}

export const SkeletonScheduleGrid = ({ rowCount }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? (
    <SkeletonScheduleGridMobile rowCount={rowCount} />
  ) : (
    <SkeletonScheduleGridDesktop rowCount={rowCount} />
  );
};
