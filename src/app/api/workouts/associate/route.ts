import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { autoRegulateTrainingPlan } from '@/lib/coach-engine';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const db = await getDb();

    const { workoutId, activityLogId, userId, unlink } = payload;
    const uId = parseInt(userId || '1', 10);

    if (unlink) {
      const wId = parseInt(workoutId, 10);
      const workout = await db.get('SELECT * FROM workouts WHERE id = ?', wId);
      if (!workout) {
        return NextResponse.json({ error: 'Treino planejado não encontrado' }, { status: 404 });
      }

      // Desassociar a atividade
      await db.run('UPDATE activity_logs SET workout_id = NULL WHERE workout_id = ?', wId);
      
      // Voltar status do treino para pending
      await db.run("UPDATE workouts SET status = 'pending' WHERE id = ?", wId);

      return NextResponse.json({
        success: true,
        message: 'Correspondência manual removida com sucesso!'
      });
    }

    const wId = parseInt(workoutId, 10);
    const logId = parseInt(activityLogId, 10);

    const workout = await db.get('SELECT * FROM workouts WHERE id = ?', wId);
    if (!workout) {
      return NextResponse.json({ error: 'Treino planejado não encontrado' }, { status: 404 });
    }

    const log = await db.get('SELECT * FROM activity_logs WHERE id = ?', logId);
    if (!log) {
      return NextResponse.json({ error: 'Atividade do Strava não encontrada' }, { status: 404 });
    }

    // Vincular no banco
    await db.run('UPDATE activity_logs SET workout_id = ? WHERE id = ?', wId, logId);
    await db.run("UPDATE workouts SET status = 'completed' WHERE id = ?", wId);

    // Disparar o motor de auto-regulação com base no novo treino concluído
    await autoRegulateTrainingPlan(db, uId, wId, log.tss_real, log.timestamp);

    return NextResponse.json({
      success: true,
      message: 'Correspondência manual realizada com sucesso!'
    });

  } catch (error: unknown) {
    console.error('Erro ao processar correspondência manual:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
