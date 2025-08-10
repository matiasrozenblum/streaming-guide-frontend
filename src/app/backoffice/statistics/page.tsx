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
    unknown: number;
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

// Add interfaces for top rankings data
interface TopChannel {
  id: number;
  name: string;
  count: number;
}

interface TopProgram {
  id: number;
  name: string;
  channelName: string;
  count: number;
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

// Add interfaces for stacked bar chart data
interface StackedBarDatum {
  id: number;
  name: string;
  channelName?: string;
  counts: Record<string, number>;
}

// Add utility to get filtered and ranked data for charts
function getFilteredRankedData({
  data,
  selectedIds,
  genderFilter,
  ageFilter,
  filterType,
  channelsList,
  programsList,
}: {
  data: (TopChannel | TopProgram | StackedBarDatum)[];
  selectedIds: number[];
  genderFilter: string[];
  ageFilter: string[];
  filterType?: 'channel' | 'program';
  channelsList?: Channel[];
  programsList?: Program[];
}) {
  function hasCounts(obj: unknown): obj is { counts: Record<string, number> } {
    return Boolean(typeof obj === 'object' && obj !== null && 'counts' in obj);
  }
  let filtered = data;



  // If data has no id, filter by name
  if (selectedIds.length > 0) {
    if (filterType === 'channel' && channelsList) {
      const selectedNames = channelsList.filter(c => selectedIds.includes(c.id)).map(c => c.name);
      filtered = filtered.filter((item: TopChannel | TopProgram | StackedBarDatum) => selectedNames.includes(item.name));
    } else if (filterType === 'program' && programsList) {
      const selectedNames = programsList.filter(p => selectedIds.includes(p.id)).map(p => p.name);
      filtered = filtered.filter((item: TopChannel | TopProgram | StackedBarDatum) => selectedNames.includes(item.name));
    } else {
      filtered = filtered.filter((item: TopChannel | TopProgram | StackedBarDatum) => selectedIds.includes(Number(item.id)));
    }
  }

  if (genderFilter && genderFilter.length < 4) {
    filtered = filtered.filter((item: TopChannel | TopProgram | StackedBarDatum) => {
      if (!hasCounts(item)) return true;
      return genderFilter.some((g: string) => item.counts[g] > 0);
    });
  }
  if (ageFilter && ageFilter.length < 6) {
    filtered = filtered.filter((item: TopChannel | TopProgram | StackedBarDatum) => {
      if (!hasCounts(item)) return true;
      return ageFilter.some((a: string) => item.counts[a] > 0);
    });
  }

  return filtered.slice(0, 5).map((item: TopChannel | TopProgram | StackedBarDatum, i: number) => ({ ...item, realOrder: i + 1 }));
}

// Update the stacked bar data filtering to handle channel/program selection
function filterStackedBarData(data: StackedBarDatum[], genderFilter: string[], ageFilter: string[], groupBy: 'gender' | 'age', selectedIds: number[], filterType?: 'channel' | 'program', channelsList?: Channel[], programsList?: Program[]) {
  let filtered = data;

  if (selectedIds.length > 0) {
    if (filterType === 'channel' && channelsList) {
      const selectedNames = channelsList.filter(c => selectedIds.includes(c.id)).map(c => c.name);
      filtered = filtered.filter((item: TopChannel | TopProgram | StackedBarDatum) => selectedNames.includes(item.name));
    } else if (filterType === 'program' && programsList) {
      const selectedNames = programsList.filter(p => selectedIds.includes(p.id)).map(p => p.name);
      filtered = filtered.filter((item: TopChannel | TopProgram | StackedBarDatum) => selectedNames.includes(item.name));
    } else {
      filtered = filtered.filter((item: TopChannel | TopProgram | StackedBarDatum) => selectedIds.includes(Number(item.id)));
    }
  }

  if (groupBy === 'gender') {
    const result = filtered
      .map(item => {
        const filteredCounts: Record<string, number> = {};
        genderFilter.forEach(g => { filteredCounts[g] = item.counts[g] || 0; });
        return { ...item, counts: filteredCounts };
      })
      .filter(item => genderFilter.some(g => item.counts[g] > 0));

    return result;
  } else {
    const result = filtered
      .map(item => {
        const filteredCounts: Record<string, number> = {};
        ageFilter.forEach(a => { filteredCounts[a] = item.counts[a] || 0; });
        return { ...item, counts: filteredCounts };
      })
      .filter(item => ageFilter.some(a => item.counts[a] > 0));

    return result;
  }
}

// Place this after imports, before any component
function hasCount(
  obj: unknown
): obj is (TopChannel & { count: number }) | (TopProgram & { count: number }) | ({ count: number } & Record<string, unknown>) {
  return typeof obj === 'object' && obj !== null && 'count' in obj && typeof (obj as { count: unknown }).count === 'number';
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
    'Reportes Completos',
  ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadingReports, setDownloadingReports] = useState<Set<string>>(new Set());
  const [sendingReports, setSendingReports] = useState<Set<string>>(new Set());
  const [demographics, setDemographics] = useState<UserDemographics | null>(null);
  const [usersPageSize] = useState(20);
  const [usersPage] = useState(1);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailToSend, setEmailToSend] = useState('');
  const [emailReports, setEmailReports] = useState<{pdf: boolean, csvUsers: boolean, csvSubs: boolean}>({pdf: true, csvUsers: false, csvSubs: false});

  // Add state for top 5 rankings
  const [topChannelsBySubs, setTopChannelsBySubs] = useState<TopChannel[]>([]);
  const [topChannelsByClicks, setTopChannelsByClicks] = useState<TopChannel[]>([]);
  const [topProgramsBySubs, setTopProgramsBySubs] = useState<TopProgram[]>([]);
  const [topProgramsByClicks, setTopProgramsByClicks] = useState<TopProgram[]>([]);

  // Add state for channel tab stacked charts
  const [topChannelsSubsByGender, setTopChannelsSubsByGender] = useState<StackedBarDatum[]>([]);
  const [topChannelsClicksByGender, setTopChannelsClicksByGender] = useState<StackedBarDatum[]>([]);
  const [topChannelsSubsByAge, setTopChannelsSubsByAge] = useState<StackedBarDatum[]>([]);
  const [topChannelsClicksByAge, setTopChannelsClicksByAge] = useState<StackedBarDatum[]>([]);

  // Add state for program tab stacked charts
  const [topProgramsSubsByGender, setTopProgramsSubsByGender] = useState<StackedBarDatum[]>([]);
  const [topProgramsClicksByGender, setTopProgramsClicksByGender] = useState<StackedBarDatum[]>([]);
  const [topProgramsSubsByAge, setTopProgramsSubsByAge] = useState<StackedBarDatum[]>([]);
  const [topProgramsClicksByAge, setTopProgramsClicksByAge] = useState<StackedBarDatum[]>([]);

  const hasFetched = useRef(false);

  const [generalFrom, setGeneralFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [generalTo, setGeneralTo] = useState<Dayjs>(dayjs());

  const [channelTabFrom, setChannelTabFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [channelTabTo, setChannelTabTo] = useState<Dayjs>(dayjs());
  const [channelsList, setChannelsList] = useState<Channel[]>([]);

  const [programTabFrom, setProgramTabFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [programTabTo, setProgramTabTo] = useState<Dayjs>(dayjs());
  const [programsList, setProgramsList] = useState<Program[]>([]);

  const [listTabFrom, setListTabFrom] = useState<Dayjs>(dayjs().subtract(7, 'day'));
  const [listTabTo, setListTabTo] = useState<Dayjs>(dayjs());
  const [listUsersPage, setListUsersPage] = useState(1);
  const [listUsersPageSize] = useState(20);
  const [listSubsPage, setListSubsPage] = useState(1);
  const [listSubsPageSize] = useState(20);
  const [listUsersReport, setListUsersReport] = useState<UsersReportResponse>({ users: [], total: 0, page: 1, pageSize: 20 });
  const [listSubsReport, setListSubsReport] = useState<SubsReportResponse>({ subscriptions: [], total: 0, page: 1, pageSize: 20 });

  const GENDER_OPTIONS = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
    { value: 'non_binary', label: 'No binario' },
    { value: 'rather_not_say', label: 'Prefiero no decir' },
    { value: 'unknown', label: 'Sin género' },
  ];
  const AGE_GROUP_OPTIONS = [
    { value: 'under18', label: 'Menor de 18' },
    { value: 'age18to30', label: '18-30 años' },
    { value: 'age30to45', label: '31-45 años' },
    { value: 'age45to60', label: '46-60 años' },
    { value: 'over60', label: 'Más de 60 años' },
    { value: 'unknown', label: 'Sin fecha de nacimiento' },
  ];
  const [selectedChannelGenders, setSelectedChannelGenders] = useState(GENDER_OPTIONS.map(o => o.value));
  const [selectedChannelAges, setSelectedChannelAges] = useState(AGE_GROUP_OPTIONS.map(o => o.value));

  // State for multi-select
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]); // for channel tab
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]); // for program tab

  // Unified state for reports
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null); // null means "Todos los canales"
  const [reportFrom, setReportFrom] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [reportTo, setReportTo] = useState<Dayjs | null>(dayjs());
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>('custom');

  // Add channels loading for reports tab
  const fetchChannelsForReports = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const channelsRes = await fetch('/api/channels');
      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannelsList(channelsData);
      }
    } catch (error) {
      console.error('Error loading channels for reports:', error);
    }
  }, [status]);

  // Date picker handlers to automatically set period to 'custom'
  const handleReportFromChange = (date: Dayjs | null) => {
    setReportFrom(date);
    setReportPeriod('custom');
  };

  const handleReportToChange = (date: Dayjs | null) => {
    setReportTo(date);
    setReportPeriod('custom');
  };

  // Period button handlers to update dates
  const handlePeriodChange = (period: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
    setReportPeriod(period);
    const now = dayjs();
    
    switch (period) {
      case 'weekly':
        setReportFrom(now.subtract(7, 'day'));
        setReportTo(now);
        break;
      case 'monthly':
        setReportFrom(now.subtract(1, 'month'));
        setReportTo(now);
        break;
      case 'quarterly':
        setReportFrom(now.subtract(3, 'month'));
        setReportTo(now);
        break;
      case 'yearly':
        setReportFrom(now.subtract(1, 'year'));
        setReportTo(now);
        break;
    }
  };

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
      
      // Fetch Top 5 in parallel
      const [topChannelsSubsRes, topChannelsClicksRes, topProgramsSubsRes, topProgramsClicksRes] = await Promise.all([
        fetch(`/api/statistics/top-channels?metric=subscriptions&from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}&limit=5`),
        fetch(`/api/statistics/top-channels?metric=youtube_clicks&from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}&limit=5`),
        fetch(`/api/statistics/top-programs?metric=subscriptions&from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}&limit=5`),
        fetch(`/api/statistics/top-programs?metric=youtube_clicks&from=${generalFrom.format('YYYY-MM-DD')}&to=${generalTo.format('YYYY-MM-DD')}&limit=5`),
      ]);
      
      // Process responses
      if (topChannelsSubsRes.ok) {
        const data = await topChannelsSubsRes.json();
        setTopChannelsBySubs(data || []);
      }
      if (topChannelsClicksRes.ok) {
        const data = await topChannelsClicksRes.json();
        setTopChannelsByClicks(data || []);
      }
      if (topProgramsSubsRes.ok) {
        const data = await topProgramsSubsRes.json();
        setTopProgramsBySubs(data || []);
      }
      if (topProgramsClicksRes.ok) {
        const data = await topProgramsClicksRes.json();
        setTopProgramsByClicks(data || []);
      }
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
  }, [channelTabFrom, channelTabTo, listSubsPage, listSubsPageSize]);

  const fetchChannelTabData = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      setLoading(true);
      setError(null);
      const [channelsRes, subsByGenderRes, clicksByGenderRes, subsByAgeRes, clicksByAgeRes] = await Promise.all([
        fetch('/api/channels'),
        fetch(`/api/statistics/top-channels?metric=subscriptions&from=${channelTabFrom.format('YYYY-MM-DD')}&to=${channelTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=gender`),
        fetch(`/api/statistics/top-channels?metric=youtube_clicks&from=${channelTabFrom.format('YYYY-MM-DD')}&to=${channelTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=gender`),
        fetch(`/api/statistics/top-channels?metric=subscriptions&from=${channelTabFrom.format('YYYY-MM-DD')}&to=${channelTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=age`),
        fetch(`/api/statistics/top-channels?metric=youtube_clicks&from=${channelTabFrom.format('YYYY-MM-DD')}&to=${channelTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=age`),
      ]);
      if (!channelsRes.ok) throw new Error('Error al cargar canales');
      setChannelsList(await channelsRes.json());
      setTopChannelsSubsByGender(subsByGenderRes.ok ? await subsByGenderRes.json() : []);
      setTopChannelsClicksByGender(clicksByGenderRes.ok ? await clicksByGenderRes.json() : []);
      setTopChannelsSubsByAge(subsByAgeRes.ok ? await subsByAgeRes.json() : []);
      setTopChannelsClicksByAge(clicksByAgeRes.ok ? await clicksByAgeRes.json() : []);
    } catch {
      setError('Error al cargar datos de demografía por canal');
    } finally {
      setLoading(false);
    }
  }, [channelTabFrom, channelTabTo, status]);

  const fetchProgramTabData = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      setLoading(true);
      setError(null);
      const [programsRes, subsByGenderRes, clicksByGenderRes, subsByAgeRes, clicksByAgeRes] = await Promise.all([
        fetch('/api/programs'),
        fetch(`/api/statistics/top-programs?metric=subscriptions&from=${programTabFrom.format('YYYY-MM-DD')}&to=${programTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=gender`),
        fetch(`/api/statistics/top-programs?metric=youtube_clicks&from=${programTabFrom.format('YYYY-MM-DD')}&to=${programTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=gender`),
        fetch(`/api/statistics/top-programs?metric=subscriptions&from=${programTabFrom.format('YYYY-MM-DD')}&to=${programTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=age`),
        fetch(`/api/statistics/top-programs?metric=youtube_clicks&from=${programTabFrom.format('YYYY-MM-DD')}&to=${programTabTo.format('YYYY-MM-DD')}&limit=5&groupBy=age`),
      ]);
      if (!programsRes.ok) throw new Error('Error al cargar programas');
      setProgramsList(await programsRes.json());
      setTopProgramsSubsByGender(subsByGenderRes.ok ? await subsByGenderRes.json() : []);
      setTopProgramsClicksByGender(clicksByGenderRes.ok ? await clicksByGenderRes.json() : []);
      setTopProgramsSubsByAge(subsByAgeRes.ok ? await subsByAgeRes.json() : []);
      setTopProgramsClicksByAge(clicksByAgeRes.ok ? await clicksByAgeRes.json() : []);
    } catch {
      setError('Error al cargar datos de demografía por programa');
    } finally {
      setLoading(false);
    }
  }, [programTabFrom, programTabTo, status]);

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
      fetchChannelsForReports(); // Load channels immediately
      hasFetched.current = true;
    }
  }, [status, fetchGeneralData, fetchChannelsForReports]);

  // Auto-refresh when date range changes
  useEffect(() => {
    if (status === 'authenticated' && hasFetched.current) {
      fetchGeneralData();
    }
  }, [generalFrom, generalTo, fetchGeneralData, status]);

  useEffect(() => { if (mainTab === 3) fetchUsersReport(); }, [mainTab, fetchUsersReport]);
  useEffect(() => { if (mainTab === 3) fetchSubsReport(); }, [mainTab, fetchSubsReport]);
  useEffect(() => { if (mainTab === 1) fetchChannelTabData(); }, [mainTab, fetchChannelTabData]);
  useEffect(() => { if (mainTab === 2) fetchProgramTabData(); }, [mainTab, fetchProgramTabData]);
  useEffect(() => { if (mainTab === 3) fetchListUsersReport(); }, [mainTab, fetchListUsersReport]);
  useEffect(() => { if (mainTab === 3) fetchListSubsReport(); }, [mainTab, fetchListSubsReport]);
  useEffect(() => { if (mainTab === 4) fetchChannelsForReports(); }, [mainTab, fetchChannelsForReports]);

  const getGenderLabel = (gender: string) => {
    const labels = {
      male: 'Masculino',
      female: 'Femenino',
      non_binary: 'No binario',
      rather_not_say: 'Prefiero no decir',
      unknown: 'Sin género',
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
      rather_not_say: '#5db510',
      unknown: '#6b7280',
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

  // Horizontal Bar Chart Component
  const HorizontalBarChart = ({ 
    data, 
    title, 
    maxValue, 
    color = '#3b82f6',
    showChannel = false 
  }: { 
    data: (TopChannel | TopProgram | StackedBarDatum)[], 
    title: string, 
    maxValue: number,
    color?: string,
    showChannel?: boolean
  }) => {
    if (!data || data.length === 0) {
      return (
        <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <Typography variant="body2" color="text.secondary">No hay datos disponibles</Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{title}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {(data.filter(hasCount) as Array<{ count: number; id: number; name: string; channelName?: string }> ).map((item, index) => {
              const count = item.count;
              const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
              const isProgram = 'channelName' in item;
              
              return (
                <Box key={item.id || index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      minWidth: 20, 
                      fontWeight: 'bold',
                      color: mode === 'light' ? '#374151' : '#d1d5db'
                    }}
                  >
                    #{index + 1}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'medium',
                        color: mode === 'light' ? '#111827' : '#f9fafb',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.name}
                    </Typography>
                    {showChannel && isProgram && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: mode === 'light' ? '#6b7280' : '#9ca3af',
                          fontSize: '0.75rem'
                        }}
                      >
                        {item.channelName}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ position: 'relative', flex: 1, maxWidth: 200 }}>
                    <Box
                      sx={{
                        height: 24,
                        backgroundColor: mode === 'light' ? '#f3f4f6' : '#374151',
                        borderRadius: 1,
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: color,
                          borderRadius: 1,
                          transition: 'width 0.3s ease-in-out'
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        {count.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Stacked Horizontal Bar Chart Component
  const GENDER_KEYS = ['male', 'female', 'non_binary', 'rather_not_say', 'unknown'] as const;
  const AGE_KEYS = ['under18', 'age18to30', 'age30to45', 'age45to60', 'over60', 'unknown'] as const;

  const GENDER_COLORS = {
    male: '#3b82f6',
    female: '#ec4899',
    non_binary: '#8b5cf6',
    rather_not_say: '#5db510',
    unknown: '#6b7280',
  };
  const AGE_COLORS = {
    under18: '#ef4444',
    age18to30: '#f59e0b',
    age30to45: '#10b981',
    age45to60: '#3b82f6',
    over60: '#8b5cf6',
    unknown: '#6b7280',
  };

  function StackedHorizontalBarChart({
    data,
    title,
    keys,
    colors,
    getLabel,
    maxBars = 5,
    showChannel = false,
    legend = true,
  }: {
    data: StackedBarDatum[];
    title: string;
    keys: readonly string[];
    colors: Record<string, string>;
    getLabel: (key: string) => string;
    maxBars?: number;
    showChannel?: boolean;
    legend?: boolean;
  }) {
    if (!data || data.length === 0) {
      return (
        <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <Typography variant="body2" color="text.secondary">No hay datos disponibles</Typography>
          </CardContent>
        </Card>
      );
    }
    // Only show top N
    const topData = data.slice(0, maxBars);
    return (
      <Card sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b', border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{title}</Typography>
          <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              {topData.map((item, index) => {
                const total = keys.reduce((sum, k) => sum + (item.counts?.[k] ?? 0), 0);
                return (
                  <Box key={item.id || index} sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ minWidth: 20, fontWeight: 'bold', color: mode === 'light' ? '#374151' : '#d1d5db' }}>#{index + 1}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: mode === 'light' ? '#111827' : '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Typography>
                      {showChannel && item.channelName && (
                        <Typography variant="caption" sx={{ color: mode === 'light' ? '#6b7280' : '#9ca3af', fontSize: '0.75rem' }}>{item.channelName}</Typography>
                      )} 
                    </Box>
                    <Box sx={{ position: 'relative', flex: 1, minWidth: 120, maxWidth: 320, display: 'flex', height: 28, backgroundColor: mode === 'light' ? '#f3f4f6' : '#374151', borderRadius: 1, overflow: 'hidden' }}>
                      {keys.map((k) => {
                        const value = item.counts?.[k] ?? 0;
                        const width = total > 0 ? (value / total) * 100 : 0;
                        if (value === 0) return null;
                        return (
                          <Box
                            key={k}
                            sx={{
                              width: `${width}%`,
                              backgroundColor: colors[k],
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: width > 10 ? 'center' : 'flex-end',
                              position: 'relative',
                              transition: 'width 0.3s',
                            }}
                          >
                            {width > 10 && (
                              <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{value}</Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                    <Typography variant="caption" sx={{ minWidth: 24, textAlign: 'right', color: mode === 'light' ? '#111827' : '#f9fafb', fontWeight: 'bold', fontSize: '0.9rem', ml: 1 }}>{total}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
          {legend && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              {keys.map(k => (
                <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: colors[k], borderRadius: 0.5, border: '1px solid #e5e7eb' }} />
                  <Typography variant="caption" sx={{ color: mode === 'light' ? '#374151' : '#d1d5db' }}>{getLabel(k)}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // Filtering for Channel Tab (flat data, if needed)
  const filteredTopChannelsBySubs = getFilteredRankedData({
    data: topChannelsBySubs,
    selectedIds: selectedChannels,
    genderFilter: selectedChannelGenders,
    ageFilter: selectedChannelAges,
    filterType: 'channel',
    channelsList,
  });
  const filteredTopChannelsByClicks = getFilteredRankedData({
    data: topChannelsByClicks,
    selectedIds: selectedChannels,
    genderFilter: selectedChannelGenders,
    ageFilter: selectedChannelAges,
    filterType: 'channel',
    channelsList,
  });
  // Filtering for Program Tab (flat data, if needed)
  const filteredTopProgramsBySubs = getFilteredRankedData({
    data: topProgramsBySubs,
    selectedIds: selectedPrograms,
    genderFilter: selectedChannelGenders,
    ageFilter: selectedChannelAges,
    filterType: 'program',
    programsList,
  });
  const filteredTopProgramsByClicks = getFilteredRankedData({
    data: topProgramsByClicks,
    selectedIds: selectedPrograms,
    genderFilter: selectedChannelGenders,
    ageFilter: selectedChannelAges,
    filterType: 'program',
    programsList,
  });
  // For grouped charts (StackedBarDatum[]), filter the grouped data arrays directly:
  const filteredTopChannelsSubsByGender = filterStackedBarData(topChannelsSubsByGender, selectedChannelGenders, selectedChannelAges, 'gender', selectedChannels, 'channel', channelsList);
  const filteredTopChannelsClicksByGender = filterStackedBarData(topChannelsClicksByGender, selectedChannelGenders, selectedChannelAges, 'gender', selectedChannels, 'channel', channelsList);
  const filteredTopChannelsSubsByAge = filterStackedBarData(topChannelsSubsByAge, selectedChannelGenders, selectedChannelAges, 'age', selectedChannels, 'channel', channelsList);
  const filteredTopChannelsClicksByAge = filterStackedBarData(topChannelsClicksByAge, selectedChannelGenders, selectedChannelAges, 'age', selectedChannels, 'channel', channelsList);
  // In Program Tab:
  const filteredTopProgramsSubsByGender = filterStackedBarData(topProgramsSubsByGender, selectedChannelGenders, selectedChannelAges, 'gender', selectedPrograms, 'program', undefined, programsList);
  const filteredTopProgramsClicksByGender = filterStackedBarData(topProgramsClicksByGender, selectedChannelGenders, selectedChannelAges, 'gender', selectedPrograms, 'program', undefined, programsList);
  const filteredTopProgramsSubsByAge = filterStackedBarData(topProgramsSubsByAge, selectedChannelGenders, selectedChannelAges, 'age', selectedPrograms, 'program', undefined, programsList);
  const filteredTopProgramsClicksByAge = filterStackedBarData(topProgramsClicksByAge, selectedChannelGenders, selectedChannelAges, 'age', selectedPrograms, 'program', undefined, programsList);

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



  const handleChannelPeriodicReport = async (channelId: number | null, action: 'download' | 'email') => {
    const reportKey = `channel_periodic_${channelId || 'all'}_${action}`;
    
    try {
      if (action === 'download') {
        setDownloadingReports(prev => new Set([...prev, reportKey]));
      } else {
        setSendingReports(prev => new Set([...prev, reportKey]));
      }

      const from = reportFrom?.format('YYYY-MM-DD') || generalFrom.format('YYYY-MM-DD');
      const to = reportTo?.format('YYYY-MM-DD') || generalTo.format('YYYY-MM-DD');
      
      // If no specific channel is selected, use the periodic report endpoint
      if (channelId === null) {
        const getReportType = (period: string) => {
          switch (period) {
            case 'weekly': return 'weekly-summary';
            case 'monthly': return 'monthly-summary';
            case 'quarterly': return 'quarterly-summary';
            case 'yearly': return 'yearly-summary';
            default: return 'weekly-summary';
          }
        };

        const response = await fetch(`/api/statistics/comprehensive-reports?path=/periodic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: getReportType(reportPeriod),
            period: reportPeriod,
            format: 'pdf',
            action,
            from,
            to,
            toEmail: action === 'email' ? 'laguiadelstreaming@gmail.com' : undefined,
          }),
        });

        if (action === 'download') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportPeriod}_report_${from}_to_${to}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setSuccess('Reporte descargado correctamente');
        } else {
          const result = await response.json();
          setSuccess(result.message || 'Reporte enviado correctamente');
        }
      } else {
        // Specific channel report
        const response = await fetch(`/api/statistics/comprehensive-reports?path=/channel/${channelId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'channel-summary',
            format: 'pdf',
            from,
            to,
            channelId,
            action,
            toEmail: action === 'email' ? 'laguiadelstreaming@gmail.com' : undefined,
          }),
        });

        if (action === 'download') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `channel_${channelId}_report_${from}_to_${to}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setSuccess('Reporte descargado correctamente');
        } else {
          const result = await response.json();
          setSuccess(result.message || 'Reporte enviado correctamente');
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Error al generar el reporte');
    } finally {
      if (action === 'download') {
        setDownloadingReports(prev => {
          const newSet = new Set(prev);
          newSet.delete(reportKey);
          return newSet;
        });
      } else {
        setSendingReports(prev => {
          const newSet = new Set(prev);
          newSet.delete(reportKey);
          return newSet;
        });
      }
    }
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
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <DatePicker label="Desde" value={generalFrom} onChange={v => setGeneralFrom(v!)} />
              <DatePicker label="Hasta" value={generalTo} onChange={v => setGeneralTo(v!)} />
              <Button 
                variant="contained" 
                onClick={fetchGeneralData}
                disabled={loading}
                sx={{ ml: 2 }}
              >
                Actualizar
              </Button>
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
            <HorizontalBarChart
              data={filteredTopChannelsBySubs}
              title="Top 5 Canales por Suscripciones"
              maxValue={filteredTopChannelsBySubs.length > 0 ? Math.max(...(filteredTopChannelsBySubs.filter(hasCount) as Array<{ count: number }> ).map(c => c.count)) : 0}
              color="#10b981"
            />
            <HorizontalBarChart
              data={filteredTopChannelsByClicks}
              title="Top 5 Canales por Clicks en YouTube"
              maxValue={filteredTopChannelsByClicks.length > 0 ? Math.max(...(filteredTopChannelsByClicks.filter(hasCount) as Array<{ count: number }> ).map(c => c.count)) : 0}
              color="#f59e0b"
            />
            <HorizontalBarChart
              data={filteredTopProgramsBySubs}
              title="Top 5 Programas por Suscripciones"
              maxValue={filteredTopProgramsBySubs.length > 0 ? Math.max(...(filteredTopProgramsBySubs.filter(hasCount) as Array<{ count: number }> ).map(p => p.count)) : 0}
              color="#3b82f6"
              showChannel={true}
            />
            <HorizontalBarChart
              data={filteredTopProgramsByClicks}
              title="Top 5 Programas por Clicks en YouTube"
              maxValue={filteredTopProgramsByClicks.length > 0 ? Math.max(...(filteredTopProgramsByClicks.filter(hasCount) as Array<{ count: number }> ).map(p => p.count)) : 0}
              color="#8b5cf6"
              showChannel={true}
            />
          </Box>
        </TabPanel>

        {/* Programas Más Populares */}
        <TabPanel value={mainTab} index={1}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <DatePicker label="Desde" value={channelTabFrom} onChange={v => setChannelTabFrom(v!)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140, maxWidth: 180 } } }} />
              <DatePicker label="Hasta" value={channelTabTo} onChange={v => setChannelTabTo(v!)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140, maxWidth: 180 } } }} />
              {/* Channel Multi-select */}
              <FormControl sx={{ minWidth: 200, maxWidth: 240 }} size="small" variant="outlined">
                <InputLabel id="channel-label" shrink>Canal</InputLabel>
                <Select
                  labelId="channel-label"
                  multiple
                  value={selectedChannels}
                  onChange={e => {
                    const value = e.target.value as number[];
                    // If all are selected or none, treat as 'Todos' (empty array means all)
                    if (value.length === 0 || value.length === channelsList.length) {
                      setSelectedChannels([]);
                    } else {
                      setSelectedChannels(value);
                    }
                  }}
                  renderValue={selected =>
                    selected.length === 0
                      ? 'Todos los canales'
                      : channelsList.filter(c => selected.includes(c.id)).map(c => c.name).join(', ')
                  }
                  displayEmpty
                  size="small"
                >
                  <MenuItem value="all" onClick={() => setSelectedChannels([])}>
                    <Checkbox checked={selectedChannels.length === 0} indeterminate={selectedChannels.length > 0 && selectedChannels.length < channelsList.length} size="small" />
                    <em>Todos los canales</em>
                  </MenuItem>
                  {channelsList.map(ch => (
                    <MenuItem key={ch.id} value={ch.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox checked={selectedChannels.includes(ch.id)} size="small" />
                        {ch.name}
                      </Box>
                      <Button
                        size="small"
                        sx={{ ml: 1, minWidth: 'auto', fontSize: '0.7em' }}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedChannels([ch.id]);
                        }}
                      >
                        solamente
                      </Button>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Gender Multi-select */}
              <FormControl sx={{ minWidth: 160, maxWidth: 200 }} size="small" variant="outlined">
                <InputLabel id="channel-gender-label" shrink>Género</InputLabel>
                <Select
                  labelId="channel-gender-label"
                  multiple
                  value={selectedChannelGenders}
                  onChange={e => {
                    const value = e.target.value;
                    if (value.includes('all')) {
                      setSelectedChannelGenders(
                        selectedChannelGenders.length === GENDER_OPTIONS.length ? GENDER_OPTIONS.map(o => o.value) : GENDER_OPTIONS.map(o => o.value)
                      );
                    } else {
                      // Prevent empty selection
                      if (value.length === 0) {
                        setSelectedChannelGenders(GENDER_OPTIONS.map(o => o.value));
                      } else {
                        setSelectedChannelGenders(typeof value === 'string' ? value.split(',') : value);
                      }
                    }
                  }}
                  renderValue={selected =>
                    selected.length === GENDER_OPTIONS.length
                      ? 'Todos'
                      : GENDER_OPTIONS.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                  }
                  displayEmpty
                  inputProps={{ 'aria-label': 'Género' }}
                  sx={{ minWidth: 160, maxWidth: 200 }}
                >
                  <MenuItem value="all" onClick={() => setSelectedChannelGenders(GENDER_OPTIONS.map(o => o.value))}>
                    <Checkbox checked={selectedChannelGenders.length === GENDER_OPTIONS.length} indeterminate={selectedChannelGenders.length > 0 && selectedChannelGenders.length < GENDER_OPTIONS.length} size="small" />
                    <em>Todos</em>
                  </MenuItem>
                  {GENDER_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Checkbox checked={selectedChannelGenders.indexOf(opt.value) > -1} size="small" />
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Age Group Multi-select */}
              <FormControl sx={{ minWidth: 180, maxWidth: 220 }} size="small" variant="outlined">
                <InputLabel id="channel-age-label" shrink>Edad</InputLabel>
                <Select
                  labelId="channel-age-label"
                  multiple
                  value={selectedChannelAges}
                  onChange={e => {
                    const value = e.target.value;
                    if (value.includes('all')) {
                      setSelectedChannelAges(AGE_GROUP_OPTIONS.map(o => o.value));
                    } else {
                      // Prevent empty selection
                      if (value.length === 0) {
                        setSelectedChannelAges(AGE_GROUP_OPTIONS.map(o => o.value));
                      } else {
                        setSelectedChannelAges(typeof value === 'string' ? value.split(',') : value);
                      }
                    }
                  }}
                  renderValue={selected =>
                    selected.length === AGE_GROUP_OPTIONS.length
                      ? 'Todos'
                      : AGE_GROUP_OPTIONS.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                  }
                  displayEmpty
                  inputProps={{ 'aria-label': 'Edad' }}
                  sx={{ minWidth: 180, maxWidth: 220 }}
                >
                  <MenuItem value="all" onClick={() => setSelectedChannelAges(AGE_GROUP_OPTIONS.map(o => o.value))}>
                    <Checkbox checked={selectedChannelAges.length === AGE_GROUP_OPTIONS.length} indeterminate={selectedChannelAges.length > 0 && selectedChannelAges.length < AGE_GROUP_OPTIONS.length} size="small" />
                    <em>Todos</em>
                  </MenuItem>
                  {AGE_GROUP_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Checkbox checked={selectedChannelAges.indexOf(opt.value) > -1} size="small" />
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </LocalizationProvider>
          {/* Top 5 Channels by Subscriptions/Clicks (grouped) */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <StackedHorizontalBarChart
              data={filteredTopChannelsSubsByGender}
              title="Top 5 Canales por Suscripciones (por Género)"
              keys={GENDER_KEYS}
              colors={GENDER_COLORS}
              getLabel={getGenderLabel}
            />
            <StackedHorizontalBarChart
              data={filteredTopChannelsClicksByGender}
              title="Top 5 Canales por Clicks en YouTube (por Género)"
              keys={GENDER_KEYS}
              colors={GENDER_COLORS}
              getLabel={getGenderLabel}
            />
            <StackedHorizontalBarChart
              data={filteredTopChannelsSubsByAge}
              title="Top 5 Canales por Suscripciones (por Edad)"
              keys={AGE_KEYS}
              colors={AGE_COLORS}
              getLabel={getAgeGroupLabel}
            />
            <StackedHorizontalBarChart
              data={filteredTopChannelsClicksByAge}
              title="Top 5 Canales por Clicks en YouTube (por Edad)"
              keys={AGE_KEYS}
              colors={AGE_COLORS}
              getLabel={getAgeGroupLabel}
            />
          </Box>
          {/* If a channel is selected, show its programs' demographics */}
          {selectedChannels.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>Demografía de Programas de los Canales Seleccionados</Typography>
              {/* Render charts/tables for selectedChannelPrograms (subscriptions/clicks by gender/age) */}
              {/* ... */}
            </Box>
          )}
        </TabPanel>

        {/* Análisis por Programa */}
        <TabPanel value={mainTab} index={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <DatePicker label="Desde" value={programTabFrom} onChange={v => setProgramTabFrom(v!)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140, maxWidth: 180 } } }} />
              <DatePicker label="Hasta" value={programTabTo} onChange={v => setProgramTabTo(v!)} slotProps={{ textField: { size: 'small', sx: { minWidth: 140, maxWidth: 180 } } }} />
              {/* Program Multi-select */}
              <FormControl sx={{ minWidth: 200, maxWidth: 240 }} size="small" variant="outlined">
                <InputLabel id="program-label" shrink>Programa</InputLabel>
                <Select
                  labelId="program-label"
                  multiple
                  value={selectedPrograms}
                  onChange={e => {
                    const value = e.target.value as number[];
                    if (value.length === 0 || value.length === programsList.length) {
                      setSelectedPrograms([]);
                    } else {
                      setSelectedPrograms(value);
                    }
                  }}
                  renderValue={selected =>
                    selected.length === 0
                      ? 'Todos los programas'
                      : programsList.filter(p => selected.includes(p.id)).map(p => p.name).join(', ')
                  }
                  displayEmpty
                  size="small"
                >
                  <MenuItem value="all" onClick={() => setSelectedPrograms([])}>
                    <Checkbox checked={selectedPrograms.length === 0} indeterminate={selectedPrograms.length > 0 && selectedPrograms.length < programsList.length} size="small" />
                    <em>Todos los programas</em>
                  </MenuItem>
                  {programsList.map(prog => (
                    <MenuItem key={prog.id} value={prog.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox checked={selectedPrograms.includes(prog.id)} size="small" />
                        {prog.name}
                      </Box>
                      <Button
                        size="small"
                        sx={{ ml: 1, minWidth: 'auto', fontSize: '0.7em' }}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedPrograms([prog.id]);
                        }}
                      >
                        solamente
                      </Button>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Gender Multi-select */}
              <FormControl sx={{ minWidth: 160, maxWidth: 200 }} size="small" variant="outlined">
                <InputLabel id="program-gender-label" shrink>Género</InputLabel>
                <Select
                  labelId="program-gender-label"
                  multiple
                  value={selectedChannelGenders}
                  onChange={e => {
                    const value = e.target.value;
                    if (value.includes('all')) {
                      setSelectedChannelGenders(
                        selectedChannelGenders.length === GENDER_OPTIONS.length ? GENDER_OPTIONS.map(o => o.value) : GENDER_OPTIONS.map(o => o.value)
                      );
                    } else {
                      if (value.length === 0) {
                        setSelectedChannelGenders(GENDER_OPTIONS.map(o => o.value));
                      } else {
                        setSelectedChannelGenders(typeof value === 'string' ? value.split(',') : value);
                      }
                    }
                  }}
                  renderValue={selected =>
                    selected.length === GENDER_OPTIONS.length
                      ? 'Todos'
                      : GENDER_OPTIONS.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                  }
                  displayEmpty
                  inputProps={{ 'aria-label': 'Género' }}
                  sx={{ minWidth: 160, maxWidth: 200 }}
                >
                  <MenuItem value="all" onClick={() => setSelectedChannelGenders(GENDER_OPTIONS.map(o => o.value))}>
                    <Checkbox checked={selectedChannelGenders.length === GENDER_OPTIONS.length} indeterminate={selectedChannelGenders.length > 0 && selectedChannelGenders.length < GENDER_OPTIONS.length} size="small" />
                    <em>Todos</em>
                  </MenuItem>
                  {GENDER_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Checkbox checked={selectedChannelGenders.indexOf(opt.value) > -1} size="small" />
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Age Group Multi-select */}
              <FormControl sx={{ minWidth: 180, maxWidth: 220 }} size="small" variant="outlined">
                <InputLabel id="program-age-label" shrink>Edad</InputLabel>
                <Select
                  labelId="program-age-label"
                  multiple
                  value={selectedChannelAges}
                  onChange={e => {
                    const value = e.target.value;
                    if (value.includes('all')) {
                      setSelectedChannelAges(AGE_GROUP_OPTIONS.map(o => o.value));
                    } else {
                      if (value.length === 0) {
                        setSelectedChannelAges(AGE_GROUP_OPTIONS.map(o => o.value));
                      } else {
                        setSelectedChannelAges(typeof value === 'string' ? value.split(',') : value);
                      }
                    }
                  }}
                  renderValue={selected =>
                    selected.length === AGE_GROUP_OPTIONS.length
                      ? 'Todos'
                      : AGE_GROUP_OPTIONS.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                  }
                  displayEmpty
                  inputProps={{ 'aria-label': 'Edad' }}
                  sx={{ minWidth: 180, maxWidth: 220 }}
                >
                  <MenuItem value="all" onClick={() => setSelectedChannelAges(AGE_GROUP_OPTIONS.map(o => o.value))}>
                    <Checkbox checked={selectedChannelAges.length === AGE_GROUP_OPTIONS.length} indeterminate={selectedChannelAges.length > 0 && selectedChannelAges.length < AGE_GROUP_OPTIONS.length} size="small" />
                    <em>Todos</em>
                  </MenuItem>
                  {AGE_GROUP_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Checkbox checked={selectedChannelAges.indexOf(opt.value) > -1} size="small" />
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </LocalizationProvider>
          {/* Top 5 Programs by Subscriptions/Clicks (grouped) */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <StackedHorizontalBarChart
              data={filteredTopProgramsSubsByGender}
              title="Top 5 Programas por Suscripciones (por Género)"
              keys={GENDER_KEYS}
              colors={GENDER_COLORS}
              getLabel={getGenderLabel}
              showChannel={true}
            />
            <StackedHorizontalBarChart
              data={filteredTopProgramsClicksByGender}
              title="Top 5 Programas por Clicks en YouTube (por Género)"
              keys={GENDER_KEYS}
              colors={GENDER_COLORS}
              getLabel={getGenderLabel}
              showChannel={true}
            />
            <StackedHorizontalBarChart
              data={filteredTopProgramsSubsByAge}
              title="Top 5 Programas por Suscripciones (por Edad)"
              keys={AGE_KEYS}
              colors={AGE_COLORS}
              getLabel={getAgeGroupLabel}
              showChannel={true}
            />
            <StackedHorizontalBarChart
              data={filteredTopProgramsClicksByAge}
              title="Top 5 Programas por Clicks en YouTube (por Edad)"
              keys={AGE_KEYS}
              colors={AGE_COLORS}
              getLabel={getAgeGroupLabel}
              showChannel={true}
            />
          </Box>
          {/* If a program is selected, show its demographics */}
          {selectedPrograms.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>Demografía de Programas Seleccionados</Typography>
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

        {/* Reportes Completos */}
        <TabPanel value={mainTab} index={4}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <DatePicker label="Desde" value={generalFrom} onChange={v => setGeneralFrom(v!)} />
              <DatePicker label="Hasta" value={generalTo} onChange={v => setGeneralTo(v!)} />
            </Box>
          </LocalizationProvider>
          
          <Typography variant="h6" gutterBottom sx={{ color: mode === 'light' ? '#111827' : '#f1f5f9' }}>Generación de Reportes</Typography>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Genera reportes con fechas personalizadas o períodos predefinidos. Selecciona un canal específico o genera reportes para todos los canales.
            </Typography>
            
            {/* Unified Date and Channel Selection */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Date Range */}
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, color: mode === 'light' ? '#111827' : '#f1f5f9' }}>
                    Rango de Fechas
                  </Typography>
                  
                  {/* Custom Date Range */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Fechas personalizadas:
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <DatePicker 
                          label="Desde" 
                          value={reportFrom} 
                          onChange={handleReportFromChange} 
                          sx={{ minWidth: 150 }}
                        />
                        <DatePicker 
                          label="Hasta" 
                          value={reportTo} 
                          onChange={handleReportToChange} 
                          sx={{ minWidth: 150 }}
                        />
                      </Box>
                    </LocalizationProvider>
                  </Box>

                  {/* Quick Period Buttons */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Períodos predefinidos:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant={reportPeriod === 'weekly' ? 'contained' : 'outlined'}
                        onClick={() => handlePeriodChange('weekly')}
                      >
                        Semanal
                      </Button>
                      <Button
                        size="small"
                        variant={reportPeriod === 'monthly' ? 'contained' : 'outlined'}
                        onClick={() => handlePeriodChange('monthly')}
                      >
                        Mensual
                      </Button>
                      <Button
                        size="small"
                        variant={reportPeriod === 'quarterly' ? 'contained' : 'outlined'}
                        onClick={() => handlePeriodChange('quarterly')}
                      >
                        Trimestral
                      </Button>
                      <Button
                        size="small"
                        variant={reportPeriod === 'yearly' ? 'contained' : 'outlined'}
                        onClick={() => handlePeriodChange('yearly')}
                      >
                        Anual
                      </Button>
                      <Button
                        size="small"
                        variant={reportPeriod === 'custom' ? 'contained' : 'outlined'}
                        onClick={() => setReportPeriod('custom')}
                      >
                        Personalizado
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {/* Channel Selection */}
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, color: mode === 'light' ? '#111827' : '#f1f5f9' }}>
                    Seleccionar Canal
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="channel-select-label">Canal</InputLabel>
                    <Select
                      labelId="channel-select-label"
                      id="channel-select"
                      value={selectedChannelId === null ? '' : String(selectedChannelId)}
                      label="Canal"
                      onChange={(e) => setSelectedChannelId(e.target.value === '' ? null : Number(e.target.value))}
                    >
                      <MenuItem value="">
                        <em>Todos los canales</em>
                      </MenuItem>
                      {channelsList.map((channel) => (
                        <MenuItem key={channel.id} value={String(channel.id)}>
                          {channel.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>

            {/* Report Actions */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, color: mode === 'light' ? '#111827' : '#f1f5f9' }}>
                Generar Reporte
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => handleChannelPeriodicReport(selectedChannelId, 'download')}
                  disabled={downloadingReports.has(`channel_periodic_${selectedChannelId || 'all'}_download`) || sendingReports.has(`channel_periodic_${selectedChannelId || 'all'}_email`)}
                  startIcon={downloadingReports.has(`channel_periodic_${selectedChannelId || 'all'}_download`) ? <CircularProgress size={20} /> : undefined}
                  size="large"
                >
                  {downloadingReports.has(`channel_periodic_${selectedChannelId || 'all'}_download`) ? 'Descargando...' : 'Descargar PDF'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleChannelPeriodicReport(selectedChannelId, 'email')}
                  disabled={sendingReports.has(`channel_periodic_${selectedChannelId || 'all'}_email`) || downloadingReports.has(`channel_periodic_${selectedChannelId || 'all'}_download`)}
                  startIcon={sendingReports.has(`channel_periodic_${selectedChannelId || 'all'}_email`) ? <CircularProgress size={20} /> : undefined}
                  size="large"
                >
                  {sendingReports.has(`channel_periodic_${selectedChannelId || 'all'}_email`) ? 'Enviando...' : 'Enviar por Email'}
                </Button>
              </Box>
              
              {/* Report Info */}
              <Box sx={{ mt: 2, p: 2, backgroundColor: mode === 'light' ? '#f8fafc' : '#1e293b', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Canal:</strong> {selectedChannelId ? channelsList.find(c => c.id === selectedChannelId)?.name : 'Todos los canales'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Período:</strong> {reportPeriod === 'weekly' ? 'Semanal' : reportPeriod === 'monthly' ? 'Mensual' : reportPeriod === 'quarterly' ? 'Trimestral' : 'Anual'}
                </Typography>
                {reportPeriod === 'custom' && reportFrom && reportTo && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Fechas:</strong> {reportFrom.format('DD/MM/YYYY')} - {reportTo.format('DD/MM/YYYY')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>



          <Typography variant="h6" gutterBottom sx={{ color: mode === 'light' ? '#111827' : '#f1f5f9' }}>Reportes Automáticos</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Los reportes automáticos se envían a laguiadelstreaming@gmail.com en los siguientes horarios:
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
              <Card sx={{ p: 2, backgroundColor: mode === 'light' ? '#f0f9ff' : '#1e3a8a' }}>
                <CardContent>
                  <Typography variant="h6">Semanal</Typography>
                  <Typography variant="body2">Domingos a las 6:00 PM</Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ p: 2, backgroundColor: mode === 'light' ? '#f0f9ff' : '#1e3a8a' }}>
                <CardContent>
                  <Typography variant="h6">Mensual</Typography>
                  <Typography variant="body2">Primer día del mes a las 9:00 AM</Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ p: 2, backgroundColor: mode === 'light' ? '#f0f9ff' : '#1e3a8a' }}>
                <CardContent>
                  <Typography variant="h6">Anual</Typography>
                  <Typography variant="body2">1 de Enero a las 10:00 AM</Typography>
                </CardContent>
              </Card>
            </Box>
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