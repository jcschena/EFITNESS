import { NextResponse } from 'next/server';
import { getDb, getWeekDates, formatDate } from '@/lib/db';
import { generateWorkoutsForPlan } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // 1. Apagar os treinos antigos associados à planilha ID 3
    await db.run('DELETE FROM workouts WHERE plan_id = 3');
    
    // 2. Gerar a planilha de treinos no nível Elite/Avançado
    const weekDates = getWeekDates();
    const workouts = generateWorkoutsForPlan('Corrida', 'elite');
    
    // 3. Inserir os treinos corretos do nível Avançado para a planilha ID 3
    for (const w of workouts) {
      await db.run(`
        INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, 3, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
    }
    
    // Obter os novos treinos inseridos para verificar
    const newWorkouts = await db.all('SELECT id, plan_id, day_of_week, date, type, title FROM workouts WHERE plan_id = 3 ORDER BY day_of_week ASC');

    return NextResponse.json({
      success: true,
      message: 'Treinos da assessoria atualizados com sucesso para o nível Avançado.',
      workouts: newWorkouts
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao atualizar treinos'
    }, { status: 500 });
  }
}
