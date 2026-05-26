import { NextResponse } from 'next/server';
import { getDb, getWeekDates, formatDate, generateWorkoutsForPlan } from '@/lib/db';
import { getBestMatchingPlan, getWeeksAfterCut } from '@/lib/training-library';

// GET: Listar todas as provas de um usuário
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get('userId');
    if (!userIdStr) {
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 });
    }
    const userId = parseInt(userIdStr, 10);
    const db = await getDb();

    const races = await db.all(
      'SELECT * FROM races WHERE user_id = ? ORDER BY date_time ASC',
      userId
    );

    return NextResponse.json({ success: true, races });
  } catch (error: any) {
    console.error('Erro ao buscar calendário de provas:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}

// POST: Criar ou editar uma prova
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDb();

    const {
      id,
      userId,
      name,
      organizer,
      website,
      date_time,
      sport_type,
      distance,
      country,
      city,
      is_target,
      daily_available_hours,
      train_in_morning,
      morning_available_time,
      train_at_lunch,
      lunch_available_time,
      train_at_night,
      night_available_time
    } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'O nome da prova é obrigatório' }, { status: 400 });
    }
    if (!date_time) {
      return NextResponse.json({ success: false, error: 'A data e horário da prova são obrigatórios' }, { status: 400 });
    }
    if (!sport_type) {
      return NextResponse.json({ success: false, error: 'O tipo de esporte é obrigatório' }, { status: 400 });
    }
    const parsedDistance = parseFloat(String(distance).replace(',', '.'));
    if (isNaN(parsedDistance) || parsedDistance <= 0) {
      return NextResponse.json({ success: false, error: 'A distância deve ser um número positivo válido' }, { status: 400 });
    }

    const uId = parseInt(userId, 10);
    const isTargetVal = is_target ? 1 : 0;

    let raceId = id ? parseInt(id, 10) : null;
    let isNew = !raceId;

    if (isNew) {
      const result = await db.run(`
        INSERT INTO races (user_id, name, organizer, website, date_time, sport_type, distance, country, city, is_target)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, uId, name.trim(), organizer?.trim() || null, website?.trim() || null, date_time, sport_type, parsedDistance, country?.trim() || null, city?.trim() || null, isTargetVal);
      raceId = result.lastID || null;
    } else {
      await db.run(`
        UPDATE races
        SET name = ?,
            organizer = ?,
            website = ?,
            date_time = ?,
            sport_type = ?,
            distance = ?,
            country = ?,
            city = ?,
            is_target = ?
        WHERE id = ? AND user_id = ?
      `, name.trim(), organizer?.trim() || null, website?.trim() || null, date_time, sport_type, parsedDistance, country?.trim() || null, city?.trim() || null, isTargetVal, raceId, uId);
    }

    // Se for marcada como Prova Alvo, realizar toda a periodização
    if (isTargetVal === 1) {
      // 1. Desmarcar as outras provas do usuário como alvo
      await db.run(
        'UPDATE races SET is_target = 0 WHERE user_id = ? AND id != ?',
        uId,
        raceId
      );

      // 2. Obter perfil do usuário para saber o nível
      const user = await db.get('SELECT level FROM users WHERE id = ?', uId);
      if (user) {
        // Estimar carga semanal com base no nível
        let weeklyTssTarget = 240;
        if (user.level === 'elite') {
          weeklyTssTarget = 550;
        } else if (user.level === 'sedentario') {
          weeklyTssTarget = 100;
        }

        const dateTargetOnly = date_time.split('T')[0];

        // 3. Sincronizar com a tabela goals
        const existingGoal = await db.get(
          'SELECT id, target_time FROM goals WHERE user_id = ? ORDER BY date_target ASC LIMIT 1',
          uId
        );

        const targetTime = existingGoal?.target_time || '01:00:00';

        const trainInMorningVal = train_in_morning !== undefined ? (train_in_morning ? 1 : 0) : 1;
        const morningTimeVal = morning_available_time !== undefined ? parseInt(String(morning_available_time), 10) : 60;
        const trainAtLunchVal = train_at_lunch ? 1 : 0;
        const lunchTimeVal = lunch_available_time ? parseInt(String(lunch_available_time), 10) : 0;
        const trainAtNightVal = train_at_night !== undefined ? (train_at_night ? 1 : 0) : 1;
        const nightTimeVal = night_available_time !== undefined ? parseInt(String(night_available_time), 10) : 60;

        const calculatedHours = ((trainInMorningVal * morningTimeVal + trainAtLunchVal * lunchTimeVal + trainAtNightVal * nightTimeVal) / 60);
        const dailyHoursVal = daily_available_hours ? parseFloat(String(daily_available_hours).replace(',', '.')) : calculatedHours;

        if (existingGoal) {
          await db.run(`
            UPDATE goals
            SET type = ?,
                distance = ?,
                date_target = ?,
                target_time = ?,
                weekly_tss_target = ?,
                daily_available_hours = ?,
                train_in_morning = ?,
                morning_available_time = ?,
                train_at_lunch = ?,
                lunch_available_time = ?,
                train_at_night = ?,
                night_available_time = ?
            WHERE id = ?
          `, sport_type, parsedDistance, dateTargetOnly, targetTime, weeklyTssTarget, dailyHoursVal, trainInMorningVal, morningTimeVal, trainAtLunchVal, lunchTimeVal, trainAtNightVal, nightTimeVal, existingGoal.id);
        } else {
          await db.run(`
            INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target, daily_available_hours, train_in_morning, morning_available_time, train_at_lunch, lunch_available_time, train_at_night, night_available_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, uId, sport_type, parsedDistance, dateTargetOnly, targetTime, weeklyTssTarget, dailyHoursVal, trainInMorningVal, morningTimeVal, trainAtLunchVal, lunchTimeVal, trainAtNightVal, nightTimeVal);
        }

        // 4. Buscar melhor planilha da biblioteca baseada no objetivo e nível
        const recommendedPlan = getBestMatchingPlan(sport_type, user.level, parsedDistance);
        
        // Calcular datas da semana corrente
        const systemToday = new Date();
        const day = systemToday.getDay();
        const diff = systemToday.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(systemToday);
        monday.setDate(diff);
        const startOfWeekStr = formatDate(monday);
        
        // Calcular semanas disponíveis
        const targetDate = new Date(dateTargetOnly + 'T12:00:00');
        const mondayDate = new Date(startOfWeekStr + 'T12:00:00');
        const diffTime = targetDate.getTime() - mondayDate.getTime();
        const weeksAvailable = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));
        
        let totalWeeks = recommendedPlan.weeks;
        let actualWeeksToUse = recommendedPlan.weeks;
        let finalCutChoice = 'none';
        
        const originalWeekIndices = Array.from({ length: totalWeeks }, (_, i) => i);
        let selectedWeekIndices = [...originalWeekIndices];
        
        if (weeksAvailable > 0 && weeksAvailable < totalWeeks) {
          actualWeeksToUse = weeksAvailable;
          finalCutChoice = 'ambos';
          selectedWeekIndices = getWeeksAfterCut(originalWeekIndices, weeksAvailable, 'ambos');
        }

        const activePlan = await db.get(
          'SELECT id, name FROM training_plans WHERE user_id = ? AND active = 1',
          uId
        );

        let planId: number;
        const planName = `${recommendedPlan.name} (${recommendedPlan.author}) - Calibrada a 100%`;

        if (activePlan) {
          planId = activePlan.id;
          await db.run('DELETE FROM workouts WHERE plan_id = ?', planId);
          await db.run(`
            UPDATE training_plans
            SET name = ?,
                library_id = ?,
                effort_pct = 100,
                cut_choice = ?,
                current_week = 1,
                total_weeks = ?,
                start_cycle_date = ?
            WHERE id = ?
          `, planName, recommendedPlan.id, finalCutChoice, actualWeeksToUse, startOfWeekStr, planId);
        } else {
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          const endOfWeekStr = formatDate(sunday);
          
          const planInsert = await db.run(`
            INSERT INTO training_plans (
              user_id, name, start_date, end_date, active, 
              library_id, effort_pct, cut_choice, current_week, total_weeks, start_cycle_date
            ) VALUES (?, ?, ?, ?, 1, ?, 100, ?, 1, ?, ?)
          `, 
            uId, 
            planName, 
            startOfWeekStr, 
            endOfWeekStr, 
            recommendedPlan.id, 
            finalCutChoice, 
            actualWeeksToUse, 
            startOfWeekStr
          );
          planId = planInsert.lastID!;
        }

        // Gerar e inserir os treinos da Semana 1 do novo plano
        const originalWeeksData = recommendedPlan.generateWeeks(100);
        const firstWeekIndex = selectedWeekIndices[0] ?? 0;
        const firstWeekWorkouts = originalWeeksData[firstWeekIndex] || [];
        const weekDates = getWeekDates(startOfWeekStr);

        for (const w of firstWeekWorkouts) {
          const workoutDate = formatDate(weekDates[w.day - 1]);
          await db.run(`
            INSERT INTO workouts (
              plan_id, day_of_week, date, type, distance_target, 
              duration_target, pace_target, power_target, tss_target, title, description, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          `,
            planId,
            w.day,
            workoutDate,
            w.type,
            w.dist,
            w.dur,
            w.pace,
            typeof w.power === 'number' ? w.power : 0,
            w.tss,
            w.title,
            w.desc
          );
        }

        // 5. Inserir notificação de periodização do Coach IA
        const todayStr = formatDate(new Date());
        const formattedDate = new Date(date_time).toLocaleDateString('pt-BR');
        const weekCountMsg = actualWeeksToUse === totalWeeks 
          ? `completa de ${totalWeeks} semanas`
          : `ajustada para ${actualWeeksToUse} semanas (corte: ${finalCutChoice === 'ambos' ? 'misto/equilibrado' : finalCutChoice})`;

        await db.run(`
          INSERT INTO coach_notifs (user_id, date, title, content, read)
          VALUES (?, ?, 'Nova Prova Alvo Definida! 🎯', ?, 0)
        `, uId, todayStr, `Defini a sua planilha baseada na planilha periodizada "${recommendedPlan.name}" de ${recommendedPlan.author} da nossa biblioteca. Ela foi ${weekCountMsg} e calibrada para 100% do seu esforço para focar na sua nova Prova Alvo: "${name.trim()}" que será realizada em ${formattedDate}. Acesse a aba da Biblioteca de Planilhas se desejar calibrar a intensidade ou o ajuste de calendário!`);
      }
    }

    return NextResponse.json({
      success: true,
      message: isNew ? 'Prova cadastrada com sucesso!' : 'Prova atualizada com sucesso!',
      raceId
    });

  } catch (error: any) {
    console.error('Erro ao salvar prova:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}

// DELETE: Excluir uma prova
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');
    const userIdStr = searchParams.get('userId');

    if (!idStr || !userIdStr) {
      return NextResponse.json({ success: false, error: 'id e userId são obrigatórios' }, { status: 400 });
    }

    const id = parseInt(idStr, 10);
    const userId = parseInt(userIdStr, 10);
    const db = await getDb();

    // Buscar a prova para saber se era alvo
    const race = await db.get(
      'SELECT is_target FROM races WHERE id = ? AND user_id = ?',
      id,
      userId
    );

    if (!race) {
      return NextResponse.json({ success: false, error: 'Prova não encontrada' }, { status: 404 });
    }

    await db.run('DELETE FROM races WHERE id = ? AND user_id = ?', id, userId);

    return NextResponse.json({
      success: true,
      message: 'Prova excluída com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao excluir prova:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}
