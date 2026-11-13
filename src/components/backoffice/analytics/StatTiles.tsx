"use client";

import { Box, Card, CardContent, Typography, Skeleton } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import type { OverviewTile } from "@/services/analytics";
import { metricLabel } from "@/services/analytics";

interface Props {
  tiles: OverviewTile[];
  loading?: boolean;
  /** Shown under the deltas so the comparison window is never a guess. */
  previousRange?: { from: string; to: string };
}

/**
 * Headline numbers. These are hero figures, not a chart — a bar chart of five
 * unrelated metrics would invite comparisons between quantities that share no
 * unit, so each gets its own tile with its own delta.
 */
export function StatTiles({ tiles, loading, previousRange }: Props) {
  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={116} />
        ))}
      </Box>
    );
  }

  if (tiles.length === 0) {
    return (
      <Typography color="text.secondary">
        Todavía no hay eventos registrados en este rango.
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {tiles.map((tile) => (
          <Tile key={tile.metric} tile={tile} />
        ))}
      </Box>
      {previousRange && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
        >
          Variación contra {previousRange.from} — {previousRange.to}
        </Typography>
      )}
    </Box>
  );
}

function Tile({ tile }: { tile: OverviewTile }) {
  const isNew = tile.delta_pct === null;
  const isUp = (tile.delta_pct ?? 0) >= 0;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          title={metricLabel(tile.metric)}
        >
          {metricLabel(tile.metric)}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
          {tile.value.toLocaleString("es-AR")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
          {isNew ? (
            // A percentage against a zero baseline is undefined, not "+100%".
            <Typography variant="caption" color="text.secondary">
              sin datos previos
            </Typography>
          ) : (
            <>
              {isUp ? (
                <ArrowUpwardIcon sx={{ fontSize: 14, color: "success.main" }} />
              ) : (
                <ArrowDownwardIcon sx={{ fontSize: 14, color: "error.main" }} />
              )}
              <Typography
                variant="caption"
                color={isUp ? "success.main" : "error.main"}
              >
                {isUp ? "+" : ""}
                {tile.delta_pct}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs {tile.previous.toLocaleString("es-AR")}
              </Typography>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
