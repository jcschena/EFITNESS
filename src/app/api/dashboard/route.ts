import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculatePhysioMetrics } from '@/lib/coach-engine';
import { getCelebration } from '@/lib/celebrations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get('userId') || '1';
    const userId = parseInt(userIdStr, 10);
    const clientDate = searchParams.get('clientDate') || undefined;

    const db = await getDb();

    // 1. Obter Usuário
    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Obter Goal
    const goal = await db.get('SELECT * FROM goals WHERE user_id = ? ORDER BY date_target ASC LIMIT 1', userId);

    // 3. Obter Planilha Ativa
    const activePlan = await db.get('SELECT * FROM training_plans WHERE user_id = ? AND active = 1', userId);
    
    let workouts: any[] = [];
    if (activePlan) {
      // Obter treinos da planilha ativa
      workouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC', activePlan.id);
    }

    // 4. Obter Logs de Atividades realizados na semana
    let activityLogs: any[] = [];
    if (workouts.length > 0) {
      const workoutIds = workouts.map(w => w.id).join(',');
      activityLogs = await db.all(`
        SELECT * FROM activity_logs 
        WHERE workout_id IN (${workoutIds})
        ORDER BY timestamp DESC
      `);
    }

    // 5. Obter Notificações Recentes do Coach
    const notifications = await db.all(
      'SELECT * FROM coach_notifs WHERE user_id = ? ORDER BY id DESC LIMIT 5', 
      userId
    );

    // 6. Calcular Métricas de Fadiga (CTL, ATL, TSB)
    const physioMetrics = await calculatePhysioMetrics(db, userId);

    // 7. Obter o último treino absoluto sincronizado do Strava para o usuário
    let lastSyncedActivity = await db.get(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1',
      userId
    );
    if (!lastSyncedActivity) {
      // Fallback para treinos antigos
      lastSyncedActivity = await db.get(`
        SELECT al.* FROM activity_logs al
        JOIN workouts w ON al.workout_id = w.id
        JOIN training_plans tp ON w.plan_id = tp.id
        WHERE tp.user_id = ?
        ORDER BY al.timestamp DESC LIMIT 1
      `, userId);
    }

    // 8. Verificar se hoje é alguma comemoração especial (Aniversário ou Feriado)
    const celebration = getCelebration(user.birth_date, clientDate);

    return NextResponse.json({
      user,
      goal,
      plan: activePlan || null,
      workouts,
      activityLogs,
      notifications,
      metrics: physioMetrics,
      lastSyncedActivity: lastSyncedActivity || null,
      celebration
    });

  } catch (error: any) {
    console.error('Erro na API de Dashboard:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
