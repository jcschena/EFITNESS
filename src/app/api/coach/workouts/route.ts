import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { workoutId, title, type, distance_target, duration_target, pace_target, power_target, tss_target, description, status } = data;

    if (!workoutId) {
      return NextResponse.json({ success: false, error: 'O parâmetro workoutId é obrigatório.' }, { status: 400 });
    }

    const db = await getDb();

    // Validar se o treino existe
    const workout = await db.get('SELECT id FROM workouts WHERE id = ?', workoutId);
    if (!workout) {
      return NextResponse.json({ success: false, error: 'Treino não encontrado.' }, { status: 404 });
    }

    // Atualizar no banco
    await db.run(
      `UPDATE workouts 
       SET title = ?, 
           type = ?, 
           distance_target = ?, 
           duration_target = ?, 
           pace_target = ?, 
           power_target = ?, 
           tss_target = ?, 
           description = ?, 
           status = ? 
       WHERE id = ?`,
      title || 'Treino',
      type || 'Corrida',
      distance_target !== undefined ? parseFloat(distance_target) : 0,
      duration_target !== undefined ? parseInt(duration_target, 10) : 0,
      pace_target || 'N/A',
      power_target !== undefined ? parseInt(power_target, 10) : 0,
      tss_target !== undefined ? parseInt(tss_target, 10) : 0,
      description || '',
      status || 'adjusted',
      workoutId
    );

    return NextResponse.json({
      success: true,
      message: 'Treino atualizado pelo coach com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro na API de atualização de treinos pelo coach:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');

    if (!athleteId) {
      return NextResponse.json({ success: false, error: 'O parâmetro athleteId é obrigatório.' }, { status: 400 });
    }

    const db = await getDb();

    // Carregar planilha ativa
    const activePlan = await db.get('SELECT id, name FROM training_plans WHERE user_id = ? AND active = 1', parseInt(athleteId, 10));
    if (!activePlan) {
      return NextResponse.json({ success: true, workouts: [], planName: 'Sem planilha ativa' });
    }

    // Carregar treinos
    const workouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', activePlan.id);

    return NextResponse.json({
      success: true,
      workouts,
      planName: activePlan.name
    });

  } catch (error: any) {
    console.error('Erro ao buscar treinos do atleta para o coach:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    }, { status: 500 });
  }
}
