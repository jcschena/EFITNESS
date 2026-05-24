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
  Check
} from 'lucide-react';
import dynamic from 'next/dynamic';

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
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  
  // Dados do Dashboard carregados do Backend
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  // Estados do Simulador
  const [simType, setSimType] = useState<string>('Corrida');
  const [simScenario, setSimScenario] = useState<string>('normal'); // 'normal', 'overtraining', 'missed'
  const [simDistance, setSimDistance] = useState<string>('14.0');
  const [simDuration, setSimDuration] = useState<string>('3960'); // em segundos (1h06min)
  const [simHr, setSimHr] = useState<string>('162');
  const [simPace, setSimPace] = useState<string>('4:45');
  const [simPower, setSimPower] = useState<string>('0');
  const [simTss, setSimTss] = useState<string>('0');
  const [simStatusMsg, setSimStatusMsg] = useState<string>('');

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

  // Handler de seleção de cenário no simulador
  useEffect(() => {
    if (simType === 'Corrida') {
      if (simScenario === 'normal') {
        setSimDistance('14.0');
        setSimDuration('3960');
        setSimHr('160');
        setSimPace('4:45');
        setSimPower('0');
        setSimTss('85');
      } else if (simScenario === 'overtraining') {
        setSimDistance('16.5');
        setSimDuration('4400');
        setSimHr('176'); // Muito alto (limiar é 172)
        setSimPace('4:25'); // Muito rápido
        setSimPower('0');
        setSimTss('145'); // Prescrito é 85
      } else {
        // Pulado
        setSimDistance('0');
        setSimDuration('0');
        setSimHr('0');
        setSimPace('0:00');
        setSimPower('0');
        setSimTss('0');
      }
    } else if (simType === 'Ciclismo') {
      if (simScenario === 'normal') {
        setSimDistance('40.0');
        setSimDuration('4800');
        setSimHr('135');
        setSimPace('30.0');
        setSimPower('195');
        setSimTss('55');
      } else if (simScenario === 'overtraining') {
        setSimDistance('45.0');
        setSimDuration('5200');
        setSimHr('155');
        setSimPace('33.5');
        setSimPower('255'); // Acima do Sweet Spot
        setSimTss('120');
      } else {
        setSimDistance('0');
        setSimDuration('0');
        setSimHr('0');
        setSimPace('0');
        setSimPower('0');
        setSimTss('0');
      }
    }
  }, [simType, simScenario]);

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

  // Enviar Treino Simulador (Webhook)
  const handleSimulateWebhook = async () => {
    try {
      setSimStatusMsg('Disparando Webhook Strava...');
      const payload = {
        isMock: true,
        userId: activeUser,
        type: simType,
        distance: simDistance,
        duration: simDuration,
        avgHr: simHr !== '0' ? simHr : undefined,
        pace: simPace !== '0:00' ? simPace + '/km' : undefined,
        avgPower: simPower !== '0' ? simPower : undefined,
        tss: simTss !== '0' ? simTss : undefined,
        timestamp: new Date().toISOString()
      };

      const res = await fetch('/api/strava/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSimStatusMsg(`Sucesso! TSS calculado: ${data.calculatedTss}. Atividade associada: ${data.workoutAssociated ? 'Sim' : 'Não'}.`);
        
        // Recarregar os dados do dashboard em 1 segundo
        setTimeout(() => {
          if (activeUser) {
            fetchDashboard(activeUser);
          }
        }, 1200);
      } else {
        setSimStatusMsg('Erro ao disparar webhook.');
      }
    } catch (err) {
      console.error('Erro no simulador Strava:', err);
      setSimStatusMsg('Erro de conexão no simulador.');
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
  const { user, goal, plan, workouts, activityLogs, notifications, metrics, lastSyncedActivity, celebration } = dashboardData || {};

  // Formatar dados do gráfico comparativo planejado vs executado
  // Vamos plotar a carga TSS planejada para cada dia de Segunda (1) a Domingo (7) versus a carga executada
  const tssLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const tssTargetData = [0, 0, 0, 0, 0, 0, 0];
  const tssRealData = [0, 0, 0, 0, 0, 0, 0];

  if (workouts) {
    workouts.forEach((w: any) => {
      const idx = w.day_of_week - 1;
      if (idx >= 0 && idx < 7) {
        tssTargetData[idx] = w.tss_target;
        // Se estiver completo, o TSS realizado é computado.
        // Tentamos achar se tem log na mesma data/treino.
        if (w.status === 'completed') {
          // Achar se tem log de atividade correspondente
          const log = activityLogs?.find((l: any) => l.workout_id === w.id);
          tssRealData[idx] = log ? log.tss_real : w.tss_target; // Fallback para target se não tiver log
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
    switch (type) {
      case 'Corrida': return 'var(--neon-green)';
      case 'Ciclismo': return 'var(--neon-cyan)';
      case 'Natacao': return 'var(--neon-purple)';
      case 'Forca': return 'var(--neon-orange)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* NAVBAR HEADER */}
      <header style={{ background: 'rgba(6, 9, 19, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10, padding: '12px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo */}
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(90deg, #fff 0%, #00f0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, lineHeight: 1 }}>
                  ULTRA
                </h2>
                <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '4px', color: 'var(--neon-cyan)', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1 }}>
                  COACH
                </span>
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap' }}>
                Esforço conjunto, conquista compartilhada!
              </span>
            </div>
          </div>

          {/* Active User Info & Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
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
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {celebration && <ConfettiShower />}

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
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
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
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px', paddingBottom: '2px' }}>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grande Objetivo</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{goal?.type} ({goal?.distance} km)</strong>
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
                </div>

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>Nota Fisiológica:</strong>
                  Sua carga semanal total está distribuída de forma {user?.level === 'elite' ? 'polarizada (80/20) para otimizar as mitocôndrias rápidas' : 'linear suave para evitar estresse articular precoce'}. A auto-regulação está configurada com base no seu limiar de {user?.threshold_pace}/km.
                </div>
              </div>

            </div>

            {/* Lista da Planilha Semanal */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Planilha Semanal
                <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>({plan?.name})</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {workouts && workouts.map((w: any) => {
                  const hasLog = activityLogs?.find((l: any) => l.workout_id === w.id);
                  const isRest = w.type === 'Descanso';
                  const isCompleted = w.status === 'completed';
                  const isAdjusted = w.status === 'adjusted';

                  return (
                    <div 
                      key={w.id} 
                      className="premium-card" 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '80px 1.5fr 2fr 1.2fr', 
                        alignItems: 'center', 
                        gap: '16px',
                        padding: '16px 20px',
                        borderColor: isCompleted 
                          ? 'rgba(57, 255, 20, 0.15)' 
                          : isAdjusted 
                            ? 'rgba(255, 107, 53, 0.2)' 
                            : 'var(--glass-border)',
                        background: isRest 
                          ? 'rgba(255,255,255,0.01)' 
                          : isCompleted 
                            ? 'rgba(57, 255, 20, 0.02)' 
                            : 'var(--glass-bg)'
                      }}
                    >
                      {/* Dia e Tipo */}
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'block' }}>
                          {tssLabels[w.day_of_week - 1]}
                        </span>
                        <strong style={{ fontSize: '1rem', color: getWorkoutColor(w.type) }}>
                          {w.type}
                        </strong>
                      </div>

                      {/* Nome do Treino e Descrição */}
                      <div>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Prescrito</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {w.distance_target > 0 ? w.distance_target + ' km' : ''}
                            {w.duration_target > 0 ? ` (${Math.round(w.duration_target/60)} min)` : ''}
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
                              {hasLog.distance_real} km ({Math.round(hasLog.duration_real/60)} min)
                            </span>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              @ {hasLog.pace_real} {hasLog.avg_power > 0 ? `| ${hasLog.avg_power}W` : ''}
                            </span>
                          </div>
                        ) : isCompleted ? (
                          <div>
                            <span style={{ color: 'var(--neon-green)', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>Manual ✔</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {w.distance_target} km
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Pendente</span>
                            <span style={{ color: 'var(--text-muted)' }}>--</span>
                          </div>
                        )}
                      </div>

                      {/* TSS Badge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
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
                            ) : isRest ? null : (
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
                        {lastSyncedActivity.distance_real} km
                      </strong>
                    </div>

                    {/* Duração */}
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Tempo Decorrido</span>
                      <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '4px' }}>
                        {(() => {
                          const secs = lastSyncedActivity.duration_real;
                          const hrs = Math.floor(secs / 3600);
                          const mins = Math.floor((secs % 3600) / 60);
                          const remainingSecs = secs % 60;
                          return hrs > 0 
                            ? `${hrs}h ${mins}m ${remainingSecs}s` 
                            : `${mins}m ${remainingSecs}s`;
                        })()}
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

            {/* Simulador colapsável */}
            <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              <button 
                onClick={() => setShowSimulator(!showSimulator)}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: 'none', 
                  padding: '16px 20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} style={{ color: 'var(--neon-orange)' }} />
                  Ferramentas do Desenvolvedor (Simulador Webhook Strava)
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {showSimulator ? 'Recolher [-]' : 'Expandir [+]'}
                </span>
              </button>

              {showSimulator && (
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    Esta ferramenta simula a chamada da API Webhook do Strava enviando os dados em push. Altere as variáveis fisiológicas abaixo para testar a auto-regulação adaptativa do coach.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    
                    {/* Form de Variáveis */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* Tipo de atividade */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Modalidade</label>
                          <select 
                            className="glass-input" 
                            style={{ background: '#0d1527', color: '#fff' }}
                            value={simType} 
                            onChange={e => setSimType(e.target.value)}
                          >
                            <option value="Corrida">Corrida de Rua</option>
                            <option value="Ciclismo">Ciclismo</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Cenário Fisiológico</label>
                          <select 
                            className="glass-input" 
                            style={{ background: '#0d1527', color: '#fff' }}
                            value={simScenario} 
                            onChange={e => setSimScenario(e.target.value)}
                          >
                            <option value="normal">Normal (Dentro da Prescrição)</option>
                            <option value="overtraining">Sobrecarga (Overtraining Risco)</option>
                            <option value="missed">Sessão Pulada / Zero Carga</option>
                          </select>
                        </div>
                      </div>

                      {/* Métricas específicas */}
                      {simScenario !== 'missed' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Distância Realizada (km)</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                className="glass-input" 
                                value={simDistance}
                                onChange={e => setSimDistance(e.target.value)}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Duração Real (segundos)</label>
                              <input 
                                type="number" 
                                className="glass-input" 
                                value={simDuration}
                                onChange={e => setSimDuration(e.target.value)}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Frequência Cardíaca Média (bpm)</label>
                              <input 
                                type="number" 
                                className="glass-input" 
                                value={simHr}
                                onChange={e => setSimHr(e.target.value)}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                {simType === 'Corrida' ? 'Ritmo Médio (Pace MM:SS)' : 'Potência Média (Watts)'}
                              </label>
                              {simType === 'Corrida' ? (
                                <input 
                                  type="text" 
                                  className="glass-input" 
                                  value={simPace}
                                  onChange={e => setSimPace(e.target.value)}
                                />
                              ) : (
                                <input 
                                  type="number" 
                                  className="glass-input" 
                                  value={simPower}
                                  onChange={e => setSimPower(e.target.value)}
                                />
                              )}
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              TSS Estimado da Atividade (Se 0, a IA calculará com base nos Limiares)
                            </label>
                            <input 
                              type="number" 
                              className="glass-input" 
                              value={simTss}
                              onChange={e => setSimTss(e.target.value)}
                            />
                          </div>
                        </>
                      )}

                      <button 
                        type="button" 
                        className="glow-btn-lime" 
                        style={{ marginTop: '10px' }}
                        onClick={handleSimulateWebhook}
                      >
                        Disparar Webhook Strava push
                      </button>
                    </div>

                    {/* Explicação da Auto-Regulação Fisiológica */}
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--neon-lime)' }}>Como testar:</h4>
                      <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '16px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li>Escolha a modalidade e o cenário fisiológico (ex: Sobrecarga).</li>
                        <li>Clique em <strong>Disparar Webhook Strava push</strong>.</li>
                        <li>Verifique o sucesso e veja as métricas atualizarem na aba atual e na planilha semanal de treinos!</li>
                      </ol>

                      {simStatusMsg && (
                        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', fontSize: '0.85rem', color: '#fc4c02', fontFamily: 'monospace', textAlign: 'center' }}>
                          {simStatusMsg}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER PWA MOBILE NAV */}
      <footer style={{ background: 'rgba(6, 9, 19, 0.9)', borderTop: '1px solid var(--border-color)', padding: '16px 20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
    </div>
  );
}
