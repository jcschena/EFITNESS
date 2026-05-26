import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculatePhysioMetrics } from '@/lib/coach-engine';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coachIdStr = searchParams.get('coachId');

    if (!coachIdStr) {
      return NextResponse.json({ success: false, error: 'O parâmetro coachId é obrigatório.' }, { status: 400 });
    }

    const coachId = parseInt(coachIdStr, 10);
    const db = await getDb();

    // 0. Obter dados do treinador logado para saber se é administrador ou professor subordinado
    const loggedUser = await db.get('SELECT id, role, parent_coach_id FROM users WHERE id = ?', coachId);
    if (!loggedUser || loggedUser.role !== 'coach') {
      return NextResponse.json({ success: false, error: 'Treinador não autorizado.' }, { status: 403 });
    }

    const isSubTeacher = loggedUser.parent_coach_id !== null;
    const advisoryAdminId = isSubTeacher ? loggedUser.parent_coach_id : loggedUser.id;

    // 1. Obter atletas vinculados a esta assessoria (e filtrar por professor se for subordinado)
    let athletes;
    if (isSubTeacher) {
      athletes = await db.all(
        `SELECT id, name, level, weight, threshold_hr, threshold_pace, strava_connected, teacher_id 
         FROM users 
         WHERE coach_id = ? AND teacher_id = ? AND role = 'athlete' 
         ORDER BY name ASC`, 
        advisoryAdminId, 
        loggedUser.id
      );
    } else {
      athletes = await db.all(
        `SELECT id, name, level, weight, threshold_hr, threshold_pace, strava_connected, teacher_id 
         FROM users 
         WHERE coach_id = ? AND role = 'athlete' 
         ORDER BY name ASC`, 
        advisoryAdminId
      );
    }

    const athletesWithMetrics = [];

    for (const athlete of athletes) {
      // Calcular métricas fisiológicas acumuladas (CTL, ATL, TSB)
      const metrics = await calculatePhysioMetrics(db, athlete.id);

      // Obter progresso da semana corrente
      const activePlan = await db.get('SELECT * FROM training_plans WHERE user_id = ? AND active = 1', athlete.id);
      let weeklyTssTarget = 0;
      let weeklyTssReal = 0;
      let nextWorkout = 'Nenhum';
      let planName = 'Nenhum plano ativo';

      if (activePlan) {
        planName = activePlan.name;
        const workouts = await db.all('SELECT * FROM workouts WHERE plan_id = ?', activePlan.id);
        weeklyTssTarget = workouts.reduce((acc, w) => acc + (w.tss_target || 0), 0);

        const activityLogs = await db.all(`
          SELECT * FROM activity_logs 
          WHERE user_id = ? 
            AND timestamp >= ? 
            AND timestamp <= ?
        `, athlete.id, activePlan.start_date + 'T00:00:00', activePlan.end_date + 'T23:59:59');
        weeklyTssReal = activityLogs.reduce((acc, al) => acc + (al.tss_real || 0), 0);

        const pending = workouts.find(w => w.status === 'pending' || w.status === 'adjusted');
        if (pending) {
          nextWorkout = `${pending.title} (${pending.type})`;
        }
      }

      // Obter informações do professor atribuído
      let teacherName = 'Nenhum';
      if (athlete.teacher_id) {
        const tObj = await db.get('SELECT name FROM users WHERE id = ?', athlete.teacher_id);
        if (tObj) teacherName = tObj.name;
      }

      athletesWithMetrics.push({
        id: athlete.id,
        name: athlete.name,
        level: athlete.level,
        weight: athlete.weight,
        thresholdHr: athlete.threshold_hr,
        thresholdPace: athlete.threshold_pace,
        stravaConnected: athlete.strava_connected === 1,
        teacherId: athlete.teacher_id,
        teacherName,
        metrics: {
          ctl: Math.round(metrics.ctl),
          atl: Math.round(metrics.atl),
          tsb: Math.round(metrics.tsb)
        },
        weeklyProgress: {
          planName,
          targetTss: weeklyTssTarget,
          realTss: weeklyTssReal,
          nextWorkout
        }
      });
    }

    // 2. Obter as chaves de acesso (cupom) da assessoria
    const accessKeys = await db.all('SELECT * FROM access_keys WHERE coach_id = ?', advisoryAdminId);

    // Contar total de alunos vinculados
    const totalAthletes = athletes.length;

    // 3. Obter lista de professores disponíveis para a assessoria líder (usada no seletor de atribuição)
    const teachers = isSubTeacher ? [] : await db.all('SELECT id, name FROM users WHERE role = \'coach\' AND parent_coach_id = ?', advisoryAdminId);

    return NextResponse.json({
      success: true,
      athletes: athletesWithMetrics,
      accessKeys,
      totalAthletes,
      teachers,
      isSubTeacher,
      parentCoachId: loggedUser.parent_coach_id
    });

  } catch (error: any) {
    console.error('Erro na API de listagem de atletas do coach:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    }, { status: 500 });
  }
}
