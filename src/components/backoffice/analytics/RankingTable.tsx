"use client";

import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RemoveIcon from "@mui/icons-material/Remove";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import type { RankingRow } from "@/services/analytics";
import { SERIES } from "./palette";

interface Props {
  rows: RankingRow[];
  loading?: boolean;
  /** Programs show their channel alongside; channel rankings don't repeat it. */
  showChannel?: boolean;
  onSelect?: (row: RankingRow) => void;
}

/**
 * A row is a program, a channel or a streamer depending on which ranking it came
 * from; each keeps its own name and logo fields, so resolve them once here.
 */
const nameOf = (row: RankingRow): string =>
  row.program_name ?? row.streamer_name ?? row.channel_name ?? "—";

const logoOf = (row: RankingRow): string | null =>
  row.streamer_logo_url ?? row.channel_logo_url ?? null;

/**
 * Ranked magnitudes. The bar is drawn inside the row rather than as a separate
 * chart so the name, the value and the length share one line — a bar chart
 * beside a table would say the same thing twice.
 */
export function RankingTable({
  rows,
  loading,
  showChannel = true,
  onSelect,
}: Props) {
  const theme = useTheme();

  if (loading) return <Skeleton variant="rounded" height={360} />;

  if (rows.length === 0) {
    return (
      <Typography color="text.secondary">Sin datos para este rango.</Typography>
    );
  }

  // Bars are scaled to the leader, so the top row always fills the track and
  // the rest read as a share of it.
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell width={48}>#</TableCell>
          <TableCell>Nombre</TableCell>
          {showChannel && <TableCell>Canal</TableCell>}
          <TableCell align="right" width={100}>
            Eventos
          </TableCell>
          <TableCell align="right" width={100}>
            Usuarios
          </TableCell>
          <TableCell align="center" width={72}>
            Cambio
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={`${row.program_id ?? row.streamer_id ?? "ch"}-${row.channel_id}-${row.position}`}
            hover
            onClick={onSelect ? () => onSelect(row) : undefined}
            sx={{ cursor: onSelect ? "pointer" : "default" }}
          >
            <TableCell>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {row.position}
              </Typography>
            </TableCell>
            <TableCell>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                {/* Channel and streamer rankings have no separate logo column,
                    so their own logo rides alongside the name instead. */}
                {!showChannel && logoOf(row) && (
                  <Avatar
                    src={logoOf(row)!}
                    alt=""
                    sx={{ width: 22, height: 22 }}
                    variant="rounded"
                  />
                )}
                <Typography variant="body2">{nameOf(row)}</Typography>
              </Box>
              <Box
                sx={{
                  height: 6,
                  borderRadius: "3px",
                  bgcolor: theme.palette.action.hover,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${(row.value / max) * 100}%`,
                    bgcolor: SERIES[0],
                    borderRadius: "3px",
                  }}
                />
              </Box>
            </TableCell>
            {showChannel && (
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {row.channel_logo_url && (
                    <Avatar
                      src={row.channel_logo_url}
                      alt=""
                      sx={{ width: 22, height: 22 }}
                      variant="rounded"
                    />
                  )}
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {row.channel_name ?? "—"}
                  </Typography>
                </Box>
              </TableCell>
            )}
            <TableCell align="right">
              <Typography variant="body2">
                {row.value.toLocaleString("es-AR")}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" color="text.secondary">
                {row.unique_users.toLocaleString("es-AR")}
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Movement row={row} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Movement({ row }: { row: RankingRow }) {
  if (row.previous_position === null) {
    return (
      <Tooltip title="Sin posición en el período anterior">
        <FiberNewIcon sx={{ fontSize: 18, color: "text.secondary" }} />
      </Tooltip>
    );
  }

  // Positions count upward as they get worse, so a drop in number is a climb.
  const delta = row.previous_position - row.position;

  if (delta === 0) {
    return <RemoveIcon sx={{ fontSize: 16, color: "text.secondary" }} />;
  }

  const up = delta > 0;
  return (
    <Tooltip title={`Antes #${row.previous_position}`}>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
        {up ? (
          <ArrowUpwardIcon sx={{ fontSize: 14, color: "success.main" }} />
        ) : (
          <ArrowDownwardIcon sx={{ fontSize: 14, color: "error.main" }} />
        )}
        <Typography
          variant="caption"
          color={up ? "success.main" : "error.main"}
        >
          {Math.abs(delta)}
        </Typography>
      </Box>
    </Tooltip>
  );
}
