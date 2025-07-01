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
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { BarChart } from '@mui/icons-material';
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

interface Channel {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
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

// Add type for report request body
interface ReportRequestBody {
  type: 'users' | 'subscriptions';
  format: 'csv';
  from: string;
  to: string;
  page: number;
  pageSize: number;
  action: 'table';
  programId?: number;
}

export default function StatisticsPage() {
  const { status } = useSessionContext();
  const { mode } = useThemeContext();
  
  const [mainTab, setMainTab] = useState(0);
  const mainTabs = [
    'Resumen General',
    'Demografía por Canal',
    'Demografía por Programa',
    'Listados y Reportes',
  ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [demographics, setDemographics] = useState<UserDemographics | null>(null);
  const [usersPageSize] = useState(20);
  const [usersPage] = useState(1);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailToSend, setEmailToSend] = useState('');
  const [emailReports, setEmailReports] = useState<{pdf: boolean, csvUsers: boolean, csvSubs: boolean}>({pdf: true, csvUsers: false, csvSubs: false});

  const hasFetched = useRef(false);

  const [generalFrom, setGeneralFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [generalTo, setGeneralTo] = useState<Dayjs>(dayjs());

  const [channelTabFrom, setChannelTabFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [channelTabTo, setChannelTabTo] = useState<Dayjs>(dayjs());
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [channelsList, setChannelsList] = useState<Channel[]>([]);
  const [channelGroupBy, setChannelGroupBy] = useState<'gender' | 'age'>('gender');

  const [programTabFrom, setProgramTabFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [programTabTo, setProgramTabTo] = useState<Dayjs>(dayjs());
  const [selectedProgramTab, setSelectedProgramTab] = useState<number | null>(null);
  const [programsList, setProgramsList] = useState<Program[]>([]);
  const [programGroupBy, setProgramGroupBy] = useState<'gender' | 'age'>('gender');

  const [listTabFrom, setListTabFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [listTabTo, setListTabTo] = useState<Dayjs>(dayjs());
  const [listUsersPage, setListUsersPage] = useState(1);
  const [listUsersPageSize] = useState(20);
  const [listSubsPage, setListSubsPage] = useState(1);
  const [listSubsPageSize] = useState(20);
  const [listUsersReport, setListUsersReport] = useState<UsersReportResponse>({ users: [], total: 0, page: 1, pageSize: 20 });
  const [listSubsReport, setListSubsReport] = useState<SubsReportResponse>({ subscriptions: [], total: 0, page: 1, pageSize: 20 });

  const fetchGeneralData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError(null);
    try {
      // Fetch demographics first
      const demographicsRes = await fetch(`/api/statistics/demographics?from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}`);
      if (demographicsRes.ok) {
        const demographicsData = await demographicsRes.json();
        setDemographics(demographicsData);
      } else {
        setError('Error al cargar datos del resumen general');
      }
      // Fetch Top 5 in parallel, but don't block demographics
      Promise.all([
        fetch(`/api/statistics/top-channels?metric=subscriptions&from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}&limit=5`),
        fetch(`/api/statistics/top-channels?metric=youtube_clicks&from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}&limit=5`),
        fetch(`/api/statistics/top-programs?metric=subscriptions&from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}&limit=5`),
        fetch(`/api/statistics/top-programs?metric=youtube_clicks&from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}&limit=5`),
      ]).catch(() => {
        // Optionally set a separate error for Top 5, or just ignore
      });
    } catch {
      setError('Error al cargar el resumen general');
    } finally {
      setLoading(false);
    }
  }, [status, generalFrom, generalTo]);

  const fetchUsersReport = useCallback(async () => {
    try {
      const res = await fetch('/api/statistics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'users',
          format: 'csv',
          from: generalFrom.format('YYYY-MM-DD'),
          to: generalTo.format('YYYY-MM-DD'),
          page: usersPage,
          pageSize: usersPageSize,
          action: 'table',
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Users report API error:', errorText);
        setError('Error al cargar usuarios nuevos');
        setListUsersReport({ users: [], total: 0, page: 1, pageSize: 20 });
        return;
      }
      const data: UsersReportResponse = await res.json();
      setListUsersReport(data && data.users ? data : { users: [], total: 0, page: 1, pageSize: 20 });
    } catch (e) {
      console.error('Users report fetch error:', e);
      setError('Error al cargar usuarios nuevos');
      setListUsersReport({ users: [], total: 0, page: 1, pageSize: 20 });
    }
  }, [generalFrom, generalTo, usersPage, usersPageSize]);

  const fetchSubsReport = useCallback(async () => {
    try {
      const body: ReportRequestBody = {
        type: 'subscriptions',
        format: 'csv',
        from: channelTabFrom.format('YYYY-MM-DD'),
        to: channelTabTo.format('YYYY-MM-DD'),
        page: listSubsPage,
        pageSize: listSubsPageSize,
        action: 'table',
      };
      if (selectedProgramTab) body.programId = selectedProgramTab;
      const res = await fetch('/api/statistics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Subs report API error:', errorText);
        setError('Error al cargar suscripciones nuevas');
        setListSubsReport({ subscriptions: [], total: 0, page: 1, pageSize: 20 });
        return;
      }
      const data: SubsReportResponse = await res.json();
      setListSubsReport(data && data.subscriptions ? data : { subscriptions: [], total: 0, page: 1, pageSize: 20 });
    } catch (e) {
      console.error('Subs report fetch error:', e);
      setError('Error al cargar suscripciones nuevas');
      setListSubsReport({ subscriptions: [], total: 0, page: 1, pageSize: 20 });
    }
  }, [channelTabFrom, channelTabTo, listSubsPage, listSubsPageSize, selectedProgramTab]);

  const fetchChannelTabData = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      setLoading(true);
      setError(null);
      const [channelsRes, topSubsRes, topClicksRes] = await Promise.all([
        fetch('/api/channels'),
        fetch(`/api/statistics/top-channels?metric=subscriptions&from=${channelTabFrom.format('YYYY-MM-DD')}&to=${channelTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=${channelGroupBy}`),
        fetch(`/api/statistics/top-channels?metric=youtube_clicks&from=${channelTabFrom.format('YYYY-MM-DD')}&to=${channelTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=${channelGroupBy}`),
      ]);
      if (!channelsRes.ok || !topSubsRes.ok || !topClicksRes.ok) throw new Error('Error al cargar datos de canales');
      setChannelsList(await channelsRes.json());
      // If a channel is selected, fetch its programs' demographics
      if (selectedChannel) {
        const progsRes = await fetch(`/api/statistics/channel-programs-demographics?channelId=${selectedChannel}&from=${channelTabFrom.format('YYYY-MM-DD')}&to=${channelTabTo.format('YYYY-MM-DD')}&groupBy=${channelGroupBy}`);
        if (progsRes.ok) {
          // Handle programs data if needed
        }
      }
    } catch {
      setError('Error al cargar datos de demografía por canal');
    } finally {
      setLoading(false);
    }
  }, [channelTabFrom, channelTabTo, channelGroupBy, selectedChannel]);

  const fetchProgramTabData = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      setLoading(true);
      setError(null);
      const [programsRes, topSubsRes, topClicksRes] = await Promise.all([
        fetch('/api/programs'),
        fetch(`/api/statistics/top-programs?metric=subscriptions&from=${programTabFrom.format('YYYY-MM-DD')}&to=${programTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=${programGroupBy}`),
        fetch(`/api/statistics/top-programs?metric=youtube_clicks&from=${programTabFrom.format('YYYY-MM-DD')}&to=${programTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=${programGroupBy}`),
      ]);
      if (!programsRes.ok || !topSubsRes.ok || !topClicksRes.ok) throw new Error('Error al cargar datos de programas');
      setProgramsList(await programsRes.json());
      // If a program is selected, fetch its demographics
      if (selectedProgramTab) {
        const demoRes = await fetch(`/api/statistics/program-demographics?programId=${selectedProgramTab}&from=${programTabFrom.format('YYYY-MM-DD')}&to=${programTabTo.format('YYYY-MM-DD')}&groupBy=${programGroupBy}`);
        if (demoRes.ok) {
          // Handle demographics data if needed
        }
      }
    } catch {
      setError('Error al cargar datos de demografía por programa');
    } finally {
      setLoading(false);
    }
  }, [programTabFrom, programTabTo, programGroupBy, selectedProgramTab]);

  const fetchListUsersReport = useCallback(async () => {
    try {
      const res = await fetch('/api/statistics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'users',
          format: 'csv',
          from: listTabFrom.format('YYYY-MM-DD'),
          to: listTabTo.format('YYYY-MM-DD'),
          page: listUsersPage,
          pageSize: listUsersPageSize,
          action: 'table',
        }),
      });
      if (!res.ok) {
        setListUsersReport({ users: [], total: 0, page: 1, pageSize: 20 });
        return;
      }
      const data: UsersReportResponse = await res.json();
      setListUsersReport(data && data.users ? data : { users: [], total: 0, page: 1, pageSize: 20 });
    } catch {
      setListUsersReport({ users: [], total: 0, page: 1, pageSize: 20 });
    }
  }, [listTabFrom, listTabTo, listUsersPage, listUsersPageSize]);

  const fetchListSubsReport = useCallback(async () => {
    try {
      const res = await fetch('/api/statistics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscriptions',
          format: 'csv',
          from: listTabFrom.format('YYYY-MM-DD'),
          to: listTabTo.format('YYYY-MM-DD'),
          page: listSubsPage,
          pageSize: listSubsPageSize,
          action: 'table',
        }),
      });
      if (!res.ok) {
        setListSubsReport({ subscriptions: [], total: 0, page: 1, pageSize: 20 });
        return;
      }
      const data: SubsReportResponse = await res.json();
      setListSubsReport(data && data.subscriptions ? data : { subscriptions: [], total: 0, page: 1, pageSize: 20 });
    } catch {
      setListSubsReport({ subscriptions: [], total: 0, page: 1, pageSize: 20 });
    }
  }, [listTabFrom, listTabTo, listSubsPage, listSubsPageSize]);

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      fetchGeneralData();
      hasFetched.current = true;
    }
  }, [status, fetchGeneralData]);

  useEffect(() => { if (mainTab === 3) fetchUsersReport(); }, [mainTab, fetchUsersReport]);
  useEffect(() => { if (mainTab === 3) fetchSubsReport(); }, [mainTab, fetchSubsReport]);
  useEffect(() => { if (mainTab === 1) fetchChannelTabData(); }, [mainTab, fetchChannelTabData]);
  useEffect(() => { if (mainTab === 2) fetchProgramTabData(); }, [mainTab, fetchProgramTabData]);
  useEffect(() => { if (mainTab === 3) fetchListUsersReport(); }, [mainTab, fetchListUsersReport]);
  useEffect(() => { if (mainTab === 3) fetchListSubsReport(); }, [mainTab, fetchListSubsReport]);

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

  // Update handleReportAction to accept multiple report types and channelId
  const handleMultiReportEmail = async (email: string, options: { pdf: boolean, csvUsers: boolean, csvSubs: boolean }, channelId?: number) => {
    const from = generalFrom.format('YYYY-MM-DD');
    const to = generalTo.format('YYYY-MM-DD');
    const requests = [];
    if (options.pdf) {
      requests.push({
        type: 'weekly-summary',
        format: 'pdf',
        from,
        to,
        channelId,
        action: 'email',
        toEmail: email,
      });
    }
    if (options.csvUsers) {
      requests.push({
        type: 'users',
        format: 'csv',
        from,
        to,
        action: 'email',
        toEmail: email,
      });
    }
    if (options.csvSubs) {
      requests.push({
        type: 'subscriptions',
        format: 'csv',
        from,
        to,
        action: 'email',
        toEmail: email,
      });
    }
    // Send all in one request (backend must support array)
    const res = await fetch('/api/statistics/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports: requests }),
    });
    if (!res.ok) setError('Error al enviar el reporte por email');
    else setSuccess('Reporte enviado por email');
  };

  // Move handleEmail above its first usage
  const handleEmail = () => {
    setEmailReports({pdf: true, csvUsers: false, csvSubs: false});
    setEmailDialogOpen(true);
  };

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
            value={mainTab}
            onChange={(_, newValue) => setMainTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: mode === 'light' ? '#6b7280' : '#9ca3af',
                '&.Mui-selected': {
                  color: mode === 'light' ? '#2563eb' : '#3b82f6',
                },
              },
            }}
          >
            {mainTabs.map((tab, index) => (
              <Tab key={index} label={tab} />
            ))}
          </Tabs>
        </Box>

        {/* Resumen General */}
        <TabPanel value={mainTab} index={0}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <DatePicker label="Desde" value={generalFrom} onChange={v => setGeneralFrom(v!)} />
              <DatePicker label="Hasta" value={generalTo} onChange={v => setGeneralTo(v!)} />
            </Box>
          </LocalizationProvider>
          {demographics && (
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              {/* Resumen General */}
              <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Resumen General</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between"><Typography>Total de Usuarios:</Typography><Typography variant="h6" color="primary">{(demographics.totalUsers ?? 0).toLocaleString()}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography>Con Suscripciones:</Typography><Typography variant="h6" color="success.main">{(demographics.usersWithSubscriptions ?? 0).toLocaleString()}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography>Sin Suscripciones:</Typography><Typography variant="h6" color="warning.main">{(demographics.usersWithoutSubscriptions ?? 0).toLocaleString()}</Typography></Box>
                  </Box>
                </CardContent>
              </Card>
              {/* Por Género */}
              <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Distribución por Género</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {Object.entries(demographics.byGender ?? {}).map(([gender, count]) => (
                      <Box key={gender} display="flex" justifyContent="space-between" alignItems="center">
                        <Chip label={getGenderLabel(gender)} size="small" sx={{ backgroundColor: getGenderColor(gender), color: 'white', fontWeight: 'bold' }} />
                        <Typography variant="h6">{(count || 0).toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
              {/* Por Edad */}
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Distribución por Edad</Typography>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
                      {Object.entries(demographics.byAgeGroup ?? {}).map(([ageGroup, count]) => (
                        <Box key={ageGroup} display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ backgroundColor: mode === 'light' ? '#f8fafc' : '#334155', borderRadius: 1, border: `1px solid ${getAgeGroupColor(ageGroup)}20` }}>
                          <Chip label={getAgeGroupLabel(ageGroup)} size="small" sx={{ backgroundColor: getAgeGroupColor(ageGroup), color: 'white', fontWeight: 'bold' }} />
                          <Typography variant="h6">{(count || 0).toLocaleString()}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
          {/* Top 5 Channels/Programs by Subscriptions/Clicks */}
          <Box sx={{ mt: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 5 Canales por Suscripciones</Typography>
                {/* Render bar chart or list for topChannels */}
                {/* ... */}
              </CardContent>
            </Card>
            <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 5 Canales por Clicks en YouTube</Typography>
                {/* Render bar chart or list for topChannelsClicks */}
                {/* ... */}
              </CardContent>
            </Card>
            <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 5 Programas por Suscripciones</Typography>
                {/* Render bar chart or list for topPrograms */}
                {/* ... */}
              </CardContent>
            </Card>
            <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 5 Programas por Clicks en YouTube</Typography>
                {/* Render bar chart or list for topProgramsClicks */}
                {/* ... */}
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Programas Más Populares */}
        <TabPanel value={mainTab} index={1}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <DatePicker label="Desde" value={channelTabFrom} onChange={v => setChannelTabFrom(v!)} />
              <DatePicker label="Hasta" value={channelTabTo} onChange={v => setChannelTabTo(v!)} />
              <FormControl sx={{ minWidth: 240 }} variant="outlined">
                <InputLabel id="channel-label" shrink>Canal</InputLabel>
                <Select
                  labelId="channel-label"
                  value={selectedChannel ?? ''}
                  label="Canal"
                  onChange={e => setSelectedChannel(e.target.value ? Number(e.target.value) : null)}
                  renderValue={val => {
                    const ch = channelsList.find(c => c.id === val);
                    return ch ? ch.name : 'Todos los canales';
                  }}
                  displayEmpty
                >
                  <MenuItem value=""><em>Todos los canales</em></MenuItem>
                  {channelsList.map(ch => (
                    <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Grupo</InputLabel>
                <Select
                  value={channelGroupBy}
                  label="Grupo"
                  onChange={e => setChannelGroupBy(e.target.value as 'gender' | 'age')}
                >
                  <MenuItem value="gender">Por Género</MenuItem>
                  <MenuItem value="age">Por Edad</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </LocalizationProvider>
          {/* Top 5 Channels by Subscriptions/Clicks (grouped) */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 5 Canales por Suscripciones ({channelGroupBy === 'gender' ? 'por Género' : 'por Edad'})</Typography>
                {/* Render bar chart or list for topChannelsBySubs (grouped) */}
                {/* ... */}
              </CardContent>
            </Card>
            <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 5 Canales por Clicks en YouTube ({channelGroupBy === 'gender' ? 'por Género' : 'por Edad'})</Typography>
                {/* Render bar chart or list for topChannelsByClicks (grouped) */}
                {/* ... */}
              </CardContent>
            </Card>
          </Box>
          {/* If a channel is selected, show its programs' demographics */}
          {selectedChannel && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>Demografía de Programas del Canal Seleccionado</Typography>
              {/* Render charts/tables for selectedChannelPrograms (subscriptions/clicks by gender/age) */}
              {/* ... */}
            </Box>
          )}
        </TabPanel>

        {/* Análisis por Programa */}
        <TabPanel value={mainTab} index={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <DatePicker label="Desde" value={programTabFrom} onChange={v => setProgramTabFrom(v!)} />
              <DatePicker label="Hasta" value={programTabTo} onChange={v => setProgramTabTo(v!)} />
              <FormControl sx={{ minWidth: 240 }} variant="outlined">
                <InputLabel id="program-label" shrink>Programa</InputLabel>
                <Select
                  labelId="program-label"
                  value={selectedProgramTab ?? ''}
                  label="Programa"
                  onChange={e => setSelectedProgramTab(e.target.value ? Number(e.target.value) : null)}
                  renderValue={val => {
                    const prog = programsList.find(p => p.id === val);
                    return prog ? prog.name : 'Todos los programas';
                  }}
                  displayEmpty
                >
                  <MenuItem value=""><em>Todos los programas</em></MenuItem>
                  {programsList.map(prog => (
                    <MenuItem key={prog.id} value={prog.id}>{prog.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Grupo</InputLabel>
                <Select
                  value={programGroupBy}
                  label="Grupo"
                  onChange={e => setProgramGroupBy(e.target.value as 'gender' | 'age')}
                >
                  <MenuItem value="gender">Por Género</MenuItem>
                  <MenuItem value="age">Por Edad</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </LocalizationProvider>
          {/* Top 5 Programs by Subscriptions/Clicks (grouped) */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 5 Programas por Suscripciones ({programGroupBy === 'gender' ? 'por Género' : 'por Edad'})</Typography>
                {/* Render bar chart or list for topProgramsBySubsTab (grouped) */}
                {/* ... */}
              </CardContent>
            </Card>
            <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 5 Programas por Clicks en YouTube ({programGroupBy === 'gender' ? 'por Género' : 'por Edad'})</Typography>
                {/* Render bar chart or list for topProgramsByClicksTab (grouped) */}
                {/* ... */}
              </CardContent>
            </Card>
          </Box>
          {/* If a program is selected, show its demographics */}
          {selectedProgramTab && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>Demografía del Programa Seleccionado</Typography>
              {/* Render charts/tables for selectedProgramDemographics (subscriptions/clicks by gender/age) */}
              {/* ... */}
            </Box>
          )}
        </TabPanel>

        {/* Reportes */}
        <TabPanel value={mainTab} index={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <DatePicker label="Desde" value={listTabFrom} onChange={v => setListTabFrom(v!)} />
              <DatePicker label="Hasta" value={listTabTo} onChange={v => setListTabTo(v!)} />
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => handleMultiReportEmail(emailToSend, { pdf: false, csvUsers: true, csvSubs: true }, undefined)}>Descargar CSVs</Button>
              <Button onClick={() => handleMultiReportEmail(emailToSend, { pdf: true, csvUsers: false, csvSubs: false }, undefined)}>Descargar PDF</Button>
              <Button onClick={() => handleEmail()}>Enviar por Email</Button>
            </Box>
          </LocalizationProvider>
          {/* Users Table */}
          <Typography color="text.primary" variant="h6" sx={{ mt: 2, mb: 1 }}>Listado de Usuarios Nuevos</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellido</TableCell>
                  <TableCell>Género</TableCell>
                  <TableCell>Fecha de Nacimiento</TableCell>
                  <TableCell>Fecha de Registro</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(listUsersReport.users || []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{getGenderLabel(user.gender)}</TableCell>
                    <TableCell>{user.birthDate ? dayjs(user.birthDate).format('YYYY-MM-DD') : '-'}</TableCell>
                    <TableCell>{user.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button disabled={listUsersPage === 1} onClick={() => setListUsersPage(p => Math.max(1, p - 1))}>Anterior</Button>
            <Typography color="text.primary" sx={{ mx: 2 }}>Página {listUsersPage}</Typography>
            <Button disabled={listUsersPage * listUsersPageSize >= listUsersReport.total} onClick={() => setListUsersPage(p => p + 1)}>Siguiente</Button>
          </Box>
          {/* Subscriptions Table */}
          <Typography color="text.primary" variant="h6" sx={{ mt: 4, mb: 1 }}>Listado de Suscripciones Nuevas</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Programa</TableCell>
                  <TableCell>Canal</TableCell>
                  <TableCell>Fecha de Suscripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(listSubsReport.subscriptions || []).map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.id}</TableCell>
                    <TableCell>{sub.user ? `${sub.user.firstName} ${sub.user.lastName} (#${sub.user.id})` : '-'}</TableCell>
                    <TableCell>{sub.program ? sub.program.name : '-'}</TableCell>
                    <TableCell>{sub.channel ? sub.channel.name : '-'}</TableCell>
                    <TableCell>{sub.createdAt ? dayjs(sub.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button disabled={listSubsPage === 1} onClick={() => setListSubsPage(p => Math.max(1, p - 1))}>Anterior</Button>
            <Typography color="text.primary" sx={{ mx: 2 }}>Página {listSubsPage}</Typography>
            <Button disabled={listSubsPage * listSubsPageSize >= listSubsReport.total} onClick={() => setListSubsPage(p => p + 1)}>Siguiente</Button>
          </Box>
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

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
        <DialogTitle>Enviar Reporte por Email</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="subtitle2">Selecciona los reportes a enviar:</Typography>
            <Box>
              <FormControlLabel
                control={<Checkbox checked={emailReports.pdf} onChange={e => setEmailReports(r => ({...r, pdf: e.target.checked}))} />}
                label="PDF: Reporte Demográfico y de Actividad"
              />
              <FormControlLabel
                control={<Checkbox checked={emailReports.csvUsers} onChange={e => setEmailReports(r => ({...r, csvUsers: e.target.checked}))} />}
                label="CSV: Listado de Usuarios Nuevos"
              />
              <FormControlLabel
                control={<Checkbox checked={emailReports.csvSubs} onChange={e => setEmailReports(r => ({...r, csvSubs: e.target.checked}))} />}
                label="CSV: Listado de Suscripciones Nuevas"
              />
            </Box>
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Email de destino"
            type="email"
            fullWidth
            variant="outlined"
            value={emailToSend}
            onChange={(e) => setEmailToSend(e.target.value)}
            placeholder="ejemplo@email.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => handleMultiReportEmail(emailToSend, emailReports, undefined)} variant="contained" disabled={!emailToSend}>
            Enviar a este email
          </Button>
          <Button
            onClick={() => handleMultiReportEmail('laguiadelstreaming@gmail.com', emailReports, undefined)}
            variant="outlined"
          >
            Enviar a laguiadelstreaming@gmail.com
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 