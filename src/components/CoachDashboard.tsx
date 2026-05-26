import React, { useState, useEffect } from 'react';
import { 
  Users, Key, LogOut, Search, Activity, AlertTriangle, 
  TrendingUp, Calendar, Edit3, Save, X, Plus, Check, RefreshCw,
  BookOpen, Download, MessageSquare, Send, Trash2
} from 'lucide-react';

interface Athlete {
  id: number;
  name: string;
  level: string;
  weight: number;
  thresholdHr: number;
  thresholdPace: string;
  stravaConnected: boolean;
  teacherId?: number | null;
  teacherName?: string | null;
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
  const [activeTab, setActiveTab] = useState<'athletes' | 'keys' | 'library' | 'finance' | 'teachers' | 'branding'>('athletes');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [brandingForm, setBrandingForm] = useState({
    customName: '',
    customLogo: '',
    customInfo: '',
    customColor: '#00f2fe'
  });
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
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
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [activePlanStartDate, setActivePlanStartDate] = useState<string | null>(null);
  const [draggedOverDay, setDraggedOverDay] = useState<number | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<any | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  
  // Estados de Hierarquia de Professores (Sub-professores)
  const [isSubTeacher, setIsSubTeacher] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [teacherSubmitLoading, setTeacherSubmitLoading] = useState(false);

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

  // ==========================================
  // SISTEMA DE GESTÃO FINANCEIRA (TREINADOR)
  // ==========================================
  const [financeAthletes, setFinanceAthletes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [coachPix, setCoachPix] = useState({ key: '', instructions: '' });
  const [financeLoading, setFinanceLoading] = useState(false);
  const [recordingPaymentAthlete, setRecordingPaymentAthlete] = useState<any | null>(null);
  const [editingFinanceAthlete, setEditingFinanceAthlete] = useState<any | null>(null);
  const [viewingPaymentHistoryAthlete, setViewingPaymentHistoryAthlete] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', referenceMonth: '', method: 'Pix' });
  const [financeForm, setFinanceForm] = useState({ monthlyFee: '', paymentDueDay: '' });
  const [pixForm, setPixForm] = useState({ key: '', instructions: '' });
  const [pixSaving, setPixSaving] = useState(false);
  const [financeSearchTerm, setFinanceSearchTerm] = useState('');
  const [financeFilterStatus, setFinanceFilterStatus] = useState<'all' | 'paid' | 'overdue' | 'blocked'>('all');

  const fetchFinanceData = async () => {
    setFinanceLoading(true);
    try {
      const res = await fetch(`/api/coach/finance?coachId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setFinanceAthletes(data.athletes || []);
        setPayments(data.payments || []);
        setCoachPix(data.coachPix || { key: '', instructions: '' });
        setPixForm(data.coachPix || { key: '', instructions: '' });
      } else {
        alert(data.error || 'Erro ao carregar dados financeiros');
      }
    } catch (err) {
      alert('Erro de conexão ao buscar dados financeiros');
    } finally {
      setFinanceLoading(false);
    }
  };

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setPixSaving(true);
    try {
      const res = await fetch('/api/coach/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_pix',
          coachId: userId,
          pixKey: pixForm.key,
          pixInstructions: pixForm.instructions
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Dados do Pix salvos com sucesso!');
        setCoachPix({ key: pixForm.key, instructions: pixForm.instructions });
      } else {
        alert(data.error || 'Erro ao salvar Pix');
      }
    } catch (err) {
      alert('Erro de rede ao salvar Pix');
    } finally {
      setPixSaving(false);
    }
  };

  const handleSaveAthleteFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFinanceAthlete) return;
    try {
      const res = await fetch('/api/coach/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_athlete_finance',
          coachId: userId,
          athleteId: editingFinanceAthlete.id,
          monthlyFee: financeForm.monthlyFee,
          paymentDueDay: financeForm.paymentDueDay
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Dados financeiros atualizados!');
        setEditingFinanceAthlete(null);
        fetchFinanceData();
      } else {
        alert(data.error || 'Erro ao atualizar dados');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar dados financeiros');
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingPaymentAthlete) return;
    try {
      const res = await fetch('/api/coach/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_payment',
          coachId: userId,
          athleteId: recordingPaymentAthlete.id,
          amount: paymentForm.amount,
          paymentDate: new Date().toLocaleDateString('en-CA'),
          referenceMonth: paymentForm.referenceMonth,
          method: paymentForm.method
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pagamento registrado com sucesso e acesso liberado!');
        setRecordingPaymentAthlete(null);
        fetchFinanceData();
        // Atualizar lista principal de atletas também
        fetchCoachData();
      } else {
        alert(data.error || 'Erro ao registrar pagamento');
      }
    } catch (err) {
      alert('Erro de rede ao registrar pagamento');
    }
  };

  const handleToggleBlockAthlete = async (athlete: any) => {
    const isBlocked = athlete.status === 'blocked';
    const msg = isBlocked 
      ? `Deseja liberar o acesso do aluno ${athlete.name}?`
      : `Deseja suspender temporariamente o acesso do aluno ${athlete.name} por inadimplência?`;
    if (!confirm(msg)) return;

    try {
      const res = await fetch('/api/coach/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_block',
          coachId: userId,
          athleteId: athlete.id,
          newStatus: isBlocked ? 'active' : 'blocked'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchFinanceData();
        fetchCoachData();
      } else {
        alert(data.error || 'Erro ao alterar status de acesso');
      }
    } catch (err) {
      alert('Erro de rede ao alterar status de acesso');
    }
  };

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
        setIsSubTeacher(!!data.isSubTeacher);
        if (data.teachers) {
          setTeachers(data.teachers);
        }
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

  const fetchAthleteWorkouts = async (athleteId: number) => {
    setWorkoutsLoading(true);
    try {
      const res = await fetch(`/api/coach/workouts?athleteId=${athleteId}`);
      const data = await res.json();
      if (data.success) {
        setWorkouts(data.workouts || []);
        setActivePlanId(data.planId || null);
        setActivePlanStartDate(data.startDate || null);
      } else {
        alert(data.error || 'Erro ao buscar planilha');
      }
    } catch (err) {
      alert('Erro de conexão ao buscar treinos');
    } finally {
      setWorkoutsLoading(false);
    }
  };

  const handleSelectAthlete = async (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    await fetchAthleteWorkouts(athlete.id);
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
        setEditingWorkout(null);
        if (selectedAthlete) {
          await fetchAthleteWorkouts(selectedAthlete.id);
        }
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

  const handleDeleteWorkout = async (workoutId: number) => {
    if (!window.confirm('Tem certeza de que deseja excluir este treino previamente prescrito?')) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/coach/workouts?workoutId=${workoutId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        // Atualizar lista local de treinos removendo o treino deletado
        setWorkouts(workouts.filter(w => w.id !== workoutId));
        if (editingWorkout?.workoutId === workoutId) {
          setEditingWorkout(null);
        }
        // Recarregar estatísticas em background
        fetchCoachData();
      } else {
        alert(data.error || 'Erro ao excluir treino');
      }
    } catch (err) {
      alert('Erro de rede ao excluir treino');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, workoutId: number) => {
    e.dataTransfer.setData('text/plain', String(workoutId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    const workoutIdStr = e.dataTransfer.getData('text/plain');
    if (!workoutIdStr) return;
    const workoutId = parseInt(workoutIdStr, 10);
    
    const draggedWorkout = workouts.find(w => w.id === workoutId);
    if (!draggedWorkout || draggedWorkout.day_of_week === targetDay) return;

    // Atualização otimista
    setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, day_of_week: targetDay } : w));

    try {
      const res = await fetch('/api/coach/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId,
          day_of_week: targetDay
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Erro ao mover treino');
        if (selectedAthlete) {
          await fetchAthleteWorkouts(selectedAthlete.id);
        }
      } else {
        if (selectedAthlete) {
          await fetchAthleteWorkouts(selectedAthlete.id);
        }
      }
    } catch (err) {
      alert('Erro de conexão ao mover treino');
      if (selectedAthlete) {
        await fetchAthleteWorkouts(selectedAthlete.id);
      }
    }
  };




  // Funções de Gerenciamento de Professores
  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const res = await fetch(`/api/coach/teachers?coachId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers || []);
      } else {
        alert(data.error || 'Erro ao buscar professores');
      }
    } catch (err) {
      alert('Erro de conexão ao buscar professores');
    } finally {
      setTeachersLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName || !newTeacherUsername || !newTeacherPassword) return;
    setTeacherSubmitLoading(true);
    try {
      const res = await fetch('/api/coach/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_teacher',
          coachId: userId,
          name: newTeacherName,
          username: newTeacherUsername,
          password: newTeacherPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTeacherName('');
        setNewTeacherUsername('');
        setNewTeacherPassword('');
        alert(data.message || 'Professor cadastrado com sucesso!');
        fetchTeachers();
        fetchCoachData(); // Atualiza contadores
      } else {
        alert(data.error || 'Erro ao cadastrar professor');
      }
    } catch (err) {
      alert('Erro de conexão ao cadastrar professor');
    } finally {
      setTeacherSubmitLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: number) => {
    if (!confirm('Tem certeza que deseja excluir este professor? Os alunos serão desvinculados.')) return;
    try {
      const res = await fetch('/api/coach/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_teacher',
          coachId: userId,
          teacherId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchTeachers();
        fetchCoachData();
      } else {
        alert(data.error || 'Erro ao excluir professor');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir professor');
    }
  };

  const handleAssignTeacher = async (athleteId: number, teacherIdStr: string) => {
    const teacherId = teacherIdStr ? parseInt(teacherIdStr, 10) : null;
    try {
      const res = await fetch('/api/coach/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: parseInt(userId, 10),
          athleteId,
          teacherId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchCoachData();
      } else {
        alert(data.error || 'Erro ao atribuir professor');
      }
    } catch (err) {
      alert('Erro de rede ao atribuir professor');
    }
  };

  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overtrainingCount = athletes.filter(a => a.metrics.tsb < -20).length;

  const renderFinanceTab = () => {
    // Calcular estatísticas financeiras
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentMonthRef = `${currentMonth}/${currentYear}`;

    const totalPredicted = financeAthletes.reduce((sum, a) => sum + (a.monthlyFee || 150), 0);
    
    const totalConfirmed = payments
      .filter(p => p.reference_month === currentMonthRef)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const blockedCount = financeAthletes.filter(a => a.status === 'blocked').length;
    const overdueCount = financeAthletes.filter(a => a.paymentStatus === 'overdue' && a.status !== 'blocked').length;
    const paidCount = financeAthletes.filter(a => a.paymentStatus === 'paid' && a.status !== 'blocked').length;
    
    const activeAthletesCount = financeAthletes.length;
    const adhesionRate = activeAthletesCount > 0 ? Math.round((paidCount / activeAthletesCount) * 100) : 100;

    const filteredFinanceAthletes = financeAthletes.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(financeSearchTerm.toLowerCase());
      if (financeFilterStatus === 'all') return matchesSearch;
      if (financeFilterStatus === 'paid') return matchesSearch && a.paymentStatus === 'paid' && a.status !== 'blocked';
      if (financeFilterStatus === 'overdue') return matchesSearch && a.paymentStatus === 'overdue' && a.status !== 'blocked';
      if (financeFilterStatus === 'blocked') return matchesSearch && a.status === 'blocked';
      return matchesSearch;
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', alignItems: 'start' }} className="animate-slide-up">
        
        {/* LADO ESQUERDO: LISTAGEM E STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CARDS DE STATS FINANCEIROS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(20, 20, 28, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Previsto ({currentMonthRef})</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f3f4f6' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPredicted)}
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{activeAthletesCount} alunos vinculados</span>
            </div>
            
            <div style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'block', marginBottom: '4px' }}>Faturamento Confirmado</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#34d399' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalConfirmed)}
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Recebido este mês</span>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#fca5a5', display: 'block', marginBottom: '4px' }}>Inadimplentes / Bloqueados</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ef4444' }}>
                {blockedCount} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#9ca3af' }}>bloqueados</span>
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{overdueCount} pendentes de pagamento</span>
            </div>

            <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#00f2fe', display: 'block', marginBottom: '4px' }}>Taxa de Adimplência</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#00f2fe' }}>
                {adhesionRate}%
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{paidCount} de {activeAthletesCount} pagos</span>
            </div>
          </div>

          {/* FILTROS E BUSCA */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                type="text" 
                placeholder="Pesquisar aluno..."
                value={financeSearchTerm}
                onChange={e => setFinanceSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(20, 20, 28, 0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '10px 12px 10px 36px',
                  color: '#f3f4f6',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'paid', 'overdue', 'blocked'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFinanceFilterStatus(status)}
                  style={{
                    background: financeFilterStatus === status ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: financeFilterStatus === status ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: financeFilterStatus === status ? '#00f2fe' : '#9ca3af',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {status === 'all' && 'Todos'}
                  {status === 'paid' && 'Adimplentes'}
                  {status === 'overdue' && 'Pendentes'}
                  {status === 'blocked' && 'Bloqueados'}
                </button>
              ))}
            </div>
          </div>

          {/* TABELA DE ALUNOS FINANCEIRO */}
          <div style={{ overflowX: 'auto', background: 'rgba(20, 20, 28, 0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
            {financeLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <RefreshCw className="animate-spin" size={24} color="#00f2fe" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    <th style={{ padding: '16px' }}>Aluno</th>
                    <th style={{ padding: '16px' }}>Mensalidade</th>
                    <th style={{ padding: '16px' }}>Vencimento</th>
                    <th style={{ padding: '16px' }}>Último Pagamento</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFinanceAthletes.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Nenhum aluno financeiro encontrado.</td>
                    </tr>
                  ) : (
                    filteredFinanceAthletes.map(athlete => {
                      const isBlocked = athlete.status === 'blocked';
                      return (
                        <tr key={athlete.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '16px', fontWeight: 700 }}>{athlete.name}</td>
                          <td style={{ padding: '16px', color: '#fff', fontWeight: 600 }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(athlete.monthlyFee)}
                          </td>
                          <td style={{ padding: '16px', color: '#9ca3af' }}>Dia {athlete.paymentDueDay}</td>
                          <td style={{ padding: '16px', color: '#9ca3af' }}>
                            {athlete.lastPaymentDate ? new Date(athlete.lastPaymentDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Nenhum'}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: 600,
                              background: isBlocked 
                                ? 'rgba(239, 68, 68, 0.15)' 
                                : athlete.paymentStatus === 'overdue' 
                                  ? 'rgba(251, 146, 60, 0.15)' 
                                  : 'rgba(52, 211, 153, 0.15)',
                              color: isBlocked 
                                ? '#ef4444' 
                                : athlete.paymentStatus === 'overdue' 
                                  ? '#fb923c' 
                                  : '#34d399'
                            }}>
                              {isBlocked ? 'Bloqueado' : athlete.paymentStatus === 'overdue' ? 'Pendente' : 'Adimplente'}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setRecordingPaymentAthlete(athlete);
                                setPaymentForm({
                                  amount: String(athlete.monthlyFee),
                                  referenceMonth: currentMonthRef,
                                  method: 'Pix'
                                });
                              }}
                              style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              title="Registrar Pagamento"
                            >
                              💰 Pagar
                            </button>
                            <button
                              onClick={() => {
                                setEditingFinanceAthlete(athlete);
                                setFinanceForm({
                                  monthlyFee: String(athlete.monthlyFee),
                                  paymentDueDay: String(athlete.paymentDueDay)
                                });
                              }}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                              title="Configurar Mensalidade"
                            >
                              ⚙️
                            </button>
                            <button
                              onClick={() => handleToggleBlockAthlete(athlete)}
                              style={{ 
                                background: isBlocked ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                border: isBlocked ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', 
                                color: isBlocked ? '#34d399' : '#ef4444', 
                                padding: '6px 10px', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                              title={isBlocked ? 'Liberar Acesso' : 'Bloquear Acesso'}
                            >
                              {isBlocked ? '🔓 Liberar' : '🚫 Bloquear'}
                            </button>
                            <button
                              onClick={() => setViewingPaymentHistoryAthlete(athlete)}
                              style={{ background: 'rgba(79, 172, 254, 0.1)', border: '1px solid rgba(79, 172, 254, 0.2)', color: '#4facfe', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                              title="Histórico de Pagamentos"
                            >
                              📜 Histórico
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* LADO DIREITO: CONFIGURAÇÃO DE PIX */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(20, 20, 28, 0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔑</span> Configuração de Pix
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Defina sua chave Pix principal e instruções de pagamento. Elas serão exibidas na tela de bloqueio dos alunos inadimplentes.
            </p>
            <form onSubmit={handleSavePix} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>CHAVE PIX</label>
                <input 
                  type="text" 
                  placeholder="E-mail, celular, CPF ou aleatória"
                  value={pixForm.key}
                  onChange={e => setPixForm({ ...pixForm, key: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f3f4f6',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>INSTRUÇÕES DE PAGAMENTO</label>
                <textarea 
                  placeholder="Ex: Enviar comprovante para o WhatsApp do treinador após o pagamento."
                  value={pixForm.instructions}
                  onChange={e => setPixForm({ ...pixForm, instructions: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f3f4f6',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={pixSaving}
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
                  gap: '6px'
                }}
              >
                {pixSaving ? 'Salvando...' : (
                  <>
                    <Save size={14} />
                    Salvar Pix
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const fetchBrandingData = async () => {
    setBrandingLoading(true);
    try {
      const res = await fetch(`/api/coach/branding?coachId=${userId}`);
      const data = await res.json();
      if (data.success && data.branding) {
        setBrandingForm({
          customName: data.branding.custom_name || '',
          customLogo: data.branding.custom_logo || '',
          customInfo: data.branding.custom_info || '',
          customColor: data.branding.custom_color || '#00f2fe'
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados de personalização:', err);
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandingSaving(true);
    try {
      const res = await fetch('/api/coach/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: userId,
          customName: brandingForm.customName,
          customLogo: brandingForm.customLogo,
          customInfo: brandingForm.customInfo,
          customColor: brandingForm.customColor
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Configurações de personalização salvas!');
      } else {
        alert(data.error || 'Erro ao salvar personalização');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar personalização');
    } finally {
      setBrandingSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('O logotipo deve ter no máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBrandingForm(prev => ({
        ...prev,
        customLogo: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const renderBrandingTab = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', alignItems: 'start' }} className="animate-slide-up">
        <div style={{ background: 'rgba(20, 20, 28, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0', color: '#00f2fe' }}>Identidade Visual da Assessoria</h3>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: '0 0 24px 0', lineHeight: '1.5' }}>
            Personalize o nome, o logotipo, a cor de destaque e as informações que seus atletas visualizam ao acessar o aplicativo.
          </p>

          {brandingLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <RefreshCw className="animate-spin" size={24} color="#00f2fe" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>NOME DA ASSESSORIA / MARCA</label>
                <input 
                  type="text" 
                  placeholder="Ex: Prime Assessoria Esportiva"
                  value={brandingForm.customName}
                  onChange={e => setBrandingForm({ ...brandingForm, customName: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f3f4f6',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>LOGOTIPO DA ASSESSORIA</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f3f4f6',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Formatos recomendados: PNG ou SVG transparente. Máximo 2MB.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>COR DE DESTAQUE DO TEMA</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={brandingForm.customColor || '#00f2fe'}
                    onChange={e => setBrandingForm({ ...brandingForm, customColor: e.target.value })}
                    style={{
                      border: 'none',
                      background: 'none',
                      width: '44px',
                      height: '44px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />
                  <input 
                    type="text"
                    value={brandingForm.customColor || '#00f2fe'}
                    onChange={e => setBrandingForm({ ...brandingForm, customColor: e.target.value })}
                    style={{
                      background: '#0d0d12',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f3f4f6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      width: '100px'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Esta cor substituirá o ciano elétrico em botões, bordas e detalhes do app do atleta.</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>INFORMAÇÕES ADICIONAIS / CONTATO</label>
                <textarea 
                  placeholder="Ex: Endereço físico, links de redes sociais, telefone de suporte ou slogan da assessoria."
                  value={brandingForm.customInfo}
                  onChange={e => setBrandingForm({ ...brandingForm, customInfo: e.target.value })}
                  rows={5}
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f3f4f6',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={brandingSaving}
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${brandingForm.customColor || '#00f2fe'}, #4facfe)`,
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
                  gap: '8px'
                }}
              >
                {brandingSaving ? 'Salvando...' : 'Salvar Alterações de Branding'}
              </button>
            </form>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(20, 20, 28, 0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>
              Pré-visualização do Topo (Atleta)
            </h4>
            
            <div style={{
              background: '#060913',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {brandingForm.customLogo ? (
                  <img 
                    src={brandingForm.customLogo} 
                    alt="Logo" 
                    style={{ maxHeight: '32px', maxWidth: '80px', objectFit: 'contain' }} 
                  />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: `linear-gradient(135deg, ${brandingForm.customColor || '#00f2fe'}, #4facfe)`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: '#0a0a0f', fontSize: '0.8rem', fontWeight: 800 }}>U</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                    {brandingForm.customName || 'ULTRA COACH'}
                  </span>
                  <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>
                    PLANILHA SEMANAL
                  </span>
                </div>
              </div>
              <div style={{
                background: `${brandingForm.customColor || '#00f2fe'}1a`,
                color: brandingForm.customColor || '#00f2fe',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                INTERMEDIÁRIO
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(20, 20, 28, 0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>
              Informações Adicionais
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {brandingForm.customInfo || 'Nenhuma informação adicional de contato inserida.'}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px', gap: '24px', flexWrap: 'wrap' }}>
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
          
          {!isSubTeacher && (
            <>
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
                onClick={() => { setActiveTab('teachers'); fetchTeachers(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'teachers' ? '2px solid #00f2fe' : '2px solid transparent',
                  color: activeTab === 'teachers' ? '#00f2fe' : '#9ca3af',
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
                Professores
              </button>
            </>
          )}

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

          {!isSubTeacher && (
            <button 
              onClick={() => { setActiveTab('finance'); fetchFinanceData(); }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'finance' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'finance' ? '#00f2fe' : '#9ca3af',
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
              <TrendingUp size={18} />
              Financeiro 💰
            </button>
          )}

          {!isSubTeacher && (
            <button 
              onClick={() => { setActiveTab('branding'); fetchBrandingData(); }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'branding' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'branding' ? '#00f2fe' : '#9ca3af',
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
              <span style={{ fontSize: '1.1rem' }}>🎨</span>
              Personalização
            </button>
          )}
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
                        {!isSubTeacher && <th style={{ padding: '16px' }}>Professor Atribuído</th>}
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
                          <td colSpan={isSubTeacher ? 8 : 9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Nenhum aluno cadastrado ou encontrado.</td>
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
                                  {athlete.level === 'elite' ? 'Avançado' : athlete.level === 'sedentario' ? 'Iniciante' : 'Intermediário'}
                                </span>
                              </td>
                              {!isSubTeacher && (
                                <td style={{ padding: '16px' }}>
                                  <select
                                    value={athlete.teacherId || ''}
                                    onChange={e => handleAssignTeacher(athlete.id, e.target.value)}
                                    style={{
                                      background: '#0d0d12',
                                      border: '1px solid rgba(255,255,255,0.08)',
                                      borderRadius: '6px',
                                      padding: '6px 8px',
                                      color: '#f3f4f6',
                                      fontSize: '0.8rem',
                                      outline: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="">Nenhum (Dono)</option>
                                    {teachers.map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                  </select>
                                </td>
                              )}
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

            {/* ABA: PROFESSORES */}
            {activeTab === 'teachers' && !isSubTeacher && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', alignItems: 'start' }} className="animate-slide-up">
                
                {/* LISTAGEM DE PROFESSORES */}
                <div style={{ background: 'rgba(20, 20, 28, 0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                  {teachersLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                      <RefreshCw className="animate-spin" size={24} color="#00f2fe" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                          <th style={{ padding: '16px' }}>Nome do Professor</th>
                          <th style={{ padding: '16px' }}>Usuário</th>
                          <th style={{ padding: '16px' }}>Senha</th>
                          <th style={{ padding: '16px' }}>Alunos Sob Gestão</th>
                          <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Nenhum professor cadastrado nesta assessoria.</td>
                          </tr>
                        ) : (
                          teachers.map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.9rem' }}>
                              <td style={{ padding: '16px', fontWeight: 700, color: '#f3f4f6' }}>{t.name}</td>
                              <td style={{ padding: '16px', color: '#9ca3af' }}>{t.username}</td>
                              <td style={{ padding: '16px', fontFamily: 'monospace', color: '#9ca3af' }}>{t.password}</td>
                              <td style={{ padding: '16px', fontWeight: 600, color: '#00f2fe' }}>{t.athleteCount} alunos</td>
                              <td style={{ padding: '16px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleDeleteTeacher(t.id)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    color: '#ef4444',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Excluir
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* CADASTRO DE PROFESSOR */}
                <div style={{ background: 'rgba(20, 20, 28, 0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700, color: '#f3f4f6' }}>Cadastrar Novo Professor</h4>
                  <form onSubmit={handleCreateTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>NOME COMPLETO</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Prof. Carlos Silva"
                        value={newTeacherName}
                        onChange={e => setNewTeacherName(e.target.value)}
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
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>USUÁRIO DE ACESSO</label>
                      <input 
                        type="text" 
                        placeholder="Ex: carlos.coach"
                        value={newTeacherUsername}
                        onChange={e => setNewTeacherUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
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
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>SENHA</label>
                      <input 
                        type="text" 
                        placeholder="Crie uma senha temporária"
                        value={newTeacherPassword}
                        onChange={e => setNewTeacherPassword(e.target.value)}
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
                      disabled={teacherSubmitLoading}
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
                      {teacherSubmitLoading ? 'Cadastrando...' : (
                        <>
                          <Plus size={16} />
                          Cadastrar Professor
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

            {/* ABA: FINANCEIRO */}
            {activeTab === 'finance' && renderFinanceTab()}

            {/* ABA: PERSONALIZAÇÃO */}
            {activeTab === 'branding' && renderBrandingTab()}

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {activePlanId && (
                      <button
                        onClick={() => setEditingWorkout({
                          planId: activePlanId,
                          day_of_week: 1,
                          title: '',
                          type: 'Corrida',
                          distance_target: 0,
                          duration_target: 0,
                          pace_target: 'N/A',
                          power_target: 0,
                          tss_target: 0,
                          description: '',
                          status: 'pending'
                        })}
                        style={{
                          background: 'rgba(0, 242, 254, 0.1)',
                          border: '1px solid rgba(0, 242, 254, 0.2)',
                          borderRadius: '10px',
                          padding: '12px',
                          color: '#00f2fe',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Plus size={16} />
                        Adicionar Novo Treino na Semana
                      </button>
                    )}

                    {(() => {
                      const DAYS_OF_WEEK = [
                        { day: 1, name: 'Segunda-feira' },
                        { day: 2, name: 'Terça-feira' },
                        { day: 3, name: 'Quarta-feira' },
                        { day: 4, name: 'Quinta-feira' },
                        { day: 5, name: 'Sexta-feira' },
                        { day: 6, name: 'Sábado' },
                        { day: 7, name: 'Domingo' }
                      ];

                      const getDayDateLabel = (dayNum: number) => {
                        if (!activePlanStartDate) return '';
                        try {
                          const baseDate = new Date(activePlanStartDate + 'T12:00:00');
                          baseDate.setDate(baseDate.getDate() + (dayNum - 1));
                          const dayStr = String(baseDate.getDate()).padStart(2, '0');
                          const monthStr = String(baseDate.getMonth() + 1).padStart(2, '0');
                          return `${dayStr}/${monthStr}`;
                        } catch (e) {
                          return '';
                        }
                      };

                      return DAYS_OF_WEEK.map(dayObj => {
                        const dayWorkouts = workouts.filter(w => w.day_of_week === dayObj.day);
                        const isOver = draggedOverDay === dayObj.day;
                        const dateLabel = getDayDateLabel(dayObj.day);

                        return (
                          <div
                            key={dayObj.day}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => { e.preventDefault(); setDraggedOverDay(dayObj.day); }}
                            onDragLeave={() => setDraggedOverDay(null)}
                            onDrop={(e) => handleDrop(e, dayObj.day)}
                            style={{
                              background: isOver ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                              border: isOver ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '16px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              transition: 'all 0.2s',
                              boxShadow: isOver ? '0 0 15px rgba(0, 242, 254, 0.15)' : 'none'
                            }}
                          >
                            {/* Cabeçalho do Dia */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#f3f4f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {dayObj.name} {dateLabel && <span style={{ color: '#00f2fe', fontSize: '0.8rem', fontWeight: 500 }}>({dateLabel})</span>}
                              </h4>
                              {activePlanId && (
                                <button
                                  onClick={() => setEditingWorkout({
                                    planId: activePlanId,
                                    day_of_week: dayObj.day,
                                    title: '',
                                    type: 'Corrida',
                                    distance_target: 0,
                                    duration_target: 0,
                                    pace_target: 'N/A',
                                    power_target: 0,
                                    tss_target: 0,
                                    description: '',
                                    status: 'pending'
                                  })}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '6px',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  title="Adicionar treino para este dia"
                                >
                                  <Plus size={14} />
                                </button>
                              )}
                            </div>

                            {/* Treinos do Dia */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {dayWorkouts.length === 0 ? (
                                <div style={{
                                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                                  borderRadius: '10px',
                                  padding: '12px',
                                  textAlign: 'center',
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                  userSelect: 'none'
                                }}>
                                  Nenhum treino programado
                                </div>
                              ) : (
                                dayWorkouts.map(w => (
                                  <div
                                    key={w.id}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, w.id)}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.06)',
                                      borderRadius: '12px',
                                      padding: '12px 14px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: '12px',
                                      cursor: 'grab',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                      {/* Drag Indicator (Icone de grip) */}
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#4b5563', cursor: 'grab' }}>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
                                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
                                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
                                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#f3f4f6' }}>
                                          {w.title}
                                        </h5>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                                          <span>Tipo: <strong style={{ color: '#00f2fe' }}>{w.type}</strong></span>
                                          {w.distance_target > 0 && <span>Distância: <strong>{w.distance_target}km</strong></span>}
                                          {w.tss_target > 0 && <span>Carga: <strong>{w.tss_target} TSS</strong></span>}
                                        </div>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px' }}>
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
                                          background: 'rgba(255, 255, 255, 0.05)',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          borderRadius: '6px',
                                          padding: '5px 8px',
                                          fontSize: '0.75rem',
                                          color: '#f3f4f6',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Edit3 size={12} />
                                        Prescrever
                                      </button>
                                      <button
                                        onClick={() => handleDeleteWorkout(w.id)}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.1)',
                                          border: '1px solid rgba(239, 68, 68, 0.2)',
                                          borderRadius: '6px',
                                          padding: '5px 8px',
                                          fontSize: '0.75rem',
                                          color: '#ef4444',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Trash2 size={12} />
                                        Excluir
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
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
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#00f2fe' }}>
                          {editingWorkout.workoutId ? 'Editar Treino' : 'Adicionar Novo Treino'}
                        </h4>
                        <button 
                          onClick={() => setEditingWorkout(null)} 
                          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {!editingWorkout.workoutId && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>DIA DA SEMANA</label>
                            <select
                              value={editingWorkout.day_of_week || 1}
                              onChange={e => setEditingWorkout({ ...editingWorkout, day_of_week: parseInt(e.target.value, 10) })}
                              style={{ width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#f3f4f6', fontSize: '0.85rem' }}
                            >
                              <option value={1}>Segunda-feira</option>
                              <option value={2}>Terça-feira</option>
                              <option value={3}>Quarta-feira</option>
                              <option value={4}>Quinta-feira</option>
                              <option value={5}>Sexta-feira</option>
                              <option value={6}>Sábado</option>
                              <option value={7}>Domingo</option>
                            </select>
                          </div>
                        )}

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

                        {editingWorkout.workoutId && (
                          <button 
                            type="button" 
                            onClick={() => handleDeleteWorkout(editingWorkout.workoutId)}
                            disabled={saveLoading}
                            style={{
                              width: '100%',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '8px',
                              padding: '10px',
                              color: '#ef4444',
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
                            <Trash2 size={14} />
                            Excluir Treino
                          </button>
                        )}
                      </form>

                      {/* SEÇÃO DE FEEDBACK DE TREINO */}
                      {editingWorkout.workoutId && (
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
                      )}

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

      {/* MODAL: REGISTRAR PAGAMENTO */}
      {recordingPaymentAthlete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: '#14141c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Registrar Pagamento</h3>
              <button 
                onClick={() => setRecordingPaymentAthlete(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
              Registrando mensalidade para o aluno <strong>{recordingPaymentAthlete.name}</strong>.
            </p>

            <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>MÊS DE REFERÊNCIA</label>
                <input 
                  type="text" 
                  placeholder="Ex: 05/2026"
                  value={paymentForm.referenceMonth}
                  onChange={e => setPaymentForm({ ...paymentForm, referenceMonth: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>VALOR PAGO (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>MÉTODO DE PAGAMENTO</label>
                <select
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
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
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão de Crédito/Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência Bancária</option>
                </select>
              </div>

              <button 
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #34d399, #10b981)',
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
                  marginTop: '8px'
                }}
              >
                <Check size={16} />
                Confirmar Pagamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR VALOR DA MENSALIDADE E VENCIMENTO */}
      {editingFinanceAthlete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: '#14141c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Configurar Mensalidade</h3>
              <button 
                onClick={() => setEditingFinanceAthlete(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
              Defina os parâmetros financeiros para <strong>{editingFinanceAthlete.name}</strong>.
            </p>

            <form onSubmit={handleSaveAthleteFinance} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>VALOR DA MENSALIDADE (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={financeForm.monthlyFee}
                  onChange={e => setFinanceForm({ ...financeForm, monthlyFee: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>DIA DE VENCIMENTO</label>
                <input 
                  type="number" 
                  min={1}
                  max={31}
                  value={financeForm.paymentDueDay}
                  onChange={e => setFinanceForm({ ...financeForm, paymentDueDay: e.target.value })}
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
                  marginTop: '8px'
                }}
              >
                <Check size={16} />
                Salvar Configurações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO DE PAGAMENTOS DO ALUNO */}
      {viewingPaymentHistoryAthlete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: '#14141c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '550px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Histórico de Pagamentos</h3>
              <button 
                onClick={() => setViewingPaymentHistoryAthlete(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
              Pagamentos registrados para <strong>{viewingPaymentHistoryAthlete.name}</strong>.
            </p>

            <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: '#0d0d12' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                    <th style={{ padding: '12px' }}>Mês Ref</th>
                    <th style={{ padding: '12px' }}>Valor</th>
                    <th style={{ padding: '12px' }}>Data Pgto</th>
                    <th style={{ padding: '12px' }}>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.filter(p => p.user_id === viewingPaymentHistoryAthlete.id).length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Nenhum pagamento registrado.</td>
                    </tr>
                  ) : (
                    payments
                      .filter(p => p.user_id === viewingPaymentHistoryAthlete.id)
                      .map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#00f2fe' }}>{p.reference_month}</td>
                          <td style={{ padding: '12px', color: '#34d399', fontWeight: 600 }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                          </td>
                          <td style={{ padding: '12px', color: '#9ca3af' }}>
                            {new Date(p.payment_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{ padding: '12px', color: '#9ca3af' }}>{p.method}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <button 
              onClick={() => setViewingPaymentHistoryAthlete(null)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '10px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Fechar
            </button>
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
