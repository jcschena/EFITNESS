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
  Copy,
  Info,
  Trophy,
  Apple,
  Accessibility,
  Link as LinkIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { SPORTS_CONFIG, getSportConfig } from '@/lib/sports';
import { NUTRITION_DATA, STRETCHING_DATA } from '@/lib/nutrition-stretching';
import { TRAINING_LIBRARY, getWeeksAfterCut, getBestMatchingPlan, calibrateWorkout } from '@/lib/training-library';
import { BookOpen, Award, Settings, Eye, HelpCircle, Download } from 'lucide-react';
import CoachDashboard from '@/components/CoachDashboard';
import MasterDashboard from '@/components/MasterDashboard';


const BarChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Bar),
  { ssr: false }
);

const GpsTracker = dynamic(
  () => import('@/components/GpsTracker'),
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

const RunnerIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 448 512" fill={color} width="100%" height="100%">
    <path d="M320 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM125.7 175.5c9.9-9.9 23.4-15.5 37.5-15.5c1.9 0 3.8 .1 5.6 .3L137.6 254c-9.3 28 1.7 58.8 26.8 74.5l86.2 53.9-25.4 88.8c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l28.7-100.4c5.9-20.6-2.6-42.6-20.7-53.9L238 299l30.9-82.4 5.1 12.3C289 264.7 323.9 288 362.7 288l21.3 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-21.3 0c-12.9 0-24.6-7.8-29.5-19.7l-6.3-15c-14.6-35.1-44.1-61.9-80.5-73.1l-48.7-15c-11.1-3.4-22.7-5.2-34.4-5.2c-31 0-60.8 12.3-82.7 34.3L57.4 153.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l23.1-23.1zM91.2 352L32 352c-17.7 0-32 14.3-32 32s14.3 32 32 32l69.6 0c19 0 36.2-11.2 43.9-28.5L157 361.6l-9.5-6c-17.5-10.9-30.5-26.8-37.9-44.9L91.2 352z" />
  </svg>
);

const CyclistIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 640 512" fill={color} width="100%" height="100%">
    <path d="M400 96a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm27.2 64l-61.8-48.8c-17.3-13.6-41.7-13.8-59.1-.3l-83.1 64.2c-30.7 23.8-28.5 70.8 4.3 91.6L288 305.1 288 416c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128c0-10.7-5.3-20.7-14.2-26.6L295 232.9l60.3-48.5L396 217c5.7 4.5 12.7 7 20 7l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-52.8 0zM56 384a72 72 0 1 1 144 0A72 72 0 1 1 56 384zm200 0A128 128 0 1 0 0 384a128 128 0 1 0 256 0zm184 0a72 72 0 1 1 144 0 72 72 0 1 1 -144 0zm200 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" />
  </svg>
);

const SwimmerIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 576 512" fill={color} width="100%" height="100%">
    <path d="M309.5 178.4L447.9 297.1c-1.6 .9-3.2 2-4.8 3c-18 12.4-40.1 20.3-59.2 20.3c-19.6 0-40.8-7.7-59.2-20.3c-22.1-15.5-51.6-15.5-73.7 0c-17.1 11.8-38 20.3-59.2 20.3c-10.1 0-21.1-2.2-31.9-6.2C163.1 193.2 262.2 96 384 96l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-26.9 0-52.3 6.6-74.5 18.4zM160 160A64 64 0 1 1 32 160a64 64 0 1 1 128 0zM306.5 325.9C329 341.4 356.5 352 384 352c26.9 0 55.4-10.8 77.4-26.1c0 0 0 0 0 0c11.9-8.5 28.1-7.8 39.2 1.7c14.4 11.9 32.5 21 50.6 25.2c17.2 4 27.9 21.2 23.9 38.4s-21.2 27.9-38.4 23.9c-24.5-5.7-44.9-16.5-58.2-25C449.5 405.7 417 416 384 416c-31.9 0-60.6-9.9-80.4-18.9c-5.8-2.7-11.1-5.3-15.6-7.7c-4.5 2.4-9.7 5.1-15.6 7.7c-19.8 9-48.5 18.9-80.4 18.9c-33 0-65.5-10.3-94.5-25.8c-13.4 8.4-33.7 19.3-58.2 25c-17.2 4-34.4-6.7-38.4-23.9s6.7-34.4 23.9-38.4c18.1-4.2 36.2-13.3 50.6-25.2c11.1-9.4 27.3-10.1 39.2-1.7c0 0 0 0 0 0C136.7 341.2 165.1 352 192 352c27.5 0 55-10.6 77.5-26.1c11.1-7.9 25.9-7.9 37 0z" />
  </svg>
);

const UltraLogoIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <path d="M6 18L16 6L26 18" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 24L16 16L22 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    <path d="M6 18C6 24 10 28 16 28C22 28 26 24 26 18" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export default function Home() {
  // Estados Globais da SPA - Inicialização segura para evitar Hydration Mismatch no Next.js
  const [userRole, setUserRole] = useState<string>('athlete');
  const [activeUserName, setActiveUserName] = useState<string>('');
  const [activeUser, setActiveUser] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState<boolean>(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('planilha'); // 'planilha', 'coach', 'simulador', 'nutricao', 'alongamento'
  
  // Estados para a Biblioteca de Planilhas Periodizadas
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('Corrida');
  const [viewingLibraryPlan, setViewingLibraryPlan] = useState<any>(null);
  const [effortPctCalibration, setEffortPctCalibration] = useState<number>(100);
  const [cutChoiceSelection, setCutChoiceSelection] = useState<'inicial' | 'polimento' | 'ambos' | 'none'>('none');
  const [applyPlanLoading, setApplyPlanLoading] = useState<boolean>(false);
  const [selectedPreviewWeek, setSelectedPreviewWeek] = useState<number>(1);

  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [feedbacksLoading, setFeedbacksLoading] = useState<boolean>(false);

  // Estados para importação e criação de planilhas
  const [libraryPlans, setLibraryPlans] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState<boolean>(false);
  const [importUrl, setImportUrl] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState<boolean>(false);
  const [selectedBuilderWeek, setSelectedBuilderWeek] = useState<number>(1);
  const [customPlanForm, setCustomPlanForm] = useState<any>({
    name: '',
    author: '',
    sport: 'Corrida',
    level: 'intermediario',
    description: '',
    weeks: 1,
    workouts: [
      Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        type: 'Descanso',
        title: 'Descanso fisiológico',
        desc: 'Dia livre para recuperação ativa e alongamento.',
        dist: 0,
        dur: 0,
        pace: 'N/A',
        power: 0,
        tss: 0
      }))
    ]
  });
  
  // Estados para as abas de Nutrição e Alongamento
  const [nutritionMonth, setNutritionMonth] = useState<number>(() => new Date().getMonth());
  const [stretchingCategory, setStretchingCategory] = useState<string>('dynamic');
  
  // Dados do Dashboard carregados do Backend
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSyncingStrava, setIsSyncingStrava] = useState<boolean>(false);

  // Relógio e Data em tempo real
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Estados de Onboarding
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    username: '',
    password: '',
    accessKey: '',
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

  // Estados de Lançamento Manual de Treino
  const [showManualLogModal, setShowManualLogModal] = useState<boolean>(false);

  // Estados das Métricas Fisiológicas
  const [showMetricsModal, setShowMetricsModal] = useState<boolean>(false);
  const [metricsModalTab, setMetricsModalTab] = useState<'ctl' | 'atl' | 'tsb' | 'zones'>('ctl');
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

  // Estados do Calendário de Provas
  const [races, setRaces] = useState<any[]>([]);
  const [racesLoading, setRacesLoading] = useState<boolean>(false);
  const [showRaceModal, setShowRaceModal] = useState<boolean>(false);
  const [raceSaving, setRaceSaving] = useState<boolean>(false);
  const [raceForm, setRaceForm] = useState({
    id: '',
    name: '',
    organizer: '',
    website: '',
    date_time: '',
    sport_type: 'Corrida',
    distance: '',
    country: '',
    city: '',
    is_target: false,
    daily_available_hours: '',
    train_in_morning: true,
    morning_available_time: '60',
    train_at_lunch: false,
    lunch_available_time: '',
    train_at_night: true,
    night_available_time: '60'
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

  const getExecutionAnalysis = (w: any, log: any) => {
    if (!log) return null;
    
    if (w.type === 'Descanso') {
      return {
        percentage: 100,
        status: 'pleno',
        label: 'Cumprido',
        color: 'var(--neon-green)',
        text: 'O descanso fisiológico programado foi respeitado.'
      };
    }

    let planned = 0;
    let actual = 0;
    let metricName = '';

    if (w.distance_target > 0) {
      planned = w.distance_target;
      actual = log.distance_real;
      metricName = 'distância';
    } else if (w.duration_target > 0) {
      planned = w.duration_target;
      actual = log.duration_real;
      metricName = 'duração';
    } else {
      planned = w.tss_target;
      actual = log.tss_real;
      metricName = 'esforço (TSS)';
    }

    if (planned <= 0) {
      return {
        percentage: 100,
        status: 'pleno',
        label: 'Realizado',
        color: 'var(--neon-cyan)',
        text: 'Treino concluído com sucesso.'
      };
    }

    const ratio = actual / planned;
    const percentage = Math.round(ratio * 100);

    let status = 'pleno';
    let label = 'Plenamente Atingido';
    let color = 'var(--neon-green)';
    let text = '';

    const formatDiff = (val1: number, val2: number, metric: string) => {
      const diff = val1 - val2;
      if (metric === 'distância') {
        return `${formatDistance(diff)} km`;
      } else if (metric === 'duração') {
        return secondsToTime(diff);
      } else {
        return `${Math.round(diff)} TSS`;
      }
    };

    if (percentage < 90) {
      status = 'parcial';
      label = 'Parcialmente Atingido';
      color = 'var(--neon-orange)';
      text = `Treino parcialmente realizado (${percentage}% da ${metricName} prevista). Faltaram ${formatDiff(planned, actual, metricName)} para atingir a meta recomendada pelo ULTRA COACH.`;
    } else if (percentage > 110) {
      status = 'superado';
      label = 'Meta Superada';
      color = 'var(--neon-cyan)';
      text = `Treino superado (${percentage}% da ${metricName} prevista). Você realizou ${formatDiff(actual, planned, metricName)} além do prescrito. Fique atento para evitar fadiga excessiva ou lesões!`;
    } else {
      status = 'pleno';
      label = 'Plenamente Atingido';
      color = 'var(--neon-green)';
      text = `Excelente! Meta de ${metricName} atingida com precisão cirúrgica (${percentage}% concluído, variação de apenas ${Math.abs(100 - percentage)}%).`;
    }

    return {
      percentage,
      status,
      label,
      color,
      text
    };
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

  const openMetricsModal = (tab: 'ctl' | 'atl' | 'tsb' | 'zones') => {
    setMetricsModalTab(tab);
    setShowMetricsModal(true);
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

  const fetchLibraryPlans = async () => {
    try {
      setLibraryLoading(true);
      const res = await fetch('/api/library');
      if (res.ok) {
        const data = await res.json();
        setLibraryPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Erro ao buscar biblioteca:', err);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleImportPlan = async () => {
    if (!importUrl) {
      alert('Por favor, insira o link da planilha.');
      return;
    }
    try {
      setIsImporting(true);
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          url: importUrl,
          userId: activeUser
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Planilha buscada e carregada com sucesso na sua biblioteca!');
        setImportUrl('');
        await fetchLibraryPlans();
      } else {
        alert('Erro ao importar: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Falha na conexão ao importar a planilha.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleBuilderWeeksChange = (newWeeks: number) => {
    const currentWorkouts = [...customPlanForm.workouts];
    if (newWeeks > currentWorkouts.length) {
      for (let i = currentWorkouts.length; i < newWeeks; i++) {
        currentWorkouts.push(
          Array.from({ length: 7 }, (_, dayIdx) => ({
            day: dayIdx + 1,
            type: 'Descanso',
            title: 'Descanso fisiológico',
            desc: 'Dia livre para recuperação ativa e alongamento.',
            dist: 0,
            dur: 0,
            pace: 'N/A',
            power: 0,
            tss: 0
          }))
        );
      }
    } else if (newWeeks < currentWorkouts.length) {
      currentWorkouts.splice(newWeeks);
    }
    setCustomPlanForm({
      ...customPlanForm,
      weeks: newWeeks,
      workouts: currentWorkouts
    });
    setSelectedBuilderWeek(Math.min(selectedBuilderWeek, newWeeks));
  };

  const handleCopyBuilderWeek = (fromWeek: number, toWeek: number) => {
    const workoutsCopy = JSON.parse(JSON.stringify(customPlanForm.workouts));
    workoutsCopy[toWeek - 1] = workoutsCopy[fromWeek - 1].map((w: any) => ({
      ...w,
      day: w.day
    }));
    setCustomPlanForm({
      ...customPlanForm,
      workouts: workoutsCopy
    });
    alert(`Semana ${fromWeek} copiada com sucesso para a Semana ${toWeek}!`);
  };

  const handleSaveCustomPlan = async () => {
    if (!customPlanForm.name) {
      alert('Por favor, informe o nome da planilha.');
      return;
    }
    if (!customPlanForm.sport) {
      alert('Por favor, informe o esporte.');
      return;
    }
    try {
      setApplyPlanLoading(true);
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: activeUser,
          plan: customPlanForm
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Planilha customizada salva com sucesso na sua biblioteca!');
        setShowCreatePlanModal(false);
        setCustomPlanForm({
          name: '',
          author: '',
          sport: 'Corrida',
          level: 'intermediario',
          description: '',
          weeks: 1,
          workouts: [
            Array.from({ length: 7 }, (_, i) => ({
              day: i + 1,
              type: 'Descanso',
              title: 'Descanso fisiológico',
              desc: 'Dia livre para recuperação ativa e alongamento.',
              dist: 0,
              dur: 0,
              pace: 'N/A',
              power: 0,
              tss: 0
            }))
          ]
        });
        setSelectedBuilderWeek(1);
        await fetchLibraryPlans();
      } else {
        alert('Erro ao salvar planilha: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Falha na conexão ao salvar a planilha.');
    } finally {
      setApplyPlanLoading(false);
    }
  };

  const handleSelectLibraryPlan = (libPlan: any, effortPct = 100, cutChoice: any = null, currentWeek = 1) => {
    if (libPlan.workouts && typeof libPlan.generateWeeks !== 'function') {
      const workoutsData = libPlan.workouts;
      libPlan.generateWeeks = (effortPctVal: number) => {
        return workoutsData.map((week: any[]) =>
          week.map(w => calibrateWorkout(w, effortPctVal))
        );
      };
    }
    setViewingLibraryPlan(libPlan);
    setEffortPctCalibration(effortPct);
    setCutChoiceSelection(cutChoice || (goal?.date_target ? 'ambos' : 'none'));
    setSelectedPreviewWeek(currentWeek);
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
        await fetchLibraryPlans();

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

  const fetchRaces = async (userId: number) => {
    setRacesLoading(true);
    try {
      const res = await fetch(`/api/races?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRaces(data.races || []);
      }
    } catch (err) {
      console.error('Erro ao carregar provas:', err);
    } finally {
      setRacesLoading(false);
    }
  };

  const handleOpenRaceModal = (race: any = null) => {
    if (race) {
      const isTarget = race.is_target === 1 || race.is_target === true;
      const goal = dashboardData?.goal;
      setRaceForm({
        id: race.id.toString(),
        name: race.name,
        organizer: race.organizer || '',
        website: race.website || '',
        date_time: race.date_time ? race.date_time.slice(0, 16) : '', // format YYYY-MM-DDTHH:MM
        sport_type: race.sport_type || 'Corrida',
        distance: race.distance.toString(),
        country: race.country || '',
        city: race.city || '',
        is_target: isTarget,
        daily_available_hours: isTarget && goal && goal.daily_available_hours != null ? goal.daily_available_hours.toString() : '',
        train_in_morning: isTarget && goal ? (goal.train_in_morning !== 0) : true,
        morning_available_time: isTarget && goal && goal.morning_available_time != null ? goal.morning_available_time.toString() : '60',
        train_at_lunch: isTarget && goal ? goal.train_at_lunch === 1 : false,
        lunch_available_time: isTarget && goal && goal.lunch_available_time != null ? goal.lunch_available_time.toString() : '',
        train_at_night: isTarget && goal ? (goal.train_at_night !== 0) : true,
        night_available_time: isTarget && goal && goal.night_available_time != null ? goal.night_available_time.toString() : '60'
      });
    } else {
      setRaceForm({
        id: '',
        name: '',
        organizer: '',
        website: '',
        date_time: '',
        sport_type: 'Corrida',
        distance: '',
        country: '',
        city: '',
        is_target: false,
        daily_available_hours: '',
        train_in_morning: true,
        morning_available_time: '60',
        train_at_lunch: false,
        lunch_available_time: '',
        train_at_night: true,
        night_available_time: '60'
      });
    }
    setShowRaceModal(true);
  };

  const handleSaveRace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    setRaceSaving(true);
    try {
      const payload = {
        id: raceForm.id || null,
        userId: activeUser,
        name: raceForm.name,
        organizer: raceForm.organizer,
        website: raceForm.website,
        date_time: raceForm.date_time,
        sport_type: raceForm.sport_type,
        distance: parseFloat(raceForm.distance.replace(',', '.')) || 0,
        country: raceForm.country,
        city: raceForm.city,
        is_target: raceForm.is_target,
        daily_available_hours: raceForm.is_target ? (parseFloat(raceForm.daily_available_hours.replace(',', '.')) || null) : null,
        train_in_morning: raceForm.is_target ? (raceForm.train_in_morning ? 1 : 0) : 1,
        morning_available_time: raceForm.is_target && raceForm.train_in_morning ? (parseInt(raceForm.morning_available_time, 10) || 0) : 0,
        train_at_lunch: raceForm.is_target ? (raceForm.train_at_lunch ? 1 : 0) : 0,
        lunch_available_time: raceForm.is_target && raceForm.train_at_lunch ? (parseInt(raceForm.lunch_available_time, 10) || 0) : 0,
        train_at_night: raceForm.is_target ? (raceForm.train_at_night ? 1 : 0) : 0,
        night_available_time: raceForm.is_target && raceForm.train_at_night ? (parseInt(raceForm.night_available_time, 10) || 0) : 0
      };

      const res = await fetch('/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowRaceModal(false);
        await fetchRaces(activeUser);
        if (raceForm.is_target) {
          await fetchDashboard(activeUser);
        }
      } else {
        const errorData = await res.json();
        alert('Erro ao salvar prova: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar prova.');
    } finally {
      setRaceSaving(false);
    }
  };

  const handleDeleteRace = async (raceId: number) => {
    if (!activeUser) return;
    if (!confirm('Deseja realmente excluir esta prova?')) return;

    try {
      const res = await fetch(`/api/races?id=${raceId}&userId=${activeUser}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchRaces(activeUser);
        await fetchDashboard(activeUser);
      } else {
        const errorData = await res.json();
        alert('Erro ao excluir prova: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir prova.');
    }
  };

  const handleToggleTargetRace = async (race: any) => {
    if (!activeUser) return;
    if (race.is_target === 0 || race.is_target === false) {
      // Abrir modal para preencher o formulário obrigatoriamente
      handleOpenRaceModal({ ...race, is_target: 1 });
      return;
    }

    try {
      const payload = {
        ...race,
        userId: activeUser,
        is_target: false
      };

      const res = await fetch('/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchRaces(activeUser);
        await fetchDashboard(activeUser);
      } else {
        const errorData = await res.json();
        alert('Erro ao alterar prova alvo: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao alterar prova alvo.');
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
    gender: '',
    height: '',
    resting_hr: '',
    max_hr: '',
    observations: '',
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

  // Estados para Controle de Tempo da Comemoração (Silhuetas Esportivas)
  const [loginCelebrationActive, setLoginCelebrationActive] = useState<boolean>(false);
  const [weeklyPlanCelebrationActive, setWeeklyPlanCelebrationActive] = useState<boolean>(false);
  const prevWeeklyPlanCompleted = useRef<boolean>(false);

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
        localStorage.setItem('user_role', data.role || 'athlete');
        localStorage.setItem('active_user_name', data.name || '');
        setUserRole(data.role || 'athlete');
        setActiveUserName(data.name || '');
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
    const savedUserId = localStorage.getItem('active_user_id');
    const savedAuthenticated = localStorage.getItem('is_authenticated');
    const savedRole = localStorage.getItem('user_role') || 'athlete';
    const savedName = localStorage.getItem('active_user_name') || '';

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

    let currentUserId: number | null = null;
    if (urlUserId) {
      const parsedId = parseInt(urlUserId, 10);
      if (!isNaN(parsedId)) {
        localStorage.setItem('active_user_id', String(parsedId));
        localStorage.setItem('is_authenticated', 'true');
        currentUserId = parsedId;
      }
    } else if (savedUserId && savedAuthenticated === 'true') {
      const parsedId = parseInt(savedUserId, 10);
      if (!isNaN(parsedId)) {
        currentUserId = parsedId;
      }
    }

    setUserRole(savedRole);
    setActiveUserName(savedName);
    setActiveUser(currentUserId);
    setIsInitialized(true);

    if (currentUserId) {
      if (savedRole === 'athlete') {
        fetchDashboard(currentUserId);
        fetchRaces(currentUserId);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    if (urlUserId) {
      // Limpar query string para manter a URL limpa
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (activeUser) {
      localStorage.setItem('active_user_id', String(activeUser));
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('active_user_name', activeUserName);
      if (userRole === 'athlete') {
        fetchDashboard(activeUser);
        fetchRaces(activeUser);
      } else {
        setLoading(false);
      }
    } else {
      localStorage.removeItem('active_user_id');
      localStorage.removeItem('is_authenticated');
      localStorage.removeItem('user_role');
      localStorage.removeItem('active_user_name');
      setUserRole('athlete');
      setActiveUserName('');
      setDashboardData(null);
      setLoading(false);
    }
  }, [activeUser, userRole, activeUserName, isInitialized]);

  // Efeito para garantir tempo mínimo do loader (1 ciclo completo dos esportes = 6s)
  const isCurrentlyLoading = !!(loading || (activeUser && userRole === 'athlete' && !dashboardData));
  useEffect(() => {
    if (!activeUser || userRole !== 'athlete') {
      setMinLoadingTimePassed(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      return;
    }

    if (!loadingTimerRef.current) {
      setMinLoadingTimePassed(false);
      loadingTimerRef.current = setTimeout(() => {
        setMinLoadingTimePassed(true);
        loadingTimerRef.current = null;
      }, 6000); // 6 segundos
    }
  }, [activeUser, userRole]);

  // Limpeza de timer na desmontagem
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Efeito para ativar comemoração por 60 segundos após login
  useEffect(() => {
    if (activeUser) {
      setLoginCelebrationActive(true);
      const timer = setTimeout(() => {
        setLoginCelebrationActive(false);
      }, 60000); // 60 segundos
      return () => clearTimeout(timer);
    } else {
      setLoginCelebrationActive(false);
    }
  }, [activeUser]);

  // Efeito para ativar comemoração por 60 segundos ao concluir planilha semanal
  useEffect(() => {
    const workouts = dashboardData?.workouts;
    const total = workouts ? workouts.length : 0;
    const completed = workouts ? workouts.filter((w: any) => w.status === 'completed').length : 0;
    const completedAll = workouts && workouts.length > 0 && completed === total;

    if (completedAll) {
      if (!prevWeeklyPlanCompleted.current) {
        setWeeklyPlanCelebrationActive(true);
        const timer = setTimeout(() => {
          setWeeklyPlanCelebrationActive(false);
        }, 60000); // 60 segundos
        return () => clearTimeout(timer);
      }
    } else {
      setWeeklyPlanCelebrationActive(false);
    }
    prevWeeklyPlanCompleted.current = !!completedAll;
  }, [dashboardData?.workouts]);



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
        gender: dashboardData.user.gender || '',
        height: String(dashboardData.user.height || ''),
        resting_hr: String(dashboardData.user.resting_hr || ''),
        max_hr: String(dashboardData.user.max_hr || ''),
        observations: dashboardData.user.observations || '',
        goal_type: dashboardData.goal?.type || 'Corrida',
        goal_distance: String(dashboardData.goal?.distance || ''),
        goal_date_target: dashboardData.goal?.date_target || '',
        goal_target_time: dashboardData.goal?.target_time || '',
        goal_weekly_tss_target: String(dashboardData.goal?.weekly_tss_target || '')
      });
    }
  }, [dashboardData]);

  // Carregar feedbacks do treino selecionado
  useEffect(() => {
    if (selectedWorkout?.id) {
      setFeedbacksLoading(true);
      fetch(`/api/workouts/feedback?workoutId=${selectedWorkout.id}`)
        .then(res => res.json())
        .then(data => {
          setFeedbacks(data.feedbacks || []);
        })
        .catch(err => console.error('Erro ao carregar feedbacks:', err))
        .finally(() => setFeedbacksLoading(false));
    } else {
      setFeedbacks([]);
    }
  }, [selectedWorkout]);

  // Enviar novo feedback do treino
  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !selectedWorkout?.id) return;
    try {
      const res = await fetch('/api/workouts/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: selectedWorkout.id,
          senderRole: 'athlete',
          message: feedbackInput.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(prev => [...prev, {
          id: Date.now(),
          workout_id: selectedWorkout.id,
          sender_role: 'athlete',
          message: feedbackInput.trim(),
          timestamp: data.timestamp || new Date().toISOString()
        }]);
        setFeedbackInput('');
      }
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
    }
  };


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

  // Disparar sincronização manual de atividades do Strava
  const handleSyncStrava = async () => {
    if (!activeUser) return;
    setIsSyncingStrava(true);

    try {
      const res = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.syncedCount > 0) {
            alert(`Sincronização concluída com sucesso! ${data.syncedCount} treino(s) novo(s) importado(s) e registrado(s) na planilha.`);
          } else {
            alert('Sincronização concluída! Nenhum treino novo encontrado no Strava.');
          }
          // Recarregar os dados do dashboard
          await fetchDashboard(activeUser);
        } else {
          alert('Erro na sincronização: ' + (data.errors?.join(', ') || 'Erro desconhecido.'));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert('Erro ao sincronizar com o Strava: ' + (errData.error || 'Erro interno no servidor'));
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar:', err);
      alert('Erro de conexão ao servidor de sincronização.');
    } finally {
      setIsSyncingStrava(false);
    }
  };

  // Realizar associação/desassociação manual de atividade do Strava com treino planejado
  const handleManualAssociation = async (workoutId: number, activityLogId: number, unlink = false) => {
    if (!activeUser) return;
    try {
      const res = await fetch('/api/workouts/associate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser,
          workoutId,
          activityLogId,
          unlink
        })
      });

      if (res.ok) {
        alert(unlink ? 'Atividade desvinculada com sucesso!' : 'Atividade vinculada com sucesso!');
        setSelectedWorkout(null); // Fechar o modal de detalhes do treino
        await fetchDashboard(activeUser);
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao processar correspondência: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao processar correspondência.');
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
              ? 'Avançado' 
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


  // Aplicar planilha periodizada da biblioteca
  const handleApplyLibraryPlan = async (libraryPlanId: string) => {
    if (!activeUser || applyPlanLoading) return;
    
    setApplyPlanLoading(true);
    try {
      const clientDateStr = new Date().toLocaleDateString('en-CA');
      const res = await fetch('/api/library/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser,
          libraryId: libraryPlanId,
          effortPct: effortPctCalibration,
          cutChoice: cutChoiceSelection,
          clientDate: clientDateStr
        })
      });

      if (res.ok) {
        alert('Planilha periodizada aplicada e calibrada com sucesso!');
        setViewingLibraryPlan(null);
        setActiveTab('planilha');
        // Recarregar os dados do dashboard
        await fetchDashboard(activeUser);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Erro ao aplicar planilha: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error('Erro ao aplicar planilha da biblioteca:', err);
      alert('Falha de conexão com o servidor ao aplicar a planilha.');
    } finally {
      setApplyPlanLoading(false);
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

        localStorage.setItem('is_authenticated', 'true');
        localStorage.setItem('active_user_id', String(data.userId));
        localStorage.setItem('user_role', data.role || 'athlete');
        localStorage.setItem('active_user_name', onboardForm.name || 'Treinador');
        setUserRole(data.role || 'athlete');
        setActiveUserName(onboardForm.name || 'Treinador');

        if (onboardForm.stravaConnected && data.role !== 'coach') {
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



  // Componente de Confete para Comemorações (Troféus Coloridos)
  const ConfettiShower = () => {
    const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; color: string; duration: number; size: number }>>([]);
    
    useEffect(() => {
      const colors = ['#fc4c02', '#00f0ff', '#39ff14', '#a855f7', '#ff6b35', '#ffeb3b', '#e91e63'];
      const newPieces = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 4 + Math.random() * 4,
        size: 18 + Math.random() * 12,
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
              top: '-40px',
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: 0.85,
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))',
              transform: 'rotate(0deg)',
              animation: `fall ${p.duration}s linear ${p.delay}s infinite`,
            }}
          >
            <UltraLogoIcon color={p.color} />
          </div>
        ))}
        <style jsx global>{`
          @keyframes fall {
            0% {
              top: -40px;
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

  const showLoadingScreen = isCurrentlyLoading || (activeUser && userRole === 'athlete' && !minLoadingTimePassed);

  if (showLoadingScreen) {
    return (
      <div className="loader-container">
        <div className="loader-spotlight" />
        
        <div className="loader-avatar-ring">
          <div className="loader-sport-icon swim-icon">
            <SwimmerIcon color="var(--neon-cyan)" />
          </div>
          <div className="loader-sport-icon bike-icon">
            <CyclistIcon color="var(--neon-green)" />
          </div>
          <div className="loader-sport-icon run-icon">
            <RunnerIcon color="var(--neon-orange)" />
          </div>
        </div>
        
        <div className="loader-text-container" style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="loader-title">ULTRA COACH</h3>
          <div className="loader-progress-bar">
            <div className="loader-progress-fill" />
          </div>
          <p className="loader-subtitle">Carregando cockpit fisiológico...</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '28px', maxWidth: '320px', lineHeight: '1.5', fontStyle: 'italic', textAlign: 'center', opacity: 0.8 }}>
            ⚠️ O aplicativo é uma ferramenta e não substitui o acompanhamento de um profissional credenciado de educação física.
          </p>
        </div>
        
        <style jsx global>{`
          .loader-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            background-color: var(--bg-deep, #060913);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 32px;
            font-family: var(--font-main);
          }

          .loader-spotlight {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(0, 240, 255, 0.06) 0%, transparent 70%);
            pointer-events: none;
          }

          .loader-avatar-ring {
            position: relative;
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: rgba(13, 21, 39, 0.6);
            border: 2px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
            animation: ringGlow 6s linear infinite;
          }

          .loader-sport-icon {
            position: absolute;
            width: 64px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
          }

          .swim-icon {
            animation: swimLoop 6s linear infinite;
          }

          .bike-icon {
            animation: bikeLoop 6s linear infinite;
          }

          .run-icon {
            animation: runLoop 6s linear infinite;
          }

          .loader-text-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            text-align: center;
            z-index: 1;
          }

          .loader-title {
            font-family: var(--font-title);
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            color: #fff;
            margin: 0;
            background: linear-gradient(90deg, #fff 0%, var(--neon-cyan) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .loader-progress-bar {
            width: 180px;
            height: 3px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
          }

          .loader-progress-fill {
            position: absolute;
            top: 0;
            bottom: 0;
            height: 100%;
            background: linear-gradient(90deg, transparent, var(--neon-cyan), var(--neon-green), var(--neon-orange), transparent);
            animation: progressSweep 2s ease-in-out infinite;
          }

          .loader-subtitle {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin: 0;
            font-weight: 500;
            letter-spacing: 0.02em;
          }

          @keyframes swimLoop {
            0% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0px);
            }
            26.67% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0px);
            }
            33.33% {
              opacity: 0;
              transform: scale(1.15) translateY(-5px);
              filter: blur(6px);
            }
            90% {
              opacity: 0;
              transform: scale(0.7) translateY(5px);
              filter: blur(6px);
            }
            96.67% {
              opacity: 0.5;
              transform: scale(0.85) translateY(5px);
              filter: blur(2px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0px);
            }
          }

          @keyframes bikeLoop {
            0% {
              opacity: 0;
              transform: scale(0.7) translateY(5px);
              filter: blur(6px);
            }
            23.33% {
              opacity: 0;
              transform: scale(0.7) translateY(5px);
              filter: blur(6px);
            }
            30.0% {
              opacity: 0.5;
              transform: scale(0.85) translateY(5px);
              filter: blur(2px);
            }
            33.33% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0px);
            }
            60.0% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0px);
            }
            66.67% {
              opacity: 0;
              transform: scale(1.15) translateY(-5px);
              filter: blur(6px);
            }
            100% {
              opacity: 0;
              transform: scale(0.7) translateY(5px);
              filter: blur(6px);
            }
          }

          @keyframes runLoop {
            0% {
              opacity: 0;
              transform: scale(0.7) translateY(5px);
              filter: blur(6px);
            }
            56.67% {
              opacity: 0;
              transform: scale(0.7) translateY(5px);
              filter: blur(6px);
            }
            63.33% {
              opacity: 0.5;
              transform: scale(0.85) translateY(5px);
              filter: blur(2px);
            }
            66.67% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0px);
            }
            90.0% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0px);
            }
            96.67% {
              opacity: 0;
              transform: scale(1.15) translateY(-5px);
              filter: blur(6px);
            }
            100% {
              opacity: 0;
              transform: scale(0.7) translateY(5px);
              filter: blur(6px);
            }
          }

          @keyframes ringGlow {
            0%, 26.67%, 100% {
              border-color: rgba(0, 240, 255, 0.3);
              box-shadow: 0 0 20px rgba(0, 240, 255, 0.25), inset 0 0 10px rgba(0, 240, 255, 0.1);
            }
            33.33%, 60.0% {
              border-color: rgba(57, 255, 20, 0.3);
              box-shadow: 0 0 20px rgba(57, 255, 20, 0.25), inset 0 0 10px rgba(57, 255, 20, 0.1);
            }
            66.67%, 93.33% {
              border-color: rgba(255, 107, 53, 0.3);
              box-shadow: 0 0 20px rgba(255, 107, 53, 0.25), inset 0 0 10px rgba(255, 107, 53, 0.1);
            }
          }

          @keyframes progressSweep {
            0% {
              left: -100%;
              width: 50%;
            }
            100% {
              left: 100%;
              width: 50%;
            }
          }
        `}</style>
      </div>
    );
  }

  // TELA DE LOGIN E SENHA OU CADASTRO
  if (!activeUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', width: '100%' }} className="animate-slide-up">
        <div style={{ maxWidth: isRegistering ? '550px' : '420px', width: '100%', transition: 'max-width 0.3s ease' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0, 240, 255, 0.04)', borderRadius: '50%', marginBottom: '12px', border: '1px solid rgba(0, 240, 255, 0.15)', boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)' }}>
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.5))' }}>
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
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '4px', background: 'linear-gradient(90deg, #fff 0%, #00f0ff 50%, #39ff14 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ULTRA
            </h1>
            <p style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
              Esforço conjunto, conquista compartilhada!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '340px', margin: '0 auto', lineHeight: '1.4' }}>
              Periodização Fisiológica Científica e Controle de Carga de Treinos
            </p>
          </div>

          {!isRegistering ? (
            /* Login Card */
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

              <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Novo no app?{' '}
                  <button 
                    type="button" 
                    onClick={() => setIsRegistering(true)} 
                    style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Cadastrar Atleta
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Register Card (Onboarding) */
            <div className="premium-card" style={{ padding: '32px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.4rem', fontWeight: 700, color: '#fff', textAlign: 'center' }}>
                {onboardForm.accessKey === 'SUPERCOACH2026' ? 'Cadastrar Novo Treinador' : 'Cadastrar Novo Atleta'}
              </h3>
              
              <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {onboardForm.accessKey === 'SUPERCOACH2026' && (
                  <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', color: '#34d399', marginBottom: '10px', textAlign: 'center' }}>
                    🔑 Cadastro de Treinador detectado. As métricas de condicionamento e metas esportivas iniciais serão ignoradas.
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Nome Completo</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="Ex: Ana Souza"
                      value={onboardForm.name} 
                      onChange={e => setOnboardForm({ ...onboardForm, name: e.target.value })} 
                      required 
                      style={{ fontSize: '0.9rem', padding: '10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Chave de Acesso</label>
                    <input 
                      type="password" 
                      className="glass-input" 
                      placeholder="Chave do convite"
                      value={onboardForm.accessKey} 
                      onChange={e => setOnboardForm({ ...onboardForm, accessKey: e.target.value })} 
                      required 
                      style={{ fontSize: '0.9rem', padding: '10px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Usuário</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="Nome de login"
                      value={onboardForm.username} 
                      onChange={e => setOnboardForm({ ...onboardForm, username: e.target.value })} 
                      required 
                      style={{ fontSize: '0.9rem', padding: '10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Senha</label>
                    <input 
                      type="password" 
                      className="glass-input" 
                      placeholder="Senha forte"
                      value={onboardForm.password} 
                      onChange={e => setOnboardForm({ ...onboardForm, password: e.target.value })} 
                      required 
                      style={{ fontSize: '0.9rem', padding: '10px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Nascimento</label>
                    <input 
                      type="date" 
                      className="glass-input" 
                      value={onboardForm.birthDate} 
                      onChange={e => setOnboardForm({ ...onboardForm, birthDate: e.target.value })} 
                      required 
                      style={{ fontSize: '0.9rem', padding: '10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Peso (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="glass-input" 
                      placeholder="Ex: 72.5"
                      value={onboardForm.weight} 
                      onChange={e => setOnboardForm({ ...onboardForm, weight: e.target.value })} 
                      required 
                      style={{ fontSize: '0.9rem', padding: '10px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Condicionamento</label>
                    <select 
                      className="glass-input"
                      value={onboardForm.level}
                      onChange={e => setOnboardForm({ ...onboardForm, level: e.target.value })}
                      style={{ fontSize: '0.9rem', padding: '10px', background: '#1c1c24' }}
                    >
                      <option value="sedentario">Iniciante / Sedentário</option>
                      <option value="intermediario">Intermediário</option>
                      <option value="elite">Avançado</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Disponibilidade semanal</label>
                    <select 
                      className="glass-input"
                      value={onboardForm.weeklyHours}
                      onChange={e => setOnboardForm({ ...onboardForm, weeklyHours: e.target.value })}
                      required
                      style={{ fontSize: '0.9rem', padding: '10px', background: '#1c1c24' }}
                    >
                      <option value="">Selecione...</option>
                      <option value="3">Até 3 horas/semana</option>
                      <option value="6">4 a 7 horas/semana</option>
                      <option value="10">8 a 12 horas/semana</option>
                      <option value="15">Mais de 12 horas/semana</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--neon-cyan)' }}>Meta Esportiva Inicial</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Modalidade</label>
                      <select 
                        className="glass-input"
                        value={onboardForm.goalType}
                        onChange={e => setOnboardForm({ ...onboardForm, goalType: e.target.value })}
                        style={{ fontSize: '0.9rem', padding: '10px', background: '#1c1c24' }}
                      >
                        <option value="Corrida">Corrida de Rua</option>
                        <option value="Ciclismo">Ciclismo</option>
                        <option value="Natacao">Natação</option>
                        <option value="Triathlon">Triathlon</option>
                        <option value="Duathlon">Duathlon</option>
                        <option value="Aquathlon">Aquathlon</option>
                        <option value="Trail">Corrida de Trilha (Trail)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Distância Alvo (km)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="glass-input" 
                        placeholder="Ex: 10.0"
                        value={onboardForm.goalDistance} 
                        onChange={e => setOnboardForm({ ...onboardForm, goalDistance: e.target.value })} 
                        required 
                        style={{ fontSize: '0.9rem', padding: '10px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    id="stravaConnectedOnboard"
                    checked={onboardForm.stravaConnected}
                    onChange={e => setOnboardForm({ ...onboardForm, stravaConnected: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#fc4c02', cursor: 'pointer' }}
                  />
                  <label htmlFor="stravaConnectedOnboard" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Sincronizar com o <span style={{ color: '#fc4c02', fontWeight: 700 }}>Strava</span> após o cadastro
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="glow-btn" 
                  style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw style={{ animation: 'spin 1s linear infinite' }} size={16} />
                      Processando...
                    </>
                  ) : (
                    <>
                      Finalizar e Criar Planilha
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Já possui conta?{' '}
                  <button 
                    type="button" 
                    onClick={() => setIsRegistering(false)} 
                    style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SE USUÁRIO ATIVO FOR O MASTER (DIRETORIA), REDIRECIONAR PARA O PAINEL MASTER
  if (activeUser && userRole === 'master') {
    return (
      <MasterDashboard 
        userId={String(activeUser)} 
        userName={activeUserName || 'Diretor'} 
        onLogout={() => {
          setActiveUser(null);
          setUserRole('athlete');
          setActiveUserName('');
          localStorage.removeItem('active_user_id');
          localStorage.removeItem('is_authenticated');
          localStorage.removeItem('user_role');
          localStorage.removeItem('active_user_name');
        }}
      />
    );
  }

  // SE USUÁRIO ATIVO FOR UM TREINADOR, REDIRECIONAR PARA O PAINEL DE TREINADORES
  if (activeUser && userRole === 'coach') {
    return (
      <CoachDashboard 
        userId={String(activeUser)} 
        userName={activeUserName || 'Treinador'} 
        onLogout={() => {
          setActiveUser(null);
          setUserRole('athlete');
          setActiveUserName('');
          localStorage.removeItem('active_user_id');
          localStorage.removeItem('is_authenticated');
          localStorage.removeItem('user_role');
          localStorage.removeItem('active_user_name');
        }}
      />
    );
  }

  // SE JÁ EXISTE UM USUÁRIO ATIVO CARREGADO E COM DADOS DO DASHBOARD
  if (dashboardData && 'blocked' in dashboardData && (dashboardData as any).blocked) {
    const handleCopyPix = () => {
      const pixKey = (dashboardData as any).coachPix?.key;
      if (pixKey) {
        navigator.clipboard.writeText(pixKey);
        alert('Chave Pix copiada para a área de transferência! 👍');
      } else {
        alert('Chave Pix não cadastrada pelo treinador.');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)', color: '#fff' }} className="animate-slide-up">
        <div className="premium-card" style={{ maxWidth: '480px', width: '100%', padding: '40px 32px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)' }}>
          
          {/* Locked Icon */}
          <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '50%', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px', background: 'linear-gradient(90deg, #fff 0%, #fca5a5 50%, #ef4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Acesso Suspenso
          </h2>
          
          <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
            Olá, <strong>{(dashboardData as any).user?.name}</strong>. Constatamos uma pendência financeira em sua mensalidade. Seu acesso às planilhas e feedbacks foi temporariamente suspenso pela assessoria.
          </p>

          {/* Pix Box */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', marginBottom: '28px', textAlign: 'left' }}>
            <h4 style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💸</span> Regularize via Pix
            </h4>
            
            {(dashboardData as any).coachPix?.key ? (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Chave Pix do Treinador:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <code style={{ flex: 1, fontSize: '0.85rem', color: '#fff', wordBreak: 'break-all' }}>{(dashboardData as any).coachPix.key}</code>
                    <button 
                      onClick={handleCopyPix}
                      style={{ background: 'var(--neon-cyan)', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {(dashboardData as any).coachPix.instructions && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Instruções:</span>
                    <p style={{ fontSize: '0.85rem', color: '#d1d5db', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                      {(dashboardData as any).coachPix.instructions}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0, textAlign: 'center', padding: '8px 0' }}>
                Entre em contato com o seu treinador para obter os dados de pagamento e reestabelecer o seu acesso.
              </p>
            )}
          </div>

          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '24px' }}>
            Assim que o treinador confirmar o pagamento, seu acesso será liberado instantaneamente.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => fetchDashboard((dashboardData as any).user.id)}
              style={{ flex: 1, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', padding: '12px 18px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              🔄 Já paguei / Atualizar
            </button>
            <button
              onClick={() => {
                setActiveUser(null);
                setUserRole('athlete');
                setActiveUserName('');
                localStorage.removeItem('active_user_id');
                localStorage.removeItem('is_authenticated');
                localStorage.removeItem('user_role');
                localStorage.removeItem('active_user_name');
              }}
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '12px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Sair
            </button>
          </div>

        </div>
      </div>
    );
  }

  const { user, goal, plan, workouts, activityLogs, notifications, metrics, lastSyncedActivity, celebration, calendarUrl } = dashboardData || {};
  const recommendedPlan = goal ? getBestMatchingPlan(goal.type, user?.level || 'intermediario', goal.distance) : null;

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
        // Se estiver completo e não possuir log de atividade associado no activityLogs,
        // somamos o tss_target como fallback (ex: Descanso autoconcluído ou manual sem log).
        if (w.status === 'completed') {
          const hasLog = activityLogs?.some((l: any) => l.workout_id === w.id);
          if (!hasLog) {
            tssRealData[idx] += w.tss_target;
          }
        }
      }
    });
  }

  if (activityLogs && plan) {
    activityLogs.forEach((l: any) => {
      if (!l.timestamp) return;
      const logDateStr = l.timestamp.split('T')[0];
      const start = new Date(plan.start_date + 'T12:00:00');
      const current = new Date(logDateStr + 'T12:00:00');
      const diffDays = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < 7) {
        tssRealData[diffDays] += l.tss_real || 0;
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
              <strong 
                onClick={() => setActiveTab('perfil')}
                style={{ 
                  color: activeTab === 'perfil' ? 'var(--neon-cyan)' : '#fff', 
                  cursor: 'pointer',
                  borderBottom: activeTab === 'perfil' ? '1.5px solid var(--neon-cyan)' : '1px dashed rgba(255,255,255,0.4)',
                  paddingBottom: '1px',
                  transition: 'var(--transition-smooth)'
                }}
                title="Ver Perfil & Dados"
              >
                {user?.name}
              </strong>
              <span style={{ fontSize: '0.75rem', padding: '1px 6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: user?.level === 'elite' ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
                {user?.level === 'elite' ? 'AVANÇADO' : user?.level === 'intermediario' ? 'INTERMEDIÁRIO' : user?.level === 'sedentario' ? 'INICIANTE' : (user?.level?.toUpperCase() || '')}
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
        {((celebration && loginCelebrationActive) || showProfileCelebration || (isWeeklyPlanCompleted && weeklyPlanCelebrationActive)) && <ConfettiShower />}

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
            <div 
              className="physiological-metric-card"
              onClick={() => openMetricsModal('ctl')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '14px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <div style={{ display: 'flex', padding: '12px', background: 'rgba(57, 255, 20, 0.08)', borderRadius: '12px', border: '1px solid rgba(57, 255, 20, 0.15)' }}>
                <TrendingUp style={{ color: 'var(--neon-green)' }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  CTL (Fitness / Condicionamento)
                  <Info size={12} style={{ color: 'var(--text-muted)' }} />
                </span>
                <strong style={{ fontSize: '1.75rem', color: '#fff', fontFamily: 'var(--font-title)' }}>{metrics?.ctl || 0}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Média de 42 dias • Quanto maior, mais preparado (↑ Melhor)</span>
              </div>
            </div>

            {/* ATL */}
            <div 
              className="physiological-metric-card"
              onClick={() => openMetricsModal('atl')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '14px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <div style={{ display: 'flex', padding: '12px', background: 'rgba(255, 107, 53, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 107, 53, 0.15)' }}>
                <Heart style={{ color: 'var(--neon-orange)' }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ATL (Fadiga Recente)
                  <Info size={12} style={{ color: 'var(--text-muted)' }} />
                </span>
                <strong style={{ fontSize: '1.75rem', color: '#fff', fontFamily: 'var(--font-title)' }}>{metrics?.atl || 0}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Média de 7 dias • Fadiga acumulada (Monitorar)</span>
              </div>
            </div>

            {/* TSB */}
            <div 
              className="physiological-metric-card"
              onClick={() => openMetricsModal('tsb')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '14px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <div style={{ display: 'flex', padding: '12px', background: 'rgba(0, 240, 255, 0.08)', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                <Clock style={{ color: '#fc4c02' }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  TSB (Forma / Balanço)
                  <Info size={12} style={{ color: 'var(--text-muted)' }} />
                </span>
                <strong style={{ fontSize: '1.75rem', color: tsbColor, fontFamily: 'var(--font-title)' }}>{metrics?.tsb || 0}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>CTL - ATL • Ideal: -10 a -30 para evolução</span>
              </div>
            </div>

            {/* STATUS BRIEF */}
            <div 
              className="status-brief-container physiological-metric-card"
              onClick={() => openMetricsModal('zones')}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '14px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Status do Organismo
                <Info size={12} style={{ color: 'var(--text-muted)' }} />
              </span>
              <strong style={{ fontSize: '0.95rem', color: '#fff', margin: '4px 0' }}>{tsbStatus}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tsbColor }}></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fisiologia de adaptação • Detalhes da ciência</span>
              </div>
            </div>

          </section>
        )}

        {/* NOTIFICAÇÃO DE ADAPTAÇÃO FISIOLÓGICA */}
        {notifications && notifications.length > 0 && (
          <div className="animate-fade-in" style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.2)', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertTriangle style={{ color: 'var(--neon-orange)', flexShrink: 0, marginTop: '2px' }} size={20} />
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {notifications[0].title}
                <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(255, 107, 53, 0.15)', color: 'var(--neon-orange)', borderRadius: '4px', fontWeight: 600 }}>Assistente Fisiológico</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {notifications[0].content}
              </p>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          borderBottom: '1px solid var(--border-color)', 
          gap: '8px', 
          paddingBottom: '10px',
          width: '100%'
        }}>
          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('planilha')}
            style={{ 
              background: activeTab === 'planilha' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
              border: activeTab === 'planilha' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px',
              color: activeTab === 'planilha' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'planilha' ? 700 : 500,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Calendar size={18} style={{ color: activeTab === 'planilha' ? 'var(--neon-cyan)' : 'inherit' }} />
            Planilha Semanal
          </button>
          
          {userRole === 'coach' && (
            <button 
              className="tab-btn" 
              onClick={() => {
                setActiveTab('coach');
                setSelectedPreviewWeek(1);
              }}
              style={{ 
                background: activeTab === 'coach' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
                border: activeTab === 'coach' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '12px',
                color: activeTab === 'coach' ? '#fff' : 'var(--text-secondary)', 
                fontWeight: activeTab === 'coach' ? 700 : 500,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <BookOpen size={18} style={{ color: activeTab === 'coach' ? 'var(--neon-cyan)' : 'inherit' }} />
              Biblioteca de Planilhas
              <Award size={12} style={{ color: 'var(--neon-orange)' }} />
            </button>
          )}

          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('simulador')}
            style={{ 
              background: activeTab === 'simulador' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
              border: activeTab === 'simulador' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px',
              color: activeTab === 'simulador' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'simulador' ? 700 : 500,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.9rem',
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
            onClick={() => setActiveTab('provas')}
            style={{ 
              background: activeTab === 'provas' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
              border: activeTab === 'provas' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px',
              color: activeTab === 'provas' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'provas' ? 700 : 500,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Trophy size={18} style={{ color: activeTab === 'provas' ? 'var(--neon-cyan)' : 'inherit' }} />
            Provas
          </button>

          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('nutricao')}
            style={{ 
              background: activeTab === 'nutricao' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
              border: activeTab === 'nutricao' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px',
              color: activeTab === 'nutricao' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'nutricao' ? 700 : 500,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Apple size={18} style={{ color: activeTab === 'nutricao' ? 'var(--neon-cyan)' : 'inherit' }} />
            Nutrição
          </button>

          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('alongamento')}
            style={{ 
              background: activeTab === 'alongamento' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
              border: activeTab === 'alongamento' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px',
              color: activeTab === 'alongamento' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'alongamento' ? 700 : 500,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Accessibility size={18} style={{ color: activeTab === 'alongamento' ? 'var(--neon-cyan)' : 'inherit' }} />
            Alongamentos
          </button>

          <button 
            className="tab-btn" 
            onClick={() => setActiveTab('gravar')}
            style={{ 
              background: activeTab === 'gravar' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
              border: activeTab === 'gravar' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px',
              color: activeTab === 'gravar' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'gravar' ? 700 : 500,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Compass size={18} style={{ color: activeTab === 'gravar' ? 'var(--neon-cyan)' : 'inherit' }} />
            Gravar Treino
            <span style={{ fontSize: '0.65rem', background: 'var(--neon-green)', padding: '1px 5px', color: '#030712', borderRadius: '4px', fontWeight: 700 }}>GPS</span>
          </button>

        </div>

        {/* TAB CONTENTS */}
        
        {/* 1. PLANILHA SEMANALE DASHBOARD */}
        {activeTab === 'planilha' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            
            {/* Banner de Orientação da Prova Alvo / Biblioteca */}
            {goal && (
              <div 
                className="premium-card animate-slide-up" 
                style={{ 
                  background: plan?.library_id 
                    ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(57, 255, 20, 0.03) 100%)' 
                    : 'linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(13, 21, 39, 0.8) 100%)',
                  border: plan?.library_id 
                    ? '1px solid rgba(0, 240, 255, 0.25)' 
                    : '1px solid rgba(255, 107, 53, 0.25)',
                  boxShadow: plan?.library_id 
                    ? '0 8px 32px rgba(0, 240, 255, 0.08)' 
                    : '0 8px 32px rgba(255, 107, 53, 0.08)',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '20px'
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: '1', minWidth: '280px' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: plan?.library_id ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 107, 53, 0.1)', 
                    borderRadius: '12px',
                    border: plan?.library_id ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid rgba(255, 107, 53, 0.2)'
                  }}>
                    <Target style={{ color: plan?.library_id ? 'var(--neon-cyan)' : 'var(--neon-orange)' }} size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {plan?.library_id ? 'Planilha Científica Ativa' : 'Atenção: Planilha Não Vinculada'}
                      <span style={{ 
                        fontSize: '0.75rem', 
                        background: plan?.library_id ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 107, 53, 0.15)', 
                        color: plan?.library_id ? 'var(--neon-green)' : 'var(--neon-orange)', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>
                        {goal.type === 'Saude' || goal.type === 'Musculacao' ? 'FOCO ATIVO' : 'PROVA ALVO'}
                      </span>
                    </h3>
                    
                    {goal.type === 'Saude' ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                        Seu objetivo ativo é <strong style={{ color: 'var(--neon-lime)' }}>Saúde & Qualidade de Vida</strong>. Seus treinos semanais estão calibrados para o seu bem-estar, consistência e manutenção da saúde fisiológica.
                      </p>
                    ) : goal.type === 'Musculacao' ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                        Seu objetivo ativo é <strong style={{ color: 'var(--neon-orange)' }}>Musculação (Hipertrofia/Força)</strong>. Sua planilha semanal contém uma programação estruturada por grupos musculares de acordo com seu nível.
                      </p>
                    ) : plan?.library_id ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                        Seus treinos são orientados pela planilha periodizada prescrita pelo seu treinador: <strong style={{ color: '#fff' }}>{plan?.name}</strong>. 
                        A periodização está sincronizada com a sua prova de <strong>{goal.type} ({goal.distance} km)</strong>{goal.date_target ? ` marcada para o dia ${new Date(goal.date_target + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}.
                      </p>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                        Você estabeleceu uma prova alvo de <strong>{goal.type} ({goal.distance} km)</strong>{goal.date_target ? ` para o dia ${new Date(goal.date_target + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}. 
                        Os treinos prescritos por seu treinador aparecerão no seu calendário semanal.
                      </p>
                    )}
                  </div>
                </div>

                {userRole === 'coach' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {plan?.library_id ? (
                      <button
                        onClick={() => {
                          const libPlan = libraryPlans.find(p => p.id === plan.library_id) || TRAINING_LIBRARY[plan.library_id];
                          if (libPlan) {
                            handleSelectLibraryPlan(libPlan, plan.effort_pct || 100, plan.cut_choice || 'none', plan.current_week || 1);
                          }
                          setActiveTab('coach');
                        }}
                        className="glow-btn"
                        style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Sliders size={16} />
                        Calibrar Esforço
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (recommendedPlan) {
                              setViewingLibraryPlan(recommendedPlan);
                              setEffortPctCalibration(100);
                              setCutChoiceSelection('ambos');
                              setSelectedPreviewWeek(1);
                              setActiveTab('coach');
                            }
                          }}
                          className="glow-btn"
                          style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Check size={16} />
                          Aplicar Recomendada
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSportFilter(goal.type.includes('Natac') || goal.type.includes('Nataç') ? 'Natação' : goal.type);
                            setActiveTab('coach');
                          }}
                          style={{ 
                            padding: '10px 20px', 
                            fontSize: '0.85rem', 
                            fontWeight: 650, 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          Ver Todas
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

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
                        <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                          {goal?.type === 'Saude' ? 'Saúde & Qualidade de Vida' : goal?.type === 'Musculacao' ? 'Musculação' : `${goal?.type} (${formatDistance(goal?.distance)} km)`}
                        </strong>
                      </div>
                      {goal?.type !== 'Saude' && goal?.type !== 'Musculacao' && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Data Alvo da Prova</span>
                            <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{goal?.date_target ? new Date(goal.date_target).toLocaleDateString('pt-BR') : 'N/A'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tempo Alvo Prescrito</span>
                            <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{goal?.target_time || 'N/A'}</strong>
                          </div>
                        </>
                      )}
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
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>({plan?.name || 'Modo Livre - Treinos Realizados'})</span>
                </h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {user?.strava_connected === 1 && (
                    <button
                      onClick={handleSyncStrava}
                      disabled={isSyncingStrava}
                      className="glow-btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #fc4c02 0%, #e23e00 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(252, 76, 2, 0.2)',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <RefreshCw size={14} style={{ animation: isSyncingStrava ? 'spin 1.5s linear infinite' : 'none' }} />
                      {isSyncingStrava ? 'Sincronizando...' : 'Sincronizar Strava'}
                    </button>
                  )}
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
              </div>

              {/* Modo Livre Warning */}
              {!plan && (
                <div className="premium-card animate-slide-up" style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(13, 21, 39, 0.8) 100%)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🏃‍♂️</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>Modo Livre</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Você não possui nenhuma planilha ativa. Abaixo estão exibidos os treinos que você realizou esta semana (sincronizados ou manuais). Peça para seu treinador prescrever seus treinos estruturados.
                    </p>
                  </div>
                </div>
              )}

              {/* Barra de Progresso Semanal */}
              {workouts && workouts.length > 0 && plan && (
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
                            {(() => {
                              const analysis = getExecutionAnalysis(w, hasLog);
                              if (!analysis) return null;
                              return (
                                <div style={{ marginTop: '4px' }}>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    background: `${analysis.color}15`,
                                    color: analysis.color,
                                    border: `1px solid ${analysis.color}35`,
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span>{analysis.status === 'pleno' ? '🎯' : analysis.status === 'superado' ? '⚡' : '⚠️'}</span>
                                    {analysis.label} ({analysis.percentage}%)
                                  </span>
                                </div>
                              );
                            })()}
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

        {/* 2. BIBLIOTECA DE PLANILHAS PERIODIZADAS */}
        {activeTab === 'coach' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            
            {/* Se viewingLibraryPlan estiver nulo, exibe a lista de planilhas. Caso contrário, exibe o painel de calibração/prévia */}
            {!viewingLibraryPlan ? (
              <div>
                {/* Cabeçalho da Biblioteca */}
                <div className="premium-card" style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(57, 255, 20, 0.02) 100%)', padding: '28px', border: '1px solid rgba(0, 240, 255, 0.15)', borderRadius: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', padding: '12px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                      <BookOpen style={{ color: 'var(--neon-cyan)' }} size={28} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>Biblioteca de Planilhas Periodizadas</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Importe planilhas via link da internet ou monte seu próprio ciclo de treinos estruturado.</p>
                    </div>
                  </div>
                </div>

                {/* Aviso sobre Origem dos Exemplos */}
                <div style={{ 
                  background: 'rgba(234, 179, 8, 0.05)', 
                  border: '1px solid rgba(234, 179, 8, 0.15)', 
                  borderRadius: '12px', 
                  padding: '14px 18px', 
                  marginBottom: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px' 
                }}>
                  <Info size={18} style={{ color: 'var(--neon-orange)', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Exemplos de Treino:</strong> As planilhas pré-cadastradas abaixo são modelos de referência retirados de links públicos da internet (como programas de Hal Higdon, Jack Daniels, Joe Friel, etc.). Elas estão disponibilizadas aqui exclusivamente como exemplos didáticos para inspirar sua rotina de treinamento.
                  </p>
                </div>

                {/* Painel de Importação e Criação */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr', 
                  gap: '20px', 
                  marginBottom: '24px' 
                }} className="responsive-grid">
                  
                  {/* Bloco Importar */}
                  <div className="premium-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Download size={18} style={{ color: 'var(--neon-cyan)' }} />
                      Importar Planilha via Link
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      Cole um link de planilha pública do Google Sheets, arquivo CSV, página HTML ou JSON.
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', background: 'rgba(0, 240, 255, 0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Formatos aceitos:</span><br/>
                      • <strong>Google Sheets:</strong> Link de compartilhamento público da planilha.<br/>
                      • <strong>CSV / HTML / JSON:</strong> URL direta do arquivo ou da página contendo a tabela de treinos.
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <input 
                        type="text" 
                        placeholder="Cole o link da planilha aqui..." 
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(13, 21, 39, 0.6)',
                          color: '#fff',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      />
                      <button 
                        onClick={handleImportPlan}
                        disabled={isImporting}
                        className="glow-btn"
                        style={{
                          padding: '10px 20px',
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isImporting ? 'Buscando...' : 'Buscar e Carregar'}
                      </button>
                    </div>
                  </div>

                  {/* Bloco Criar Customizada */}
                  <div className="premium-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(57, 255, 20, 0.1)', borderRadius: '50%', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
                      <Plus size={24} style={{ color: 'var(--neon-green)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>Montar Planilha</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>Monte sua planilha personalizada para uma semana ou ciclo completo.</p>
                    </div>
                    <button 
                      onClick={() => setShowCreatePlanModal(true)}
                      className="glow-btn"
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(90deg, var(--neon-green) 0%, #39ff14 100%)',
                        border: 'none',
                        color: '#030712',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Criar Minha Planilha
                    </button>
                  </div>

                </div>

                {/* Filtro de Esportes */}
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
                  {['Corrida', 'Ciclismo', 'Natação', 'Triathlon', 'Ultramaratona'].map((sport) => {
                    const isActive = selectedSportFilter === sport;
                    const emoji = sport === 'Corrida' ? '🏃‍♂️' : sport === 'Ciclismo' ? '🚴‍♂️' : sport === 'Natação' ? '🏊‍♂️' : sport === 'Triathlon' ? '🏊‍♂️🚴‍♂️🏃‍♂️' : '🥾';
                    const activeColor = sport === 'Corrida' ? 'var(--neon-green)' : sport === 'Ciclismo' ? 'var(--neon-cyan)' : sport === 'Natação' ? 'var(--neon-purple)' : sport === 'Triathlon' ? 'var(--neon-cyan)' : 'var(--neon-orange)';
                    
                    return (
                      <button
                        key={sport}
                        onClick={() => setSelectedSportFilter(sport)}
                        style={{
                          background: isActive ? `rgba(${sport === 'Corrida' ? '57, 255, 20' : sport === 'Ciclismo' ? '0, 240, 255' : '168, 85, 247'}, 0.15)` : 'rgba(255,255,255,0.03)',
                          border: isActive ? `1.5px solid ${activeColor}` : '1px solid rgba(255,255,255,0.08)',
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          fontWeight: isActive ? 700 : 500,
                          padding: '10px 20px',
                          borderRadius: '24px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <span>{emoji}</span>
                        <span>{sport}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Grid de Planilhas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {libraryLoading ? (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Carregando biblioteca...
                    </div>
                  ) : libraryPlans.filter(plan => {
                    if (selectedSportFilter === 'Natação') return plan.sport === 'Natacao';
                    return plan.sport === selectedSportFilter;
                  }).length === 0 ? (
                    <div style={{
                      gridColumn: '1 / -1',
                      padding: '40px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      color: 'var(--text-secondary)'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Nenhuma planilha carregada para {selectedSportFilter}.</p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Utilize a seção de importação via link acima ou crie sua própria planilha customizada.</p>
                    </div>
                  ) : (
                    libraryPlans
                      .filter(plan => {
                        if (selectedSportFilter === 'Natação') return plan.sport === 'Natacao';
                        return plan.sport === selectedSportFilter;
                      })
                      .map((plan) => {
                        const levelLabel = plan.level === 'iniciante' ? 'Iniciante' : plan.level === 'intermediario' ? 'Intermediário' : 'Avançado';
                        const levelColor = plan.level === 'iniciante' ? 'var(--neon-green)' : plan.level === 'intermediario' ? 'var(--neon-cyan)' : 'var(--neon-orange)';
                        
                        return (
                          <div key={plan.id} className="premium-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: levelColor, background: `rgba(255,255,255,0.03)`, padding: '2px 8px', borderRadius: '4px', border: `1px solid rgba(255,255,255,0.05)` }}>
                                {levelLabel}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                ⏱️ {plan.weeks} Semanas
                              </span>
                            </div>
                            
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', lineHeight: '1.3' }}>{plan.name}</h3>
                            
                            <div style={{ marginBottom: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Autor: <strong style={{ color: 'var(--text-primary)' }}>{plan.author}</strong> <br />
                              Fonte: <em style={{ color: 'var(--neon-cyan)', wordBreak: 'break-all' }}>{plan.source}</em>
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: '1.5', flexGrow: 1 }}>{plan.description}</p>
                            
                            <button
                              onClick={() => handleSelectLibraryPlan(plan)}
                              className="glow-btn"
                              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                              <Eye size={16} />
                              Visualizar e Aplicar
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            ) : (
              /* Detalhes, Calibração de Esforço e Ajuste de Tempo */
              <div className="premium-card animate-slide-up" style={{ padding: '32px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                {/* Header do Detalhe */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <button
                      onClick={() => setViewingLibraryPlan(null)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', padding: 0 }}
                    >
                      ← Voltar para Biblioteca
                    </button>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: 0 }}>{viewingLibraryPlan.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      Autor: <strong style={{ color: '#fff' }}>{viewingLibraryPlan.author}</strong> | Fonte: <span style={{ color: 'var(--neon-cyan)' }}>{viewingLibraryPlan.source}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}>
                      📋 {viewingLibraryPlan.weeks} Semanas Originais
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }} className="responsive-grid">
                  {/* Bloco 1: Calibração de Esforço */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Settings size={18} style={{ color: 'var(--neon-cyan)' }} />
                      1. Calibrar Intensidade do Esforço
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      Ajuste o percentual do esforço da planilha. Reduzir o esforço recalcula de forma científica o ritmo (pace/velocidade), a potência e o TSS das sessões de treino por regra de 3.
                    </p>
                    
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)', marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Esforço da Planilha</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: effortPctCalibration === 100 ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
                          {effortPctCalibration}%
                        </span>
                      </div>
                      
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={effortPctCalibration}
                        onChange={(e) => {
                          setEffortPctCalibration(parseInt(e.target.value, 10));
                        }}
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '5px',
                          outline: 'none',
                          cursor: 'pointer',
                          accentColor: 'var(--neon-cyan)'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        <span>50% (Ritmo Regenerativo)</span>
                        <span>100% (Original)</span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Adaptação de Calendário (Prova Alvo) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} style={{ color: 'var(--neon-orange)' }} />
                      2. Adequar Periodização para Prova Alvo
                    </h4>
                    
                    {(() => {
                      const goal = dashboardData?.goal;
                      if (!goal || !goal.date_target) {
                        return (
                          <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            💡 <strong>Sem Prova Alvo cadastrada:</strong> Você fará as {viewingLibraryPlan.weeks} semanas completas do ciclo original. Você pode definir uma prova no formulário de Perfil no Cockpit se desejar.
                          </div>
                        );
                      }

                      // Calcular semanas disponíveis
                      const today = new Date();
                      const day = today.getDay();
                      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                      const monday = new Date(today);
                      monday.setDate(diff);
                      
                      const targetDate = new Date(goal.date_target + 'T12:00:00');
                      const diffTime = targetDate.getTime() - monday.getTime();
                      const weeksAvailable = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));

                      if (weeksAvailable <= 0) {
                        return (
                          <div style={{ padding: '16px', background: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.2)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--neon-red)', lineHeight: '1.4' }}>
                            ⚠️ A data da sua prova alvo cadastrada no perfil ({new Date(goal.date_target + 'T12:00:00').toLocaleDateString('pt-BR')}) já passou. Atualize seu objetivo no formulário de Perfil.
                          </div>
                        );
                      }

                      if (weeksAvailable >= viewingLibraryPlan.weeks) {
                        return (
                          <div style={{ padding: '16px', background: 'rgba(57, 255, 20, 0.08)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--neon-green)', lineHeight: '1.4' }}>
                            ✅ <strong>Preparação Ideal!</strong> Faltam <strong>{weeksAvailable} semanas</strong> até sua prova alvo ({new Date(goal.date_target + 'T12:00:00').toLocaleDateString('pt-BR')}). Tempo ideal para realizar as {viewingLibraryPlan.weeks} semanas completas sem cortes.
                          </div>
                        );
                      }

                      // Tempo insuficiente! Pergunta o que cortar
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ padding: '12px 16px', background: 'rgba(255, 107, 53, 0.08)', border: '1px solid rgba(255, 107, 53, 0.25)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--neon-orange)', lineHeight: '1.4' }}>
                            ⚠️ <strong>Conflito de Calendário:</strong> Restam apenas <strong>{weeksAvailable} semanas</strong> até sua prova alvo, mas esta planilha original tem <strong>{viewingLibraryPlan.weeks} semanas</strong>. Escolha a estratégia para ajustar o ciclo:
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="cutChoice"
                                checked={cutChoiceSelection === 'inicial'}
                                onChange={() => setCutChoiceSelection('inicial')}
                                style={{ accentColor: 'var(--neon-orange)' }}
                              />
                              <div>
                                <strong>Remover semanas iniciais</strong>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Corta as semanas iniciais de base, focando no pico/especificidade.</span>
                              </div>
                            </label>
                            
                            <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }} />

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="cutChoice"
                                checked={cutChoiceSelection === 'polimento'}
                                onChange={() => setCutChoiceSelection('polimento')}
                                style={{ accentColor: 'var(--neon-orange)' }}
                              />
                              <div>
                                <strong>Reduzir fase de polimento (Taper)</strong>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Corta semanas finais de taper para manter a base, mantendo apenas a semana pré-prova.</span>
                              </div>
                            </label>

                            <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }} />

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="cutChoice"
                                checked={cutChoiceSelection === 'ambos'}
                                onChange={() => setCutChoiceSelection('ambos')}
                                style={{ accentColor: 'var(--neon-orange)' }}
                              />
                              <div>
                                <strong>Cortar um pouco dos dois (Equilibrado)</strong>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Corta metade da diferença no início do ciclo e metade na fase de polimento.</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 3. PRÉVIA INTERATIVA DE TREINOS DO CICLO */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={18} style={{ color: 'var(--neon-green)' }} />
                    3. Prévia dos Treinos Periodizados (Calibrados)
                  </h4>
                  
                  {(() => {
                    const goal = dashboardData?.goal;
                    let weeksCount = viewingLibraryPlan.weeks;
                    
                    if (goal?.date_target) {
                      const today = new Date();
                      const day = today.getDay();
                      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                      const monday = new Date(today);
                      monday.setDate(diff);
                      const targetDate = new Date(goal.date_target + 'T12:00:00');
                      const diffTime = targetDate.getTime() - monday.getTime();
                      const computedWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));
                      if (computedWeeks > 0 && computedWeeks < viewingLibraryPlan.weeks) {
                        weeksCount = computedWeeks;
                      }
                    }

                    const originalWeekIndices = Array.from({ length: viewingLibraryPlan.weeks }, (_, i) => i);
                    const selectedWeekIndices = getWeeksAfterCut(originalWeekIndices, weeksCount, cutChoiceSelection);
                    
                    const maxWeeks = selectedWeekIndices.length;
                    const safePreviewWeek = Math.min(selectedPreviewWeek, maxWeeks);
                    
                    const originalWeeksData = viewingLibraryPlan.generateWeeks(effortPctCalibration);
                    const targetWeekIndex = selectedWeekIndices[safePreviewWeek - 1] ?? 0;
                    const previewWorkouts = originalWeeksData[targetWeekIndex] || [];

                    return (
                      <div>
                        {/* Navegação de semanas da prévia */}
                        <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
                          {Array.from({ length: maxWeeks }).map((_, idx) => {
                            const weekNum = idx + 1;
                            const isSelected = safePreviewWeek === weekNum;
                            // Encontrar a semana física original correspondente
                            const originalWeekNum = selectedWeekIndices[idx] + 1;
                            
                            return (
                              <button
                                key={weekNum}
                                onClick={() => setSelectedPreviewWeek(weekNum)}
                                style={{
                                  background: isSelected ? 'var(--neon-green)' : 'rgba(255,255,255,0.03)',
                                  border: isSelected ? '1px solid var(--neon-green)' : '1px solid rgba(255,255,255,0.06)',
                                  color: isSelected ? '#030712' : 'var(--text-secondary)',
                                  fontWeight: isSelected ? 700 : 500,
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  whiteSpace: 'nowrap',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Semana {weekNum} {originalWeekNum !== weekNum && <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(Orig: S{originalWeekNum})</span>}
                              </button>
                            );
                          })}
                        </div>

                        {/* Listagem de treinos da semana selecionada na prévia */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {previewWorkouts.map((w: any, index: number) => {
                            const isRest = w.type === 'Descanso';
                            const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                            
                            // Cor do ícone por tipo de esporte
                            const sportColor = w.type === 'Corrida' ? 'var(--neon-green)' : w.type === 'Ciclismo' ? 'var(--neon-cyan)' : w.type === 'Natacao' ? 'var(--neon-purple)' : w.type === 'Forca' ? 'var(--neon-orange)' : 'var(--text-muted)';
                            
                            return (
                              <div
                                key={index}
                                style={{
                                  background: isRest ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                                  border: '1px solid rgba(255,255,255,0.05)',
                                  borderRadius: '10px',
                                  padding: '12px 18px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '12px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '220px' }}>
                                  {/* Dia da semana */}
                                  <div style={{ width: '80px', flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>{dayNames[w.day - 1]}</span>
                                    <span style={{ fontSize: '0.85rem', color: sportColor, fontWeight: 700 }}>{w.type}</span>
                                  </div>
                                  
                                  {/* Título e Descrição */}
                                  <div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'block' }}>{w.title}</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>{w.desc}</span>
                                  </div>
                                </div>

                                {/* Métricas */}
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexShrink: 0 }}>
                                  {!isRest ? (
                                    <>
                                      {w.dist > 0 && (
                                        <div style={{ textAlign: 'right' }}>
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Distância</span>
                                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>{w.dist} km</span>
                                        </div>
                                      )}
                                      {w.dur > 0 && (
                                        <div style={{ textAlign: 'right' }}>
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Duração</span>
                                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>{Math.round(w.dur / 60)} min</span>
                                        </div>
                                      )}
                                      {w.pace && w.pace !== 'N/A' && (
                                        <div style={{ textAlign: 'right' }}>
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Ritmo</span>
                                          <span style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>{w.pace}</span>
                                        </div>
                                      )}
                                      {w.power > 0 && (
                                        <div style={{ textAlign: 'right' }}>
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Potência</span>
                                          <span style={{ fontSize: '0.85rem', color: 'var(--neon-green)', fontWeight: 700 }}>{w.power} W</span>
                                        </div>
                                      )}
                                      <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Sobrecarga</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--neon-orange)', fontWeight: 700 }}>{w.tss} TSS</span>
                                      </div>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '4px 12px', borderRadius: '20px' }}>
                                      Descanso Ativo 💤
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setViewingLibraryPlan(null)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 24px', fontSize: '0.9rem', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleApplyLibraryPlan(viewingLibraryPlan.id)}
                    className="glow-btn"
                    disabled={applyPlanLoading}
                    style={{ padding: '12px 32px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
                  >
                    {applyPlanLoading ? (
                      <>
                        <RefreshCw style={{ animation: 'spin 1.5s linear infinite' }} size={16} />
                        Aplicando Planilha...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Confirmar e Ativar Planilha
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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
                      Assim que você subir seu primeiro treino real no Strava, os detalhes consolidados dele aparecerão aqui.
                    </p>
                  </div>
                </div>
              )}
            </div>


          </div>
        )}

        {/* 3B. CALENDÁRIO DE PROVAS */}
        {activeTab === 'provas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            {/* Header com botão de adicionar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy size={28} style={{ color: 'var(--neon-cyan)' }} />
                  Calendário de Provas
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Planeje sua temporada esportiva. Defina qual é a prova alvo para reestruturar toda a planilha de treinos semanal e orientar o Coach IA.
                </p>
              </div>
              <button 
                onClick={() => handleOpenRaceModal()}
                className="glow-btn"
                style={{ padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} />
                Cadastrar Prova
              </button>
            </div>

            {/* Listagem de Provas */}
            {racesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: 'var(--neon-cyan)' }} size={32} />
              </div>
            ) : races.length === 0 ? (
              <div className="premium-card" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '60px 20px', 
                textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.01)'
              }}>
                <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Nenhuma prova cadastrada</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', marginTop: '6px', marginBottom: '24px' }}>
                  Organize seus objetivos esportivos cadastrando as provas que você pretende participar.
                </p>
                <button 
                  onClick={() => handleOpenRaceModal()}
                  className="glow-btn"
                  style={{ padding: '12px 24px', borderRadius: '12px' }}
                >
                  Adicionar Minha Primeira Prova
                </button>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: '24px' 
              }}>
                {races.map((race) => {
                  const sportConfig = getSportConfig(race.sport_type);
                  return (
                    <div 
                      key={race.id}
                      className="premium-card animate-slide-up"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '20px',
                        border: race.is_target === 1 ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: race.is_target === 1 ? '0 8px 32px rgba(0, 240, 255, 0.12), 0 0 15px rgba(0, 240, 255, 0.05)' : 'none',
                        position: 'relative',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {/* Badge de Prova Alvo */}
                      {race.is_target === 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          fontSize: '0.7rem',
                          background: 'linear-gradient(135deg, var(--neon-cyan) 0%, #0099ff 100%)',
                          color: '#030712',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 850,
                          boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Target size={12} />
                          PROVA ALVO
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Tipo de Esporte e Nome */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            fontSize: '1.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {sportConfig?.emoji || '🏆'}
                          </div>
                          <div style={{ maxWidth: race.is_target === 1 ? 'calc(100% - 130px)' : '100%' }}>
                            <span style={{ fontSize: '0.75rem', color: sportConfig?.color || 'var(--neon-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                              {sportConfig?.name || race.sport_type}
                            </span>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {race.name}
                            </h3>
                          </div>
                        </div>

                        {/* Informações detalhadas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <Clock size={15} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                            <span>{new Date(race.date_time).toLocaleDateString('pt-BR')} às {new Date(race.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <TrendingUp size={15} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                            <span>Distância: <strong>{formatDistance(race.distance)} km</strong></span>
                          </div>

                          {race.organizer && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <Users size={15} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                              <span>Organizador: {race.organizer}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <Compass size={15} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                            <span>Local: {race.city ? `${race.city}, ` : ''}{race.country || 'Brasil'}</span>
                          </div>

                          {race.website && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <ArrowRight size={15} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                              <a 
                                href={race.website} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: 'var(--neon-cyan)', textDecoration: 'none', fontWeight: 600 }}
                                onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                              >
                                Site Oficial
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '14px', alignItems: 'center' }}>
                        {race.is_target === 1 ? (
                          <button
                            disabled
                            style={{ 
                              flex: 1, 
                              padding: '10px 14px', 
                              fontSize: '0.8rem', 
                              cursor: 'default',
                              background: 'rgba(57, 255, 20, 0.08)',
                              border: '1.5px solid var(--neon-green)',
                              color: 'var(--neon-green)',
                              borderRadius: '8px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Target size={14} />
                            Alvo do Treino
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleTargetRace(race)}
                            style={{ 
                              flex: 1, 
                              padding: '10px 14px', 
                              fontSize: '0.8rem', 
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: '#fff',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'var(--transition-smooth)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)'; e.currentTarget.style.borderColor = 'var(--neon-cyan)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                          >
                            <Target size={14} />
                            Tornar Alvo
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenRaceModal(race)}
                          style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--text-secondary)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'var(--transition-smooth)'
                          }}
                          onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                          onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                          <Sliders size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteRace(race.id)}
                          style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--neon-red)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'var(--transition-smooth)'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                              {calibrationResult.currentMetrics.level === 'elite' ? 'Avançado' : calibrationResult.currentMetrics.level === 'intermediario' ? 'Intermediário' : 'Iniciante'}
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
                              {calibrationResult.suggestedMetrics.level === 'elite' ? 'Avançado' : calibrationResult.suggestedMetrics.level === 'intermediario' ? 'Intermediário' : 'Iniciante'}
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
                        <label htmlFor="profile-gender" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sexo / Gênero</label>
                        <select 
                          id="profile-gender"
                          className="glass-input" 
                          value={profileForm.gender} 
                          onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })} 
                          disabled={profileSaving}
                          style={{
                            background: 'rgba(3, 7, 18, 0.6)',
                            color: '#fff',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <option value="" style={{ background: '#0d1527', color: '#fff' }}>Selecione...</option>
                          <option value="Masculino" style={{ background: '#0d1527', color: '#fff' }}>Masculino</option>
                          <option value="Feminino" style={{ background: '#0d1527', color: '#fff' }}>Feminino</option>
                          <option value="Outro" style={{ background: '#0d1527', color: '#fff' }}>Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-2">
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
                      <div>
                        <label htmlFor="profile-height" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Altura (m)</label>
                        <input 
                          id="profile-height"
                          type="number" 
                          step="0.01"
                          className="glass-input" 
                          placeholder="Ex: 1.75"
                          value={profileForm.height} 
                          onChange={e => setProfileForm({ ...profileForm, height: e.target.value })} 
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
                          { value: 'elite', label: 'Avançado', desc: 'Treinos em alta intensidade' }
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

                    {/* Meta Semanal de Horas e FCs */}
                    <div className="form-grid-2">
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label htmlFor="profile-resting-hr" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>FC Repouso (bpm)</label>
                          <input 
                            id="profile-resting-hr"
                            type="number" 
                            className="glass-input" 
                            placeholder="Ex: 50"
                            value={profileForm.resting_hr} 
                            onChange={e => setProfileForm({ ...profileForm, resting_hr: e.target.value })} 
                            disabled={profileSaving}
                          />
                        </div>
                        <div>
                          <label htmlFor="profile-max-hr" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>FC Máxima (bpm)</label>
                          <input 
                            id="profile-max-hr"
                            type="number" 
                            className="glass-input" 
                            placeholder="Ex: 185"
                            value={profileForm.max_hr} 
                            onChange={e => setProfileForm({ ...profileForm, max_hr: e.target.value })} 
                            disabled={profileSaving}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observações e Histórico */}
                    <div>
                      <label htmlFor="profile-observations" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Observações, Lesões ou Restrições Clínicas</label>
                      <textarea 
                        id="profile-observations"
                        className="glass-input" 
                        placeholder="Ex: Histórico de condromalácia patelar leve no joelho esquerdo. Sem outras restrições. Prefiro correr de manhã."
                        value={profileForm.observations} 
                        onChange={e => setProfileForm({ ...profileForm, observations: e.target.value })} 
                        disabled={profileSaving}
                        rows={3}
                        style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
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
                    
                    <div className={profileForm.goal_type !== 'Saude' && profileForm.goal_type !== 'Musculacao' ? "form-grid-2" : ""}>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="goal-type" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tipo de Prova / Objetivo</label>
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
                      {profileForm.goal_type !== 'Saude' && profileForm.goal_type !== 'Musculacao' && (
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
                      )}
                    </div>

                    {profileForm.goal_type !== 'Saude' && profileForm.goal_type !== 'Musculacao' && (
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
                    )}

                    <div>
                      <label htmlFor="goal-tss" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Carga Alvo Semanal (TSS)</label>
                      <input 
                        id="goal-tss"
                        type="number" 
                        className="glass-input" 
                        placeholder="Ex: 650"
                        value={profileForm.goal_weekly_tss_target} 
                        onChange={e => setProfileForm({ ...profileForm, goal_weekly_tss_target: e.target.value })} 
                        required={profileForm.goal_type !== 'Saude' && profileForm.goal_type !== 'Musculacao'} 
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
                      <strong>Google Agenda (Web):</strong> No menu esquerdo, ao lado de <em>{"Outras agendas"}</em>, clique no botão <strong>+</strong> &gt; <strong>{"Do URL"}</strong>, cole o link acima e clique em <em>{"Adicionar agenda"}</em>.
                    </li>
                    <li>
                      <strong>Apple Calendar (Mac/iPhone):</strong> Abra o aplicativo Calendário, vá em <strong>Arquivo</strong> &gt; <strong>Nova Assinatura de Calendário...</strong>, cole o link e clique em OK. No iPhone, vá em Ajustes &gt; Calendário &gt; Contas &gt; Adicionar Conta &gt; Outra &gt; Adicionar Assinatura de Calendário.
                    </li>
                    <li>
                      <strong>Outlook (Web/Desktop):</strong> Clique em <strong>Adicionar Calendário</strong> &gt; <strong>Inscrever-se da Web</strong>, insira o link, dê um nome ao calendário (ex: {"Treinos ULTRA"}) e clique em Salvar.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 5. DICAS DE NUTRIÇÃO */}
        {activeTab === 'nutricao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            {/* Header com Informação de Atualização */}
            <div className="premium-card" style={{ 
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(13, 21, 39, 0.8) 100%)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '45px', 
                    height: '45px', 
                    background: 'rgba(0, 240, 255, 0.15)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(0, 240, 255, 0.3)'
                  }}>
                    <Apple style={{ color: 'var(--neon-cyan)' }} size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)' }}>
                      Guia de Nutrição & Hidratação Esportiva
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                      Estratégias nutricionais periodizadas mensalmente para otimização do rendimento e recuperação metabólica.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--neon-green)', 
                    background: 'rgba(57, 255, 20, 0.1)', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(57, 255, 20, 0.25)', 
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Clock size={12} />
                    Atualizado Mensalmente
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Mês Atual: {(() => {
                      const mNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                      return mNames[new Date().getMonth()];
                    })()} de {new Date().getFullYear()}
                  </span>
                </div>
              </div>

              {/* Seletor de Meses */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Selecione o Mês para Visualizar as Dicas:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m, idx) => {
                    const isSelected = nutritionMonth === idx;
                    const isCurrent = new Date().getMonth() === idx;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNutritionMonth(idx)}
                        style={{
                          background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          color: isSelected ? '#fff' : isCurrent ? 'var(--neon-green)' : 'var(--text-secondary)',
                          fontWeight: isSelected || isCurrent ? 700 : 500,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          position: 'relative'
                        }}
                      >
                        {m}
                        {isCurrent && (
                          <span style={{
                            position: 'absolute',
                            top: '-3px',
                            right: '-3px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--neon-green)',
                            boxShadow: '0 0 6px var(--neon-green)'
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Foco e Diretriz Geral */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div className="premium-card" style={{ 
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(13, 21, 39, 0.5) 100%)',
                padding: '24px'
              }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--neon-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎯</span> Foco de {NUTRITION_DATA[nutritionMonth].monthName}: {NUTRITION_DATA[nutritionMonth].title}
                </h4>
                <p style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600, lineHeight: '1.4', marginBottom: '14px' }}>
                  {NUTRITION_DATA[nutritionMonth].focus}
                </p>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  borderLeft: '3px solid var(--neon-cyan)', 
                  padding: '12px 16px', 
                  borderRadius: '0 8px 8px 0',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)'
                }}>
                  {NUTRITION_DATA[nutritionMonth].generalGuideline}
                </div>
              </div>
            </div>

            {/* Três Momentos do Treino (Pré, Durante, Pós) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* Pré-Treino */}
              <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(13, 21, 39, 0.3)' }}>
                <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neon-orange)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  🍌 Pré-Treino (Abastecimento)
                </h5>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, flex: 1 }}>
                  {NUTRITION_DATA[nutritionMonth].preWorkout}
                </p>
              </div>

              {/* Durante o Treino */}
              <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(13, 21, 39, 0.3)' }}>
                <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  ⚡ Durante o Treino (Manutenção)
                </h5>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, flex: 1 }}>
                  {NUTRITION_DATA[nutritionMonth].duringWorkout}
                </p>
              </div>

              {/* Pós-Treino */}
              <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(13, 21, 39, 0.3)' }}>
                <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  🍗 Pós-Treino (Reconstrução)
                </h5>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, flex: 1 }}>
                  {NUTRITION_DATA[nutritionMonth].postWorkout}
                </p>
              </div>

            </div>

            {/* Dica de Hidratação & Referências */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Card de Hidratação */}
              <div className="premium-card" style={{ 
                background: 'linear-gradient(135deg, rgba(0, 136, 255, 0.06) 0%, rgba(13, 21, 39, 0.4) 100%)',
                borderColor: 'rgba(0, 136, 255, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}>
                <div style={{ fontSize: '1.5rem', marginTop: '2px' }}>💧</div>
                <div>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0088ff', margin: '0 0 4px 0' }}>Foco em Hidratação</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    {NUTRITION_DATA[nutritionMonth].hydrationTip}
                  </p>
                </div>
              </div>

              {/* Referências e Aviso Legal */}
              <div className="premium-card" style={{ 
                background: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Fonte Científica
                  </h5>
                  <a 
                    href={NUTRITION_DATA[nutritionMonth].sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--neon-cyan)', 
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {NUTRITION_DATA[nutritionMonth].source}
                    <ArrowRight size={12} />
                  </a>
                </div>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  <strong>Aviso de Isenção:</strong> As informações apresentadas são baseadas em diretrizes gerais de nutrição esportiva e destinam-se a fins educacionais. As necessidades metabólicas variam para cada indivíduo. Consulte um profissional de nutrição credenciado antes de alterar sua dieta.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 6. SÉRIES DE ALONGAMENTO */}
        {activeTab === 'alongamento' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            {/* Header com Instruções Gerais */}
            <div className="premium-card" style={{ 
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(13, 21, 39, 0.8) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ 
                  width: '45px', 
                  height: '45px', 
                  background: 'rgba(168, 85, 247, 0.15)', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}>
                  <Accessibility style={{ color: 'rgb(168, 85, 247)' }} size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)' }}>
                    Biblioteca de Alongamento & Mobilidade
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                    Séries de alongamentos estruturados para otimização da flexibilidade, redução de tensões e prevenção de lesões esportivas.
                  </p>
                </div>
              </div>

              {/* Seletor de Categoria */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Escolha o Foco do Alongamento:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {STRETCHING_DATA.map((cat) => {
                    const isSelected = stretchingCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setStretchingCategory(cat.id)}
                        style={{
                          background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1.5px solid rgb(168, 85, 247)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        {cat.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Descrição da Categoria Selecionada */}
            {(() => {
              const cat = STRETCHING_DATA.find(c => c.id === stretchingCategory);
              if (!cat) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="premium-card" style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '16px 20px', borderLeft: '3px solid rgb(168, 85, 247)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                      {cat.description}
                    </p>
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Fonte Científica: <a href={cat.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>{cat.source}</a>
                    </div>
                  </div>

                  {/* Grid de Exercícios */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {cat.exercises.map((ex) => (
                      <div 
                        key={ex.id} 
                        className="premium-card" 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '14px', 
                          background: 'rgba(13, 21, 39, 0.2)',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        {/* Título e Músculo Alvo */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '2rem' }}>{ex.imageEmoji || '🧘'}</span>
                          <div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>{ex.name}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                              Músculos Alvo: <strong style={{ color: 'var(--neon-cyan)' }}>{ex.target}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Tempo / Repetições */}
                        <div style={{ 
                          background: 'rgba(168, 85, 247, 0.06)', 
                          border: '1px solid rgba(168, 85, 247, 0.15)', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontSize: '0.8rem', 
                          color: '#fff', 
                          fontWeight: 600,
                          alignSelf: 'flex-start'
                        }}>
                          ⏱️ {ex.duration}
                        </div>

                        {/* Passos */}
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>
                            Como Executar:
                          </span>
                          <ol style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {ex.steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>

                        {/* Dica de Segurança */}
                        <div style={{ 
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                          paddingTop: '12px', 
                          fontSize: '0.75rem', 
                          color: 'var(--neon-orange)', 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '6px' 
                        }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                          <span>
                            <strong>Dica de Segurança:</strong> {ex.safetyTip}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Banner Geral de Segurança */}
            <div className="premium-card" style={{ 
              background: 'rgba(255, 107, 53, 0.04)', 
              borderColor: 'rgba(255, 107, 53, 0.2)', 
              display: 'flex', 
              gap: '16px', 
              alignItems: 'flex-start',
              marginTop: '10px'
            }}>
              <AlertTriangle style={{ color: 'var(--neon-orange)', flexShrink: 0, marginTop: '2px' }} size={20} />
              <div>
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, marginBottom: '4px' }}>
                  Recomendações Gerais de Segurança (Clínica Mayo & Harvard Health)
                </h4>
                <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>Nunca alongue músculos frios:</strong> Faça sempre um aquecimento leve de 5 a 10 minutos (caminhada, trote ou pedalada leve) antes de alongar.</li>
                  <li><strong>Evite saltos ou rebotes (bouncing):</strong> O alongamento estático deve ser mantido de forma suave. Rebotes geram microlesões no tendão e ativam o reflexo de estiramento protetor (encurtando o músculo).</li>
                  <li><strong>Tensão, não dor:</strong> Você deve sentir uma tensão leve a moderada na fibra. Se sentir dor aguda ou fisgada, reduza a amplitude imediatamente.</li>
                  <li><strong>Mantenha respiração regular:</strong> Não prenda a breath (apneia). Inspire profundamente e expire relaxando durante o alongamento.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 7. GRAVAR TREINO COM GPS */}
        {activeTab === 'gravar' && (
          <div className="animate-fade-in">
            <GpsTracker 
              userId={activeUser!} 
              onWorkoutSaved={async () => {
                setActiveTab('planilha');
                if (activeUser) {
                  await fetchDashboard(activeUser);
                }
              }}
              onCancel={() => setActiveTab('planilha')}
            />
          </div>
        )}

      </main>

      {/* FOOTER PWA MOBILE NAV */}
      <footer style={{ background: 'rgba(6, 9, 19, 0.9)', borderTop: '1px solid var(--border-color)', padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div className="footer-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
            <span>© 2026 ULTRA COACH. Todos os direitos reservados.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wifi size={12} style={{ color: 'var(--neon-green)' }} /> Strava API Integrada
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} style={{ color: 'var(--neon-green)' }} /> PWA Instalável
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 auto', maxWidth: '800px', lineHeight: '1.5', fontStyle: 'italic', opacity: 0.85 }}>
            ⚠️ <strong>Aviso importante:</strong> O aplicativo é uma ferramenta de suporte ao treinamento e não substitui o acompanhamento personalizado de um profissional credenciado de educação física.
          </p>
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
                      const analysis = getExecutionAnalysis(selectedWorkout, hasLog);
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
                          
                          {analysis && (
                            <div style={{
                              gridColumn: '1 / -1',
                              marginTop: '12px',
                              padding: '14px',
                              background: `${analysis.color}08`,
                              border: `1px solid ${analysis.color}25`,
                              borderRadius: '10px',
                              boxShadow: `0 0 10px ${analysis.color}05`
                            }}>
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.75rem',
                                color: analysis.color,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '6px'
                              }}>
                                <span>{analysis.status === 'pleno' ? '🎯' : analysis.status === 'superado' ? '⚡' : '⚠️'}</span>
                                Análise do Confronto: {analysis.label} ({analysis.percentage}%)
                              </span>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>
                                {analysis.text}
                              </p>
                            </div>
                          )}

                          {hasLog.sync_source === 'Strava' && (
                            <button
                              onClick={async () => {
                                if (confirm('Deseja realmente desvincular esta atividade do Strava deste treino planejado? O treino voltará ao status Pendente.')) {
                                  await handleManualAssociation(selectedWorkout.id, hasLog.id, true);
                                }
                              }}
                              className="glow-btn"
                              style={{
                                gridColumn: '1 / -1',
                                marginTop: '16px',
                                padding: '10px 16px',
                                fontSize: '0.85rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: 'rgba(255, 59, 48, 0.1)',
                                border: '1px solid rgba(255, 59, 48, 0.3)',
                                color: '#ff3b30',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'var(--transition-smooth)'
                              }}
                              onMouseOver={e => {
                                e.currentTarget.style.background = '#ff3b30';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseOut={e => {
                                e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
                                e.currentTarget.style.color = '#ff3b30';
                              }}
                            >
                              <X size={14} /> Desvincular Atividade Strava
                            </button>
                          )}
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

                        {!isRest && (
                          <div style={{
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                              Vincular com Atividade Strava
                            </h5>
                            
                            {(() => {
                              // Filtrar todas as atividades do dia do treino selecionado e das 48h subsequentes (72h no total)
                              const dayLogs = activityLogs?.filter((l: any) => {
                                if (!l.timestamp) return false;
                                const wDate = new Date(selectedWorkout.date + 'T00:00:00');
                                const actDate = new Date(l.timestamp);
                                const startTime = wDate.getTime();
                                const endTime = startTime + (3 * 24 * 60 * 60 * 1000); // 72 horas em ms (dia planejado + 48h subsequentes)
                                const actTime = actDate.getTime();
                                return actTime >= startTime && actTime < endTime;
                              }) || [];
                              if (dayLogs.length === 0) {
                                return (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Nenhuma atividade do Strava encontrada para este dia ou nas 48h seguintes.
                                  </span>
                                );
                              }
                              return (
                                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                  <select
                                    id="strava-activity-select"
                                    defaultValue=""
                                    style={{
                                      padding: '8px',
                                      borderRadius: '6px',
                                      background: 'rgba(3, 7, 18, 0.8)',
                                      border: '1px solid var(--glass-border)',
                                      color: '#fff',
                                      fontSize: '0.85rem',
                                      width: '100%',
                                      outline: 'none'
                                    }}
                                  >
                                    <option value="" disabled>Selecione uma atividade...</option>
                                    {dayLogs.map((l: any) => {
                                      const formattedDate = (() => {
                                        try {
                                          const d = new Date(l.timestamp);
                                          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                        } catch (e) {
                                          return l.timestamp;
                                        }
                                      })();
                                      
                                      const statusText = l.workout_id 
                                        ? l.workout_id === selectedWorkout.id 
                                          ? ' (Já vinculado a este treino)' 
                                          : ' (Vinculado a outro treino)' 
                                        : '';
                                        
                                      return (
                                        <option key={l.id} value={l.id}>
                                          {getWorkoutIcon(l.type)} {l.type} - {formattedDate} - {formatDistance(l.distance_real)} km ({secondsToTime(l.duration_real)}){statusText}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <button
                                    onClick={async () => {
                                      const selectEl = document.getElementById('strava-activity-select') as HTMLSelectElement;
                                      const val = selectEl?.value;
                                      if (!val) {
                                        alert('Por favor, selecione uma atividade.');
                                        return;
                                      }
                                      await handleManualAssociation(selectedWorkout.id, parseInt(val, 10));
                                    }}
                                    className="glow-btn"
                                    style={{
                                      padding: '8px 12px',
                                      fontSize: '0.8rem',
                                      borderRadius: '6px',
                                      background: 'linear-gradient(135deg, #fc4c02 0%, #e23e00 100%)',
                                      border: 'none',
                                      color: '#fff',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px',
                                      boxShadow: '0 0 10px rgba(252, 76, 2, 0.2)'
                                    }}
                                  >
                                    <LinkIcon size={12} /> Vincular Atividade
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* SEÇÃO DE FEEDBACK DE TREINO */}
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MessageSquare size={16} color="var(--neon-cyan)" />
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: 0 }}>
                  Feedback do Treino
                </h4>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Lista de mensagens */}
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  paddingRight: '4px'
                }}>
                  {feedbacksLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                      <RefreshCw className="animate-spin" size={16} color="var(--neon-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : feedbacks.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center', margin: '20px 0' }}>
                      Nenhum feedback enviado ainda. Envie uma mensagem para alinhar com o seu treinador!
                    </p>
                  ) : (
                    feedbacks.map((f: any) => {
                      const isMe = f.sender_role === 'athlete';
                      return (
                        <div key={f.id} style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          width: '100%'
                        }}>
                          <div style={{
                            background: isMe ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 242, 254, 0.08)',
                            border: isMe ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 242, 254, 0.15)',
                            borderRadius: '12px',
                            borderTopRightRadius: isMe ? '2px' : '12px',
                            borderTopLeftRadius: isMe ? '12px' : '2px',
                            padding: '10px 14px',
                            maxWidth: '80%'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '0.65rem',
                              color: isMe ? '#9ca3af' : 'var(--neon-cyan)',
                              fontWeight: 600,
                              marginBottom: '4px'
                            }}>
                              <span>{isMe ? 'Você (Atleta)' : 'Treinador'}</span>
                              <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>
                                {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#fff', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                              {f.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Form de Envio */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                  <input
                    type="text"
                    value={feedbackInput}
                    onChange={e => setFeedbackInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendFeedback();
                    }}
                    placeholder="Escreva um feedback ou pergunta sobre este treino..."
                    style={{
                      flex: 1,
                      background: '#0d0d12',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      color: '#f3f4f6',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleSendFeedback}
                    disabled={!feedbackInput.trim()}
                    style={{
                      background: feedbackInput.trim() ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: feedbackInput.trim() ? 'pointer' : 'default',
                      color: feedbackInput.trim() ? '#0a0a0f' : '#4b5563',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
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

      {/* MODAL DE CADASTRO/EDIÇÃO DE PROVA */}
      {showRaceModal && (
        <div 
          onClick={() => setShowRaceModal(false)}
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
            padding: '20px'
          }}
          className="animate-fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 240, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
            className="animate-scale-up"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={24} style={{ color: 'var(--neon-cyan)' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)' }}>
                  {raceForm.id ? 'Editar Prova' : 'Cadastrar Nova Prova'}
                </h3>
              </div>
              <button 
                onClick={() => setShowRaceModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = '#fff'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveRace} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label htmlFor="race-name" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nome da Prova</label>
                <input 
                  id="race-name"
                  type="text" 
                  className="glass-input" 
                  placeholder="Ex: Maratona do Rio, Ironman Brasil"
                  value={raceForm.name} 
                  onChange={e => setRaceForm({ ...raceForm, name: e.target.value })} 
                  required 
                  disabled={raceSaving}
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label htmlFor="race-organizer" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Organizador</label>
                  <input 
                    id="race-organizer"
                    type="text" 
                    className="glass-input" 
                    placeholder="Ex: Iguana Sports, Dream Factory"
                    value={raceForm.organizer} 
                    onChange={e => setRaceForm({ ...raceForm, organizer: e.target.value })} 
                    disabled={raceSaving}
                  />
                </div>
                <div>
                  <label htmlFor="race-website" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Site da Prova</label>
                  <input 
                    id="race-website"
                    type="url" 
                    className="glass-input" 
                    placeholder="Ex: https://www.exemplo.com"
                    value={raceForm.website} 
                    onChange={e => setRaceForm({ ...raceForm, website: e.target.value })} 
                    disabled={raceSaving}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label htmlFor="race-date-time" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Data e Horário</label>
                  <input 
                    id="race-date-time"
                    type="datetime-local" 
                    className="glass-input" 
                    value={raceForm.date_time} 
                    onChange={e => setRaceForm({ ...raceForm, date_time: e.target.value })} 
                    required
                    disabled={raceSaving}
                  />
                </div>
                <div>
                  <label htmlFor="race-sport" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Esporte</label>
                  <select 
                    id="race-sport"
                    className="glass-input" 
                    value={raceForm.sport_type} 
                    onChange={e => setRaceForm({ ...raceForm, sport_type: e.target.value })} 
                    disabled={raceSaving}
                    style={{ background: 'rgba(3, 7, 18, 0.8)', color: '#fff', border: '1px solid var(--border-color)' }}
                  >
                    {SPORTS_CONFIG.filter(sport => sport.id !== 'Descanso' && sport.id !== 'Forca').map(sport => (
                      <option key={sport.id} value={sport.id} style={{ background: '#0d1527', color: '#fff' }}>
                        {sport.emoji} {sport.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label htmlFor="race-distance" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Distância (km)</label>
                  <input 
                    id="race-distance"
                    type="number" 
                    step="0.01"
                    className="glass-input" 
                    placeholder="Ex: 21.1 ou 42.2"
                    value={raceForm.distance} 
                    onChange={e => setRaceForm({ ...raceForm, distance: e.target.value })} 
                    required 
                    disabled={raceSaving}
                  />
                </div>
                <div className="form-grid-2">
                  <div>
                    <label htmlFor="race-country" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>País</label>
                    <input 
                      id="race-country"
                      type="text" 
                      className="glass-input" 
                      placeholder="Ex: Brasil"
                      value={raceForm.country} 
                      onChange={e => setRaceForm({ ...raceForm, country: e.target.value })} 
                      disabled={raceSaving}
                    />
                  </div>
                  <div>
                    <label htmlFor="race-city" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Município</label>
                    <input 
                      id="race-city"
                      type="text" 
                      className="glass-input" 
                      placeholder="Ex: São Paulo"
                      value={raceForm.city} 
                      onChange={e => setRaceForm({ ...raceForm, city: e.target.value })} 
                      disabled={raceSaving}
                    />
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                marginTop: '6px'
              }}>
                <input 
                  id="race-target"
                  type="checkbox" 
                  checked={raceForm.is_target}
                  onChange={e => setRaceForm({ ...raceForm, is_target: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--neon-cyan)' }}
                  disabled={raceSaving}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label htmlFor="race-target" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                    Definir como Prova Alvo do Treinamento
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Se marcado, a planilha semanal de treinos e o Coach IA focarão totalmente nesta prova.
                  </span>
                </div>
              </div>

              {raceForm.is_target && (
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '20px',
                    background: 'rgba(0, 240, 255, 0.02)',
                    border: '1px solid rgba(0, 240, 255, 0.15)',
                    borderRadius: '12px',
                    marginTop: '6px'
                  }}
                  className="animate-fade-in"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0, 240, 255, 0.15)', paddingBottom: '8px', marginBottom: '4px' }}>
                    <Sparkles size={16} style={{ color: 'var(--neon-cyan)', flexShrink: 0 }} />
                    <strong style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Disponibilidade do Atleta (Formulário)
                    </strong>
                  </div>

                  {/* Turno da Manhã */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        id="availability-morning"
                        type="checkbox" 
                        checked={raceForm.train_in_morning}
                        onChange={e => setRaceForm({ ...raceForm, train_in_morning: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--neon-cyan)' }}
                        disabled={raceSaving}
                      />
                      <label htmlFor="availability-morning" style={{ fontSize: '0.8rem', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                        Disponível no turno da manhã? 🌅
                      </label>
                    </div>
                    {raceForm.train_in_morning && (
                      <div className="animate-fade-in" style={{ paddingLeft: '26px' }}>
                        <label htmlFor="availability-morning-time" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                          Tempo disponível na manhã (em minutos):
                        </label>
                        <input 
                          id="availability-morning-time"
                          type="number" 
                          step="5"
                          min="15"
                          max="240"
                          className="glass-input" 
                          placeholder="Ex: 60 ou 90"
                          value={raceForm.morning_available_time} 
                          onChange={e => setRaceForm({ ...raceForm, morning_available_time: e.target.value })} 
                          required={raceForm.is_target && raceForm.train_in_morning}
                          disabled={raceSaving}
                          style={{ borderColor: 'rgba(0, 240, 255, 0.2)' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Turno do Almoço */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        id="availability-lunch"
                        type="checkbox" 
                        checked={raceForm.train_at_lunch}
                        onChange={e => setRaceForm({ ...raceForm, train_at_lunch: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--neon-cyan)' }}
                        disabled={raceSaving}
                      />
                      <label htmlFor="availability-lunch" style={{ fontSize: '0.8rem', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                        Disponível no horário de almoço? 🥗
                      </label>
                    </div>
                    {raceForm.train_at_lunch && (
                      <div className="animate-fade-in" style={{ paddingLeft: '26px' }}>
                        <label htmlFor="availability-lunch-time" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                          Tempo disponível no almoço (em minutos):
                        </label>
                        <input 
                          id="availability-lunch-time"
                          type="number" 
                          step="5"
                          min="15"
                          max="240"
                          className="glass-input" 
                          placeholder="Ex: 30 ou 45"
                          value={raceForm.lunch_available_time} 
                          onChange={e => setRaceForm({ ...raceForm, lunch_available_time: e.target.value })} 
                          required={raceForm.is_target && raceForm.train_at_lunch}
                          disabled={raceSaving}
                          style={{ borderColor: 'rgba(0, 240, 255, 0.2)' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Turno do Fim do Dia / Noite */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        id="availability-night"
                        type="checkbox" 
                        checked={raceForm.train_at_night}
                        onChange={e => setRaceForm({ ...raceForm, train_at_night: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--neon-cyan)' }}
                        disabled={raceSaving}
                      />
                      <label htmlFor="availability-night" style={{ fontSize: '0.8rem', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                        Disponível no fim do dia? 🌃
                      </label>
                    </div>
                    {raceForm.train_at_night && (
                      <div className="animate-fade-in" style={{ paddingLeft: '26px' }}>
                        <label htmlFor="availability-night-time" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                          Tempo disponível no fim do dia (em minutos):
                        </label>
                        <input 
                          id="availability-night-time"
                          type="number" 
                          step="5"
                          min="15"
                          max="240"
                          className="glass-input" 
                          placeholder="Ex: 60 ou 90"
                          value={raceForm.night_available_time} 
                          onChange={e => setRaceForm({ ...raceForm, night_available_time: e.target.value })} 
                          required={raceForm.is_target && raceForm.train_at_night}
                          disabled={raceSaving}
                          style={{ borderColor: 'rgba(0, 240, 255, 0.2)' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Resumo do limite de tempo total */}
                  <div 
                    style={{ 
                      padding: '10px 12px', 
                      background: 'rgba(0, 240, 255, 0.04)', 
                      border: '1px solid rgba(0, 240, 255, 0.08)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      lineHeight: '1.4',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      marginTop: '4px'
                    }}
                  >
                    <span>
                      <strong>Tempo total diário disponível:</strong>{' '}
                      {((raceForm.train_in_morning ? (parseInt(raceForm.morning_available_time, 10) || 0) : 0) +
                        (raceForm.train_at_lunch ? (parseInt(raceForm.lunch_available_time, 10) || 0) : 0) +
                        (raceForm.train_at_night ? (parseInt(raceForm.night_available_time, 10) || 0) : 0)) / 60}{' '}
                      horas (
                      {(raceForm.train_in_morning ? (parseInt(raceForm.morning_available_time, 10) || 0) : 0) +
                        (raceForm.train_at_lunch ? (parseInt(raceForm.lunch_available_time, 10) || 0) : 0) +
                        (raceForm.train_at_night ? (parseInt(raceForm.night_available_time, 10) || 0) : 0)}{' '}
                      minutos)
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Ajustaremos o volume semanal, as durações e distribuiremos os treinos em sessões diárias compatíveis com estes limites.
                    </span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="glow-btn"
                style={{ width: '100%', padding: '14px', fontWeight: 700, marginTop: '10px' }}
                disabled={raceSaving}
              >
                {raceSaving ? 'Salvando...' : 'Salvar Prova'}
              </button>
            </form>
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

      {/* MODAL DE CRIAÇÃO DE PLANILHA CUSTOMIZADA */}
      {showCreatePlanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }} className="animate-fade-in">
          <div className="premium-card animate-scale-in" style={{
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            border: '1px solid rgba(57, 255, 20, 0.25)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: 'rgba(57, 255, 20, 0.1)', borderRadius: '8px' }}>
                  <Dumbbell style={{ color: 'var(--neon-green)' }} size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>Montar Minha Própria Planilha</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Crie e salve uma planilha estruturada na sua biblioteca de treinos.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreatePlanModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário Geral */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Nome da Planilha *</label>
                <input
                  type="text"
                  placeholder="Ex: Planilha de Corrida Rumo aos 5k"
                  value={customPlanForm.name}
                  onChange={(e) => setCustomPlanForm({ ...customPlanForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Autor *</label>
                <input
                  type="text"
                  placeholder="Ex: Seu Nome ou Treinador"
                  value={customPlanForm.author}
                  onChange={(e) => setCustomPlanForm({ ...customPlanForm, author: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Esporte principal *</label>
                <select
                  value={customPlanForm.sport}
                  onChange={(e) => setCustomPlanForm({ ...customPlanForm, sport: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                >
                  <option value="Corrida">Corrida</option>
                  <option value="Ciclismo">Ciclismo</option>
                  <option value="Natacao">Natação</option>
                  <option value="Triathlon">Triathlon</option>
                  <option value="Ultramaratona">Ultramaratona</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Nível da Planilha</label>
                <select
                  value={customPlanForm.level}
                  onChange={(e) => setCustomPlanForm({ ...customPlanForm, level: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Duração (Semanas) *</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={customPlanForm.weeks}
                  onChange={(e) => handleBuilderWeeksChange(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Descrição / Detalhes</label>
                <input
                  type="text"
                  placeholder="Descreva o foco desta planilha"
                  value={customPlanForm.description}
                  onChange={(e) => setCustomPlanForm({ ...customPlanForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Navegador de Semanas do Builder */}
            {customPlanForm.weeks > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }} className="hide-scrollbar">
                {Array.from({ length: customPlanForm.weeks }).map((_, idx) => {
                  const wNum = idx + 1;
                  const isSelected = selectedBuilderWeek === wNum;
                  return (
                    <button
                      key={wNum}
                      type="button"
                      onClick={() => setSelectedBuilderWeek(wNum)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: isSelected ? 'var(--neon-green)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid var(--neon-green)' : '1px solid rgba(255,255,255,0.06)',
                        color: isSelected ? '#030712' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Semana {wNum}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Ferramentas de Cópia Rápida */}
            {customPlanForm.weeks > 1 && (
              <div style={{ display: 'flex', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  ⚙️ <strong>Ações Rápidas:</strong> Copiar treinos de S{selectedBuilderWeek} para outra semana:
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(13,21,39,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.78rem' }}
                    defaultValue=""
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val) {
                        handleCopyBuilderWeek(selectedBuilderWeek, val);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">Selecione a semana destino...</option>
                    {Array.from({ length: customPlanForm.weeks })
                      .map((_, i) => i + 1)
                      .filter(w => w !== selectedBuilderWeek)
                      .map(w => (
                        <option key={w} value={w}>Semana {w}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
            )}

            {/* Lista de Treinos da Semana Selecionada no Builder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Treinos da Semana {selectedBuilderWeek}
              </h3>
              
              {customPlanForm.workouts[selectedBuilderWeek - 1]?.map((w: any, dayIdx: number) => {
                const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                
                return (
                  <div key={dayIdx} style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>
                        {dayNames[dayIdx]} (Dia {dayIdx + 1})
                      </span>
                      
                      {/* Tipo do Treino */}
                      <select
                        value={w.type}
                        onChange={(e) => {
                          const updated = [...customPlanForm.workouts];
                          updated[selectedBuilderWeek - 1][dayIdx].type = e.target.value;
                          if (e.target.value === 'Descanso') {
                            updated[selectedBuilderWeek - 1][dayIdx].title = 'Descanso fisiológico';
                            updated[selectedBuilderWeek - 1][dayIdx].desc = 'Dia livre para recuperação ativa e alongamento.';
                            updated[selectedBuilderWeek - 1][dayIdx].dist = 0;
                            updated[selectedBuilderWeek - 1][dayIdx].dur = 0;
                            updated[selectedBuilderWeek - 1][dayIdx].pace = 'N/A';
                            updated[selectedBuilderWeek - 1][dayIdx].power = 0;
                            updated[selectedBuilderWeek - 1][dayIdx].tss = 0;
                          } else if (e.target.value === 'Forca') {
                            updated[selectedBuilderWeek - 1][dayIdx].title = 'Fortalecimento Geral';
                            updated[selectedBuilderWeek - 1][dayIdx].desc = 'Foco em estabilidade de core e mobilidade.';
                            updated[selectedBuilderWeek - 1][dayIdx].dist = 0;
                            updated[selectedBuilderWeek - 1][dayIdx].dur = 1800;
                            updated[selectedBuilderWeek - 1][dayIdx].pace = 'N/A';
                            updated[selectedBuilderWeek - 1][dayIdx].power = 0;
                            updated[selectedBuilderWeek - 1][dayIdx].tss = 15;
                          } else {
                            updated[selectedBuilderWeek - 1][dayIdx].title = '';
                            updated[selectedBuilderWeek - 1][dayIdx].desc = '';
                            updated[selectedBuilderWeek - 1][dayIdx].dist = 10;
                            updated[selectedBuilderWeek - 1][dayIdx].dur = 3600;
                            updated[selectedBuilderWeek - 1][dayIdx].pace = e.target.value === 'Ciclismo' ? '30 km/h' : '5:00/km';
                            updated[selectedBuilderWeek - 1][dayIdx].power = 0;
                            updated[selectedBuilderWeek - 1][dayIdx].tss = 60;
                          }
                          setCustomPlanForm({ ...customPlanForm, workouts: updated });
                        }}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.8)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                      >
                        <option value="Corrida">🏃‍♂️ Corrida</option>
                        <option value="Ciclismo">🚴‍♂️ Ciclismo</option>
                        <option value="Natacao">🏊‍♂️ Natação</option>
                        <option value="Forca">💪 Força</option>
                        <option value="Descanso">🛌 Descanso</option>
                      </select>
                    </div>

                    {w.type !== 'Descanso' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Título do Treino</label>
                          <input
                            type="text"
                            placeholder="Ex: Trote Leve Z2"
                            value={w.title}
                            onChange={(e) => {
                              const updated = [...customPlanForm.workouts];
                              updated[selectedBuilderWeek - 1][dayIdx].title = e.target.value;
                              setCustomPlanForm({ ...customPlanForm, workouts: updated });
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Descrição do Treino</label>
                          <input
                            type="text"
                            placeholder="Ex: Corrida em ritmo confortável conversacional"
                            value={w.desc}
                            onChange={(e) => {
                              const updated = [...customPlanForm.workouts];
                              updated[selectedBuilderWeek - 1][dayIdx].desc = e.target.value;
                              setCustomPlanForm({ ...customPlanForm, workouts: updated });
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Distância (km)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={w.dist}
                            onChange={(e) => {
                              const updated = [...customPlanForm.workouts];
                              updated[selectedBuilderWeek - 1][dayIdx].dist = parseFloat(e.target.value) || 0;
                              setCustomPlanForm({ ...customPlanForm, workouts: updated });
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Duração (minutos)</label>
                          <input
                            type="number"
                            value={Math.round(w.dur / 60)}
                            onChange={(e) => {
                              const updated = [...customPlanForm.workouts];
                              updated[selectedBuilderWeek - 1][dayIdx].dur = (parseInt(e.target.value, 10) || 0) * 60;
                              setCustomPlanForm({ ...customPlanForm, workouts: updated });
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pace Prescrito</label>
                          <input
                            type="text"
                            placeholder="Ex: 5:30/km ou 30 km/h"
                            value={w.pace}
                            onChange={(e) => {
                              const updated = [...customPlanForm.workouts];
                              updated[selectedBuilderWeek - 1][dayIdx].pace = e.target.value;
                              setCustomPlanForm({ ...customPlanForm, workouts: updated });
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Potência (Watts)</label>
                          <input
                            type="number"
                            value={w.power}
                            onChange={(e) => {
                              const updated = [...customPlanForm.workouts];
                              updated[selectedBuilderWeek - 1][dayIdx].power = parseInt(e.target.value, 10) || 0;
                              setCustomPlanForm({ ...customPlanForm, workouts: updated });
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Carga TSS Estimada</label>
                          <input
                            type="number"
                            value={w.tss}
                            onChange={(e) => {
                              const updated = [...customPlanForm.workouts];
                              updated[selectedBuilderWeek - 1][dayIdx].tss = parseInt(e.target.value, 10) || 0;
                              setCustomPlanForm({ ...customPlanForm, workouts: updated });
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 21, 39, 0.6)', color: '#fff', fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        🛌 Dia de descanso configurado. Nenhuma métrica requerida.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rodapé */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowCreatePlanModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCustomPlan}
                disabled={applyPlanLoading}
                className="glow-btn"
                style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}
              >
                {applyPlanLoading ? 'Salvando...' : 'Salvar na Biblioteca'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE EXPLICAÇÃO DE MÉTRICAS FISIOLÓGICAS */}
      {showMetricsModal && (
        <div 
          onClick={() => setShowMetricsModal(false)}
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
          <div 
            onClick={e => e.stopPropagation()}
            className="premium-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '650px',
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
              onClick={() => setShowMetricsModal(false)}
              aria-label="Fechar"
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
              <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Ciência do Esporte
              </span>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '4px', fontFamily: 'var(--font-title)' }}>
                Métricas Fisiológicas de Carga
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Entenda como o ULTRA COACH calcula sua evolução e regula sua planilha semanal.
              </p>
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '20px', overflowX: 'auto' }} className="hide-scrollbar">
              {(['ctl', 'atl', 'tsb', 'zones'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMetricsModalTab(tab)}
                  style={{
                    background: metricsModalTab === tab ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                    border: 'none',
                    borderBottom: metricsModalTab === tab ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                    color: metricsModalTab === tab ? '#fff' : 'var(--text-secondary)',
                    fontWeight: metricsModalTab === tab ? 700 : 500,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderRadius: '6px 6px 0 0',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {tab === 'ctl' && 'CTL (Fitness)'}
                  {tab === 'atl' && 'ATL (Fadiga)'}
                  {tab === 'tsb' && 'TSB (Forma)'}
                  {tab === 'zones' && 'Zonas de TSB'}
                </button>
              ))}
            </div>

            {/* Conteúdo das Abas */}
            <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
              {metricsModalTab === 'ctl' && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', padding: '10px', background: 'rgba(57, 255, 20, 0.08)', borderRadius: '10px', border: '1px solid rgba(57, 255, 20, 0.15)' }}>
                      <TrendingUp style={{ color: 'var(--neon-green)' }} size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>CTL - Chronic Training Load</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neon-green)', fontWeight: 600 }}>Fitness / Condicionamento Crônico</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontWeight: 600, color: 'var(--neon-green)', marginBottom: '8px' }}>
                      💡 O que representa?
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      O <strong>CTL</strong> mede o estresse acumulado no seu organismo no <strong>longo prazo</strong>. É o tamanho da sua base física ou &quot;tamanho do seu motor&quot;.
                      <strong style={{ color: '#fff', display: 'block', marginTop: '6px' }}>
                        📈 Quanto MAIOR for o número, mais preparado e condicionado você estará, permitindo suportar maiores volumes e intensidades de treino com menor risco de lesão.
                      </strong>
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fórmula de Cálculo</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Média exponencial dos valores de <strong>TSS</strong> (Training Stress Score) diários dos últimos <strong>42 dias</strong>.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Alvo do Treinador</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Deve subir de forma gradual (entre 4 e 7 pontos por semana). Aumentos rápidos demais aumentam o risco de lesões.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metricsModalTab === 'atl' && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', padding: '10px', background: 'rgba(255, 107, 53, 0.08)', borderRadius: '10px', border: '1px solid rgba(255, 107, 53, 0.15)' }}>
                      <Heart style={{ color: 'var(--neon-orange)' }} size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>ATL - Acute Training Load</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neon-orange)', fontWeight: 600 }}>Fadiga Acumulada Recente / Carga Aguda</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontWeight: 600, color: 'var(--neon-orange)', marginBottom: '8px' }}>
                      💡 O que representa?
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      O <strong>ATL</strong> mede a sobrecarga colocada sobre o seu corpo nos treinos <strong>recentes</strong>. Representa o nível de cansaço acumulado.
                      <strong style={{ color: '#fff', display: 'block', marginTop: '6px' }}>
                        ⚠️ Um número MAIOR representa maior fadiga imediata. Ter fadiga alta é necessário para evoluir (supercompensação), mas requer monitoramento para evitar lesões.
                      </strong>
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fórmula de Cálculo</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Média exponencial dos valores de <strong>TSS</strong> (Training Stress Score) diários dos últimos <strong>7 dias</strong>.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Alvo do Treinador</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Alternar semanas de fadiga alta (estímulo) com semanas de recuperação (descanso) para permitir a supercompensação.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metricsModalTab === 'tsb' && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', padding: '10px', background: 'rgba(0, 240, 255, 0.08)', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                      <Clock style={{ color: '#fc4c02' }} size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>TSB - Training Stress Balance</h3>
                      <span style={{ fontSize: '0.75rem', color: '#fc4c02', fontWeight: 600 }}>Forma Física / Balanço de Estresse</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontWeight: 600, color: '#fc4c02', marginBottom: '8px' }}>
                      💡 O que representa?
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      O <strong>TSB</strong> representa o seu <strong>equilíbrio fisiológico</strong>. É a diferença matemática entre o seu condicionamento (CTL) e sua fadiga (ATL).
                      <strong style={{ color: '#fff', display: 'block', marginTop: '6px' }}>
                        ⚖️ Ele pode ser POSITIVO ou NEGATIVO. O número reflete se você está apto para competir (positivo) ou acumulando fadiga para gerar adaptação (negativo).
                      </strong>
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fórmula de Cálculo</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
                        TSB = CTL - ATL
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Zona Recomendada</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Fase de desenvolvimento: <strong>-10 a -30</strong>. Provas importantes: <strong>&gt; +10</strong>. Evite valores menores que <strong>-30</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metricsModalTab === 'zones' && (
                <div className="animate-fade-in">
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '12px' }}>Zonas Fisiológicas do TSB</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Dependendo do valor do TSB, o seu organismo se encontra em uma destas faixas científicas de rendimento:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Zona de Polimento */}
                    <div style={{ display: 'flex', gap: '12px', background: 'rgba(0, 240, 255, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                      <span style={{ padding: '4px 8px', background: 'rgba(0, 240, 255, 0.15)', color: 'var(--neon-cyan)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                        &gt; +10
                      </span>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Fase de Polimento / Descanso (Pronto p/ Prova)</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Seu corpo se livrou da fadiga recente mantendo o condicionamento. Você está descansado, ágil e pronto para render o máximo.
                        </p>
                      </div>
                    </div>

                    {/* Zona de Manutenção */}
                    <div style={{ display: 'flex', gap: '12px', background: 'rgba(57, 255, 20, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(57, 255, 20, 0.1)' }}>
                      <span style={{ padding: '4px 8px', background: 'rgba(57, 255, 20, 0.15)', color: 'var(--neon-green)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                        0 a +10
                      </span>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Zona de Manutenção / Transição</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Estado equilibrado. Baixo nível de fadiga, mas sem estímulo forte de evolução. Bom para semanas regenerativas simples.
                        </p>
                      </div>
                    </div>

                    {/* Zona Ótima */}
                    <div style={{ display: 'flex', gap: '12px', background: 'rgba(255, 107, 53, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 107, 53, 0.1)' }}>
                      <span style={{ padding: '4px 8px', background: 'rgba(255, 107, 53, 0.15)', color: 'var(--neon-orange)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                        -10 a -30
                      </span>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Estresse de Desenvolvimento (Evolução Ótima)</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          <strong>A zona doce de treino!</strong> O corpo está sendo estimulado na medida ideal para induzir ganho de condicionamento de forma segura.
                        </p>
                      </div>
                    </div>

                    {/* Zona de Perigo */}
                    <div style={{ display: 'flex', gap: '12px', background: 'rgba(255, 59, 48, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 59, 48, 0.1)' }}>
                      <span style={{ padding: '4px 8px', background: 'rgba(255, 59, 48, 0.15)', color: 'var(--neon-red)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                        &lt; -30
                      </span>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Zona de Sobrecarga (Risco de Lesão / Perigo)</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Fadiga excessiva acumulada. Risco muito alto de lesão muscular, fadiga crônica ou overtraining. Recomenda-se descanso imediato.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <button 
                type="button"
                className="glow-btn"
                onClick={() => setShowMetricsModal(false)}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              >
                Entendido, continuar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
