import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculatePhysioMetrics } from '@/lib/coach-engine';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get('userId') || '1';
    const userId = parseInt(userIdStr, 10);

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

    return NextResponse.json({
      user,
      goal,
      plan: activePlan || null,
      workouts,
      activityLogs,
      notifications,
      metrics: physioMetrics
    });

  } catch (error: any) {
    console.error('Erro na API de Dashboard:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
