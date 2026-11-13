"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import {
  getOverview,
  getTrends,
  getProgramRanking,
  getChannelRanking,
  getStreamerRanking,
  getEventNames,
  metricLabel,
  DEFAULT_METRIC,
  DEFAULT_STREAMER_METRIC,
  type Overview,
  type Trend,
  type RankingRow,
  type EventName,
  type Granularity,
  type Platform,
} from "@/services/analytics";
import { StatTiles } from "@/components/backoffice/analytics/StatTiles";
import { TrendChart } from "@/components/backoffice/analytics/TrendChart";
import { RankingTable } from "@/components/backoffice/analytics/RankingTable";
import { InstagramExport } from "@/components/backoffice/analytics/InstagramExport";

const TABS = [
  "Resumen",
  "Tendencias",
  "Programas",
  "Canales",
  "Streamers",
] as const;

export default function AnalyticsPage() {
  const [tab, setTab] = useState(0);

  // Filters live above the tabs and apply to every one of them, so switching
  // tabs never silently changes the window you are looking at.
  const [from, setFrom] = useState<Dayjs>(dayjs().subtract(29, "day"));
  const [to, setTo] = useState<Dayjs>(dayjs());
  const [metric, setMetric] = useState<string>(DEFAULT_METRIC);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [platform, setPlatform] = useState<Platform | "">("");

  const [eventNames, setEventNames] = useState<EventName[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [programs, setPrograms] = useState<RankingRow[]>([]);
  const [channels, setChannels] = useState<RankingRow[]>([]);
  const [streamers, setStreamers] = useState<RankingRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(
    () => ({
      from: from.format("YYYY-MM-DD"),
      to: to.format("YYYY-MM-DD"),
      ...(platform ? { platform } : {}),
    }),
    [from, to, platform],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, trendData, programData, channelData, streamerData] =
        await Promise.all([
          getOverview(range),
          getTrends({ ...range, metric, granularity }),
          getProgramRanking({ ...range, metric, limit: 20 }),
          getChannelRanking({ ...range, metric, limit: 20 }),
          // Streamers are ranked by their own metric: the picker above selects
          // among program/channel events, none of which a streamer emits.
          getStreamerRanking({
            ...range,
            metric: DEFAULT_STREAMER_METRIC,
            limit: 20,
          }),
        ]);
      setOverview(overviewData);
      setTrend(trendData);
      setPrograms(programData);
      setChannels(channelData);
      setStreamers(streamerData);
    } catch (err) {
      console.error("[analytics] load failed", err);
      setError(
        "No se pudieron cargar las métricas. Revisá que el backend esté disponible.",
      );
    } finally {
      setLoading(false);
    }
  }, [range, metric, granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getEventNames()
      .then(setEventNames)
      // The picker falls back to the default metric; a failure here is not
      // worth blocking the dashboard over.
      .catch(() => setEventNames([]));
  }, []);

  const metricOptions = useMemo(() => {
    const names = eventNames.map((e) => e.event_name);
    return names.includes(DEFAULT_METRIC) ? names : [DEFAULT_METRIC, ...names];
  }, [eventNames]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <InsightsIcon color="primary" />
          <Typography variant="h4">Métricas</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Datos propios, con histórico completo. Se agregan cada noche a partir
          de los eventos de la web y la app.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={<Button onClick={() => void load()}>Reintentar</Button>}
          >
            {error}
          </Alert>
        )}

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              useFlexGap
              alignItems="center"
            >
              <DatePicker
                label="Desde"
                value={from}
                onChange={(v) => v && setFrom(v)}
                slotProps={{
                  textField: { size: "small", sx: { minWidth: 150 } },
                }}
              />
              <DatePicker
                label="Hasta"
                value={to}
                onChange={(v) => v && setTo(v)}
                slotProps={{
                  textField: { size: "small", sx: { minWidth: 150 } },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Métrica</InputLabel>
                <Select
                  label="Métrica"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                >
                  {metricOptions.map((name) => (
                    <MenuItem key={name} value={name}>
                      {metricLabel(name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Agrupar por</InputLabel>
                <Select
                  label="Agrupar por"
                  value={granularity}
                  onChange={(e) =>
                    setGranularity(e.target.value as Granularity)
                  }
                >
                  <MenuItem value="day">Día</MenuItem>
                  <MenuItem value="week">Semana</MenuItem>
                  <MenuItem value="month">Mes</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Plataforma</InputLabel>
                <Select
                  label="Plataforma"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform | "")}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="web">Web</MenuItem>
                  <MenuItem value="ios">iOS</MenuItem>
                  <MenuItem value="android">Android</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as number)}
          sx={{ mb: 2 }}
        >
          {TABS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>

        {tab === 0 && (
          <Stack spacing={3}>
            <StatTiles
              tiles={overview?.tiles ?? []}
              loading={loading}
              previousRange={
                overview
                  ? { from: overview.previous_from, to: overview.previous_to }
                  : undefined
              }
            />
            <Card variant="outlined">
              <CardContent>
                <TrendChart trend={trend} loading={loading} />
              </CardContent>
            </Card>
          </Stack>
        )}

        {tab === 1 && (
          <Card variant="outlined">
            <CardContent>
              <TrendChart trend={trend} loading={loading} height={420} />
            </CardContent>
          </Card>
        )}

        {tab === 2 && (
          <Card variant="outlined">
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Typography variant="h6">Ranking de programas</Typography>
                <InstagramExport
                  from={range.from}
                  to={range.to}
                  metric={metric}
                  kind="programs"
                />
              </Box>
              <RankingTable rows={programs} loading={loading} />
            </CardContent>
          </Card>
        )}

        {tab === 3 && (
          <Card variant="outlined">
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Typography variant="h6">Ranking de canales</Typography>
                <InstagramExport
                  from={range.from}
                  to={range.to}
                  metric={metric}
                  kind="channels"
                />
              </Box>
              <RankingTable
                rows={channels}
                loading={loading}
                showChannel={false}
              />
            </CardContent>
          </Card>
        )}

        {tab === 4 && (
          <Card variant="outlined">
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Typography variant="h6">Ranking de streamers</Typography>
                {/* No metric passed: streamers are ranked by their own event,
                    and the picker above only offers program/channel ones. */}
                <InstagramExport
                  from={range.from}
                  to={range.to}
                  kind="streamers"
                />
              </Box>
              <RankingTable
                rows={streamers}
                loading={loading}
                showChannel={false}
              />
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
}
