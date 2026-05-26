import React, { useState, useEffect } from 'react';
import { 
  Users, Key, LogOut, Plus, Check, Trash2, RefreshCw, Activity, ShieldAlert
} from 'lucide-react';

interface Advisory {
  id: number;
  name: string;
  username: string;
  password: string;
  keyCode: string;
  keyActive: boolean;
  athleteCount: number;
}

interface MasterDashboardProps {
  userId: string;
  userName: string;
  onLogout: () => void;
}

export default function MasterDashboard({ userId, userName, onLogout }: MasterDashboardProps) {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [stats, setStats] = useState({ totalAdvisories: 0, totalAthletes: 0 });
  const [loading, setLoading] = useState(true);
  const [registerForm, setRegisterForm] = useState({ name: '', username: '', password: '', keyCode: '' });
  const [registerLoading, setRegisterLoading] = useState(false);

  const fetchAdvisories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/advisories');
      const data = await res.json();
      if (data.success) {
        setAdvisories(data.advisories || []);
        setStats(data.stats || { totalAdvisories: 0, totalAthletes: 0 });
      } else {
        alert(data.error || 'Erro ao buscar assessorias.');
      }
    } catch (err) {
      alert('Erro de conexão ao buscar dados de assessorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisories();
  }, []);

  const handleRegisterCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.username || !registerForm.password || !registerForm.keyCode) {
      alert('Preencha todos os campos do formulário.');
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await fetch('/api/master/advisories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_coach',
          coachId: userId,
          ...registerForm
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setRegisterForm({ name: '', username: '', password: '', keyCode: '' });
        fetchAdvisories();
      } else {
        alert(data.error || 'Erro ao cadastrar assessoria.');
      }
    } catch (err) {
      alert('Erro de conexão ao cadastrar assessoria.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleDeleteCoach = async (coach: Advisory) => {
    if (!confirm(`Tem certeza que deseja excluir a assessoria "${coach.name}"? Isso desvinculará todos os seus ${coach.athleteCount} alunos.`)) return;

    try {
      const res = await fetch('/api/master/advisories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_coach',
          coachId: coach.id
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdvisories();
      } else {
        alert(data.error || 'Erro ao excluir assessoria.');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir assessoria.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{
        background: 'rgba(15, 15, 20, 0.75)',
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
            background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
          }}>
            <ShieldAlert color="#09090b" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '0.5px', background: 'linear-gradient(90deg, #fff 0%, #ef4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ULTRA MASTER
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Gerenciamento Corporativo de Assessorias</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Administrador: <strong style={{ color: '#f4f4f5' }}>{userName}</strong></span>
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
            Sair da Conta
          </button>
        </div>
      </header>

      <main style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* CARDS DE STATS */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{
            background: 'rgba(20, 20, 25, 0.45)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', padding: '12px' }}>
              <Activity size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessorias Cadastradas</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800 }}>{stats.totalAdvisories}</h3>
            </div>
          </div>

          <div style={{
            background: 'rgba(20, 20, 25, 0.45)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px', padding: '12px' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alunos Ativos Plataforma</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800 }}>{stats.totalAthletes}</h3>
            </div>
          </div>

        </section>

        {/* CONTAINER DO LAYOUT PRINCIPAL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px', alignItems: 'start' }}>
          
          {/* COLUNA ESQUERDA: LISTA DE ASSESSORIAS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span> Assessorias Esportivas Cadastradas
            </h3>
            
            <div style={{ overflowX: 'auto', background: 'rgba(20, 20, 25, 0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                  <RefreshCw className="animate-spin" size={32} color="#ef4444" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : advisories.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
                  Nenhuma assessoria cadastrada. Use o formulário lateral para cadastrar a primeira!
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                      <th style={{ padding: '16px' }}>Assessoria / Treinador</th>
                      <th style={{ padding: '16px' }}>Usuário</th>
                      <th style={{ padding: '16px' }}>Senha</th>
                      <th style={{ padding: '16px' }}>Cupom Alunos</th>
                      <th style={{ padding: '16px' }}>Qtd Alunos</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisories.map(coach => (
                      <tr key={coach.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '16px', fontWeight: 700 }}>{coach.name}</td>
                        <td style={{ padding: '16px', color: '#e4e4e7', fontFamily: 'monospace' }}>{coach.username}</td>
                        <td style={{ padding: '16px', color: '#a1a1aa', fontFamily: 'monospace' }}>{coach.password}</td>
                        <td style={{ padding: '16px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{coach.keyCode}</td>
                        <td style={{ padding: '16px', fontWeight: 600 }}>
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            {coach.athleteCount} alunos
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteCoach(coach)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          >
                            <Trash2 size={12} />
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIO DE CADASTRO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'rgba(20, 20, 25, 0.45)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>➕</span> Cadastrar Assessoria
              </h3>
              
              <form onSubmit={handleRegisterCoach} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>NOME DA ASSESSORIA / PROFESSOR</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Assessoria Running Club"
                    value={registerForm.name}
                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      background: '#09090b',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f4f4f5',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>USUÁRIO DE LOGIN</label>
                  <input 
                    type="text" 
                    placeholder="Ex: runningclub"
                    value={registerForm.username}
                    onChange={e => setRegisterForm({ ...registerForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    required
                    style={{
                      width: '100%',
                      background: '#09090b',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f4f4f5',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>SENHA</label>
                  <input 
                    type="text" 
                    placeholder="Defina a senha de acesso"
                    value={registerForm.password}
                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      background: '#09090b',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f4f4f5',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>CÓDIGO DO CUPOM ÚNICO (ALUNOS)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: RUN2026"
                    value={registerForm.keyCode}
                    onChange={e => setRegisterForm({ ...registerForm, keyCode: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    required
                    style={{
                      width: '100%',
                      background: '#09090b',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f4f4f5',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={registerLoading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#09090b',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)'
                  }}
                >
                  {registerLoading ? 'Cadastrando...' : (
                    <>
                      <Check size={16} />
                      Confirmar Cadastro
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
