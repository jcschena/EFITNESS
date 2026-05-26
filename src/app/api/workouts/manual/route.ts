import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateHrTSS, calculatePaceTSS, autoRegulateTrainingPlan } from '@/lib/coach-engine';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const db = await getDb();

    const {
      workoutId,
      userId,
      date,
      type,
      title,
      description,
      distanceReal,
      durationReal,
      paceReal,
      avgHr,
      maxHr,
      avgPower,
      cadency,
      elevationGain,
      syncSource,
    } = payload;

    const uId = parseInt(userId || '1', 10);
    const distReal = parseFloat(distanceReal || '0');
    const durReal = parseInt(durationReal || '0', 10); // segundos
    const hrAvg = avgHr ? parseInt(avgHr, 10) : null;
    const hrMax = maxHr ? parseInt(maxHr, 10) : null;
    const pwrAvg = avgPower ? parseInt(avgPower, 10) : null;
    const cad = cadency ? parseInt(cadency, 10) : null;
    const elev = elevationGain ? parseFloat(elevationGain) : null;
    const pace = paceReal || '0:00/km';
    let tssReal = payload.tssReal ? parseInt(payload.tssReal, 10) : 0;
    const source = syncSource || 'Manual';

    // Buscar perfil do usuário para cálculo de TSS
    const user = await db.get('SELECT * FROM users WHERE id = ?', uId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Calcular o TSS se não fornecido
    if (tssReal === 0 && durReal > 0) {
      if (type === 'Corrida' && pace !== '0:00/km') {
        tssReal = calculatePaceTSS(durReal, pace, user.threshold_pace);
      } else if (hrAvg) {
        tssReal = calculateHrTSS(durReal, hrAvg, user.threshold_hr);
      } else {
        tssReal = Math.round((durReal / 3600) * 60); // fallback genérico
      }
    }

    let finalWorkoutId = workoutId ? parseInt(workoutId, 10) : null;

    if (finalWorkoutId) {
      // 1. Completar um treino existente na planilha
      const existingWorkout = await db.get('SELECT * FROM workouts WHERE id = ?', finalWorkoutId);
      if (!existingWorkout) {
        return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });
      }

      await db.run(
        "UPDATE workouts SET status = 'completed' WHERE id = ?",
        finalWorkoutId
      );
    } else {
      // 2. Criar um novo treino extra manual na planilha ativa
      const activePlan = await db.get('SELECT * FROM training_plans WHERE user_id = ? AND active = 1', uId);
      if (!activePlan) {
        return NextResponse.json({ error: 'Nenhuma planilha ativa encontrada para este usuário' }, { status: 400 });
      }

      // Calcular dia da semana (1-Segunda a 7-Domingo)
      const d = new Date(date + 'T12:00:00');
      let dayOfWeek = d.getDay();
      dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

      const res = await db.run(
        `INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
         VALUES (?, ?, ?, ?, 0, 0, 'N/A', 0, 0, ?, ?, 'completed')`,
        activePlan.id,
        dayOfWeek,
        date,
        type,
        title || `Treino Extra de ${type}`,
        description || 'Treino extra registrado manualmente.'
      );
      finalWorkoutId = res.lastID!;
    }

    // Inserir o log na tabela activity_logs
    const timestamp = date ? `${date}T12:00:00` : new Date().toISOString();
    await db.run(
      `INSERT INTO activity_logs (
        workout_id, user_id, sync_source, timestamp, type, distance_real, duration_real, 
        pace_real, avg_hr, max_hr, avg_power, cadency, elevation_gain, tss_real
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      finalWorkoutId,
      uId,
      source,
      timestamp,
      type,
      distReal,
      durReal,
      pace,
      hrAvg,
      hrMax,
      pwrAvg,
      cad,
      elev,
      tssReal
    );

    // Disparar o Loop de Auto-Regulação Fisiológica (se não for descanso)
    if (type !== 'Descanso' && finalWorkoutId) {
      await autoRegulateTrainingPlan(db, uId, finalWorkoutId, tssReal);
    }

    return NextResponse.json({
      success: true,
      message: 'Treino lançado manualmente com sucesso!',
      workoutId: finalWorkoutId,
      tssReal
    });

  } catch (error: any) {
    console.error('Erro no processamento do lançamento manual:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
