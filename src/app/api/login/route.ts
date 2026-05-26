import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function getWeekDates(): Date[] {
  const current = new Date();
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const db = await getDb();

    // 1. Buscar pelo usuário com as credenciais informadas no banco
    let user = await db.get(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      username,
      password
    );

    // 2. Se não encontrado, verificar se é a credencial padrão para upgrade ou criação inicial
    if (!user) {
      if (username === 'jcschena' && password === '1953Bigu$') {
        // Verificar se existe o perfil de João Cláudio sem credenciais configuradas
        const joaoUser = await db.get(
          "SELECT * FROM users WHERE TRIM(UPPER(name)) = 'JOAO CLAUDIO SCHENA' AND (username IS NULL OR username = '')"
        );
        
        if (joaoUser) {
          // Atualizar o perfil com as credenciais padrão
          await db.run(
            "UPDATE users SET username = ?, password = ? WHERE id = ?",
            'jcschena',
            '1953Bigu$',
            joaoUser.id
          );
          console.log("Perfil legado de JOAO CLAUDIO SCHENA atualizado com as credenciais padrão no banco.");
          user = await db.get("SELECT * FROM users WHERE id = ?", joaoUser.id);
        } else {
          // Verificar se a tabela users está vazia para criar o perfil inicial
          const userCheck = await db.get("SELECT COUNT(*) as count FROM users");
          const count = userCheck ? parseInt(userCheck.count, 10) : 0;
          
          if (count === 0) {
            console.log('Perfil de JOAO CLAUDIO SCHENA não encontrado. Criando perfil padrão...');
            const userInsert = await db.run(`
              INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected, birth_date, username, password)
              VALUES ('JOAO CLAUDIO SCHENA', 'intermediario', 40, 75.0, 162, '5:15', 6, 0, '1985-05-23', 'jcschena', '1953Bigu$')
            `);
            const createdId = userInsert.lastID!;

            // Criar Objetivo (Goal)
            const dateTarget = formatDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
            await db.run(`
              INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
              VALUES (?, 'Corrida', 10.0, ?, '00:55:00', 240)
            `, createdId, dateTarget);

            // Criar Planilha Ativa de Treino
            const weekDates = getWeekDates();
            const startDateStr = formatDate(weekDates[0]);
            const endDateStr = formatDate(weekDates[6]);

            const planInsert = await db.run(`
              INSERT INTO training_plans (user_id, name, start_date, end_date, active)
              VALUES (?, 'Planilha Inicial Personalizada - João Claudio', ?, ?, 1)
            `, createdId, startDateStr, endDateStr);

            const planId = planInsert.lastID!;

            // Inserir treinos padrão (Intermediário)
            const workouts = [
              { day: 1, type: 'Corrida', dist: 6.0, dur: 2160, pace: '6:00/km', power: 0, tss: 35, title: 'Corrida Leve Aeróbia Z2', desc: 'Corrida confortável em ritmo conversacional para ganho de base aeróbia.' },
              { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Permita que seus músculos se recuperem do estresse acumulado.' },
              { day: 3, type: 'Corrida', dist: 8.0, dur: 2880, pace: '5:45/km', power: 0, tss: 60, title: 'Treino de Ritmo / Tempo Run', desc: 'Principal: 20 min contínuos em ritmo moderado/forte (Pace ~5:10/km). Excelente estímulo de limiar.' },
              { day: 4, type: 'Forca', dist: 0.0, dur: 2400, pace: 'N/A', power: 0, tss: 15, title: 'Fortalecimento Geral de Pernas & Core', desc: 'Agachamentos, passadas e pranchas para estabilização articular.' },
              { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para relaxamento e regeneração.' },
              { day: 6, type: 'Corrida', dist: 12.0, dur: 4680, pace: '6:30/km', power: 0, tss: 110, title: 'Treino Longo de Fim de Semana', desc: 'O treino mais longo da semana. Foco em ritmo estável de Zona 2. Hidrate-se bem antes e depois.' },
              { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia de repouso total.' }
            ];

            for (const w of workouts) {
              await db.run(`
                INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
              `, planId, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
            }

            // Criar notificação de boas-vindas
            await db.run(`
              INSERT INTO coach_notifs (user_id, date, title, content)
              VALUES (?, ?, 'Bem-vindo ao ULTRA!', 'Olá, João Claudio! Analisei seus dados e configurei sua planilha semanal de treinos dinâmicos. Use o Strava para que o Assistente Fisiológico acompanhe sua evolução e faça os ajustes automáticos de carga!')
            `, createdId, formatDate(new Date()));

            user = await db.get("SELECT * FROM users WHERE id = ?", createdId);
          }
        }
      }
    }

    // Se após todas as verificações ainda não tivermos usuário, o login falhou
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Login ou senha incorretos' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Permitir coexistência de múltiplos perfis
    console.log(`Login bem-sucedido para id=${userId}`);

    return NextResponse.json({
      success: true,
      userId,
      name: user.name
    });

  } catch (error: any) {
    console.error('Erro ao processar login:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
