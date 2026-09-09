"use client";

import { useTheme } from "@mui/material/styles";
import { Box, Typography, Skeleton } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import dayjs from "dayjs";
import type { Trend, Granularity } from "@/services/analytics";
import { metricLabel } from "@/services/analytics";
import { SERIES } from "./palette";

interface Props {
  trend: Trend | null;
  loading?: boolean;
  height?: number;
}

const bucketLabel = (bucket: string, granularity: Granularity): string => {
  const date = dayjs(bucket);
  if (granularity === "month") return date.format("MMM YY");
  if (granularity === "week") return `sem. ${date.format("DD/MM")}`;
  return date.format("DD/MM");
};

/**
 * Change over time for a single metric. One series, so no legend box — the
 * heading names it, and a legend for one line is pure noise.
 */
export function TrendChart({ trend, loading, height = 300 }: Props) {
  const theme = useTheme();

  if (loading) return <Skeleton variant="rounded" height={height} />;

  if (!trend || trend.points.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          Sin datos para este rango.
        </Typography>
      </Box>
    );
  }

  const labels = trend.points.map((p) =>
    bucketLabel(p.bucket, trend.granularity),
  );
  const values = trend.points.map((p) => p.count);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {metricLabel(trend.metric)}
      </Typography>
      <LineChart
        height={height}
        xAxis={[{ scaleType: "point", data: labels }]}
        series={[
          {
            data: values,
            label: metricLabel(trend.metric),
            color: SERIES[0],
            showMark: trend.points.length <= 31,
            curve: "monotoneX",
          },
        ]}
        // The heading already names the series; a one-entry legend adds nothing.
        hideLegend
        margin={{ left: 8, right: 16, top: 8, bottom: 24 }}
        grid={{ horizontal: true }}
        sx={{
          // Recessive grid and axes: the data should carry the contrast.
          "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
            stroke: theme.palette.divider,
          },
          "& .MuiChartsAxis-tickLabel": {
            fill: theme.palette.text.secondary,
          },
          "& .MuiChartsGrid-line": {
            stroke: theme.palette.divider,
            strokeOpacity: 0.4,
          },
          "& .MuiLineElement-root": { strokeWidth: 2 },
          "& .MuiMarkElement-root": {
            stroke: theme.palette.background.paper,
            strokeWidth: 2,
            r: 4,
          },
        }}
      />
    </Box>
  );
}
