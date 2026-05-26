import { NextResponse } from 'next/server';
import { getDb, getWeekDates, formatDate, generateWorkoutsForPlan } from '@/lib/db';

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

    const workoutsToInsert = generateWorkoutsForPlan(goalType, level);

    for (const w of workoutsToInsert) {
      await db.run(`
        INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, planId, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
    }

    // Criar notificação de boas-vindas personalizada
    await db.run(`
      INSERT INTO coach_notifs (user_id, date, title, content)
      VALUES (?, ?, 'Planilha Gerada com Sucesso!', 'Parabéns, ${name}! Analisei seus dados de onboarding e estruturei seu microciclo de treinos focando em seu objetivo de ${goalType} (${goalDistance} km). Conecte seu Strava para que o Assistente Fisiológico possa avaliar suas métricas de execução e calibrar seus limites dinamicamente.')
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
