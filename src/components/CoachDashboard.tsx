import React, { useState, useEffect } from 'react';
import { 
  Users, Key, LogOut, Search, Activity, AlertTriangle, 
  TrendingUp, Calendar, Edit3, Save, X, Plus, Check, RefreshCw,
  BookOpen, Download, MessageSquare, Send
} from 'lucide-react';

interface Athlete {
  id: number;
  name: string;
  level: string;
  weight: number;
  thresholdHr: number;
  thresholdPace: string;
  stravaConnected: boolean;
  metrics: {
    ctl: number;
    atl: number;
    tsb: number;
  };
  weeklyProgress: {
    planName: string;
    targetTss: number;
    realTss: number;
    nextWorkout: string;
  };
}

interface AccessKey {
  id: number;
  key_code: string;
  coach_id: number;
  max_athletes: number;
  active: number;
}

interface CoachDashboardProps {
  userId: string;
  userName: string;
  onLogout: () => void;
}

export default function CoachDashboard({ userId, userName, onLogout }: CoachDashboardProps) {
  const [activeTab, setActiveTab] = useState<'athletes' | 'keys' | 'library'>('athletes');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Criação de Chave
  const [newKey, setNewKey] = useState('');
  const [newKeyLimit, setNewKeyLimit] = useState(10);
  const [keySubmitLoading, setKeySubmitLoading] = useState(false);

  // Estados para Edição de Planilha do Aluno
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');

  // Estados para a Biblioteca de Planilhas
  const [libraryPlans, setLibraryPlans] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Estados para aplicação de planilha periodizada
  const [applyingPlan, setApplyingPlan] = useState<any | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [effortPct, setApplyEffortPct] = useState<number>(100);
  const [applyPlanLoading, setApplyPlanLoading] = useState(false);

  const fetchLibraryPlans = async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch('/api/library');
      const data = await res.json();
      if (data.success) {
        setLibraryPlans(data.plans || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleApplyLibraryPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId || !applyingPlan || applyPlanLoading) return;

    setApplyPlanLoading(true);
    try {
      const clientDateStr = new Date().toLocaleDateString('en-CA');
      const res = await fetch('/api/library/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(selectedAthleteId, 10),
          libraryId: applyingPlan.id,
          effortPct: effortPct,
          cutChoice: 'none',
          clientDate: clientDateStr
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Planilha periodizada aplicada com sucesso ao aluno!');
        setApplyingPlan(null);
        setSelectedAthleteId('');
        fetchCoachData(); // Atualizar dados
      } else {
        alert(data.error || 'Erro ao aplicar planilha');
      }
    } catch (err) {
      alert('Erro de conexão ao aplicar planilha');
    } finally {
      setApplyPlanLoading(false);
    }
  };

  const handleImportPlan = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          url: importUrl,
          userId: parseInt(userId, 10)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Planilha importada com sucesso para a biblioteca!');
        setImportUrl('');
        fetchLibraryPlans();
      } else {
        alert(data.error || 'Erro ao importar planilha');
      }
    } catch (err) {
      alert('Erro de rede ao importar planilha');
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    fetchCoachData();
  }, [userId]);

  // Carregar feedbacks do treino selecionado
  useEffect(() => {
    if (editingWorkout?.workoutId) {
      setFeedbacksLoading(true);
      fetch(`/api/workouts/feedback?workoutId=${editingWorkout.workoutId}`)
        .then(res => res.json())
        .then(data => {
          setFeedbacks(data.feedbacks || []);
        })
        .catch(err => console.error('Erro ao carregar feedbacks:', err))
        .finally(() => setFeedbacksLoading(false));
    } else {
      setFeedbacks([]);
    }
  }, [editingWorkout]);

  // Enviar novo feedback do treino
  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !editingWorkout?.workoutId) return;
    try {
      const res = await fetch('/api/workouts/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: editingWorkout.workoutId,
          senderRole: 'coach',
          message: feedbackInput.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(prev => [...prev, {
          id: Date.now(),
          workout_id: editingWorkout.workoutId,
          sender_role: 'coach',
          message: feedbackInput.trim(),
          timestamp: data.timestamp || new Date().toISOString()
        }]);
        setFeedbackInput('');
      }
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
    }
  };


  const fetchCoachData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coach/athletes?coachId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setAthletes(data.athletes || []);
        setAccessKeys(data.accessKeys || []);
      } else {
        setError(data.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro de rede ao buscar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;
    setKeySubmitLoading(true);
    try {
      const res = await fetch('/api/coach/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: userId,
          keyCode: newKey,
          maxAthletes: newKeyLimit
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewKey('');
        fetchCoachData();
      } else {
        alert(data.error || 'Erro ao criar chave');
      }
    } catch (err) {
      alert('Erro de conexão ao criar chave');
    } finally {
      setKeySubmitLoading(false);
    }
  };

  const handleSelectAthlete = async (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setWorkoutsLoading(true);
    try {
      const res = await fetch(`/api/coach/workouts?athleteId=${athlete.id}`);
      const data = await res.json();
      if (data.success) {
        setWorkouts(data.workouts || []);
      } else {
        alert(data.error || 'Erro ao buscar planilha');
      }
    } catch (err) {
      alert('Erro de conexão ao buscar treinos');
    } finally {
      setWorkoutsLoading(false);
    }
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkout) return;
    setSaveLoading(true);
    try {
      const res = await fetch('/api/coach/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingWorkout)
      });
      const data = await res.json();
      if (data.success) {
        // Atualizar lista local de treinos
        setWorkouts(workouts.map(w => w.id === editingWorkout.workoutId ? { ...w, ...editingWorkout, status: 'adjusted' } : w));
        setEditingWorkout(null);
        // Recarregar estatísticas em background
        fetchCoachData();
      } else {
        alert(data.error || 'Erro ao salvar treino');
      }
    } catch (err) {
      alert('Erro de rede ao salvar treino');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overtrainingCount = athletes.filter(a => a.metrics.tsb < -20).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d12', color: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{
        background: 'rgba(20, 20, 28, 0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)'
          }}>
            <Activity color="#0a0a0f" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
              ULTRA <span style={{ color: '#00f2fe' }}>COACH</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Painel Administrativo da Assessoria</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Treinador: <strong style={{ color: '#f3f4f6' }}>{userName}</strong></span>
          <button 
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ef4444',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* CARDS DE VISÃO GERAL */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          
          <div style={{
            background: 'rgba(20, 20, 28, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ background: 'rgba(79, 172, 254, 0.1)', color: '#4facfe', borderRadius: '12px', padding: '12px' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>Alunos Ativos</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.75rem', fontWeight: 800 }}>{athletes.length}</h3>
            </div>
          </div>

          <div style={{
            background: 'rgba(20, 20, 28, 0.5)',
            border: overtrainingCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.06)',
            boxShadow: overtrainingCount > 0 ? '0 0 15px rgba(239, 68, 68, 0.15)' : 'none',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.3s'
          }}>
            <div style={{ 
              background: overtrainingCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)', 
              color: overtrainingCount > 0 ? '#ef4444' : '#9ca3af', 
              borderRadius: '12px', 
              padding: '12px' 
            }}>
              <AlertTriangle size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>Risco de Overtraining</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.75rem', fontWeight: 800, color: overtrainingCount > 0 ? '#ef4444' : '#f3f4f6' }}>
                {overtrainingCount}
              </h3>
            </div>
          </div>

          <div style={{
            background: 'rgba(20, 20, 28, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '12px', padding: '12px' }}>
              <Key size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>Chaves de Acesso</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.75rem', fontWeight: 800 }}>{accessKeys.length}</h3>
            </div>
          </div>

        </section>

        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px', gap: '24px' }}>
          <button 
            onClick={() => setActiveTab('athletes')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'athletes' ? '2px solid #00f2fe' : '2px solid transparent',
              color: activeTab === 'athletes' ? '#00f2fe' : '#9ca3af',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '12px 6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={18} />
            Gerenciar Alunos
          </button>
          <button 
            onClick={() => setActiveTab('keys')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'keys' ? '2px solid #00f2fe' : '2px solid transparent',
              color: activeTab === 'keys' ? '#00f2fe' : '#9ca3af',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '12px 6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Key size={18} />
            Chaves de Acesso (Cupons)
          </button>
          <button 
            onClick={() => { setActiveTab('library'); fetchLibraryPlans(); }}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'library' ? '2px solid #00f2fe' : '2px solid transparent',
              color: activeTab === 'library' ? '#00f2fe' : '#9ca3af',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '12px 6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BookOpen size={18} />
            Biblioteca de Planilhas
          </button>
        </div>

        {/* LOADING & ERROR */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <RefreshCw className="animate-spin" size={32} color="#00f2fe" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '16px', color: '#ef4444', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* CONTEÚDO DAS ABAS */}
        {!loading && !error && (
          <div>
            
            {/* ABA: ALUNOS */}
            {activeTab === 'athletes' && (
              <div>
                
                {/* BARRA DE PESQUISA */}
                <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar aluno pelo nome..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(20, 20, 28, 0.5)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '12px 16px 12px 42px',
                      color: '#f3f4f6',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* TABELA DE ALUNOS */}
                <div style={{ overflowX: 'auto', background: 'rgba(20, 20, 28, 0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                        <th style={{ padding: '16px' }}>Aluno</th>
                        <th style={{ padding: '16px' }}>Nível</th>
                        <th style={{ padding: '16px' }}>CTL (Fitness)</th>
                        <th style={{ padding: '16px' }}>ATL (Fadiga)</th>
                        <th style={{ padding: '16px' }}>TSB (Forma)</th>
                        <th style={{ padding: '16px' }}>TSS Semanal Target/Real</th>
                        <th style={{ padding: '16px' }}>Sinc. Strava</th>
                        <th style={{ padding: '16px', textAlign: 'center' }}>Planilha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAthletes.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Nenhum aluno cadastrado ou encontrado.</td>
                        </tr>
                      ) : (
                        filteredAthletes.map(athlete => {
                          const isOvertraining = athlete.metrics.tsb < -20;
                          return (
                            <tr key={athlete.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.9rem', transition: 'all 0.2s' }}>
                              <td style={{ padding: '16px' }}>
                                <div style={{ fontWeight: 700 }}>{athlete.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>Peso: {athlete.weight} kg | Limiar: {athlete.thresholdHr} bpm</div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{
                                  fontSize: '0.75rem',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: athlete.level === 'elite' ? 'rgba(59, 130, 246, 0.15)' : athlete.level === 'sedentario' ? 'rgba(156, 163, 175, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: athlete.level === 'elite' ? '#3b82f6' : athlete.level === 'sedentario' ? '#9ca3af' : '#10b981',
                                  fontWeight: 600
                                }}>
                                  {athlete.level === 'elite' ? 'Elite' : athlete.level === 'sedentario' ? 'Iniciante' : 'Intermediário'}
                                </span>
                              </td>
                              <td style={{ padding: '16px', color: '#38bdf8', fontWeight: 600 }}>{athlete.metrics.ctl}</td>
                              <td style={{ padding: '16px', color: '#fb923c', fontWeight: 600 }}>{athlete.metrics.atl}</td>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ 
                                    color: athlete.metrics.tsb > 5 ? '#34d399' : athlete.metrics.tsb < -10 ? '#ef4444' : '#9ca3af',
                                    fontWeight: 700 
                                  }}>
                                    {athlete.metrics.tsb}
                                  </span>
                                  {isOvertraining && (
                                    <span style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      color: '#ef4444',
                                      fontSize: '0.7rem',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      animation: 'pulse 1.5s infinite'
                                    }}>
                                      <AlertTriangle size={10} />
                                      OVERTRAINING
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#9ca3af' }}>
                                  <span>TSS Real: <strong>{athlete.weeklyProgress.realTss}</strong></span>
                                  <span>Meta: {athlete.weeklyProgress.targetTss}</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                                    width: `${Math.min(100, athlete.weeklyProgress.targetTss > 0 ? (athlete.weeklyProgress.realTss / athlete.weeklyProgress.targetTss) * 100 : 0)}%`,
                                    borderRadius: '3px'
                                  }} />
                                </div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.8rem',
                                  color: athlete.stravaConnected ? '#fc4c02' : '#9ca3af',
                                  fontWeight: 600
                                }}>
                                  {athlete.stravaConnected ? 'Sincronizado' : 'Offline'}
                                </span>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <button 
                                  onClick={() => handleSelectAthlete(athlete)}
                                  style={{
                                    background: 'rgba(0, 242, 254, 0.1)',
                                    border: '1px solid rgba(0, 242, 254, 0.2)',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    color: '#00f2fe',
                                    fontSize: '0.85rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)'}
                                >
                                  <Edit3 size={14} />
                                  Prescrever / Editar
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* ABA: CHAVES DE ACESSO */}
            {activeTab === 'keys' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '30px', alignItems: 'start' }}>
                
                {/* LISTAGEM DE CHAVES */}
                <div style={{ background: 'rgba(20, 20, 28, 0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                        <th style={{ padding: '16px' }}>Código da Chave</th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px' }}>Limite de Alunos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessKeys.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Você não tem chaves de acesso criadas.</td>
                        </tr>
                      ) : (
                        accessKeys.map(key => (
                          <tr key={key.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: '#00f2fe' }}>
                              {key.key_code}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: key.active === 1 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: key.active === 1 ? '#34d399' : '#ef4444',
                                fontWeight: 600
                              }}>
                                {key.active === 1 ? 'Ativo' : 'Expirado'}
                              </span>
                            </td>
                            <td style={{ padding: '16px', fontWeight: 600 }}>{key.max_athletes} alunos</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* FORMULÁRIO DE GERAÇÃO DE CHAVE */}
                <div style={{ background: 'rgba(20, 20, 28, 0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>Gerar Novo Cupom</h4>
                  <form onSubmit={handleCreateKey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>CÓDIGO DO CUPOM</label>
                      <input 
                        type="text" 
                        placeholder="Ex: RIO2026"
                        value={newKey}
                        onChange={e => setNewKey(e.target.value.toUpperCase())}
                        required
                        style={{
                          width: '100%',
                          background: '#0d0d12',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: '#f3f4f6',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>LIMITE DE ALUNOS</label>
                      <input 
                        type="number" 
                        value={newKeyLimit}
                        onChange={e => setNewKeyLimit(parseInt(e.target.value, 10))}
                        min={1}
                        max={100}
                        required
                        style={{
                          width: '100%',
                          background: '#0d0d12',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: '#f3f4f6',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={keySubmitLoading}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#0a0a0f',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 15px rgba(0, 242, 254, 0.25)'
                      }}
                    >
                      {keySubmitLoading ? 'Criando...' : (
                        <>
                          <Plus size={16} />
                          Criar Chave
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* ABA: BIBLIOTECA DE PLANILHAS */}
            {activeTab === 'library' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', alignItems: 'start' }}>
                
                {/* LISTAGEM DE MODELOS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {libraryLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                      <RefreshCw className="animate-spin" size={24} color="#00f2fe" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : libraryPlans.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Nenhuma planilha na biblioteca.</p>
                  ) : (
                    libraryPlans.map(plan => (
                      <div key={plan.id} style={{
                        background: 'rgba(25, 25, 35, 0.4)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#00f2fe' }}>{plan.name}</h4>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#9ca3af' }}>{plan.description}</p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#9ca3af' }}>
                            <span>Esporte: <strong style={{ color: '#fff' }}>{plan.sport}</strong></span>
                            <span>Duração: <strong style={{ color: '#fff' }}>{plan.weeks} semanas</strong></span>
                            <span>Nível: <strong style={{ color: '#fff' }}>{plan.level}</strong></span>
                          </div>
                        </div>
                        <button
                          onClick={() => setApplyingPlan(plan)}
                          style={{
                            background: 'rgba(0, 242, 254, 0.1)',
                            border: '1px solid rgba(0, 242, 254, 0.2)',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            color: '#00f2fe',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                          }}
                        >
                          <Plus size={14} />
                          Aplicar ao Aluno
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* PAINEL DE IMPORTAÇÃO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'rgba(20, 20, 28, 0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Download size={16} />
                      Importar Planilha
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                      Cole uma URL pública de planilha do Google Sheets ou arquivo CSV/JSON estruturado.
                    </p>
                    <input 
                      type="text" 
                      placeholder="Cole o link da planilha..."
                      value={importUrl}
                      onChange={e => setImportUrl(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0d0d12',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#f3f4f6',
                        fontSize: '0.85rem',
                        outline: 'none',
                        marginBottom: '12px'
                      }}
                    />
                    <button
                      onClick={handleImportPlan}
                      disabled={isImporting}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '10px',
                        color: '#f3f4f6',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isImporting ? 'Importando...' : 'Confirmar Link'}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* MODAL / SEÇÃO DE EDIÇÃO DE PLANILHA DO ALUNO */}
      {selectedAthlete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(20, 20, 28, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            {/* Header Modal */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Planilha de Treinos</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>Atleta: <strong style={{ color: '#00f2fe' }}>{selectedAthlete.name}</strong></p>
              </div>
              <button 
                onClick={() => { setSelectedAthlete(null); setEditingWorkout(null); }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Corpo Modal */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {workoutsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <RefreshCw className="animate-spin" size={24} color="#00f2fe" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: editingWorkout ? '1fr 320px' : '1fr', gap: '24px', alignItems: 'start' }}>
                  
                  {/* Lista de Treinos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {workouts.length === 0 ? (
                      <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Nenhum treino na planilha desta semana.</p>
                    ) : (
                      workouts.map(w => (
                        <div key={w.id} style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
                              Dia {w.day_of_week} ({w.date})
                            </span>
                            <h4 style={{ margin: '4px 0 6px 0', fontSize: '0.95rem', fontWeight: 700 }}>
                              {w.title}
                            </h4>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#9ca3af' }}>
                              <span>Tipo: <strong style={{ color: '#f3f4f6' }}>{w.type}</strong></span>
                              {w.distance_target > 0 && <span>Distância: <strong style={{ color: '#f3f4f6' }}>{w.distance_target}km</strong></span>}
                              {w.tss_target > 0 && <span>Carga: <strong style={{ color: '#00f2fe' }}>{w.tss_target} TSS</strong></span>}
                            </div>
                            {w.description && <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '8px 0 0 0', fontStyle: 'italic' }}>{w.description}</p>}
                          </div>
                          
                          <button
                            onClick={() => setEditingWorkout({
                              workoutId: w.id,
                              title: w.title,
                              type: w.type,
                              distance_target: w.distance_target,
                              duration_target: w.duration_target,
                              pace_target: w.pace_target,
                              power_target: w.power_target,
                              tss_target: w.tss_target,
                              description: w.description || '',
                              status: w.status
                            })}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              color: '#f3f4f6',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Edit3 size={14} />
                            Prescrever
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Painel Lateral de Edição/Prescrição */}
                  {editingWorkout && (
                    <div style={{
                      background: 'rgba(20, 20, 28, 0.8)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      padding: '16px',
                      position: 'sticky',
                      top: '0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#00f2fe' }}>Editar Treino</h4>
                        <button 
                          onClick={() => setEditingWorkout(null)} 
                          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>TÍTULO</label>
                          <input 
                            type="text" 
                            value={editingWorkout.title}
                            onChange={e => setEditingWorkout({ ...editingWorkout, title: e.target.value })}
                            required
                            style={{ width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#f3f4f6', fontSize: '0.85rem' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>ESPORTE</label>
                            <select 
                              value={editingWorkout.type}
                              onChange={e => setEditingWorkout({ ...editingWorkout, type: e.target.value })}
                              style={{ width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#f3f4f6', fontSize: '0.85rem' }}
                            >
                              <option value="Corrida">Corrida</option>
                              <option value="Ciclismo">Ciclismo</option>
                              <option value="Natacao">Natação</option>
                              <option value="Descanso">Descanso</option>
                              <option value="Forca">Força</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>TSS (CARGA)</label>
                            <input 
                              type="number" 
                              value={editingWorkout.tss_target}
                              onChange={e => setEditingWorkout({ ...editingWorkout, tss_target: parseInt(e.target.value, 10) })}
                              required
                              style={{ width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#f3f4f6', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>DISTÂNCIA (KM)</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={editingWorkout.distance_target}
                              onChange={e => setEditingWorkout({ ...editingWorkout, distance_target: parseFloat(e.target.value) })}
                              required
                              style={{ width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#f3f4f6', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>PACE ALVO</label>
                            <input 
                              type="text" 
                              value={editingWorkout.pace_target}
                              onChange={e => setEditingWorkout({ ...editingWorkout, pace_target: e.target.value })}
                              style={{ width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#f3f4f6', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>DESCRIÇÃO / OBSERVAÇÕES</label>
                          <textarea 
                            value={editingWorkout.description}
                            onChange={e => setEditingWorkout({ ...editingWorkout, description: e.target.value })}
                            rows={3}
                            style={{ width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#f3f4f6', fontSize: '0.85rem', resize: 'vertical' }}
                          />
                        </div>

                        <button 
                          type="submit" 
                          disabled={saveLoading}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px',
                            color: '#0a0a0f',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            marginTop: '8px'
                          }}
                        >
                          {saveLoading ? 'Salvando...' : (
                            <>
                              <Save size={14} />
                              Salvar Treino
                            </>
                          )}
                        </button>
                      </form>

                      {/* SEÇÃO DE FEEDBACK DE TREINO */}
                      <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          <MessageSquare size={14} color="#00f2fe" />
                          <h5 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Feedback / Mensagens
                          </h5>
                        </div>

                        <div style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {/* Histórico */}
                          <div style={{
                            maxHeight: '160px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            paddingRight: '2px'
                          }}>
                            {feedbacksLoading ? (
                              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                                <RefreshCw className="animate-spin" size={14} color="#00f2fe" style={{ animation: 'spin 1s linear infinite' }} />
                              </div>
                            ) : feedbacks.length === 0 ? (
                              <p style={{ color: '#6b7280', fontSize: '0.75rem', textAlign: 'center', margin: '10px 0' }}>
                                Nenhum feedback enviado ainda.
                              </p>
                            ) : (
                              feedbacks.map((f: any) => {
                                const isMe = f.sender_role === 'coach';
                                return (
                                  <div key={f.id} style={{
                                    display: 'flex',
                                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                                    width: '100%'
                                  }}>
                                    <div style={{
                                      background: isMe ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                                      border: isMe ? '1px solid rgba(0, 242, 254, 0.15)' : '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '8px',
                                      padding: '8px 10px',
                                      maxWidth: '85%'
                                    }}>
                                      <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.6rem',
                                        color: isMe ? '#00f2fe' : '#9ca3af',
                                        fontWeight: 600,
                                        marginBottom: '2px'
                                      }}>
                                        <span>{isMe ? 'Você (Coach)' : 'Aluno'}</span>
                                        <span style={{ color: '#4b5563', fontSize: '0.55rem' }}>
                                          {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#e5e7eb', lineHeight: '1.3', whiteSpace: 'pre-wrap' }}>
                                        {f.message}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Enviar */}
                          <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '8px' }}>
                            <input
                              type="text"
                              value={feedbackInput}
                              onChange={e => setFeedbackInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSendFeedback();
                              }}
                              placeholder="Responder ao aluno..."
                              style={{
                                flex: 1,
                                background: '#0d0d12',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '0.8rem',
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
                                borderRadius: '6px',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: feedbackInput.trim() ? 'pointer' : 'default',
                                color: feedbackInput.trim() ? '#0a0a0f' : '#4b5563',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Send size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: APLICAR PLANILHA AO ALUNO */}
      {applyingPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(20, 20, 28, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '450px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Aplicar Planilha</h3>
              <button 
                onClick={() => { setApplyingPlan(null); setSelectedAthleteId(''); }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>
              Você está aplicando o modelo <strong style={{ color: '#00f2fe' }}>{applyingPlan.name}</strong> ({applyingPlan.weeks} semanas) a um aluno.
            </p>

            <form onSubmit={handleApplyLibraryPlan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>SELECIONE O ALUNO</label>
                <select
                  value={selectedAthleteId}
                  onChange={e => setSelectedAthleteId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#f3f4f6',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Selecione...</option>
                  {athletes.map(athlete => (
                    <option key={athlete.id} value={athlete.id}>{athlete.name} ({athlete.level})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>CALIBRAÇÃO DE INTENSIDADE (%)</label>
                <input 
                  type="number"
                  min={50}
                  max={150}
                  value={effortPct}
                  onChange={e => setApplyEffortPct(parseInt(e.target.value, 10))}
                  required
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#f3f4f6',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button 
                type="submit"
                disabled={applyPlanLoading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#0a0a0f',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '10px'
                }}
              >
                {applyPlanLoading ? 'Aplicando...' : (
                  <>
                    <Check size={16} />
                    Confirmar e Aplicar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Estilo Pulse em Linha para Animações */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.98); }
        }
      `}} />

    </div>
  );
}
