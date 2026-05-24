'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, 
  Activity, 
  MessageSquare, 
  Sliders, 
  User, 
  Users,
  Calendar, 
  TrendingUp, 
  Heart, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Sparkles, 
  Compass, 
  Database,
  ArrowRight,
  Wifi,
  ChevronRight,
  Check,
  X,
  Plus,
  Target,
  Copy
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { SPORTS_CONFIG, getSportConfig } from '@/lib/sports';

const BarChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Bar),
  { ssr: false }
);
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Home() {
  // Estados Globais da SPA
  const [activeUser, setActiveUser] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('planilha'); // 'planilha', 'coach', 'simulador'
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  
  // Dados do Dashboard carregados do Backend
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Relógio e Data em tempo real
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Estados de Onboarding
  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    level: 'intermediario',
    birthDate: '',
    age: '',
    weight: '',
    goalType: 'Corrida',
    goalDistance: '',
    goalTime: '',
    weeklyHours: '',
    stravaConnected: false
  });

  // Estados do Chat
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'coach'; text: string }>>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Estados de Lançamento Manual de Treino
  const [showManualLogModal, setShowManualLogModal] = useState<boolean>(false);
  const [isSubmittingManualLog, setIsSubmittingManualLog] = useState<boolean>(false);
  const [manualLogForm, setManualLogForm] = useState({
    workoutId: '' as string | number,
    date: '',
    type: 'Corrida',
    title: '',
    description: '',
    distanceReal: '',
    durationTime: '',
    paceReal: '0:00/km',
    avgHr: '',
    avgPower: '',
    tssReal: ''
  });

  const paceToSeconds = (paceStr: string): number => {
    const clean = paceStr.replace('/km', '').trim();
    const parts = clean.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 300;
  };

  const secondsToPace = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}/km`;
  };

  const formatDistance = (dist: number | undefined | null): string => {
    if (dist === undefined || dist === null || isNaN(dist)) return '0,00';
    return dist.toFixed(2).replace('.', ',');
  };

  const secondsToTime = (secs: number | undefined | null): string => {
    if (secs === undefined || secs === null || isNaN(secs) || secs <= 0) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.round(secs % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getMultiSportSplits = (goalType: string | undefined | null, totalDistance: number | undefined | null, totalTimeStr: string | undefined | null) => {
    const type = goalType || 'Corrida';
    const dist = totalDistance || 0;
    const timeStr = totalTimeStr || '00:00:00';
    const totalSeconds = timeToSeconds(timeStr);

    let swimDist = 0;
    let bikeDist = 0;
    let runDist = 0;
    let swimSecs = 0;
    let bikeSecs = 0;
    let runSecs = 0;
    let typeLabel = `${type} Personalizado`;

    if (type === 'Triathlon') {
      // Tolerâncias para distâncias padrão de Triathlon
      if (Math.abs(dist - 226.2) < 2) {
        swimDist = 3.86;
        bikeDist = 180.2;
        runDist = 42.2;
        typeLabel = "Ironman (Full)";
      } else if (Math.abs(dist - 113.1) < 2 || Math.abs(dist - 113.0) < 2) {
        swimDist = 1.9;
        bikeDist = 90.1;
        runDist = 21.1;
        typeLabel = "Ironman 70.3 (Half)";
      } else if (Math.abs(dist - 51.5) < 2) {
        swimDist = 1.5;
        bikeDist = 40.0;
        runDist = 10.0;
        typeLabel = "Olímpico (Standard)";
      } else if (Math.abs(dist - 25.75) < 2 || Math.abs(dist - 25.8) < 2) {
        swimDist = 0.75;
        bikeDist = 20.0;
        runDist = 5.0;
        typeLabel = "Sprint / Short";
      } else {
        // Divisão proporcional personalizada
        swimDist = Number((dist * 0.0168).toFixed(2));
        bikeDist = Number((dist * 0.7966).toFixed(2));
        runDist = Number((dist * 0.1866).toFixed(2));
        const diff = dist - (swimDist + bikeDist + runDist);
        if (Math.abs(diff) > 0.001) {
          runDist = Number((runDist + diff).toFixed(2));
        }
      }
      swimSecs = Math.round(totalSeconds * 0.10);
      bikeSecs = Math.round(totalSeconds * 0.53);
      runSecs = Math.round(totalSeconds * 0.37);

      return {
        label: typeLabel,
        hasSwim: true,
        hasBike: true,
        hasRun: true,
        swim: { distance: swimDist, time: secondsToTime(swimSecs) },
        bike: { distance: bikeDist, time: secondsToTime(bikeSecs) },
        run: { distance: runDist, time: secondsToTime(runSecs) }
      };
    } else if (type === 'Duathlon') {
      if (Math.abs(dist - 55.0) < 2) {
        bikeDist = 40.0;
        runDist = 15.0;
        typeLabel = "Duathlon Olímpico";
      } else if (Math.abs(dist - 27.5) < 2) {
        bikeDist = 20.0;
        runDist = 7.5;
        typeLabel = "Duathlon Sprint";
      } else if (Math.abs(dist - 190.0) < 5) {
        bikeDist = 150.0;
        runDist = 40.0;
        typeLabel = "Duathlon Longo";
      } else {
        bikeDist = Number((dist * 0.7273).toFixed(2));
        runDist = Number((dist * 0.2727).toFixed(2));
        const diff = dist - (bikeDist + runDist);
        if (Math.abs(diff) > 0.001) {
          runDist = Number((runDist + diff).toFixed(2));
        }
      }
      bikeSecs = Math.round(totalSeconds * 0.60);
      runSecs = Math.round(totalSeconds * 0.40);

      return {
        label: typeLabel,
        hasSwim: false,
        hasBike: true,
        hasRun: true,
        swim: { distance: 0, time: "00:00:00" },
        bike: { distance: bikeDist, time: secondsToTime(bikeSecs) },
        run: { distance: runDist, time: secondsToTime(runSecs) }
      };
    } else if (type === 'Aquathlon') {
      if (Math.abs(dist - 6.0) < 0.5) {
        swimDist = 1.0;
        runDist = 5.0;
        typeLabel = "Aquathlon Olímpico";
      } else if (Math.abs(dist - 3.0) < 0.5) {
        swimDist = 0.5;
        runDist = 2.5;
        typeLabel = "Aquathlon Sprint";
      } else if (Math.abs(dist - 12.0) < 1.0) {
        swimDist = 2.0;
        runDist = 10.0;
        typeLabel = "Aquathlon Longo";
      } else {
        swimDist = Number((dist * 0.1667).toFixed(2));
        runDist = Number((dist * 0.8333).toFixed(2));
        const diff = dist - (swimDist + runDist);
        if (Math.abs(diff) > 0.001) {
          runDist = Number((runDist + diff).toFixed(2));
        }
      }
      swimSecs = Math.round(totalSeconds * 0.25);
      runSecs = Math.round(totalSeconds * 0.75);

      return {
        label: typeLabel,
        hasSwim: true,
        hasBike: false,
        hasRun: true,
        swim: { distance: swimDist, time: secondsToTime(swimSecs) },
        bike: { distance: 0, time: "00:00:00" },
        run: { distance: runDist, time: secondsToTime(runSecs) }
      };
    }

    return {
      label: typeLabel,
      hasSwim: false,
      hasBike: false,
      hasRun: false,
      swim: { distance: 0, time: "00:00:00" },
      bike: { distance: 0, time: "00:00:00" },
      run: { distance: 0, time: "00:00:00" }
    };
  };

  const timeToSeconds = (timeStr: string | undefined | null): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    let h = 0, m = 0, s = 0;
    if (parts.length === 3) {
      h = parseInt(parts[0], 10) || 0;
      m = parseInt(parts[1], 10) || 0;
      s = parseInt(parts[2], 10) || 0;
    } else if (parts.length === 2) {
      m = parseInt(parts[0], 10) || 0;
      s = parseInt(parts[1], 10) || 0;
    } else if (parts.length === 1) {
      m = parseInt(parts[0], 10) || 0;
    }
    return h * 3600 + m * 60 + s;
  };

  const maskTimeInput = (val: string): string => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    if (clean.length === 0) return '';
    if (clean.length <= 2) return clean;
    if (clean.length <= 4) return `${clean.slice(0, 2)}:${clean.slice(2)}`;
    return `${clean.slice(0, 2)}:${clean.slice(2, 4)}:${clean.slice(4, 6)}`;
  };

  const calcPace = (dist: string, durationStr: string): string => {
    const d = parseFloat(dist.replace(',', '.')) || 0;
    const secs = timeToSeconds(durationStr);
    if (d <= 0 || secs <= 0) return '0:00/km';
    const secondsPerKm = secs / d;
    const pMins = Math.floor(secondsPerKm / 60);
    const pSecs = Math.round(secondsPerKm % 60);
    return `${pMins}:${String(pSecs).padStart(2, '0')}/km`;
  };

  const estimateTSS = (type: string, dist: string, durationStr: string, avgHrVal: string): number => {
    const d = parseFloat(dist.replace(',', '.')) || 0;
    const durSecs = timeToSeconds(durationStr);
    if (durSecs <= 0) return 0;
    
    let estimatedTss = Math.round((durSecs / 3600) * 60);
    
    const userThresholdPace = dashboardData?.user?.threshold_pace || '5:00';
    const userThresholdHr = dashboardData?.user?.threshold_hr || 160;
    
    if (['Corrida', 'CorridaTrilha'].includes(type)) {
      const paceStr = calcPace(dist, durationStr);
      if (paceStr !== '0:00/km') {
        const paceSecs = paceToSeconds(paceStr);
        const thresholdSecs = paceToSeconds(userThresholdPace);
        if (paceSecs > 0 && thresholdSecs > 0) {
          const intensityFactor = thresholdSecs / paceSecs;
          estimatedTss = Math.round((durSecs * Math.pow(intensityFactor, 2) / 3600) * 100);
        }
      }
    } else if (avgHrVal) {
      const hr = parseInt(avgHrVal, 10);
      if (hr > 0 && userThresholdHr > 0) {
        const intensityFactor = hr / userThresholdHr;
        estimatedTss = Math.round((durSecs * Math.pow(intensityFactor, 2) / 3600) * 100);
      }
    }
    
    return estimatedTss;
  };

  const handleAddToGoogleCalendar = (workout: any) => {
    if (!workout) return;
    
    const summaryPrefix = workout.type === 'Corrida' ? '🏃' :
                          workout.type === 'Ciclismo' ? '🚴' :
                          workout.type === 'Natacao' ? '🏊' :
                          workout.type === 'Forca' ? '💪' :
                          workout.type === 'Descanso' ? '😴' : '⚡';

    const typeName = workout.type === 'Corrida' ? 'Corrida' :
                     workout.type === 'Ciclismo' ? 'Ciclismo' :
                     workout.type === 'Natacao' ? 'Natação' :
                     workout.type === 'Forca' ? 'Fortalecimento' :
                     workout.type === 'Descanso' ? 'Descanso' : workout.type;

    const title = encodeURIComponent(`${summaryPrefix} [${typeName}] ${workout.title}`);
    const startStr = workout.date.replace(/-/g, '');
    
    const startDateObj = new Date(workout.date + 'T12:00:00');
    startDateObj.setDate(startDateObj.getDate() + 1);
    const endStr = startDateObj.getFullYear() + 
                   String(startDateObj.getMonth() + 1).padStart(2, '0') + 
                   String(startDateObj.getDate()).padStart(2, '0');

    const descParts = [];
    if (workout.description) {
      descParts.push(workout.description);
    }
    
    if (workout.type !== 'Descanso') {
      descParts.push('');
      if (workout.distance_target > 0) {
        descParts.push(`Distância Prescrita: ${formatDistance(workout.distance_target)} km`);
      }
      if (workout.duration_target > 0) {
        descParts.push(`Duração Prescrita: ${secondsToTime(workout.duration_target)}`);
      }
      if (workout.pace_target && workout.pace_target !== 'N/A') {
        descParts.push(`Ritmo Alvo (Pace): ${workout.pace_target} /km`);
      }
      if (workout.power_target > 0) {
        descParts.push(`Potência Alvo: ${workout.power_target} W`);
      }
      if (workout.tss_target > 0) {
        descParts.push(`Carga Estimada: ${workout.tss_target} TSS`);
      }
    }
    
    descParts.push(`Status do Treino: ${workout.status === 'completed' ? 'Concluído' : 'Pendente'}`);
    
    const details = encodeURIComponent(descParts.join('\n'));
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&sf=true&output=xml`;
    
    window.open(url, '_blank');
  };

  const openManualLog = (workout: any = null) => {
    const todayYmd = new Date().toLocaleDateString('en-CA');
    if (workout) {
      setManualLogForm({
        workoutId: workout.id,
        date: workout.date || todayYmd,
        type: workout.type || 'Corrida',
        title: workout.title || '',
        description: workout.description || '',
        distanceReal: workout.distance_target ? formatDistance(workout.distance_target) : '',
        durationTime: workout.duration_target ? secondsToTime(workout.duration_target) : '',
        paceReal: workout.pace_target && workout.pace_target !== 'N/A' ? workout.pace_target : '0:00/km',
        avgHr: '',
        avgPower: workout.power_target > 0 ? workout.power_target.toString() : '',
        tssReal: workout.tss_target ? workout.tss_target.toString() : ''
      });
    } else {
      setManualLogForm({
        workoutId: '',
        date: todayYmd,
        type: 'Corrida',
        title: '',
        description: '',
        distanceReal: '',
        durationTime: '',
        paceReal: '0:00/km',
        avgHr: '',
        avgPower: '',
        tssReal: ''
      });
    }
    setShowManualLogModal(true);
  };

  const handleSaveManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    
    setIsSubmittingManualLog(true);
    try {
      const payload = {
        workoutId: manualLogForm.workoutId || null,
        userId: activeUser,
        date: manualLogForm.date,
        type: manualLogForm.type,
        title: manualLogForm.title || `Treino Extra de ${manualLogForm.type}`,
        description: manualLogForm.description,
        distanceReal: parseFloat(manualLogForm.distanceReal.replace(',', '.')) || 0,
        durationReal: timeToSeconds(manualLogForm.durationTime),
        paceReal: manualLogForm.paceReal,
        avgHr: manualLogForm.avgHr ? parseInt(manualLogForm.avgHr, 10) : null,
        avgPower: manualLogForm.avgPower ? parseInt(manualLogForm.avgPower, 10) : null,
        tssReal: manualLogForm.tssReal ? parseInt(manualLogForm.tssReal, 10) : null
      };

      const res = await fetch('/api/workouts/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowManualLogModal(false);
        setSelectedWorkout(null);
        await fetchDashboard(activeUser);
      } else {
        const errorData = await res.json();
        alert('Erro ao salvar treino: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar treino.');
    } finally {
      setIsSubmittingManualLog(false);
    }
  };

  // Carregar dados do usuário ativo
  const fetchDashboard = async (userId: number) => {
    try {
      setRefreshing(true);
      const clientDate = new Date().toLocaleDateString('en-CA');
      const res = await fetch(`/api/dashboard?userId=${userId}&clientDate=${clientDate}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        // Inicializar histórico de chat se vazio
        if (chatMessages.length === 0 && data.user) {
          const firstName = data.user.name.split(' ')[0];
          let welcomeText = `Olá, ${firstName}! Sou o seu treinador virtual ULTRA COACH. Analisei seus dados de onboarding e estruturei sua planilha de treinos semanal. Sempre que você treinar e subir sua atividade no Strava, eu recebo os dados aqui e recalculo sua carga TSS instantaneamente. Como posso te orientar hoje?`;
          
          if (data.user.id === 1) {
            welcomeText = `Saudações, Tiago! Analisei suas métricas recentes de periodização. Sua planilha de treinamento rumo ao seu objetivo de Ironman está montada. Vi que seu TSB está equilibrado, mas fique atento ao treino longo de sábado. Como posso te orientar hoje?`;
          } else if (data.user.id === 2) {
            welcomeText = `Olá, Ana! Estou muito empolgado em te guiar nessa jornada de saída do sedentarismo. Montei uma semana de transição muito segura, alternando caminhada e trote leve para preservar suas articulações. Qualquer dúvida sobre ritmos ou desconforto, é só perguntar!`;
          }
          
          setChatMessages([
            { 
              sender: 'coach', 
              text: welcomeText
            }
          ]);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Erro ao buscar dados do dashboard: ${errData.error || 'Erro interno no servidor'}`);
        if (res.status === 404) {
          setActiveUser(null);
          localStorage.removeItem('active_user_id');
          localStorage.removeItem('is_authenticated');
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados do dashboard:', err);
      alert(`Erro ao conectar ao servidor do dashboard: ${err.message || 'Erro de conexão'}`);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Estados do Novo Sistema de Login e Senha
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Estados de Edição do Perfil
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCalendarUrl, setCopiedCalendarUrl] = useState(false);
  const [showProfileCelebration, setShowProfileCelebration] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    birth_date: '',
    weight: '',
    level: 'intermediario',
    threshold_hr: '',
    threshold_pace: '',
    weekly_target_hours: '',
    username: '',
    password: '',
    goal_type: 'Corrida',
    goal_distance: '',
    goal_date_target: '',
    goal_target_time: '',
    goal_weekly_tss_target: ''
  });

  // Estados para Calibração Strava
  const [calibrationPeriod, setCalibrationPeriod] = useState<number>(60);
  const [calibrationLoading, setCalibrationLoading] = useState<boolean>(false);
  const [calibrationResult, setCalibrationResult] = useState<any>(null);
  const [calibrationError, setCalibrationError] = useState<string>('');

  // Enviar Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('is_authenticated', 'true');
        localStorage.setItem('active_user_id', String(data.userId));
        setActiveUser(data.userId);
      } else {
        const errData = await res.json().catch(() => ({}));
        setLoginError(errData.error || 'Credenciais inválidas. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao realizar login:', err);
      setLoginError('Falha ao conectar com o servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Inicialização da sessão e leitura de URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get('userId');
    const syncStatus = params.get('strava_sync');
    const errorStatus = params.get('error');

    if (syncStatus === 'success') {
      alert('Conexão com o Strava realizada com sucesso!');
    } else if (errorStatus === 'strava_token_exchange_failed') {
      alert('Erro ao trocar tokens com o Strava. Verifique suas credenciais de API no painel do Strava.');
    } else if (errorStatus === 'strava_connection_error') {
      alert('Erro de conexão ao tentar falar com a API do Strava.');
    } else if (errorStatus === 'internal_callback_error') {
      alert('Erro interno no servidor ao processar o callback do Strava.');
    }

    if (urlUserId) {
      const parsedId = parseInt(urlUserId, 10);
      if (!isNaN(parsedId)) {
        localStorage.setItem('active_user_id', String(parsedId));
        localStorage.setItem('is_authenticated', 'true');
        setActiveUser(parsedId);
        // Limpar query string para manter a URL limpa
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        return;
      }
    }

    const savedUserId = localStorage.getItem('active_user_id');
    const savedAuthenticated = localStorage.getItem('is_authenticated');
    if (savedUserId && savedAuthenticated === 'true') {
      const parsedId = parseInt(savedUserId, 10);
      if (!isNaN(parsedId)) {
        setActiveUser(parsedId);
        return;
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('active_user_id', String(activeUser));
      localStorage.setItem('is_authenticated', 'true');
      fetchDashboard(activeUser);
    } else {
      localStorage.removeItem('active_user_id');
      localStorage.removeItem('is_authenticated');
      setDashboardData(null);
      setLoading(false);
    }
  }, [activeUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Atualizar relógio em tempo real no cliente
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sincronizar dados do banco com o formulário de perfil
  useEffect(() => {
    if (dashboardData?.user) {
      setProfileForm({
        name: dashboardData.user.name || '',
        birth_date: dashboardData.user.birth_date || '',
        weight: String(dashboardData.user.weight || ''),
        level: dashboardData.user.level || 'intermediario',
        threshold_hr: String(dashboardData.user.threshold_hr || ''),
        threshold_pace: dashboardData.user.threshold_pace || '',
        weekly_target_hours: String(dashboardData.user.weekly_target_hours || ''),
        username: dashboardData.user.username || '',
        password: dashboardData.user.password || '',
        goal_type: dashboardData.goal?.type || 'Corrida',
        goal_distance: String(dashboardData.goal?.distance || ''),
        goal_date_target: dashboardData.goal?.date_target || '',
        goal_target_time: dashboardData.goal?.target_time || '',
        goal_weekly_tss_target: String(dashboardData.goal?.weekly_tss_target || '')
      });
    }
  }, [dashboardData]);

  // Enviar alteração do Perfil para a API
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileSaving || !activeUser) return;

    setProfileSaving(true);
    setProfileMessage(null);
    setShowProfileCelebration(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser,
          ...profileForm
        })
      });

      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Dados pessoais e senha atualizados com sucesso!' });
        setShowProfileCelebration(true);
        await fetchDashboard(activeUser);
        setTimeout(() => {
          setProfileMessage(null);
        }, 5000);
        setTimeout(() => {
          setShowProfileCelebration(false);
        }, 6000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setProfileMessage({ type: 'error', text: errData.error || 'Erro ao atualizar dados.' });
      }
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setProfileMessage({ type: 'error', text: 'Falha de conexão ao salvar os dados.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Disparar análise de calibração via Strava
  const handleCalibrateStrava = async () => {
    if (!activeUser) return;
    setCalibrationLoading(true);
    setCalibrationError('');
    setCalibrationResult(null);

    try {
      const res = await fetch('/api/strava/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser,
          days: calibrationPeriod
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCalibrationResult(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setCalibrationError(errData.error || 'Erro ao processar calibração.');
      }
    } catch (err: any) {
      console.error('Erro de rede na calibração:', err);
      setCalibrationError('Erro de conexão ao servidor de calibração.');
    } finally {
      setCalibrationLoading(false);
    }
  };

  // Aplicar as sugestões da calibração no perfil
  const handleApplyCalibration = async () => {
    if (!activeUser || !calibrationResult) return;
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      // 1. Atualizar o formulário local do perfil com as métricas sugeridas
      const updatedForm = {
        ...profileForm,
        level: calibrationResult.suggestedMetrics.level,
        threshold_hr: String(calibrationResult.suggestedMetrics.threshold_hr),
        threshold_pace: calibrationResult.suggestedMetrics.threshold_pace
      };
      
      setProfileForm(updatedForm);

      // 2. Enviar a atualização do perfil para persistir no banco de dados
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser,
          ...updatedForm
        })
      });

      if (res.ok) {
        setProfileMessage({ 
          type: 'success', 
          text: `Calibração concluída! Nível ajustado para ${
            calibrationResult.suggestedMetrics.level === 'elite' 
              ? 'Elite' 
              : calibrationResult.suggestedMetrics.level === 'intermediario' 
                ? 'Intermediário' 
                : 'Iniciante'
          }, FC Limiar para ${calibrationResult.suggestedMetrics.threshold_hr} bpm e Pace Limiar para ${calibrationResult.suggestedMetrics.threshold_pace}.` 
        });
        
        setShowProfileCelebration(true);
        setCalibrationResult(null); // Limpar resultado de calibração para fechar o painel

        // Recarregar os dados do dashboard
        await fetchDashboard(activeUser);

        setTimeout(() => {
          setProfileMessage(null);
        }, 6000);
        setTimeout(() => {
          setShowProfileCelebration(false);
        }, 7000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setProfileMessage({ type: 'error', text: errData.error || 'Erro ao aplicar limiares.' });
      }
    } catch (err: any) {
      console.error('Erro ao aplicar calibração:', err);
      setProfileMessage({ type: 'error', text: 'Falha ao aplicar calibração fisiológica.' });
    } finally {
      setProfileSaving(false);
    }
  };


  // Submeter Onboarding
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardForm)
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages([]); // Limpar chat antigo
        if (onboardForm.stravaConnected) {
          window.location.href = `/api/strava/auth?userId=${data.userId}`;
        } else {
          setActiveUser(data.userId);
        }
      } else {
        const errData = await res.json();
        alert(`Erro no banco de dados de onboarding: ${errData.error || 'Erro no servidor'}`);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Erro ao enviar onboarding:', err);
      alert(`Falha ao conectar no onboarding: ${err.message || 'Erro de conexão'}`);
      setLoading(false);
    }
  };

  // Formatadores de data e hora para o Cockpit
  const getWeekdayName = (date: Date) => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[date.getDay()];
  };

  const getFormattedLongDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getFormattedTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Enviar Mensagem no Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const clientDate = new Date().toLocaleDateString('en-CA');
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser,
          message: userMsg,
          chatHistory: chatMessages.slice(-6), // enviar últimas mensagens para manter contexto
          clientDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'coach', text: data.reply }]);
        
        // Se o coach alterou o banco de dados de treinos, atualiza os dados na tela
        if (data.dbUpdated && activeUser) {
          await fetchDashboard(activeUser);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setChatMessages(prev => [...prev, { 
          sender: 'coach', 
          text: `Desculpe, campeão! Tive um probleminha técnico para me conectar aos meus servidores de IA agora (Erro: ${errData.error || 'Erro ' + res.status}). Poderia tentar me enviar a mensagem novamente em alguns segundos?` 
        }]);
      }
    } catch (err: any) {
      console.error('Erro ao conversar com o coach:', err);
      setChatMessages(prev => [...prev, { 
        sender: 'coach', 
        text: `Opa, meu velho! Tive uma falha de conexão de rede ao tentar me comunicar com a IA (${err.message || 'Erro de rede'}). Dá uma olhada na sua internet e tenta de novo!` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };


  // Sugestões rápidas de chat
  const handleQuickQuestion = (question: string) => {
    setChatInput(question);
  };

  // Componente de Confete para Comemorações
  const ConfettiShower = () => {
    const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; color: string; duration: number; size: number }>>([]);
    
    useEffect(() => {
      const colors = ['#fc4c02', '#00f0ff', '#39ff14', '#a855f7', '#ff6b35', '#ffeb3b', '#e91e63'];
      const newPieces = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 3 + Math.random() * 4,
        size: 6 + Math.random() * 8,
      }));
      setPieces(newPieces);
    }, []);

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
        {pieces.map(p => (
          <div 
            key={p.id} 
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.5}px`,
              background: p.color,
              borderRadius: '2px',
              opacity: 0.8,
              transform: 'rotate(0deg)',
              animation: `fall ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
        <style jsx global>{`
          @keyframes fall {
            0% {
              top: -20px;
              transform: translateX(0) rotate(0deg);
            }
            50% {
              transform: translateX(20px) rotate(180deg);
            }
            100% {
              top: 105vh;
              transform: translateX(-20px) rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: '#00f0ff' }} size={40} />
        <p style={{ fontFamily: 'var(--font-title)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Carregando cockpit fisiológico ULTRA...
        </p>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // TELA DE LOGIN E SENHA
  if (!activeUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', width: '100%' }} className="animate-slide-up">
        <div style={{ maxWidth: '420px', width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(0, 240, 255, 0.04)', borderRadius: '50%', marginBottom: '20px', border: '1px solid rgba(0, 240, 255, 0.15)', boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)' }}>
              <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.5))' }}>
                <defs>
                  <linearGradient id="ultra-grad-large" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="50%" stopColor="#b4f8c8" />
                    <stop offset="100%" stopColor="#39ff14" />
                  </linearGradient>
                </defs>
                <path d="M6 18L16 6L26 18" stroke="url(#ultra-grad-large)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 24L16 16L22 24" stroke="url(#ultra-grad-large)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                <path d="M6 18C6 24 10 28 16 28C22 28 26 24 26 18" stroke="url(#ultra-grad-large)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '4px', background: 'linear-gradient(90deg, #fff 0%, #00f0ff 50%, #39ff14 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ULTRA
            </h1>
            <p style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '16px' }}>
              Esforço conjunto, conquista compartilhada!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto', lineHeight: '1.4' }}>
              Periodização Fisiológica Científica e Coaching Virtual Autônomo
            </p>
          </div>

          {/* Login Card */}
          <div className="premium-card" style={{ padding: '32px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.4rem', fontWeight: 700, color: '#fff', textAlign: 'center' }}>Acesso ao Cockpit</h3>
            
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label htmlFor="username" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Usuário</label>
                <input 
                  id="username"
                  type="text" 
                  className="glass-input" 
                  placeholder="Seu usuário"
                  value={usernameInput} 
                  onChange={e => setUsernameInput(e.target.value)} 
                  required 
                  disabled={loginLoading}
                  style={{ fontSize: '1rem' }}
                />
              </div>

              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Senha</label>
                <input 
                  id="password"
                  type="password" 
                  className="glass-input" 
                  placeholder="Sua senha"
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                  required 
                  disabled={loginLoading}
                  style={{ fontSize: '1rem' }}
                />
              </div>

              {loginError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.25)', borderRadius: '8px', color: 'var(--neon-red)', fontSize: '0.85rem', fontWeight: 500 }} className="animate-fade-in">
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{loginError}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="glow-btn" 
                style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <RefreshCw style={{ animation: 'spin 1s linear infinite' }} size={18} />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Entrar no Painel
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // SE JÁ EXISTE UM USUÁRIO ATIVO CARREGADO E COM DADOS DO DASHBOARD
  const { user, goal, plan, workouts, activityLogs, notifications, metrics, lastSyncedActivity, celebration, calendarUrl } = dashboardData || {};

  const todayDateStr = currentTime ? currentTime.toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');
  const todayWorkout = workouts?.find((w: any) => w.date === todayDateStr);

  // Progresso de Conclusão da Planilha Semanal
  const totalWorkouts = workouts ? workouts.length : 0;
  const completedWorkouts = workouts ? workouts.filter((w: any) => w.status === 'completed').length : 0;
  const percentComplete = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  const isWeeklyPlanCompleted = workouts && workouts.length > 0 && completedWorkouts === totalWorkouts;

  // Formatar dados do gráfico comparativo planejado vs executado
  // Vamos plotar a carga TSS planejada para cada dia de Segunda (1) a Domingo (7) versus a carga executada
  const tssLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const tssTargetData = [0, 0, 0, 0, 0, 0, 0];
  const tssRealData = [0, 0, 0, 0, 0, 0, 0];

  if (workouts) {
    workouts.forEach((w: any) => {
      const idx = w.day_of_week - 1;
      if (idx >= 0 && idx < 7) {
        tssTargetData[idx] += w.tss_target;
        // Se estiver completo, o TSS realizado é computado.
        // Tentamos achar se tem log na mesma data/treino.
        if (w.status === 'completed') {
          // Achar se tem log de atividade correspondente
          const log = activityLogs?.find((l: any) => l.workout_id === w.id);
          tssRealData[idx] += log ? log.tss_real : w.tss_target; // Fallback para target se não tiver log
        }
      }
    });
  }

  const chartData = {
    labels: tssLabels,
    datasets: [
      {
        label: 'Carga Planejada (TSS)',
        data: tssTargetData,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: 'Carga Realizada (TSS)',
        data: tssRealData,
        backgroundColor: user?.level === 'elite' ? 'rgba(57, 255, 20, 0.75)' : 'rgba(0, 240, 255, 0.75)',
        borderColor: user?.level === 'elite' ? '#39ff14' : '#00f0ff',
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'var(--font-main)', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#0d1527',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  // Calcular TSB Status Class e Mensagem
  let tsbStatus = 'Equilibrado';
  let tsbColor = 'var(--neon-green)';
  if (metrics) {
    if (metrics.tsb < -20) {
      tsbStatus = 'Zona de Sobrecarga (Risco de Lesão)';
      tsbColor = 'var(--neon-red)';
    } else if (metrics.tsb < -10) {
      tsbStatus = 'Estresse de Desenvolvimento (Evolução)';
      tsbColor = 'var(--neon-orange)';
    } else if (metrics.tsb > 10) {
      tsbStatus = 'Fase de Polimento / Descanso (Pronto p/ Prova)';
      tsbColor = 'var(--neon-cyan)';
    }
  }

  // Auxiliar para pegar cor por tipo de treino
  const getWorkoutColor = (type: string) => {
    const config = getSportConfig(type);
    if (config) return config.color;
    
    // Fallbacks para compatibilidade com nomes antigos
    if (type === 'Natacao') return 'var(--neon-purple)';
    if (type === 'Forca') return 'var(--neon-orange)';
    
    return 'var(--text-muted)';
  };

  // Auxiliar para pegar emoji/ícone por tipo de treino
  const getWorkoutIcon = (type: string) => {
    const config = getSportConfig(type);
    if (config) return config.emoji;
    
    // Fallbacks
    if (type === 'Natacao') return '🏊‍♂️';
    if (type === 'Forca') return '💪';
    if (type === 'Descanso') return '💤';
    
    return '💪';
  };

  // Verifica se o treino já expirou o limite de 48 horas para realização
  const isWorkoutOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    const today = currentTime ? new Date(currentTime) : new Date();
    const targetDateEnd = new Date(dateStr + 'T23:59:59');
    const diffTime = today.getTime() - targetDateEnd.getTime();
    return diffTime > 48 * 60 * 60 * 1000;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* NAVBAR HEADER */}
      <header style={{ background: 'rgba(6, 9, 19, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10, padding: '12px 20px' }}>
        <div className="navbar-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Logo */}
          <div className="navbar-logo-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.3s ease', filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.4))' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}>
                <defs>
                  <linearGradient id="ultra-grad-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="50%" stopColor="#b4f8c8" />
                    <stop offset="100%" stopColor="#39ff14" />
                  </linearGradient>
                </defs>
                <path d="M6 18L16 6L26 18" stroke="url(#ultra-grad-nav)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 24L16 16L22 24" stroke="url(#ultra-grad-nav)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                <path d="M6 18C6 24 10 28 16 28C22 28 26 24 26 18" stroke="url(#ultra-grad-nav)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              </svg>
              <div className="navbar-logo-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(90deg, #fff 0%, #00f0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, lineHeight: 1 }}>
                    ULTRA
                  </h2>
                  <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '4px', color: 'var(--neon-cyan)', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1 }}>
                    COACH
                  </span>
                </div>
                <span className="navbar-slogan">
                  Esforço conjunto, conquista compartilhada!
                </span>
              </div>
            </div>
          </div>

          {/* Active User Info & Switch */}
          <div className="navbar-athlete-info">
            <div className="navbar-athlete-badge-row">
              {(() => {
                const isRealConnected = user?.strava_connected && user?.strava_access_token && !user?.strava_access_token.startsWith('mock_');
                const isMockConnected = user?.strava_connected && user?.strava_access_token && user?.strava_access_token.startsWith('mock_');
                
                let dotColor = 'var(--text-muted)';
                let glow = 'none';
                let label = 'Desconectado';
                
                if (isRealConnected) {
                  dotColor = '#fc4c02'; // Strava Orange
                  glow = 'pulseGlow 2s infinite';
                  label = 'Strava Real Conectado';
                } else if (isMockConnected) {
                  dotColor = 'var(--neon-cyan)';
                  glow = 'pulseGlow 2s infinite';
                  label = 'Strava Sandbox Ativo';
                }
                
                return (
                  <div 
                    title={`Status Strava: ${label}`}
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: dotColor, 
                      animation: glow 
                    }}
                  ></div>
                );
              })()}
              <span style={{ color: 'var(--text-secondary)' }}>Atleta:</span>
              <strong style={{ color: '#fff' }}>{user?.name}</strong>
              <span style={{ fontSize: '0.75rem', padding: '1px 6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: user?.level === 'elite' ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
                {user?.level?.toUpperCase() || ''}
              </span>
            </div>
            
            <div className="navbar-actions">
              {(!user?.strava_connected || !user?.strava_access_token || user?.strava_access_token.startsWith('mock_')) && (
                <a 
                  href={`/api/strava/auth?userId=${user?.id}`}
                  style={{ 
                    background: 'linear-gradient(135deg, #fc4c02 0%, #d83c01 100%)', 
                    color: '#fff', 
                    borderRadius: '8px', 
                    padding: '6px 12px', 
                    fontSize: '0.75rem', 
                    textDecoration: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(252, 76, 2, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'var(--transition-smooth)' 
                  }}
                >
                  Conectar Strava Real
                </a>
              )}
              <button 
                onClick={() => {
                  setActiveUser(null);
                  setDashboardData(null);
                  setChatMessages([]);
                  setUsernameInput('');
                  setPasswordInput('');
                }}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--neon-red)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                Sair
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {(celebration || showProfileCelebration || isWeeklyPlanCompleted) && <ConfettiShower />}

        {/* COCKPIT CHRONOMETER & CALENDAR WIDGET */}
        <section className="animate-slide-up" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '20px',
          width: '100%'
        }}>
          {/* Card 1: Calendário & Relógio Digital */}
          <div className="premium-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            position: 'relative', 
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.85) 0%, rgba(6, 9, 19, 0.85) 100%)',
            minHeight: '160px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ 
                  color: 'var(--neon-cyan)', 
                  textTransform: 'uppercase', 
                  fontSize: '0.8rem', 
                  fontWeight: 800, 
                  letterSpacing: '0.15em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Calendar size={14} />
                  {currentTime ? getWeekdayName(currentTime) : 'Carregando Dia...'}
                </span>
                <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginTop: '2px' }}>
                  {currentTime ? getFormattedLongDate(currentTime) : 'Carregando Data...'}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Clock size={16} style={{ color: 'var(--neon-cyan)', animation: 'pulseGlow 2s infinite' }} />
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '1.15rem', 
                  fontWeight: 700, 
                  color: '#fff',
                  letterSpacing: '0.05em'
                }}>
                  {currentTime ? getFormattedTime(currentTime) : '00:00:00'}
                </span>
              </div>
            </div>

            {celebration && (
              <div style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: celebration.type === 'birthday' 
                  ? 'rgba(252, 76, 2, 0.12)' 
                  : 'rgba(0, 240, 255, 0.08)',
                border: celebration.type === 'birthday' 
                  ? '1px solid rgba(252, 76, 2, 0.25)' 
                  : '1px solid rgba(0, 240, 255, 0.2)',
                boxShadow: celebration.type === 'birthday' 
                  ? '0 0 15px rgba(252, 76, 2, 0.15)' 
                  : '0 0 15px rgba(0, 240, 255, 0.1)'
              }}>
                <span style={{ fontSize: '1.1rem' }}>
                  {celebration.type === 'birthday' ? '🎂' : '🎉'}
                </span>
                <div style={{ flex: 1 }}>
                  <strong style={{ 
                    fontSize: '0.8rem', 
                    color: celebration.type === 'birthday' ? '#fc4c02' : 'var(--neon-cyan)',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {celebration.type === 'birthday' ? 'Aniversário!' : celebration.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {celebration.type === 'birthday' ? 'Comemore hoje com ótimos quilômetros!' : celebration.message.substring(0, 75) + '...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Status do Treino de Hoje */}
          <div className="premium-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.85) 0%, rgba(6, 9, 19, 0.85) 100%)',
            border: todayWorkout && todayWorkout.type !== 'Descanso' ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid var(--border-color)',
            boxShadow: todayWorkout && todayWorkout.type !== 'Descanso' ? '0 0 15px rgba(0, 240, 255, 0.1)' : 'none',
            minHeight: '160px'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ 
                  color: 'var(--text-secondary)', 
                  textTransform: 'uppercase', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  letterSpacing: '0.05em' 
                }}>
                  Hoje na Planilha
                </span>
                {(() => {
                  if (!todayWorkout) return null;
                  const isCompleted = todayWorkout.status === 'completed';
                  const isAdjusted = todayWorkout.status === 'adjusted';
                  
                  let badgeBg = 'rgba(255, 255, 255, 0.05)';
                  let badgeBorder = 'rgba(255, 255, 255, 0.1)';
                  let badgeColor = 'var(--text-secondary)';
                  let badgeText = 'Pendente';
                  
                  if (isCompleted) {
                    badgeBg = 'rgba(57, 255, 20, 0.1)';
                    badgeBorder = 'rgba(57, 255, 20, 0.2)';
                    badgeColor = 'var(--neon-green)';
                    badgeText = 'Concluído';
                  } else if (isAdjusted) {
                    badgeBg = 'rgba(255, 107, 53, 0.12)';
                    badgeBorder = 'rgba(255, 107, 53, 0.25)';
                    badgeColor = 'var(--neon-orange)';
                    badgeText = 'Ajustado';
                  }
                  
                  return (
                    <span style={{ 
                      fontSize: '0.65rem', 
                      padding: '2px 8px', 
                      background: badgeBg, 
                      border: `1px solid ${badgeBorder}`, 
                      borderRadius: '4px', 
                      color: badgeColor, 
                      fontWeight: 700, 
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      {badgeText}
                    </span>
                  );
                })()}
              </div>

              {todayWorkout ? (
                todayWorkout.type === 'Descanso' ? (
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      💤 OFF Fisiológico
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.3' }}>
                      Dia de repouso completo. Permita que as fibras musculares se recuperem e consolidem a supercompensação!
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: getWorkoutColor(todayWorkout.type), display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getWorkoutIcon(todayWorkout.type)} {todayWorkout.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.3', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {todayWorkout.description}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.8rem' }}>
                      <span>Prescrito: <strong>{todayWorkout.distance_target > 0 ? formatDistance(todayWorkout.distance_target) + ' km' : ''}{todayWorkout.duration_target > 0 ? ` (${secondsToTime(todayWorkout.duration_target)})` : ''}</strong></span>
                      <span>Carga: <strong style={{ color: 'var(--neon-green)' }}>{todayWorkout.tss_target} TSS</strong></span>
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Nenhum treino agendado
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Não encontramos nenhuma prescrição para a data de hoje nesta planilha.
                  </p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* BANNER PLANILHA 100% CONCLUÍDA */}
        {isWeeklyPlanCompleted && (
          <section className="premium-card animate-slide-up" style={{ 
            background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.12) 0%, rgba(0, 240, 255, 0.1) 100%)',
            borderColor: 'var(--neon-green)',
            borderWidth: '2px',
            borderStyle: 'solid',
            padding: '24px', 
            borderRadius: '16px',
            boxShadow: '0 0 30px rgba(57, 255, 20, 0.3), inset 0 0 20px rgba(57, 255, 20, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Efeitos de brilho no background */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-20%',
              width: '60%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(57, 255, 20, 0.15) 0%, transparent 70%)',
              transform: 'rotate(-30deg)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-50%',
              right: '-20%',
              width: '60%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)',
              transform: 'rotate(-30deg)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ fontSize: '3rem', animation: 'pulseScore 2s infinite', display: 'inline-block', zIndex: 1 }}>
              🏆
            </div>
            <div style={{ flex: 1, zIndex: 1 }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800,
                color: 'var(--neon-green)', 
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textShadow: '0 0 10px rgba(57, 255, 20, 0.5)'
              }}>
                Planilha Semanal 100% Cumprida! 🎉
              </h3>
              <p style={{ fontSize: '1.05rem', color: '#fff', lineHeight: '1.5', fontWeight: 600 }}>
                Sensacional, {user?.name}! Você completou com absoluto sucesso 100% dos treinos prescritos para esta semana!
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                Você acumulou toda a carga fisiológica planejada e deu um passo gigantesco rumo ao seu objetivo de {goal?.type ? `conquistar a prova de ${goal.type}` : 'evolução constante'}. A sua dedicação é inspiração pura. Aproveite a merecida supercompensação!
              </p>
            </div>
            <style jsx global>{`
              @keyframes pulseScore {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(57, 255, 20, 0.4)); }
                50% { transform: scale(1.1); filter: drop-shadow(0 0 15px rgba(57, 255, 20, 0.8)); }
              }
            `}</style>
          </section>
        )}

        {/* BANNER TEMÁTICO COMEMORATIVO */}
        {celebration && (
          <section className="premium-card animate-slide-up" style={{ 
            background: celebration.type === 'birthday' 
              ? 'linear-gradient(135deg, rgba(252, 76, 2, 0.18) 0%, rgba(168, 85, 247, 0.18) 100%)'
              : 'linear-gradient(135deg, rgba(0, 240, 255, 0.18) 0%, rgba(57, 255, 20, 0.12) 100%)',
            borderColor: celebration.type === 'birthday' ? 'rgba(252, 76, 2, 0.4)' : 'rgba(0, 240, 255, 0.4)',
            padding: '24px', 
            borderRadius: '16px',
            boxShadow: celebration.type === 'birthday' 
              ? '0 0 25px rgba(252, 76, 2, 0.25), inset 0 0 15px rgba(252, 76, 2, 0.1)' 
              : '0 0 25px rgba(0, 240, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '2.5rem', animation: 'bounce 2s infinite', display: 'inline-block' }}>
              {celebration.type === 'birthday' ? '🎂' : '🎉'}
            </div>
            <div style={{ flex: 1, zIndex: 1 }}>
              <h3 style={{ 
                fontSize: '1.4rem', 
                color: celebration.type === 'birthday' ? '#fc4c02' : 'var(--neon-cyan)', 
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {celebration.type === 'birthday' ? 'Feliz Aniversário! 🎉' : `${celebration.name}! 🌟`}
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.5', fontWeight: 500 }}>
                {celebration.message}
              </p>
            </div>
            <style jsx global>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }
            `}</style>
          </section>
        )}
        
        {/* TOP PHYSIOLOGICAL INSIGHT PANEL */}
        {metrics && (
          <section className="premium-card animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', padding: '20px', background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.8) 0%, rgba(6, 9, 19, 0.8) 100%)' }}>
            
            {/* CTL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', padding: '12px', background: 'rgba(57, 255, 20, 0.08)', borderRadius: '12px', border: '1px solid rgba(57, 255, 20, 0.15)' }}>
                <TrendingUp style={{ color: 'var(--neon-green)' }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>CTL (Fitness / Condicionamento)</span>
                <strong style={{ fontSize: '1.75rem', color: '#fff', fontFamily: 'var(--font-title)' }}>{metrics.ctl}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Base de estresse de longo prazo</span>
              </div>
            </div>

            {/* ATL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', padding: '12px', background: 'rgba(255, 107, 53, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 107, 53, 0.15)' }}>
                <Heart style={{ color: 'var(--neon-orange)' }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>ATL (Fadiga Recente)</span>
                <strong style={{ fontSize: '1.75rem', color: '#fff', fontFamily: 'var(--font-title)' }}>{metrics.atl}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Carga aguda nas últimas semanas</span>
              </div>
            </div>

            {/* TSB */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', padding: '12px', background: 'rgba(0, 240, 255, 0.08)', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                <Clock style={{ color: '#fc4c02' }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>TSB (Forma / Balanço)</span>
                <strong style={{ fontSize: '1.75rem', color: tsbColor, fontFamily: 'var(--font-title)' }}>{metrics.tsb}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Equilíbrio fisiológico (CTL - ATL)</span>
              </div>
            </div>

            {/* STATUS BRIEF */}
            <div className="status-brief-container">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status do Organismo</span>
              <strong style={{ fontSize: '0.95rem', color: '#fff', margin: '4px 0' }}>{tsbStatus}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tsbColor }}></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Métricas científicas de adaptação</span>
              </div>
            </div>

          </section>
        )}

        {/* NOTIFICAÇÃO DE ADAPTAÇÃO DA IA */}
        {notifications && notifications.length > 0 && (
          <div className="animate-fade-in" style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.2)', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertTriangle style={{ color: 'var(--neon-orange)', flexShrink: 0, marginTop: '2px' }} size={20} />
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {notifications[0].title}
                <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(255, 107, 53, 0.15)', color: 'var(--neon-orange)', borderRadius: '4px', fontWeight: 600 }}>IA Coach</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {notifications[0].content}
              </p>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="hide-scrollbar" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px', paddingBottom: '2px' }}>
          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('planilha')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'planilha' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              color: activeTab === 'planilha' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'planilha' ? 700 : 500,
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Calendar size={18} style={{ color: activeTab === 'planilha' ? 'var(--neon-cyan)' : 'inherit' }} />
            Planilha Semanal
          </button>
          
          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('coach')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'coach' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              color: activeTab === 'coach' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'coach' ? 700 : 500,
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <MessageSquare size={18} style={{ color: activeTab === 'coach' ? 'var(--neon-cyan)' : 'inherit' }} />
            Treinador IA (PhD)
            <Sparkles size={12} style={{ color: 'var(--neon-lime)' }} />
          </button>

          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('simulador')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'simulador' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              color: activeTab === 'simulador' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'simulador' ? 700 : 500,
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Database size={18} style={{ color: activeTab === 'simulador' ? 'var(--neon-cyan)' : 'inherit' }} />
            Último Treino Strava
            <span style={{ fontSize: '0.65rem', background: '#fc4c02', padding: '1px 5px', color: '#fff', borderRadius: '4px', fontWeight: 700 }}>CONECTADO</span>
          </button>

          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('perfil')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'perfil' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              color: activeTab === 'perfil' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'perfil' ? 700 : 500,
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <User size={18} style={{ color: activeTab === 'perfil' ? 'var(--neon-cyan)' : 'inherit' }} />
            Perfil & Dados
          </button>
        </div>

        {/* TAB CONTENTS */}
        
        {/* 1. PLANILHA SEMANALE DASHBOARD */}
        {activeTab === 'planilha' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            
            {/* Gráfico Comparativo & Meta do Usuário */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Gráfico Planilhado vs Realizado */}
              <div className="premium-card" style={{ height: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    Estresse de Treino da Semana (TSS)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Comparação da Carga Prescrita versus Sincronizada Garmin</p>
                </div>
                <div style={{ flex: 1, position: 'relative', marginTop: '16px', height: '220px' }}>
                  <BarChart data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* Detalhes do Objetivo / Periodização */}
              <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Periodização Científica</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Detalhes do macrociclo de preparação</p>
                    </div>
                    <span style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'rgba(0, 240, 255, 0.1)', color: '#fc4c02', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', fontWeight: 600 }}>
                      {goal?.type}
                    </span>
                  </div>

                  {['Triathlon', 'Duathlon', 'Aquathlon'].includes(goal?.type) ? (() => {
                    const splits = getMultiSportSplits(goal?.type, goal?.distance, goal?.target_time);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grande Objetivo</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{splits.label} ({formatDistance(goal?.distance)} km)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Data Alvo da Prova</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{goal?.date_target ? new Date(goal.date_target).toLocaleDateString('pt-BR') : 'N/A'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Carga Alvo Semanal</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fc4c02' }}>{goal?.weekly_tss_target} TSS</strong>
                        </div>

                        {/* Detalhes por Modalidade */}
                        <div style={{ 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          border: '1px solid rgba(255, 255, 255, 0.05)', 
                          borderRadius: '10px', 
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          marginTop: '6px'
                        }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: 'var(--neon-cyan)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            Metas por Modalidade
                          </span>
                          
                          {/* Swim */}
                          {splits.hasSwim && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1rem' }}>🏊‍♂️</span> Natação
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <strong>{formatDistance(splits.swim.distance)} km</strong> (@ {splits.swim.time})
                              </span>
                            </div>
                          )}

                          {/* Bike */}
                          {splits.hasBike && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: splits.hasSwim ? '1px solid rgba(255,255,255,0.03)' : 'none', paddingTop: splits.hasSwim ? '6px' : '0' }}>
                              <span style={{ fontSize: '0.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1rem' }}>🚴‍♂️</span> Ciclismo
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <strong>{formatDistance(splits.bike.distance)} km</strong> (@ {splits.bike.time})
                              </span>
                            </div>
                          )}

                          {/* Run */}
                          {splits.hasRun && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: (splits.hasSwim || splits.hasBike) ? '1px solid rgba(255,255,255,0.03)' : 'none', paddingTop: (splits.hasSwim || splits.hasBike) ? '6px' : '0' }}>
                              <span style={{ fontSize: '0.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1rem' }}>🏃‍♂️</span> Corrida
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <strong>{formatDistance(splits.run.distance)} km</strong> (@ {splits.run.time})
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tempo Total Esperado */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          background: 'linear-gradient(90deg, rgba(252, 76, 2, 0.12) 0%, rgba(252, 76, 2, 0.03) 100%)', 
                          border: '1px solid rgba(252, 76, 2, 0.3)', 
                          borderRadius: '8px', 
                          padding: '10px 12px',
                          marginTop: '6px',
                          boxShadow: '0 0 10px rgba(252, 76, 2, 0.05)'
                        }}>
                          <span style={{ fontSize: '0.8rem', color: '#fc4c02', fontWeight: 700 }}>Tempo Total Esperado</span>
                          <strong style={{ fontSize: '1.05rem', color: '#fff', fontFamily: 'var(--font-title)' }}>{goal?.target_time || 'N/A'}</strong>
                        </div>

                      </div>
                    );
                  })() : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grande Objetivo</span>
                        <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{goal?.type} ({formatDistance(goal?.distance)} km)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Data Alvo da Prova</span>
                        <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{goal?.date_target ? new Date(goal.date_target).toLocaleDateString('pt-BR') : 'N/A'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tempo Alvo Prescrito</span>
                        <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{goal?.target_time || 'N/A'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Carga Alvo Semanal</span>
                        <strong style={{ fontSize: '0.9rem', color: '#fc4c02' }}>{goal?.weekly_tss_target} TSS</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>Nota Fisiológica:</strong>
                  Sua carga semanal total está distribuída de forma {user?.level === 'elite' ? 'polarizada (80/20) para otimizar as mitocôndrias rápidas' : 'linear suave para evitar estresse articular precoce'}. A auto-regulação está configurada com base no seu limiar de {user?.threshold_pace}/km.
                </div>
              </div>

            </div>

            {/* Lista da Planilha Semanal */}
            <div>
              <div className="section-header-responsive" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, flexWrap: 'wrap' }}>
                  Planilha Semanal
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>({plan?.name})</span>
                </h3>
                <button
                  onClick={() => openManualLog(null)}
                  className="glow-btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(90deg, var(--neon-cyan) 0%, #00f0ff 100%)',
                    border: 'none',
                    color: '#030712',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
                  }}
                >
                  <Plus size={14} /> Lançar Treino Manual
                </button>
              </div>

              {/* Barra de Progresso Semanal */}
              {workouts && workouts.length > 0 && (
                <div className="premium-card" style={{ 
                  padding: '16px 20px', 
                  marginBottom: '16px',
                  background: 'rgba(13, 21, 39, 0.4)',
                  borderColor: isWeeklyPlanCompleted ? 'rgba(57, 255, 20, 0.3)' : 'var(--glass-border)',
                  boxShadow: isWeeklyPlanCompleted ? '0 0 15px rgba(57, 255, 20, 0.1)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Progresso da Semana: <strong style={{ color: isWeeklyPlanCompleted ? 'var(--neon-green)' : '#fff' }}>{percentComplete}%</strong>
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {completedWorkouts} de {totalWorkouts} treinos concluídos
                    </span>
                  </div>
                  
                  {/* Track da Barra de Progresso */}
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      width: `${percentComplete}%`, 
                      height: '100%', 
                      background: isWeeklyPlanCompleted 
                        ? 'linear-gradient(90deg, #39ff14 0%, #00f0ff 100%)' 
                        : 'linear-gradient(90deg, var(--neon-cyan) 0%, #0088ff 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-in-out',
                      boxShadow: isWeeklyPlanCompleted 
                        ? '0 0 10px #39ff14' 
                        : '0 0 8px var(--neon-cyan)'
                    }} />
                  </div>

                  {isWeeklyPlanCompleted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--neon-green)', fontWeight: 600 }}>
                      🏆 Planilha 100% concluída! Orgulho do seu esforço!
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {workouts && workouts.map((w: any) => {
                  const hasLog = activityLogs?.find((l: any) => l.workout_id === w.id);
                  const isRest = w.type === 'Descanso';
                  const isCompleted = w.status === 'completed';
                  const isAdjusted = w.status === 'adjusted';
                  const isToday = w.date === todayDateStr;
                  const isOverdue = !isCompleted && !isRest && isWorkoutOverdue(w.date);

                  return (
                    <div 
                      key={w.id} 
                      className="premium-card workout-card" 
                      onClick={() => setSelectedWorkout(w)}
                      style={{ 
                        cursor: 'pointer',
                        borderColor: isToday
                          ? 'var(--neon-cyan)'
                          : isCompleted 
                            ? 'rgba(57, 255, 20, 0.15)' 
                            : isAdjusted 
                              ? 'rgba(255, 107, 53, 0.2)' 
                              : isOverdue
                                ? 'rgba(255, 59, 48, 0.25)'
                                : 'var(--glass-border)',
                        background: isToday
                          ? 'rgba(0, 240, 255, 0.04)'
                          : isRest 
                            ? 'rgba(255,255,255,0.01)' 
                            : isCompleted 
                              ? 'rgba(57, 255, 20, 0.02)' 
                              : isOverdue
                                ? 'rgba(255, 59, 48, 0.03)'
                                : 'var(--glass-bg)',
                        boxShadow: isToday
                          ? '0 0 15px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.05)'
                          : 'none',
                        transform: isToday ? 'scale(1.01)' : 'none',
                        zIndex: isToday ? 2 : 1,
                        transition: 'var(--transition-smooth), transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = isToday ? 'scale(1.02)' : 'scale(1.01)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                        e.currentTarget.style.borderColor = isToday ? 'var(--neon-cyan)' : isOverdue ? 'rgba(255, 59, 48, 0.4)' : 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = isToday ? 'scale(1.01)' : 'none';
                        e.currentTarget.style.boxShadow = isToday ? '0 0 15px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.05)' : 'none';
                        e.currentTarget.style.borderColor = isToday
                          ? 'var(--neon-cyan)'
                          : isCompleted 
                            ? 'rgba(57, 255, 20, 0.15)' 
                            : isAdjusted 
                              ? 'rgba(255, 107, 53, 0.2)' 
                              : isOverdue
                                ? 'rgba(255, 59, 48, 0.25)'
                                : 'var(--glass-border)';
                      }}
                    >
                      {/* Dia e Tipo */}
                      <div className="workout-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em', 
                            color: isToday ? 'var(--neon-cyan)' : 'var(--text-secondary)', 
                            display: 'block',
                            fontWeight: isToday ? 800 : 500
                          }}>
                            {tssLabels[w.day_of_week - 1]}
                          </span>
                          {isToday && (
                            <span style={{ 
                              fontSize: '0.55rem', 
                              padding: '1px 4px', 
                              background: 'rgba(0, 240, 255, 0.15)', 
                              border: '1px solid var(--neon-cyan)', 
                              borderRadius: '4px', 
                              color: 'var(--neon-cyan)', 
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              animation: 'pulseGlow 2s infinite'
                            }}>
                              HOJE
                            </span>
                          )}
                        </div>
                        <strong style={{ fontSize: '0.9rem', color: getWorkoutColor(w.type), display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {getWorkoutIcon(w.type)} {getSportConfig(w.type)?.name || w.type}
                        </strong>
                      </div>

                      {/* Nome do Treino e Descrição */}
                      <div className="workout-card-info">
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {w.title}
                          {isAdjusted && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(255, 107, 53, 0.15)', color: 'var(--neon-orange)', borderRadius: '4px', fontWeight: 600 }}>
                              AJUSTADO
                            </span>
                          )}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineClamp: 1, WebkitLineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {w.description}
                        </p>
                      </div>

                      {/* Carga Alvo & Pace Prescrito */}
                      <div className="workout-card-metrics" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Prescrito</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {w.distance_target > 0 ? formatDistance(w.distance_target) + ' km' : ''}
                            {w.duration_target > 0 ? ` (${secondsToTime(w.duration_target)})` : ''}
                            {w.type === 'Forca' ? 'Funcional Core' : ''}
                            {isRest ? 'Off Fisiológico' : ''}
                          </span>
                          {!isRest && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {w.pace_target !== 'N/A' ? '@ ' + w.pace_target : ''} {w.power_target > 0 ? `| ${w.power_target}W` : ''}
                            </span>
                          )}
                        </div>

                        {/* Realizado (Garmin Sync) */}
                        {isCompleted && hasLog ? (
                          <div>
                            <span style={{ color: '#fc4c02', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>Sinc. Strava ✔</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {formatDistance(hasLog.distance_real)} km ({secondsToTime(hasLog.duration_real)})
                            </span>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              @ {hasLog.pace_real} {hasLog.avg_power > 0 ? `| ${hasLog.avg_power}W` : ''}
                            </span>
                          </div>
                        ) : isCompleted ? (
                          <div>
                            <span style={{ color: 'var(--neon-green)', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>Manual ✔</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {formatDistance(w.distance_target)} km
                            </span>
                          </div>
                        ) : isOverdue ? (
                          <div>
                            <span style={{ color: 'var(--neon-red)', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>Não Realizado</span>
                            <span style={{ color: 'var(--text-muted)' }}>Expirado 48h</span>
                          </div>
                        ) : (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Pendente</span>
                            <span style={{ color: 'var(--text-muted)' }}>--</span>
                          </div>
                        )}
                      </div>

                      {/* TSS Badge */}
                      <div className="workout-card-tss" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isCompleted ? 'var(--neon-green)' : 'var(--text-primary)' }}>
                          {isCompleted && hasLog ? hasLog.tss_real : w.tss_target} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)' }}>TSS</span>
                        </div>
                        {isCompleted && hasLog && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            Alvo: {w.tss_target}
                          </span>
                        )}
                        {!isRest && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.7rem' }}>
                            {isCompleted && hasLog ? (
                              <span style={{ color: '#fc4c02', background: 'rgba(0, 240, 255, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Strava Link</span>
                            ) : isRest ? null : isOverdue ? (
                              <span style={{ color: 'var(--neon-red)', background: 'rgba(255, 59, 48, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Não Realizado</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '1px 6px', borderRadius: '4px' }}>Manual/Pendente</span>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 2. CHAT COM O COACH IA */}
        {activeTab === 'coach' && (
          <div className="premium-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: 0, overflow: 'hidden' }}>
            
            {/* Chat Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(13, 21, 39, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', padding: '8px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '10px' }}>
                  <Sparkles style={{ color: '#fc4c02' }} size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>ULTRA COACH</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neon-lime)', display: 'block' }}>PhD em Fisiologia do Exercício | On-line</span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Métricas e cargas atuais no contexto</span>
            </div>

            {/* Chat Message Box */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatMessages.map((msg, index) => {
                const isCoach = msg.sender === 'coach';
                return (
                  <div 
                    key={index} 
                    style={{ 
                      alignSelf: isCoach ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                      display: 'flex',
                      gap: '8px',
                      flexDirection: isCoach ? 'row' : 'row-reverse'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: isCoach ? 'linear-gradient(135deg, var(--neon-cyan) 0%, #0088ff 100%)' : 'rgba(255, 255, 255, 0.1)',
                      color: isCoach ? '#030712' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {isCoach ? 'C' : 'U'}
                    </div>

                    {/* Bubble */}
                    <div style={{ 
                      background: isCoach ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 136, 255, 0.05) 100%)', 
                      border: isCoach ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 240, 255, 0.2)', 
                      borderRadius: isCoach ? '0 16px 16px 16px' : '16px 0 16px 16px',
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      lineHeight: '1.5',
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-line'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: 'var(--text-muted)' }} size={14} />
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0 16px 16px 16px', padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Analisando métricas de estresse CTL/ATL e preparando prescrição adaptada...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions suggestion */}
            <div style={{ padding: '8px 20px', display: 'flex', gap: '8px', overflowX: 'auto', borderTop: '1px solid var(--border-color)', background: 'rgba(6, 9, 19, 0.2)' }}>
              <button 
                onClick={() => handleQuickQuestion('Por que estou me sentindo cansado hoje?')}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Por que estou cansado?
              </button>
              <button 
                onClick={() => handleQuickQuestion('Como está meu nível de fadiga (ATL/TSB) atual?')}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Analisar fadiga ATL/TSB
              </button>
              <button 
                onClick={() => handleQuickQuestion('O que devo fazer para o treino de amanhã?')}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Instruções de amanhã
              </button>
              <button 
                onClick={() => handleQuickQuestion('Como funciona a auto-regulação com o Strava?')}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Como o Strava auto-regula?
              </button>
            </div>

            {/* Chat Input Box */}
            <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(13, 21, 39, 0.4)', display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Pergunte ao seu treinador sobre seu cansaço, metas ou adaptação de planilha..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                className="glow-btn" 
                style={{ borderRadius: '10px', padding: '12px' }}
                disabled={chatLoading}
              >
                <Send size={16} />
              </button>
            </form>

          </div>
        )}

        {/* 3. ÚLTIMO TREINO SINCRONIZADO DO STRAVA */}
        {activeTab === 'simulador' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            
            {/* Seção principal: Dados do Último Treino */}
            <div className="premium-card" style={{ background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.9) 0%, rgba(6, 9, 19, 0.9) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(252, 76, 2, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity style={{ color: '#fc4c02' }} size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Último Treino Importado</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Dados mais recentes recebidos via integração Strava</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#fc4c02', background: 'rgba(252, 76, 2, 0.08)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(252, 76, 2, 0.2)', fontWeight: 600 }}>
                  <Wifi size={14} />
                  Sincronização Ativa
                </div>
              </div>

              {lastSyncedActivity ? (
                <div>
                  {/* Grid de Métricas Principais */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    
                    {/* Modalidade */}
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Modalidade</span>
                      <strong style={{ fontSize: '1.25rem', color: getWorkoutColor(lastSyncedActivity.type), display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        {lastSyncedActivity.type}
                      </strong>
                    </div>

                    {/* Distância */}
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Distância</span>
                      <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '4px' }}>
                        {formatDistance(lastSyncedActivity.distance_real)} km
                      </strong>
                    </div>

                    {/* Duração */}
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Tempo Decorrido</span>
                      <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '4px' }}>
                        {secondsToTime(lastSyncedActivity.duration_real)}
                      </strong>
                    </div>

                    {/* Pace */}
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Ritmo Médio</span>
                      <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '4px' }}>
                        {lastSyncedActivity.pace_real}
                      </strong>
                    </div>

                    {/* Carga TSS */}
                    <div style={{ padding: '16px', background: 'rgba(57, 255, 20, 0.04)', borderRadius: '12px', border: '1px solid rgba(57, 255, 20, 0.1)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Carga de Estresse (TSS)</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--neon-green)', display: 'block', marginTop: '4px' }}>
                        {lastSyncedActivity.tss_real} TSS
                      </strong>
                    </div>

                  </div>

                  {/* Detalhes Fisiológicos Avançados */}
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--neon-cyan)', marginBottom: '12px' }}>Dinâmica e Biometria</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Frequência Cardíaca Média</span>
                        <strong style={{ display: 'block', fontSize: '1rem', color: '#fff', marginTop: '2px' }}>
                          {lastSyncedActivity.avg_hr ? `${lastSyncedActivity.avg_hr} bpm` : '--'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Frequência Cardíaca Máxima</span>
                        <strong style={{ display: 'block', fontSize: '1rem', color: '#fff', marginTop: '2px' }}>
                          {lastSyncedActivity.max_hr ? `${lastSyncedActivity.max_hr} bpm` : '--'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cadência Média</span>
                        <strong style={{ display: 'block', fontSize: '1rem', color: '#fff', marginTop: '2px' }}>
                          {lastSyncedActivity.cadency ? `${lastSyncedActivity.cadency} rpm` : '--'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ganho de Elevação</span>
                        <strong style={{ display: 'block', fontSize: '1rem', color: '#fff', marginTop: '2px' }}>
                          {lastSyncedActivity.elevation_gain ? `${lastSyncedActivity.elevation_gain} m` : '--'}
                        </strong>
                      </div>
                      {lastSyncedActivity.avg_power > 0 && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Potência Média</span>
                          <strong style={{ display: 'block', fontSize: '1rem', color: '#fff', marginTop: '2px' }}>
                            {lastSyncedActivity.avg_power} W
                          </strong>
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sincronizado Em</span>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff', marginTop: '2px' }}>
                          {new Date(lastSyncedActivity.timestamp).toLocaleString('pt-BR')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Informação sobre associação */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                    <CheckCircle style={{ color: 'var(--neon-green)' }} size={16} />
                    <span>
                      Este treino foi associado automaticamente {lastSyncedActivity.workout_id ? 'a um treino planejado na sua planilha.' : 'como treino extra não planejado.'}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Clock style={{ color: 'var(--text-muted)' }} size={28} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>Nenhum treino sincronizado ainda</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', maxWidth: '400px', margin: '8px auto 0' }}>
                      Assim que você subir seu primeiro treino real no Strava (ou disparar um treino simulado abaixo), os detalhes consolidados dele aparecerão aqui.
                    </p>
                  </div>
                </div>
              )}
            </div>


          </div>
        )}

        {/* 4. PERFIL E DADOS PESSOAIS */}
        {activeTab === 'perfil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            {profileMessage && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '16px 20px', 
                  background: profileMessage.type === 'success' ? 'rgba(57, 255, 20, 0.06)' : 'rgba(255, 59, 48, 0.06)', 
                  border: profileMessage.type === 'success' ? '1px solid rgba(57, 255, 20, 0.2)' : '1px solid rgba(255, 59, 48, 0.2)', 
                  borderRadius: '12px', 
                  color: profileMessage.type === 'success' ? 'var(--neon-green)' : 'var(--neon-red)', 
                  fontSize: '0.9rem', 
                  fontWeight: 500 
                }} 
                className="animate-slide-up"
              >
                {profileMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            {/* SEÇÃO DE CALIBRAÇÃO INTELIGENTE VIA STRAVA */}
            <div className="premium-card" style={{ 
              background: 'linear-gradient(135deg, rgba(252, 76, 2, 0.08) 0%, rgba(13, 21, 39, 0.8) 100%)',
              border: '1px solid rgba(252, 76, 2, 0.25)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px rgba(252, 76, 2, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '45px', 
                    height: '45px', 
                    background: 'rgba(252, 76, 2, 0.15)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(252, 76, 2, 0.3)'
                  }}>
                    <Activity style={{ color: '#fc4c02' }} size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)' }}>
                      Calibração Fisiológica Inteligente (Strava)
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                      Analise seus treinos recentes no Strava ou sua última corrida de no mínimo 30 minutos cadastrada para calibrar limiares de esforço e nível.
                    </p>
                  </div>
                </div>
                
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#fc4c02', 
                  background: 'rgba(252, 76, 2, 0.1)', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  border: '1px solid rgba(252, 76, 2, 0.25)', 
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Wifi size={12} />
                  {dashboardData?.user?.strava_connected && !dashboardData?.user?.strava_access_token?.startsWith('mock_') ? 'Strava Real Conectado' : 'Sincronização Indisponível'}
                </span>
              </div>

              <div style={{ 
                borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
                paddingTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {/* Seleção do Período de Análise */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Selecione o Período de Análise Fisiológica
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setCalibrationPeriod(30)}
                      style={{
                        background: calibrationPeriod === 30 ? 'rgba(252, 76, 2, 0.08)' : 'rgba(255,255,255,0.01)',
                        border: calibrationPeriod === 30 ? '2px solid #fc4c02' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition-smooth)',
                        boxShadow: calibrationPeriod === 30 ? '0 0 15px rgba(252, 76, 2, 0.15)' : 'none'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '1rem', color: '#fff' }}>Últimos 30 dias</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                        Adequado para reajustes rápidos após férias ou retorno recente de lesões.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalibrationPeriod(60)}
                      style={{
                        background: calibrationPeriod === 60 ? 'rgba(252, 76, 2, 0.08)' : 'rgba(255,255,255,0.01)',
                        border: calibrationPeriod === 60 ? '2px solid #fc4c02' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        transition: 'var(--transition-smooth)',
                        boxShadow: calibrationPeriod === 60 ? '0 0 15px rgba(252, 76, 2, 0.15)' : 'none'
                      }}
                    >
                      {/* Badge Recomendado */}
                      <span style={{ 
                        position: 'absolute', 
                        top: '-10px', 
                        right: '12px', 
                        fontSize: '0.65rem', 
                        background: 'linear-gradient(135deg, var(--neon-green) 0%, #00cc3f 100%)', 
                        color: '#030712', 
                        padding: '3px 8px', 
                        borderRadius: '8px', 
                        fontWeight: 800,
                        boxShadow: '0 0 10px rgba(57, 255, 20, 0.3)'
                      }}>
                        RECOMENDADO
                      </span>
                      <strong style={{ display: 'block', fontSize: '1rem', color: '#fff' }}>Últimos 60 dias (Padrão Fisiológico)</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                        Analisa o condicionamento crônico (CTL). Ideal para estabilização de limiares.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Botão de Disparo */}
                {!calibrationResult && !calibrationLoading && (
                  <button
                    type="button"
                    onClick={handleCalibrateStrava}
                    style={{
                      background: 'linear-gradient(135deg, #fc4c02 0%, #e23e00 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '16px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      transition: 'var(--transition-smooth)',
                      boxShadow: '0 4px 15px rgba(252, 76, 2, 0.25)'
                    }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(252, 76, 2, 0.4)'}
                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(252, 76, 2, 0.25)'}
                  >
                    <RefreshCw size={20} />
                    Analisar Atividades do Strava
                  </button>
                )}

                {/* Mensagens de erro */}
                {calibrationError && (
                  <div style={{ 
                    padding: '12px 16px', 
                    background: 'rgba(255, 59, 48, 0.08)', 
                    border: '1px solid rgba(255, 59, 48, 0.2)', 
                    borderRadius: '8px', 
                    color: 'var(--neon-red)', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={16} />
                    <span>{calibrationError}</span>
                  </div>
                )}

                {/* Loader da Calibração */}
                {calibrationLoading && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '30px 20px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255, 255, 255, 0.08)'
                  }} className="animate-fade-in">
                    <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: '#fc4c02' }} size={32} />
                    <div style={{ textAlign: 'center' }}>
                      <strong style={{ display: 'block', color: '#fff', fontSize: '0.95rem' }}>Analisando atividades do Strava...</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                        Calculando carga crônica de treino (CTL), identificando frequências limiares e velocidades ideais.
                      </p>
                    </div>
                  </div>
                )}

                {/* RESULTADO DA ANÁLISE DE CALIBRAÇÃO */}
                {calibrationResult && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px',
                    padding: '20px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px'
                  }} className="animate-slide-up">
                    
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--neon-cyan)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                      Relatório de Análise Fisiológica ({calibrationResult.analysis.days} dias)
                    </h4>

                    {calibrationResult.analysis.isFallback && (
                      <div style={{ 
                        padding: '12px 16px', 
                        background: 'rgba(255, 107, 53, 0.06)', 
                        border: '1px solid rgba(255, 107, 53, 0.2)', 
                        borderRadius: '8px', 
                        color: 'var(--neon-orange)', 
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        lineHeight: '1.4'
                      }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          <strong>Nota do ULTRA COACH:</strong> Não localizamos atividades de treino recentes sincronizadas no Strava. A calibração foi baseada na sua <strong>última corrida de no mínimo 30 minutos</strong> encontrada no histórico local: <em>{calibrationResult.analysis.fallbackActivityName}</em>.
                        </span>
                      </div>
                    )}

                    {/* Grid de Resumo das Atividades */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Treinos Analisados</span>
                        <strong style={{ fontSize: '1.2rem', color: '#fff', display: 'block', marginTop: '2px' }}>
                          {calibrationResult.analysis.totalActivities}
                        </strong>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Distância Acumulada</span>
                        <strong style={{ fontSize: '1.2rem', color: '#fff', display: 'block', marginTop: '2px' }}>
                          {formatDistance(calibrationResult.analysis.totalDistance)} km
                        </strong>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Média de Volume Semanal</span>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--neon-green)', display: 'block', marginTop: '2px' }}>
                          {calibrationResult.analysis.weeklyAvgHours} horas/sem
                        </strong>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Frequência Máxima Real</span>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--neon-red)', display: 'block', marginTop: '2px' }}>
                          {calibrationResult.analysis.maxHrObserved ? `${calibrationResult.analysis.maxHrObserved} bpm` : 'Não reg.'}
                        </strong>
                      </div>
                    </div>

                    {/* Comparativo de Limiares */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Comparação e Ajustes Sugeridos pelo Coach
                      </span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* Linha 1: Nível */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Nível Esportivo</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              {calibrationResult.currentMetrics.level === 'elite' ? 'Elite' : calibrationResult.currentMetrics.level === 'intermediario' ? 'Intermediário' : 'Iniciante'}
                            </span>
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ 
                              fontSize: '0.85rem', 
                              fontWeight: 800, 
                              color: calibrationResult.suggestedMetrics.level === 'elite' ? 'var(--neon-cyan)' : calibrationResult.suggestedMetrics.level === 'intermediario' ? 'var(--neon-orange)' : 'var(--neon-lime)',
                              background: 'rgba(255,255,255,0.03)',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {calibrationResult.suggestedMetrics.level === 'elite' ? 'Elite' : calibrationResult.suggestedMetrics.level === 'intermediario' ? 'Intermediário' : 'Iniciante'}
                            </span>
                          </div>
                        </div>

                        {/* Linha 2: Frequência Cardíaca */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Frequência Limiar</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {calibrationResult.currentMetrics.threshold_hr} bpm
                            </span>
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                              {calibrationResult.suggestedMetrics.threshold_hr} bpm
                            </span>
                            {calibrationResult.comparison.hrDiff !== 0 && (
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                color: calibrationResult.comparison.hrDiff > 0 ? 'var(--neon-red)' : 'var(--neon-green)',
                                background: calibrationResult.comparison.hrDiff > 0 ? 'rgba(255, 59, 48, 0.08)' : 'rgba(57, 255, 20, 0.08)',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}>
                                {calibrationResult.comparison.hrDiff > 0 ? `+${calibrationResult.comparison.hrDiff}` : calibrationResult.comparison.hrDiff} bpm
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Linha 3: Pace */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Ritmo de Limiar (Pace)</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {calibrationResult.currentMetrics.threshold_pace}/km
                            </span>
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                              {calibrationResult.suggestedMetrics.threshold_pace}/km
                            </span>
                            {calibrationResult.comparison.paceDiffSecs !== 0 && (
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                color: calibrationResult.comparison.paceDiffSecs > 0 ? 'var(--neon-green)' : 'var(--neon-red)',
                                background: calibrationResult.comparison.paceDiffSecs > 0 ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255, 59, 48, 0.08)',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}>
                                {calibrationResult.comparison.paceDiffSecs > 0 ? 'Mais rápido' : 'Mais lento'} ({calibrationResult.comparison.paceDiffStr}/km)
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Explicação do Coach */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '14px', background: 'rgba(0, 240, 255, 0.04)', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.12)' }}>
                      <Sparkles size={16} style={{ color: 'var(--neon-cyan)', marginTop: '2px', flexShrink: 0 }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                        <strong>Análise do ULTRA COACH:</strong> {(() => {
                          const userLevel = calibrationResult.suggestedMetrics.level;
                          if (userLevel === 'elite') {
                            return 'O atleta apresenta um volume e intensidade consistentes de alto nível. Recomenda-se manter limiares agressivos para forçar a supercompensação aeróbia.';
                          } else if (userLevel === 'intermediario') {
                            return 'Excelente regularidade! A resposta cardiovascular indica uma sólida base aeróbia. Ajustar os limiares permitirá otimizar os treinos de tempo-run e intervalados.';
                          } else {
                            return 'Nível ideal para o fortalecimento e ganho de capacidade pulmonar inicial. Foco em manter o conforto cardiovascular e consistência nos treinos leves.';
                          }
                        })()}
                      </p>
                    </div>

                    {/* Botões de Ação */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={handleApplyCalibration}
                        className="glow-btn"
                        style={{ flex: 2, padding: '14px' }}
                      >
                        <Check size={18} />
                        Aplicar Calibração no Perfil
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalibrationResult(null)}
                        style={{ 
                          flex: 1, 
                          padding: '14px', 
                          background: 'rgba(255,255,255,0.03)', 
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'var(--text-secondary)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      >
                        Descartar
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* CARD 1: DADOS PESSOAIS E ACESSO */}
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                      <User size={20} style={{ color: 'var(--neon-cyan)' }} />
                      Dados Pessoais & Acesso
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                      Gerencie suas informações de perfil e credenciais de acesso ao cockpit.
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label htmlFor="profile-name" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nome Completo</label>
                      <input 
                        id="profile-name"
                        type="text" 
                        className="glass-input" 
                        placeholder="Nome completo do atleta"
                        value={profileForm.name} 
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                        required 
                        disabled={profileSaving}
                      />
                    </div>

                    <div className="form-grid-2">
                      <div>
                        <label htmlFor="profile-birth" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Data de Nascimento</label>
                        <input 
                          id="profile-birth"
                          type="date" 
                          className="glass-input" 
                          value={profileForm.birth_date} 
                          onChange={e => setProfileForm({ ...profileForm, birth_date: e.target.value })} 
                          disabled={profileSaving}
                        />
                      </div>
                      <div>
                        <label htmlFor="profile-weight" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Peso (kg)</label>
                        <input 
                          id="profile-weight"
                          type="number" 
                          step="0.1"
                          className="glass-input" 
                          placeholder="Ex: 75.0"
                          value={profileForm.weight} 
                          onChange={e => setProfileForm({ ...profileForm, weight: e.target.value })} 
                          required 
                          disabled={profileSaving}
                        />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '20px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--neon-lime)', marginBottom: '16px' }}>Credenciais de Acesso</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label htmlFor="profile-username" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Usuário de Login</label>
                          <input 
                            id="profile-username"
                            type="text" 
                            className="glass-input" 
                            placeholder="Seu login"
                            value={profileForm.username} 
                            onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} 
                            required 
                            disabled={profileSaving}
                          />
                        </div>
                        <div>
                          <label htmlFor="profile-password" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nova Senha</label>
                          <input 
                            id="profile-password"
                            type="password" 
                            className="glass-input" 
                            placeholder="Nova senha de acesso"
                            value={profileForm.password} 
                            onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} 
                            required 
                            disabled={profileSaving}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: CONFIGURAÇÕES FISIOLÓGICAS E METAS */}
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                      <Sliders size={20} style={{ color: 'var(--neon-cyan)' }} />
                      Limiares Fisiológicos & Nível
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                      Calibre seus limiares para que o ULTRA COACH calcule sua fadiga (TSS) de forma precisa.
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Seleção de Nível Esportivo */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nível de Condicionamento</label>
                      <div className="level-grid">
                        {[
                          { value: 'sedentario', label: 'Iniciante', desc: 'Saindo do sedentarismo' },
                          { value: 'intermediario', label: 'Intermediário', desc: 'Treinos estruturados' },
                          { value: 'elite', label: 'Elite / Avançado', desc: 'Treinos em alta intensidade' }
                        ].map(l => {
                          const isActive = profileForm.level === l.value;
                          return (
                            <button
                              key={l.value}
                              type="button"
                              onClick={() => setProfileForm({ ...profileForm, level: l.value })}
                              disabled={profileSaving}
                              style={{
                                background: isActive ? 'rgba(0, 240, 255, 0.06)' : 'rgba(255,255,255,0.01)',
                                border: isActive ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '10px',
                                padding: '12px 8px',
                                cursor: 'pointer',
                                transition: 'var(--transition-smooth)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                textAlign: 'center',
                                boxShadow: isActive ? '0 0 15px rgba(0, 240, 255, 0.1)' : 'none'
                              }}
                            >
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isActive ? '#fff' : 'var(--text-primary)' }}>{l.label}</span>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{l.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inputs de Limiares */}
                    <div className="form-grid-2">
                      <div>
                        <label htmlFor="profile-thr" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Frequência Limiar (bpm)</label>
                        <input 
                          id="profile-thr"
                          type="number" 
                          className="glass-input" 
                          placeholder="Ex: 162"
                          value={profileForm.threshold_hr} 
                          onChange={e => setProfileForm({ ...profileForm, threshold_hr: e.target.value })} 
                          required 
                          disabled={profileSaving}
                        />
                      </div>
                      <div>
                        <label htmlFor="profile-pace" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Ritmo de Limiar (Pace)</label>
                        <input 
                          id="profile-pace"
                          type="text" 
                          className="glass-input" 
                          placeholder="Ex: 5:15"
                          value={profileForm.threshold_pace} 
                          onChange={e => setProfileForm({ ...profileForm, threshold_pace: e.target.value })} 
                          required 
                          disabled={profileSaving}
                        />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Formato MM:SS por km</span>
                      </div>
                    </div>

                    {/* Meta Semanal de Horas */}
                    <div>
                      <label htmlFor="profile-hours" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Meta de Horas Semanais</label>
                      <input 
                        id="profile-hours"
                        type="number" 
                        className="glass-input" 
                        placeholder="Ex: 6"
                        value={profileForm.weekly_target_hours} 
                        onChange={e => setProfileForm({ ...profileForm, weekly_target_hours: e.target.value })} 
                        required 
                        disabled={profileSaving}
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 3: OBJETIVO E METAS ESPORTIVAS */}
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                      <Target size={20} style={{ color: 'var(--neon-cyan)' }} />
                      Objetivo Esportivo & Meta
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                      Defina sua meta esportiva principal para que a planilha seja alinhada.
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div className="form-grid-2">
                      <div>
                        <label htmlFor="goal-type" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tipo de Prova</label>
                        <select 
                          id="goal-type"
                          className="glass-input" 
                          value={profileForm.goal_type} 
                          onChange={e => setProfileForm({ ...profileForm, goal_type: e.target.value })} 
                          disabled={profileSaving}
                          style={{
                            background: 'rgba(3, 7, 18, 0.6)',
                            color: '#fff',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {SPORTS_CONFIG.filter(sport => sport.id !== 'Descanso').map(sport => (
                            <option key={sport.id} value={sport.id} style={{ background: '#0d1527', color: '#fff' }}>
                              {sport.emoji} {sport.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="goal-distance" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Distância Alvo (km)</label>
                        <input 
                          id="goal-distance"
                          type="number" 
                          step="0.01"
                          className="glass-input" 
                          placeholder="Ex: 42.2 ou 226.2"
                          value={profileForm.goal_distance} 
                          onChange={e => setProfileForm({ ...profileForm, goal_distance: e.target.value })} 
                          required 
                          disabled={profileSaving}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div>
                        <label htmlFor="goal-date" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Data da Prova</label>
                        <input 
                          id="goal-date"
                          type="date" 
                          className="glass-input" 
                          value={profileForm.goal_date_target} 
                          onChange={e => setProfileForm({ ...profileForm, goal_date_target: e.target.value })} 
                          disabled={profileSaving}
                        />
                      </div>
                      <div>
                        <label htmlFor="goal-time" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tempo Alvo Esperado</label>
                        <input 
                          id="goal-time"
                          type="text" 
                          className="glass-input" 
                          placeholder="Ex: 09:45:00"
                          value={profileForm.goal_target_time} 
                          onChange={e => setProfileForm({ ...profileForm, goal_target_time: maskTimeInput(e.target.value) })} 
                          required 
                          disabled={profileSaving}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="goal-tss" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Carga Alvo Semanal (TSS)</label>
                      <input 
                        id="goal-tss"
                        type="number" 
                        className="glass-input" 
                        placeholder="Ex: 650"
                        value={profileForm.goal_weekly_tss_target} 
                        onChange={e => setProfileForm({ ...profileForm, goal_weekly_tss_target: e.target.value })} 
                        required 
                        disabled={profileSaving}
                      />
                    </div>

                  </div>
                </div>

              </div>

              {/* Botão de Submissão */}
              <button 
                type="submit" 
                className={profileForm.level === 'elite' ? "glow-btn-lime" : "glow-btn"} 
                style={{ width: '100%', padding: '16px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '12px' }}
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <>
                    <RefreshCw style={{ animation: 'spin 1.5s linear infinite' }} size={20} />
                    Salvando Alterações Fisiológicas...
                  </>
                ) : (
                  <>
                    Salvar Alterações e Recalibrar Cockpit
                    <Check size={20} />
                  </>
                )}
              </button>
            </form>

            {/* CARD 3: INTEGRAÇÃO DE AGENDA (iCal/ICS) */}
            <div className="premium-card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              marginTop: '24px',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 240, 255, 0.05)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                  <Calendar size={20} style={{ color: 'var(--neon-cyan)' }} />
                  Sincronização com Calendário (Google Agenda / Apple / Outlook)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Sincronize toda a sua planilha de treinos dinâmicos automaticamente com o seu aplicativo de calendário pessoal.
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Copie o link seguro abaixo e assine-o em seu aplicativo de agenda. Os treinos do ULTRA COACH serão atualizados e exibidos automaticamente.
                </p>

                {/* Input de Copiar Link */}
                <div className="copy-link-container">
                  <input 
                    type="text" 
                    readOnly 
                    className="glass-input" 
                    value={calendarUrl || 'Carregando URL do feed...'} 
                    style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem', 
                      color: 'var(--neon-cyan)',
                      background: 'rgba(3, 7, 18, 0.6)',
                      flex: 1
                    }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (calendarUrl) {
                        navigator.clipboard.writeText(calendarUrl);
                        setCopiedCalendarUrl(true);
                        setTimeout(() => setCopiedCalendarUrl(false), 2000);
                      }
                    }}
                    className="glow-btn"
                    style={{ 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      background: copiedCalendarUrl ? 'linear-gradient(90deg, var(--neon-green) 0%, #10b981 100%)' : undefined,
                      color: copiedCalendarUrl ? '#030712' : undefined
                    }}
                  >
                    {copiedCalendarUrl ? (
                      <>
                        <CheckCircle size={16} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copiar Link
                      </>
                    )}
                  </button>
                </div>

                {/* Guia de Configuração Rápida */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid rgba(255, 255, 255, 0.04)', 
                  borderRadius: '10px', 
                  padding: '16px',
                  marginTop: '8px'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>
                    Como configurar em seu calendário:
                  </h4>
                  <ul style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    paddingLeft: '16px',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    <li>
                      <strong>Google Agenda (Web):</strong> No menu esquerdo, ao lado de <em>"Outras agendas"</em>, clique no botão <strong>+</strong> &gt; <strong>"Do URL"</strong>, cole o link acima e clique em <em>"Adicionar agenda"</em>.
                    </li>
                    <li>
                      <strong>Apple Calendar (Mac/iPhone):</strong> Abra o aplicativo Calendário, vá em <strong>Arquivo</strong> &gt; <strong>Nova Assinatura de Calendário...</strong>, cole o link e clique em OK. No iPhone, vá em Ajustes &gt; Calendário &gt; Contas &gt; Adicionar Conta &gt; Outra &gt; Adicionar Assinatura de Calendário.
                    </li>
                    <li>
                      <strong>Outlook (Web/Desktop):</strong> Clique em <strong>Adicionar Calendário</strong> &gt; <strong>Inscrever-se da Web</strong>, insira o link, dê um nome ao calendário (ex: "Treinos ULTRA") e clique em Salvar.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER PWA MOBILE NAV */}
      <footer style={{ background: 'rgba(6, 9, 19, 0.9)', borderTop: '1px solid var(--border-color)', padding: '16px 20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div className="footer-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span>© 2026 ULTRA COACH. Todos os direitos reservados.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wifi size={12} style={{ color: 'var(--neon-green)' }} /> Strava API Integrada
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} style={{ color: 'var(--neon-green)' }} /> PWA Instalável
            </span>
          </div>
        </div>
      </footer>

      {/* MODAL DE DETALHES DO TREINO */}
      {selectedWorkout && (
        <div 
          onClick={() => setSelectedWorkout(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="premium-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '550px',
              padding: '28px',
              background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.95) 0%, rgba(6, 9, 19, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 240, 255, 0.15)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px'
            }}
          >
            {/* Botão de Fechar */}
            <button 
              onClick={() => setSelectedWorkout(null)}
              aria-label="Fechar Detalhes"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
                e.currentTarget.style.color = 'var(--neon-red)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <X size={18} />
            </button>

            {/* Cabeçalho */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                color: 'var(--neon-cyan)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Calendar size={14} />
                {(() => {
                  const names = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
                  return names[selectedWorkout.day_of_week - 1] || 'Dia da Semana';
                })()} — {(() => {
                  if (!selectedWorkout.date) return '';
                  const parts = selectedWorkout.date.split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedWorkout.date;
                })()}
              </span>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                color: '#fff', 
                marginTop: '6px',
                lineHeight: '1.2' 
              }}>
                {selectedWorkout.title}
              </h2>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: getWorkoutColor(selectedWorkout.type),
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {getWorkoutIcon(selectedWorkout.type)} {getSportConfig(selectedWorkout.type)?.name || selectedWorkout.type}
                </span>
                
                {(() => {
                  const isCompleted = selectedWorkout.status === 'completed';
                  const isAdjusted = selectedWorkout.status === 'adjusted';
                  const isRest = selectedWorkout.type === 'Descanso';
                  const isOverdue = !isCompleted && !isRest && isWorkoutOverdue(selectedWorkout.date);
                  
                  let bg = 'rgba(255, 255, 255, 0.05)';
                  let border = 'rgba(255, 255, 255, 0.1)';
                  let color = 'var(--text-secondary)';
                  let text = 'Pendente';
                  
                  if (isCompleted) {
                    bg = 'rgba(57, 255, 20, 0.1)';
                    border = 'rgba(57, 255, 20, 0.2)';
                    color = 'var(--neon-green)';
                    text = 'Concluído';
                  } else if (isAdjusted) {
                    bg = 'rgba(255, 107, 53, 0.12)';
                    border = 'rgba(255, 107, 53, 0.25)';
                    color = 'var(--neon-orange)';
                    text = 'Ajustado pela IA';
                  } else if (isOverdue) {
                    bg = 'rgba(255, 59, 48, 0.1)';
                    border = 'rgba(255, 59, 48, 0.25)';
                    color = 'var(--neon-red)';
                    text = 'Não Realizado';
                  }
                  
                  return (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color,
                      background: bg,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${border}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {text}
                    </span>
                  );
                })()}
              </div>
            </div>

            <hr style={{ border: 'none', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

            {/* Prescrição / Descrição do Treino */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>
                Prescrição Detalhada
              </h4>
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#fff', 
                lineHeight: '1.6', 
                background: 'rgba(255,255,255,0.02)', 
                padding: '16px', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.04)',
                whiteSpace: 'pre-line'
              }}>
                {selectedWorkout.description || 'Nenhuma descrição detalhada disponível.'}
              </p>
            </div>

            {/* Metricas Alvo vs Realizado */}
            <div className="modal-metrics-grid">
              {/* Alvo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                  Métricas Alvo
                </h4>
                
                {selectedWorkout.type !== 'Descanso' ? (
                  <>
                    {selectedWorkout.distance_target > 0 && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Distância:</span>
                        <strong style={{ fontSize: '1rem', color: '#fff' }}>{formatDistance(selectedWorkout.distance_target)} km</strong>
                      </div>
                    )}
                    {selectedWorkout.duration_target > 0 && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Duração:</span>
                        <strong style={{ fontSize: '1rem', color: '#fff' }}>{secondsToTime(selectedWorkout.duration_target)}</strong>
                      </div>
                    )}
                    {selectedWorkout.pace_target && selectedWorkout.pace_target !== 'N/A' && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ritmo (Pace):</span>
                        <strong style={{ fontSize: '1rem', color: '#fff' }}>{selectedWorkout.pace_target} /km</strong>
                      </div>
                    )}
                    {selectedWorkout.power_target > 0 && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Potência Alvo:</span>
                        <strong style={{ fontSize: '1rem', color: '#fff' }}>{selectedWorkout.power_target} W</strong>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Carga de Estresse:</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--neon-cyan)' }}>{selectedWorkout.tss_target} TSS</strong>
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Off Fisiológico (Descanso)
                  </span>
                )}
                
                {selectedWorkout.type !== 'Descanso' && (
                  <button
                    type="button"
                    onClick={() => handleAddToGoogleCalendar(selectedWorkout)}
                    className="glow-btn"
                    style={{
                      marginTop: '8px',
                      padding: '10px 14px',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      background: 'rgba(0, 240, 255, 0.05)',
                      color: 'var(--neon-cyan)',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'var(--neon-cyan)';
                      e.currentTarget.style.color = '#030712';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                      e.currentTarget.style.color = 'var(--neon-cyan)';
                    }}
                  >
                    <Calendar size={14} />
                    Google Agenda
                  </button>
                )}
              </div>

              {/* Realizado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                  Realizado
                </h4>
                
                {(() => {
                  const hasLog = activityLogs?.find((l: any) => l.workout_id === selectedWorkout.id);
                  if (selectedWorkout.status === 'completed') {
                    if (hasLog) {
                      return (
                        <>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Distância:</span>
                            <strong style={{ fontSize: '1rem', color: 'var(--neon-green)' }}>{formatDistance(hasLog.distance_real)} km</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Duração:</span>
                            <strong style={{ fontSize: '1rem', color: '#fff' }}>{secondsToTime(hasLog.duration_real)}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ritmo Médio:</span>
                            <strong style={{ fontSize: '1rem', color: '#fff' }}>{hasLog.pace_real} /km</strong>
                          </div>
                          {hasLog.avg_power > 0 && (
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Potência Média:</span>
                              <strong style={{ fontSize: '1rem', color: '#fff' }}>{hasLog.avg_power} W</strong>
                            </div>
                          )}
                          {hasLog.avg_hr > 0 && (
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Frequência Cardíaca:</span>
                              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Média: {hasLog.avg_hr} bpm {hasLog.max_hr ? `| Máx: ${hasLog.max_hr}` : ''}</strong>
                            </div>
                          )}
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Estresse Realizado:</span>
                            <strong style={{ fontSize: '1rem', color: 'var(--neon-green)' }}>{hasLog.tss_real} TSS</strong>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <div style={{ color: 'var(--neon-green)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={16} /> Concluído Manualmente
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            As métricas alvo foram consideradas como realizadas neste treino marcado manualmente.
                          </p>
                        </>
                      );
                    }
                  } else {
                    const isRest = selectedWorkout.type === 'Descanso';
                    const isOverdue = !isRest && isWorkoutOverdue(selectedWorkout.date);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', height: '100%' }}>
                        {isOverdue ? (
                          <>
                            <span style={{ color: 'var(--neon-red)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={16} /> Não Realizado
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              O limite de 48 horas para realizar e sincronizar este treino expirou.
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                              Pendente de sincronização
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              Aguardando atividade correspondente ser sincronizada via Strava.
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => openManualLog(selectedWorkout)}
                          className="glow-btn"
                          style={{
                            marginTop: '12px',
                            padding: '10px 16px',
                            fontSize: '0.85rem',
                            borderRadius: '8px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: 'linear-gradient(90deg, var(--neon-green) 0%, #10b981 100%)',
                            border: 'none',
                            color: '#030712',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <CheckCircle size={14} /> Lançar Treino Manualmente
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* Rodapé do Modal */}
            {selectedWorkout.status === 'completed' && (
              <div style={{ 
                background: 'rgba(252, 76, 2, 0.05)', 
                border: '1px solid rgba(252, 76, 2, 0.15)', 
                borderRadius: '10px', 
                padding: '12px', 
                fontSize: '0.75rem', 
                color: '#fc4c02',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}>
                <Wifi size={14} />
                Treino sincronizado via API Strava
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE LANÇAMENTO MANUAL DE TREINO */}
      {showManualLogModal && (
        <div 
          onClick={() => setShowManualLogModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1010,
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <form 
            onSubmit={handleSaveManualLog}
            onClick={e => e.stopPropagation()}
            className="premium-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '550px',
              padding: '28px',
              background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.95) 0%, rgba(6, 9, 19, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 240, 255, 0.15)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px'
            }}
          >
            {/* Botão de Fechar */}
            <button 
              type="button"
              onClick={() => setShowManualLogModal(false)}
              aria-label="Fechar Lançamento"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
                e.currentTarget.style.color = 'var(--neon-red)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <X size={18} />
            </button>

            {/* Cabeçalho */}
            <div style={{ marginBottom: '24px' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                color: 'var(--neon-green)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Dumbbell size={14} />
                Lançamento Manual
              </span>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                color: '#fff', 
                marginTop: '6px',
                lineHeight: '1.2' 
              }}>
                {manualLogForm.workoutId ? `Completar: ${manualLogForm.title}` : 'Lançar Novo Treino Extra'}
              </h2>
            </div>

            {/* Campos do Formulário */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {!manualLogForm.workoutId && (
                <>
                  <div className="form-grid-2">
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Data do Treino
                      </label>
                      <input 
                        type="date"
                        required
                        className="glass-input"
                        value={manualLogForm.date}
                        onChange={e => setManualLogForm({ ...manualLogForm, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Modalidade
                      </label>
                      <select
                        className="glass-input"
                        style={{ height: '42px', background: '#0d1527', border: '1px solid var(--border-color)', color: '#fff', width: '100%', padding: '0 12px', borderRadius: '8px' }}
                        value={manualLogForm.type}
                        onChange={e => setManualLogForm({ ...manualLogForm, type: e.target.value })}
                      >
                        {SPORTS_CONFIG.map(sport => (
                          <option key={sport.id} value={sport.id} style={{ background: '#0d1527', color: '#fff' }}>
                            {sport.emoji} {sport.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                      Título do Treino
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Corrida de Ritmo Z3, Pedal de Giro..."
                      className="glass-input"
                      value={manualLogForm.title}
                      onChange={e => setManualLogForm({ ...manualLogForm, title: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Descrição / Comentários da Execução
                </label>
                <textarea 
                  placeholder="Como foi o treino? Sentiu algum incômodo ou cansaço?"
                  className="glass-input"
                  style={{ minHeight: '60px', resize: 'vertical', paddingTop: '8px' }}
                  value={manualLogForm.description}
                  onChange={e => setManualLogForm({ ...manualLogForm, description: e.target.value })}
                />
              </div>

              {manualLogForm.type !== 'Descanso' && (
                <>
                  <div className="form-grid-2">
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Distância Realizada (km)
                      </label>
                      <input 
                        type="text"
                        placeholder="0,00"
                        className="glass-input"
                        value={manualLogForm.distanceReal}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '');
                          const tssEst = estimateTSS(manualLogForm.type, val, manualLogForm.durationTime, manualLogForm.avgHr);
                          setManualLogForm({ 
                            ...manualLogForm, 
                            distanceReal: val,
                            paceReal: calcPace(val, manualLogForm.durationTime),
                            tssReal: tssEst > 0 ? tssEst.toString() : manualLogForm.tssReal
                          });
                        }}
                        onBlur={e => {
                          const numericVal = parseFloat(manualLogForm.distanceReal.replace(',', '.')) || 0;
                          setManualLogForm(prev => ({
                            ...prev,
                            distanceReal: numericVal > 0 ? numericVal.toFixed(2).replace('.', ',') : ''
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Duração Realizada (HH:MM:SS)
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="00:00:00"
                        className="glass-input"
                        value={manualLogForm.durationTime}
                        onChange={e => {
                          const val = maskTimeInput(e.target.value);
                          const tssEst = estimateTSS(manualLogForm.type, manualLogForm.distanceReal, val, manualLogForm.avgHr);
                          setManualLogForm({ 
                            ...manualLogForm, 
                            durationTime: val,
                            paceReal: calcPace(manualLogForm.distanceReal, val),
                            tssReal: tssEst > 0 ? tssEst.toString() : manualLogForm.tssReal
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Ritmo Médio (Pace)
                      </label>
                      <input 
                        type="text"
                        placeholder="5:00/km"
                        className="glass-input"
                        value={manualLogForm.paceReal}
                        onChange={e => setManualLogForm({ ...manualLogForm, paceReal: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Carga Estimada (TSS)
                      </label>
                      <input 
                        type="number"
                        required
                        placeholder="0"
                        className="glass-input"
                        value={manualLogForm.tssReal}
                        onChange={e => setManualLogForm({ ...manualLogForm, tssReal: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Frequência Cardíaca Média (bpm)
                      </label>
                      <input 
                        type="number"
                        placeholder="Ex: 145"
                        className="glass-input"
                        value={manualLogForm.avgHr}
                        onChange={e => {
                          const val = e.target.value;
                          const tssEst = estimateTSS(manualLogForm.type, manualLogForm.distanceReal, manualLogForm.durationTime, val);
                          setManualLogForm({ 
                            ...manualLogForm, 
                            avgHr: val,
                            tssReal: tssEst > 0 ? tssEst.toString() : manualLogForm.tssReal
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Potência Média (Watts)
                      </label>
                      <input 
                        type="number"
                        placeholder="Ex: 220"
                        className="glass-input"
                        value={manualLogForm.avgPower}
                        onChange={e => setManualLogForm({ ...manualLogForm, avgPower: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Rodapé e Ações */}
            <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                className="glass-btn"
                onClick={() => setShowManualLogModal(false)}
                style={{ padding: '12px 24px', borderRadius: '10px' }}
                disabled={isSubmittingManualLog}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="glow-btn"
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: '10px',
                  background: 'linear-gradient(90deg, var(--neon-cyan) 0%, #00f0ff 100%)',
                  color: '#030712',
                  fontWeight: 700
                }}
                disabled={isSubmittingManualLog}
              >
                {isSubmittingManualLog ? 'Salvando...' : 'Salvar Treino'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
