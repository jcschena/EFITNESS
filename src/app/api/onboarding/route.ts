import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Helper para obter as datas da semana corrente (Segunda a Domingo)
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
    const data = await req.json();
    const db = await getDb();

    const name = data.name || 'Novo Atleta';
    const level = data.level || 'intermediario'; // 'elite', 'intermediario', 'sedentario'
    const birthDate = data.birthDate || null;
    let age = 30;

    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    } else if (data.age) {
      age = parseInt(data.age, 10);
    }

    const weight = parseFloat(data.weight || '75');
    const goalType = data.goalType || 'Corrida';
    const goalDistance = parseFloat(data.goalDistance || '10');
    const goalTime = data.goalTime || '01:00:00';
    const weeklyHours = parseInt(data.weeklyHours || '6', 10);
    const stravaConnected = data.stravaConnected ? 1 : 0;

    // Estimar limiares fisiológicos baseados no nível informado
    let thresholdHr = 160;
    let thresholdPace = '5:00';
    let weeklyTssTarget = 250;

    if (level === 'elite') {
      thresholdHr = 175;
      thresholdPace = '3:45';
      weeklyTssTarget = 550;
    } else if (level === 'sedentario') {
      thresholdHr = 145;
      thresholdPace = '8:30';
      weeklyTssTarget = 100;
    } else {
      // Intermediário
      thresholdHr = 162;
      thresholdPace = '5:15';
      weeklyTssTarget = 240;
    }

    // 1. Desativar outros planos antigos de treino se houver (apenas para garantir consistência)
    // Para simplificar, o onboarding criará um novo usuário, então não precisa desativar.

    // 2. Inserir Usuário
    const userInsert = await db.run(`
      INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected, birth_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, name, level, age, weight, thresholdHr, thresholdPace, weeklyHours, 0, birthDate); // Always start as 0 (authorization is done via OAuth redirect after onboarding)
    
    const userId = userInsert.lastID;

    // 3. Inserir Objetivo (Goal)
    // Prova alvo calculada para daqui a 60 dias por padrão
    const dateTarget = formatDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
    await db.run(`
      INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
      VALUES (?, ?, ?, ?, ?, ?)
    `, userId, goalType, goalDistance, dateTarget, goalTime, weeklyTssTarget);

    // 4. Criar Planilha Ativa de Treino
    const weekDates = getWeekDates();
    const startDateStr = formatDate(weekDates[0]);
    const endDateStr = formatDate(weekDates[6]);

    const planInsert = await db.run(`
      INSERT INTO training_plans (user_id, name, start_date, end_date, active)
      VALUES (?, ?, ?, ?, 1)
    `, userId, `Planilha Inicial Personalizada - Nível ${level.toUpperCase()}`, startDateStr, endDateStr);

    const planId = planInsert.lastID;

    // 5. Gerar planilha semanal com base no nível do atleta
    const workoutsToInsert = [];

    if (level === 'sedentario') {
      workoutsToInsert.push(
        { day: 1, type: 'Corrida', dist: 3.0, dur: 1800, pace: '8:30/km', power: 0, tss: 20, title: 'Trote Intervalado Inicial (1:2)', desc: 'Aquecimento de 5 min caminhando. Principal: 6x (1 min trote muito leve + 2 min caminhando). Foco em manter o esforço aeróbico super leve.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Ativo', desc: 'Dia de repouso completo. Deixe seus músculos se adaptarem.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 1800, pace: 'N/A', power: 0, tss: 12, title: 'Fortalecimento e Mobilidade Core', desc: 'Exercícios leves usando o peso do corpo para melhorar postura e estabilidade das articulações.' },
        { day: 4, type: 'Corrida', dist: 3.5, dur: 2100, pace: '8:30/km', power: 0, tss: 22, title: 'Caminhada & Trote Consistente', desc: 'Aquecimento: 5 min caminhando. Principal: 8x (1 min trote leve + 1.5 min caminhada). Respire de forma calma.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para recuperação.' },
        { day: 6, type: 'Corrida', dist: 4.0, dur: 2400, pace: '8:20/km', power: 0, tss: 30, title: 'Trote Estável de Fim de Semana', desc: 'Aquecimento: 5 min caminhando. Tente correr 5 minutos contínuos duas vezes com 3 min de caminhada entre eles. Complete o tempo em caminhada ativa.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Descanse totalmente para começar bem o próximo ciclo.' }
      );
    } else if (level === 'elite') {
      workoutsToInsert.push(
        { day: 1, type: 'Ciclismo', dist: 40.0, dur: 4800, pace: '30.0 km/h', power: 190, tss: 50, title: 'Giro Regenerativo Ativo', desc: 'Giro leve em Zona 1/2 com cadência acima de 90 RPM.' },
        { day: 2, type: 'Corrida', dist: 14.0, dur: 3960, pace: '4:45/km', power: 0, tss: 90, title: 'Intervalado de Limiar de Lactato', desc: 'Principal: 5x 1200m a ritmo de 3:45/km com 2 min de trote de recuperação.' },
        { day: 3, type: 'Natacao', dist: 3.0, dur: 3600, pace: '1:50/100m', power: 0, tss: 55, title: 'Sessão Técnica e Endurance Z2', desc: 'Séries longas de 400m mantendo ritmo estável aeróbico.' },
        { day: 4, type: 'Ciclismo', dist: 65.0, dur: 7800, pace: '31.0 km/h', power: 235, tss: 115, title: 'Intervalado Sweet Spot (SST)', desc: 'Principal: 3x 15 min a 90% do FTP (Watts) com cadência controlada.' },
        { day: 5, type: 'Forca', dist: 0.0, dur: 2700, pace: 'N/A', power: 0, tss: 25, title: 'Força Funcional de Alta Performance', desc: 'Foco em força máxima e prevenção de lesões para pernas e estabilizadores.' },
        { day: 6, type: 'Corrida', dist: 28.0, dur: 7800, pace: '4:40/km', power: 0, tss: 220, title: 'Longo de Resistência Z2 Aeróbia', desc: 'Corrida longa constante em ritmo aeróbico simulando Ironman.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Supercompensação Fisiológica', desc: 'Descanso completo. Hidratação e nutrição adequadas.' }
      );
    } else {
      // Intermediário (Padrão)
      workoutsToInsert.push(
        { day: 1, type: 'Corrida', dist: 6.0, dur: 2160, pace: '6:00/km', power: 0, tss: 35, title: 'Corrida Leve Aeróbia Z2', desc: 'Corrida confortável em ritmo conversacional para ganho de base aeróbia.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Permita que seus músculos se recuperem do estresse acumulado.' },
        { day: 3, type: 'Corrida', dist: 8.0, dur: 2880, pace: '5:45/km', power: 0, tss: 60, title: 'Treino de Ritmo / Tempo Run', desc: 'Principal: 20 min contínuos em ritmo moderado/forte (Pace ~5:10/km). Excelente estímulo de limiar.' },
        { day: 4, type: 'Forca', dist: 0.0, dur: 2400, pace: 'N/A', power: 0, tss: 15, title: 'Fortalecimento Geral de Pernas & Core', desc: 'Agachamentos, passadas e pranchas para estabilização articular.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para relaxamento e regeneração.' },
        { day: 6, type: 'Corrida', dist: 12.0, dur: 4680, pace: '6:30/km', power: 0, tss: 110, title: 'Treino Longo de Fim de Semana', desc: 'O treino mais longo da semana. Foco em ritmo estável de Zona 2. Hidrate-se bem antes e depois.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia de repouso total.' }
      );
    }

    for (const w of workoutsToInsert) {
      await db.run(`
        INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, planId, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
    }

    // Criar notificação de boas-vindas personalizada
    await db.run(`
      INSERT INTO coach_notifs (user_id, date, title, content)
      VALUES (?, ?, 'Planilha Gerada com Sucesso!', 'Parabéns, ${name}! Analisei seus dados de onboarding e estruturei seu microciclo de treinos focando em seu objetivo de ${goalType} (${goalDistance} km). Conecte seu Strava para que eu possa avaliar suas métricas de execução e calibrar seus limites dinamicamente.')
    `, userId, formatDate(new Date()));

    return NextResponse.json({
      success: true,
      userId,
      message: 'Onboarding concluído com sucesso e planilha criada!'
    });

  } catch (error: any) {
    console.error('Erro no processamento do Onboarding:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const athletes = await db.all('SELECT id, name, level FROM users ORDER BY id ASC');
    return NextResponse.json({ success: true, athletes });
  } catch (error: any) {
    console.error('Erro ao listar atletas:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}
