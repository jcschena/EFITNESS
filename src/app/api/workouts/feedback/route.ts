import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workoutIdStr = searchParams.get('workoutId');

    if (!workoutIdStr) {
      return NextResponse.json({ error: 'workoutId é obrigatório' }, { status: 400 });
    }

    const workoutId = parseInt(workoutIdStr, 10);
    const db = await getDb();

    const feedbacks = await db.all(
      'SELECT id, workout_id, sender_role, message, timestamp FROM workout_feedbacks WHERE workout_id = ? ORDER BY timestamp ASC',
      workoutId
    );

    return NextResponse.json({ feedbacks });
  } catch (error: any) {
    console.error('Erro ao obter feedbacks de treino:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { workoutId, senderRole, message } = payload;

    if (!workoutId || !senderRole || !message) {
      return NextResponse.json({ error: 'workoutId, senderRole e message são obrigatórios' }, { status: 400 });
    }

    const wId = parseInt(workoutId, 10);
    const db = await getDb();

    // Validar se o treino existe
    const workout = await db.get('SELECT id, title FROM workouts WHERE id = ?', wId);
    if (!workout) {
      return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    
    await db.run(
      'INSERT INTO workout_feedbacks (workout_id, sender_role, message, timestamp) VALUES (?, ?, ?, ?)',
      wId,
      senderRole,
      message,
      timestamp
    );

    // Também podemos inserir uma notificação se for o atleta enviando ao coach
    if (senderRole === 'athlete') {
      try {
        // Encontrar o user_id (atleta) dono deste treino
        const athlete = await db.get(
          `SELECT tp.user_id, tp.name as plan_name, u.name as athlete_name 
           FROM workouts w 
           JOIN training_plans tp ON w.plan_id = tp.id 
           JOIN users u ON tp.user_id = u.id 
           WHERE w.id = ?`,
          wId
        );
        if (athlete) {
          // Criar uma notificação de sistema para o coach (ou para o painel de notificações)
          await db.run(
            `INSERT INTO coach_notifs (user_id, date, title, content, read) 
             VALUES (?, ?, ?, ?, 0)`,
            athlete.user_id, // O coach_notifs usa o user_id do atleta para associar as notificações deste atleta
            timestamp.split('T')[0],
            `Feedback de Treino - ${athlete.athlete_name}`,
            `Novo feedback enviado no treino "${workout.title || 'Treino'}": "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
          );
        }
      } catch (err) {
        console.warn('Erro ao inserir notificação de coach:', err);
      }
    }

    return NextResponse.json({ success: true, timestamp });
  } catch (error: any) {
    console.error('Erro ao salvar feedback de treino:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
