'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Button,
  useTheme,
} from '@mui/material';
import {
  People,
  TrendingUp,
  BarChart,
  ExpandMore,
  ShowChart,
} from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';

interface UserDemographics {
  totalUsers: number;
  byGender: {
    male: number;
    female: number;
    non_binary: number;
    rather_not_say: number;
  };
  byAgeGroup: {
    under18: number;
    age18to30: number;
    age30to45: number;
    age45to60: number;
    over60: number;
    unknown: number;
  };
  usersWithSubscriptions: number;
  usersWithoutSubscriptions: number;
}

interface TopProgramsStats {
  programId: number;
  programName: string;
  channelName: string;
  subscriptionCount: number;
  percentageOfTotalUsers: number;
}

interface ProgramSubscriptionStats {
  programId: number;
  programName: string;
  channelName: string;
  totalSubscriptions: number;
  byGender: {
    male: number;
    female: number;
    non_binary: number;
    rather_not_say: number;
  };
  byAgeGroup: {
    under18: number;
    age18to30: number;
    age30to45: number;
    age45to60: number;
    over60: number;
    unknown: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`statistics-tabpanel-${index}`}
      aria-labelledby={`statistics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Add interfaces for report responses
interface UserReport {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string | null;
  createdAt: string;
}

interface SubscriptionReport {
  id: string;
  createdAt: string;
  user: { id: number; firstName: string; lastName: string } | null;
  program: { id: number; name: string } | null;
  channel: { id: number; name: string } | null;
}

interface UsersReportResponse {
  users: UserReport[];
  total: number;
  page: number;
  pageSize: number;
}

interface SubsReportResponse {
  subscriptions: SubscriptionReport[];
  total: number;
  page: number;
  pageSize: number;
}

export default function StatisticsPage() {
  const theme = useTheme();
  const { status } = useSessionContext();
  const { mode } = useThemeContext();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [demographics, setDemographics] = useState<UserDemographics | null>(null);
  const [topPrograms, setTopPrograms] = useState<TopProgramsStats[]>([]);
  const [allProgramsStats, setAllProgramsStats] = useState<ProgramSubscriptionStats[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<number | ''>('');
  const [reportTab, setReportTab] = useState<'users' | 'subscriptions'>('users');
  const [usersFrom, setUsersFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [usersTo, setUsersTo] = useState<Dayjs>(dayjs());
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize] = useState(20);
  const [usersReport, setUsersReport] = useState<UsersReportResponse>({ users: [], total: 0, page: 1, pageSize: 20 });
  const [subsFrom, setSubsFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [subsTo, setSubsTo] = useState<Dayjs>(dayjs());
  const [subsPage, setSubsPage] = useState(1);
  const [subsPageSize] = useState(20);
  const [subsReport, setSubsReport] = useState<SubsReportResponse>({ subscriptions: [], total: 0, page: 1, pageSize: 20 });
  const [usersSortBy, setUsersSortBy] = useState<keyof UserReport | null>(null);
  const [usersSortDir, setUsersSortDir] = useState<'asc' | 'desc'>('asc');
  const [subsSortBy, setSubsSortBy] = useState<keyof SubscriptionReport | null>(null);
  const [subsSortDir, setSubsSortDir] = useState<'asc' | 'desc'>('asc');

  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      setError(null);

      const [demographicsRes, topProgramsRes, allProgramsRes] = await Promise.all([
        fetch('/api/statistics/demographics'),
        fetch('/api/statistics/popular-programs?limit=20'),
        fetch('/api/statistics/programs'),
      ]);

      if (!demographicsRes.ok) throw new Error(`Error ${demographicsRes.status}`);
      if (!topProgramsRes.ok) throw new Error(`Error ${topProgramsRes.status}`);
      if (!allProgramsRes.ok) throw new Error(`Error ${allProgramsRes.status}`);

      const demographicsData = await demographicsRes.json();
      const topProgramsData = await topProgramsRes.json();
      const allProgramsData = await allProgramsRes.json();

      setDemographics(demographicsData);
      setTopPrograms(topProgramsData);
      setAllProgramsStats(allProgramsData);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const fetchUsersReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/statistics/reports/users?from=${usersFrom.format('YYYY-MM-DD')}&to=${usersTo.format('YYYY-MM-DD')}&page=${usersPage}&pageSize=${usersPageSize}`);
      const data: UsersReportResponse = await res.json();
      setUsersReport(data);
    } catch {
      setError('Error al cargar usuarios nuevos');
    }
  }, [usersFrom, usersTo, usersPage, usersPageSize]);

  const fetchSubsReport = useCallback(async () => {
    try {
      let url = `/api/statistics/reports/subscriptions?from=${subsFrom.format('YYYY-MM-DD')}&to=${subsTo.format('YYYY-MM-DD')}&page=${subsPage}&pageSize=${subsPageSize}`;
      if (selectedProgram) url += `&programId=${selectedProgram}`;
      const res = await fetch(url);
      const data: SubsReportResponse = await res.json();
      setSubsReport(data);
    } catch {
      setError('Error al cargar suscripciones nuevas');
    }
  }, [subsFrom, subsTo, subsPage, subsPageSize, selectedProgram]);

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      fetchData();
      hasFetched.current = true;
    }
  }, [status, fetchData]);

  useEffect(() => { if (tabValue === 3) fetchUsersReport(); }, [tabValue, fetchUsersReport]);
  useEffect(() => { if (tabValue === 3) fetchSubsReport(); }, [tabValue, fetchSubsReport]);

  const getGenderLabel = (gender: string) => {
    const labels = {
      male: 'Masculino',
      female: 'Femenino',
      non_binary: 'No binario',
      rather_not_say: 'Prefiero no decir',
    };
    return labels[gender as keyof typeof labels] || gender;
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    const labels = {
      under18: 'Menor de 18',
      age18to30: '18-30 años',
      age30to45: '31-45 años',
      age45to60: '46-60 años',
      over60: 'Más de 60 años',
      unknown: 'Sin fecha de nacimiento',
    };
    return labels[ageGroup as keyof typeof labels] || ageGroup;
  };

  const getGenderColor = (gender: string) => {
    const colors = {
      male: '#3b82f6',
      female: '#ec4899',
      non_binary: '#8b5cf6',
      rather_not_say: '#6b7280',
    };
    return colors[gender as keyof typeof colors] || '#6b7280';
  };

  const getAgeGroupColor = (ageGroup: string) => {
    const colors = {
      under18: '#ef4444',
      age18to30: '#f59e0b',
      age30to45: '#10b981',
      age45to60: '#3b82f6',
      over60: '#8b5cf6',
      unknown: '#6b7280',
    };
    return colors[ageGroup as keyof typeof colors] || '#6b7280';
  };

  // Refactor sortArray to avoid 'any'
  function isSubscriptionReport(obj: unknown): obj is SubscriptionReport {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'createdAt' in obj &&
      'user' in obj &&
      'program' in obj &&
      'channel' in obj
    );
  }

  function sortArray<T>(arr: T[], sortBy: keyof T | null, dir: 'asc' | 'desc'): T[] {
    if (!sortBy) return arr;
    return [...arr].sort((a, b) => {
      // For subscriptions, handle nested fields
      if (sortBy === 'user' && isSubscriptionReport(a) && isSubscriptionReport(b)) {
        const aUser = a.user?.lastName || '';
        const bUser = b.user?.lastName || '';
        return dir === 'asc' ? aUser.localeCompare(bUser) : bUser.localeCompare(aUser);
      }
      if (sortBy === 'program' && isSubscriptionReport(a) && isSubscriptionReport(b)) {
        const aProg = a.program?.name || '';
        const bProg = b.program?.name || '';
        return dir === 'asc' ? aProg.localeCompare(bProg) : bProg.localeCompare(aProg);
      }
      if (sortBy === 'channel' && isSubscriptionReport(a) && isSubscriptionReport(b)) {
        const aChan = a.channel?.name || '';
        const bChan = b.channel?.name || '';
        return dir === 'asc' ? aChan.localeCompare(bChan) : bChan.localeCompare(aChan);
      }
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return dir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }

  if (status === 'loading') {
    return (
      <Box
        sx={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            color: mode === 'light' ? '#111827' : '#f1f5f9',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <BarChart />
          Estadísticas
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: mode === 'light' ? '#6b7280' : '#9ca3af',
                '&.Mui-selected': {
                  color: mode === 'light' ? '#2563eb' : '#3b82f6',
                },
              },
            }}
          >
            <Tab label="Demografía de Usuarios" icon={<People />} />
            <Tab label="Programas Más Populares" icon={<TrendingUp />} />
            <Tab label="Análisis por Programa" icon={<ShowChart />} />
            <Tab label="Reportes" icon={<BarChart />} />
          </Tabs>
        </Box>

        {/* Demografía de Usuarios */}
        <TabPanel value={tabValue} index={0}>
          {demographics && (
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                },
              }}
            >
              {/* Resumen General */}
              <Card
                sx={{
                  backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                  border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen General
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Total de Usuarios:</Typography>
                      <Typography variant="h6" color="primary">
                        {(demographics.totalUsers || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Con Suscripciones:</Typography>
                      <Typography variant="h6" color="success.main">
                        {(demographics.usersWithSubscriptions || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Sin Suscripciones:</Typography>
                      <Typography variant="h6" color="warning.main">
                        {(demographics.usersWithoutSubscriptions || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Por Género */}
              <Card
                sx={{
                  backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                  border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribución por Género
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {Object.entries(demographics.byGender).map(([gender, count]) => (
                      <Box key={gender} display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={getGenderLabel(gender)}
                          size="small"
                          sx={{
                            backgroundColor: getGenderColor(gender),
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                        <Typography variant="h6">
                          {(count || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* Por Grupo de Edad */}
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Card
                  sx={{
                    backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                    border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Distribución por Edad
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(3, 1fr)',
                        },
                      }}
                    >
                      {Object.entries(demographics.byAgeGroup).map(([ageGroup, count]) => (
                        <Box
                          key={ageGroup}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          p={2}
                          sx={{
                            backgroundColor: mode === 'light' ? '#f8fafc' : '#334155',
                            borderRadius: 1,
                            border: `1px solid ${getAgeGroupColor(ageGroup)}20`,
                          }}
                        >
                          <Chip
                            label={getAgeGroupLabel(ageGroup)}
                            size="small"
                            sx={{
                              backgroundColor: getAgeGroupColor(ageGroup),
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                          <Typography variant="h6">
                            {(count || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </TabPanel>

        {/* Programas Más Populares */}
        <TabPanel value={tabValue} index={1}>
          <Card
            sx={{
              backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
              border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 20 Programas por Suscripciones
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Posición</TableCell>
                      <TableCell>Programa</TableCell>
                      <TableCell>Canal</TableCell>
                      <TableCell align="right">Suscripciones</TableCell>
                      <TableCell align="right">% del Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topPrograms.map((program, index) => (
                      <TableRow key={program.programId}>
                        <TableCell>
                          <Chip
                            label={`#${index + 1}`}
                            size="small"
                            color={index < 3 ? 'primary' : 'default'}
                            variant={index < 3 ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {program.programName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={program.channelName} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            {(program.subscriptionCount || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {(program.percentageOfTotalUsers || 0).toFixed(1)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Análisis por Programa */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ maxWidth: 400 }}>
              <InputLabel>Seleccionar Programa</InputLabel>
              <Select
                value={selectedProgram}
                label="Seleccionar Programa"
                onChange={(e) => setSelectedProgram(e.target.value)}
              >
                <MenuItem value="">
                  <em>Todos los programas</em>
                </MenuItem>
                {allProgramsStats.map((program) => (
                  <MenuItem key={program.programId} value={program.programId}>
                    {program.programName} ({program.channelName})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            {selectedProgram ? (
              // Mostrar estadísticas de un programa específico
              (() => {
                const program = allProgramsStats.find(p => p.programId === selectedProgram);
                if (!program) return null;

                return (
                  <Card
                    sx={{
                      backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                      border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        {program.programName}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        {program.channelName} • {(program.totalSubscriptions || 0)} suscripciones
                      </Typography>

                      <Box
                        sx={{
                          display: 'grid',
                          gap: 3,
                          mt: 2,
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(2, 1fr)',
                          },
                        }}
                      >
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Por Género
                          </Typography>
                          <Box display="flex" flexDirection="column" gap={1}>
                            {Object.entries(program.byGender).map(([gender, count]) => (
                              <Box key={gender} display="flex" justifyContent="space-between" alignItems="center">
                                <Chip
                                  label={getGenderLabel(gender)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getGenderColor(gender),
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                />
                                <Typography>{(count || 0).toLocaleString()}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Por Edad
                          </Typography>
                          <Box display="flex" flexDirection="column" gap={1}>
                            {Object.entries(program.byAgeGroup).map(([ageGroup, count]) => (
                              <Box key={ageGroup} display="flex" justifyContent="space-between" alignItems="center">
                                <Chip
                                  label={getAgeGroupLabel(ageGroup)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getAgeGroupColor(ageGroup),
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                />
                                <Typography>{(count || 0).toLocaleString()}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })()
            ) : (
              // Mostrar todos los programas en acordeón
              <Box>
                {allProgramsStats.map((program) => (
                  <Accordion
                    key={program.programId}
                    sx={{
                      backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
                      border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                      mb: 1,
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                        <Box>
                          <Typography variant="h6">{program.programName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {program.channelName}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={`${(program.totalSubscriptions || 0)} suscripciones`}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 3,
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(2, 1fr)',
                          },
                        }}
                      >
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Por Género
                          </Typography>
                          <Box display="flex" flexDirection="column" gap={1}>
                            {Object.entries(program.byGender).map(([gender, count]) => (
                              <Box key={gender} display="flex" justifyContent="space-between" alignItems="center">
                                <Chip
                                  label={getGenderLabel(gender)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getGenderColor(gender),
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                />
                                <Typography>{(count || 0).toLocaleString()}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Por Edad
                          </Typography>
                          <Box display="flex" flexDirection="column" gap={1}>
                            {Object.entries(program.byAgeGroup).map(([ageGroup, count]) => (
                              <Box key={ageGroup} display="flex" justifyContent="space-between" alignItems="center">
                                <Chip
                                  label={getAgeGroupLabel(ageGroup)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getAgeGroupColor(ageGroup),
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                />
                                <Typography>{(count || 0).toLocaleString()}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Reportes */}
        <TabPanel value={tabValue} index={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Tab
                label="Usuarios Nuevos"
                value="users"
                onClick={() => setReportTab('users')}
                sx={{ 
                  fontWeight: reportTab === 'users' ? 'bold' : 'normal',
                  color: theme.palette.text.primary,
                }}
              />
              <Tab
                label="Suscripciones Nuevas"
                value="subscriptions"
                onClick={() => setReportTab('subscriptions')}
                sx={{ 
                  fontWeight: reportTab === 'subscriptions' ? 'bold' : 'normal',
                  color: theme.palette.text.primary,
                }}
              />
            </Box>
            {reportTab === 'users' && (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <DatePicker label="Desde" value={usersFrom} onChange={v => setUsersFrom(v!)} />
                  <DatePicker label="Hasta" value={usersTo} onChange={v => setUsersTo(v!)} />
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {['id', 'firstName', 'lastName', 'gender', 'birthDate', 'createdAt'].map((col) => (
                          <TableCell
                            key={col}
                            color="text.primary"
                            onClick={() => {
                              if (usersSortBy === col) {
                                setUsersSortDir(usersSortDir === 'asc' ? 'desc' : 'asc');
                              } else {
                                setUsersSortBy(col as keyof UserReport);
                                setUsersSortDir('asc');
                              }
                            }}
                            sx={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            {col === 'id' ? 'ID' :
                             col === 'firstName' ? 'Nombre' :
                             col === 'lastName' ? 'Apellido' :
                             col === 'gender' ? 'Género' :
                             col === 'birthDate' ? 'Fecha de Nacimiento' :
                             col === 'createdAt' ? 'Fecha de Registro' : col}
                            {usersSortBy === col ? (usersSortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortArray(usersReport.users, usersSortBy, usersSortDir).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell color="text.primary">{user.id}</TableCell>
                          <TableCell color="text.primary">{user.firstName}</TableCell>
                          <TableCell color="text.primary">{user.lastName}</TableCell>
                          <TableCell color="text.primary">{getGenderLabel(user.gender)}</TableCell>
                          <TableCell color="text.primary">{user.birthDate ? dayjs(user.birthDate).format('YYYY-MM-DD') : '-'}</TableCell>
                          <TableCell color="text.primary">{user.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                  <Typography color="text.primary">Página {usersPage}</Typography>
                  <Button disabled={usersPage === 1} onClick={() => setUsersPage(p => Math.max(1, p - 1))}>Anterior</Button>
                  <Button disabled={usersPage * usersPageSize >= usersReport.total} onClick={() => setUsersPage(p => p + 1)}>Siguiente</Button>
                </Box>
              </Box>
            )}
            {reportTab === 'subscriptions' && (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <DatePicker label="Desde" value={subsFrom} onChange={v => setSubsFrom(v!)} />
                  <DatePicker label="Hasta" value={subsTo} onChange={v => setSubsTo(v!)} />
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {['id', 'user', 'program', 'channel', 'createdAt'].map((col) => (
                          <TableCell
                            key={col}
                            color="text.primary"
                            onClick={() => {
                              if (subsSortBy === col) {
                                setSubsSortDir(subsSortDir === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSubsSortBy(col as keyof SubscriptionReport);
                                setSubsSortDir('asc');
                              }
                            }}
                            sx={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            {col === 'id' ? 'ID' :
                             col === 'user' ? 'Usuario' :
                             col === 'program' ? 'Programa' :
                             col === 'channel' ? 'Canal' :
                             col === 'createdAt' ? 'Fecha de Suscripción' : col}
                            {subsSortBy === col ? (subsSortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortArray(subsReport.subscriptions, subsSortBy, subsSortDir).map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell color="text.primary">{sub.id}</TableCell>
                          <TableCell color="text.primary">{sub.user ? `${sub.user.firstName} ${sub.user.lastName} (#${sub.user.id})` : '-'}</TableCell>
                          <TableCell color="text.primary">{sub.program ? sub.program.name : '-'}</TableCell>
                          <TableCell color="text.primary">{sub.channel ? sub.channel.name : '-'}</TableCell>
                          <TableCell color="text.primary">{sub.createdAt ? dayjs(sub.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                  <Typography>Página {subsPage}</Typography>
                  <Button disabled={subsPage === 1} onClick={() => setSubsPage(p => Math.max(1, p - 1))}>Anterior</Button>
                  <Button disabled={subsPage * subsPageSize >= subsReport.total} onClick={() => setSubsPage(p => p + 1)}>Siguiente</Button>
                </Box>
              </Box>
            )}
          </LocalizationProvider>
        </TabPanel>
      </Box>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => { setError(null); setSuccess(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => { setError(null); setSuccess(null); }}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </>
  );
} 