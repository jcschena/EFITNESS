import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      workoutId, 
      planId, 
      day_of_week, 
      title, 
      type, 
      distance_target, 
      duration_target, 
      pace_target, 
      power_target, 
      tss_target, 
      description, 
      status 
    } = data;

    const db = await getDb();

    if (workoutId) {
      // Validar se o treino existe
      const workout = await db.get('SELECT * FROM workouts WHERE id = ?', workoutId);
      if (!workout) {
        return NextResponse.json({ success: false, error: 'Treino não encontrado.' }, { status: 404 });
      }

      // Merge data para permitir atualizações parciais (ex: apenas mudar o dia arrastando)
      const finalTitle = title !== undefined ? title : workout.title;
      const finalType = type !== undefined ? type : workout.type;
      const finalDistance = distance_target !== undefined ? parseFloat(distance_target) : workout.distance_target;
      const finalDuration = duration_target !== undefined ? parseInt(duration_target, 10) : workout.duration_target;
      const finalPace = pace_target !== undefined ? pace_target : workout.pace_target;
      const finalPower = power_target !== undefined ? parseInt(power_target, 10) : workout.power_target;
      const finalTss = tss_target !== undefined ? parseInt(tss_target, 10) : workout.tss_target;
      const finalDesc = description !== undefined ? description : workout.description;
      const finalStatus = status !== undefined ? status : workout.status;
      const finalDayOfWeek = day_of_week !== undefined ? parseInt(day_of_week, 10) : workout.day_of_week;

      let finalDate = workout.date;
      if (day_of_week !== undefined && parseInt(day_of_week, 10) !== workout.day_of_week) {
        const plan = await db.get('SELECT start_date FROM training_plans WHERE id = ?', workout.plan_id);
        if (plan) {
          const baseDate = new Date(plan.start_date + 'T12:00:00');
          baseDate.setDate(baseDate.getDate() + (finalDayOfWeek - 1));
          
          const yyyy = baseDate.getFullYear();
          const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
          const dd = String(baseDate.getDate()).padStart(2, '0');
          finalDate = `${yyyy}-${mm}-${dd}`;
        }
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
             status = ?,
             day_of_week = ?,
             date = ?
         WHERE id = ?`,
        finalTitle,
        finalType,
        finalDistance,
        finalDuration,
        finalPace,
        finalPower,
        finalTss,
        finalDesc,
        finalStatus,
        finalDayOfWeek,
        finalDate,
        workoutId
      );

      return NextResponse.json({
        success: true,
        message: 'Treino atualizado pelo coach com sucesso!'
      });
    } else {
      // Criar novo treino
      if (!planId) {
        return NextResponse.json({ success: false, error: 'O parâmetro planId é obrigatório para novos treinos.' }, { status: 400 });
      }
      if (!day_of_week) {
        return NextResponse.json({ success: false, error: 'O parâmetro day_of_week é obrigatório.' }, { status: 400 });
      }

      // Buscar start_date do plano para calcular a data do treino
      const plan = await db.get('SELECT start_date FROM training_plans WHERE id = ?', planId);
      if (!plan) {
        return NextResponse.json({ success: false, error: 'Planilha não encontrada.' }, { status: 404 });
      }

      const baseDate = new Date(plan.start_date + 'T12:00:00');
      baseDate.setDate(baseDate.getDate() + (parseInt(day_of_week, 10) - 1));
      
      const yyyy = baseDate.getFullYear();
      const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
      const dd = String(baseDate.getDate()).padStart(2, '0');
      const calculatedDate = `${yyyy}-${mm}-${dd}`;

      const res = await db.run(
        `INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        planId,
        parseInt(day_of_week, 10),
        calculatedDate,
        type || 'Corrida',
        distance_target !== undefined ? parseFloat(distance_target) : 0,
        duration_target !== undefined ? parseInt(duration_target, 10) : 0,
        pace_target || 'N/A',
        power_target !== undefined ? parseInt(power_target, 10) : 0,
        tss_target !== undefined ? parseInt(tss_target, 10) : 0,
        title || 'Novo Treino',
        description || '',
        status || 'pending'
      );

      return NextResponse.json({
        success: true,
        message: 'Novo treino inserido com sucesso!',
        workoutId: res.lastID
      });
    }

  } catch (error: any) {
    console.error('Erro na API de treinos pelo coach:', error);
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
    const activePlan = await db.get('SELECT id, name, start_date FROM training_plans WHERE user_id = ? AND active = 1', parseInt(athleteId, 10));
    if (!activePlan) {
      return NextResponse.json({ success: true, workouts: [], planName: 'Sem planilha ativa' });
    }

    // Carregar treinos
    const workouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', activePlan.id);

    return NextResponse.json({
      success: true,
      workouts,
      planName: activePlan.name,
      planId: activePlan.id,
      startDate: activePlan.start_date
    });

  } catch (error: any) {
    console.error('Erro ao buscar treinos do atleta para o coach:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workoutId = searchParams.get('workoutId');

    if (!workoutId) {
      return NextResponse.json({ success: false, error: 'O parâmetro workoutId é obrigatório.' }, { status: 400 });
    }

    const db = await getDb();

    // Validar se o treino existe
    const workout = await db.get('SELECT id FROM workouts WHERE id = ?', parseInt(workoutId, 10));
    if (!workout) {
      return NextResponse.json({ success: false, error: 'Treino não encontrado.' }, { status: 404 });
    }

    // Deletar do banco
    await db.run('DELETE FROM workouts WHERE id = ?', parseInt(workoutId, 10));

    return NextResponse.json({
      success: true,
      message: 'Treino deletado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro na API de exclusão de treino pelo coach:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    }, { status: 500 });
  }
}

