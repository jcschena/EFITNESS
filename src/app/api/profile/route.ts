import { NextResponse } from 'next/server';
import { getDb, getWeekDates, formatDate, generateWorkoutsForPlan } from '@/lib/db';
import { getBestMatchingPlan, getWeeksAfterCut } from '@/lib/training-library';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDb();

    const userId = parseInt(data.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'ID de usuário inválido' }, { status: 400 });
    }

    const {
      name,
      birth_date,
      weight,
      level,
      threshold_hr,
      threshold_pace,
      weekly_target_hours,
      username,
      password,
      gender,
      height,
      resting_hr,
      max_hr,
      observations,
      // Campos de meta
      goal_type,
      goal_distance,
      goal_date_target,
      goal_target_time,
      goal_weekly_tss_target
    } = data;

    // 1. Validações Básicas
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'O nome é obrigatório' }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({ success: false, error: 'O nome de usuário é obrigatório' }, { status: 400 });
    }

    if (!password || !password.trim()) {
      return NextResponse.json({ success: false, error: 'A senha é obrigatória' }, { status: 400 });
    }

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return NextResponse.json({ success: false, error: 'Peso deve ser um número positivo válido' }, { status: 400 });
    }

    const parsedHr = parseInt(threshold_hr, 10);
    if (isNaN(parsedHr) || parsedHr <= 0) {
      return NextResponse.json({ success: false, error: 'A frequência cardíaca de limiar deve ser um número válido' }, { status: 400 });
    }

    const parsedHours = parseInt(weekly_target_hours, 10);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      return NextResponse.json({ success: false, error: 'A meta de horas semanais deve ser um número válido' }, { status: 400 });
    }

    // Validar formato de pace MM:SS
    const paceRegex = /^\d{1,2}:\d{2}$/;
    if (!threshold_pace || !paceRegex.test(threshold_pace)) {
      return NextResponse.json({ success: false, error: 'O ritmo de limiar deve estar no formato MM:SS (ex: 5:15)' }, { status: 400 });
    }

    const parsedHeight = height && String(height).trim() !== '' ? parseFloat(height) : null;
    const parsedRestingHr = resting_hr && String(resting_hr).trim() !== '' ? parseInt(resting_hr, 10) : null;
    const parsedMaxHr = max_hr && String(max_hr).trim() !== '' ? parseInt(max_hr, 10) : null;

    if (parsedHeight !== null && (isNaN(parsedHeight) || parsedHeight <= 0)) {
      return NextResponse.json({ success: false, error: 'A altura deve ser um número positivo válido' }, { status: 400 });
    }
    if (parsedRestingHr !== null && (isNaN(parsedRestingHr) || parsedRestingHr <= 0)) {
      return NextResponse.json({ success: false, error: 'A frequência cardíaca em repouso deve ser um número válido' }, { status: 400 });
    }
    if (parsedMaxHr !== null && (isNaN(parsedMaxHr) || parsedMaxHr <= 0)) {
      return NextResponse.json({ success: false, error: 'A frequência cardíaca máxima deve ser um número válido' }, { status: 400 });
    }

    // 2. Verificar se o usuário existe
    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 3. Verificar se o nome de usuário já está em uso por outra pessoa
    const duplicate = await db.get(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      username.trim(),
      userId
    );
    if (duplicate) {
      return NextResponse.json({ success: false, error: 'Este nome de usuário já está em uso por outro atleta' }, { status: 400 });
    }

    // 4. Calcular idade com base na data de nascimento
    let age = user.age; // manter a anterior como fallback se não enviada
    if (birth_date) {
      const birth = new Date(birth_date);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    // 5. Atualizar no Banco de Dados
    await db.run(`
      UPDATE users 
      SET name = ?,
          birth_date = ?,
          age = ?,
          weight = ?,
          level = ?,
          threshold_hr = ?,
          threshold_pace = ?,
          weekly_target_hours = ?,
          username = ?,
          password = ?,
          gender = ?,
          height = ?,
          resting_hr = ?,
          max_hr = ?,
          observations = ?
      WHERE id = ?
    `, 
      name.trim(),
      birth_date || null,
      age,
      parsedWeight,
      level || 'intermediario',
      parsedHr,
      threshold_pace.trim(),
      parsedHours,
      username.trim(),
      password,
      gender || null,
      parsedHeight,
      parsedRestingHr,
      parsedMaxHr,
      observations || null,
      userId
    );

    // 6. Atualizar Objetivo (Goal) do usuário
    const existingGoal = await db.get(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY date_target ASC LIMIT 1',
      userId
    );

    if (goal_type) {
      const parsedGoalDistance = parseFloat(String(goal_distance || '0').replace(',', '.'));
      const parsedGoalTss = parseInt(String(goal_weekly_tss_target || '0'), 10);
      
      if (existingGoal) {
        await db.run(`
          UPDATE goals
          SET type = ?,
              distance = ?,
              date_target = ?,
              target_time = ?,
              weekly_tss_target = ?
          WHERE id = ?
        `,
          goal_type,
          isNaN(parsedGoalDistance) ? 0 : parsedGoalDistance,
          goal_date_target || null,
          goal_target_time || null,
          isNaN(parsedGoalTss) ? 0 : parsedGoalTss,
          existingGoal.id
        );
      } else {
        await db.run(`
          INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          userId,
          goal_type,
          isNaN(parsedGoalDistance) ? 0 : parsedGoalDistance,
          goal_date_target || null,
          goal_target_time || null,
          isNaN(parsedGoalTss) ? 0 : parsedGoalTss
        );
      }
    }

      // 7. Recalcular e regenerar planilha se o nível ou a modalidade (goal_type) mudarem
      const levelChanged = user.level !== level;
      const goalTypeChanged = existingGoal ? existingGoal.type !== goal_type : true;

      if (levelChanged || goalTypeChanged) {
        const activePlan = await db.get('SELECT * FROM training_plans WHERE user_id = ? AND active = 1', userId);
        if (activePlan) {
          // Deletar workouts da planilha ativa
          await db.run('DELETE FROM workouts WHERE plan_id = ?', activePlan.id);

          // Verificar se temos uma data de prova alvo
          const targetDateStr = goal_date_target || (existingGoal ? existingGoal.date_target : null);
          const distanceVal = parseFloat(String(goal_distance || (existingGoal ? existingGoal.distance : 0)).replace(',', '.'));

          if (targetDateStr) {
            // Aplicar planilha periodizada da biblioteca!
            const recommendedPlan = getBestMatchingPlan(goal_type, level, distanceVal);

            // Calcular datas da semana corrente
            const systemToday = new Date();
            const day = systemToday.getDay();
            const diff = systemToday.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(systemToday);
            monday.setDate(diff);
            const startOfWeekStr = formatDate(monday);
            
            // Calcular semanas disponíveis
            const targetDate = new Date(targetDateStr + 'T12:00:00');
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

            const planName = `${recommendedPlan.name} (${recommendedPlan.author}) - Calibrada a 100%`;

            // Atualizar o plano ativo para ser o da biblioteca
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
            `, planName, recommendedPlan.id, finalCutChoice, actualWeeksToUse, startOfWeekStr, activePlan.id);

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
                activePlan.id,
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

            const weekCountMsg = actualWeeksToUse === totalWeeks 
              ? `completa de ${totalWeeks} semanas`
              : `ajustada para ${actualWeeksToUse} semanas (corte: ${finalCutChoice === 'ambos' ? 'misto' : finalCutChoice})`;

            // Notificação de recalibração com planilha da biblioteca
            const todayYmd = formatDate(new Date());
            await db.run(`
              INSERT INTO coach_notifs (user_id, date, title, content, read)
              VALUES (?, ?, 'Planilha Recalibrada! 🔄', ?, 0)
            `, userId, todayYmd, `Identifiquei a mudança de ${levelChanged ? 'Nível' : ''}${levelChanged && goalTypeChanged ? ' e ' : ''}${goalTypeChanged ? 'Objetivo' : ''}. Recalibrei sua planilha para a planilha periodizada "${recommendedPlan.name}" de ${recommendedPlan.author} da nossa biblioteca. Ela foi ${weekCountMsg} e calibrada a 100% de esforço para a sua prova de ${goal_type}.`);
          } else {
            // Caso legado sem prova alvo
            // Gerar novos workouts baseados no novo objetivo e nível
            const newWorkouts = generateWorkoutsForPlan(goal_type, level);
            const weekDates = getWeekDates();

            for (const w of newWorkouts) {
              await db.run(`
                INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
              `, activePlan.id, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
            }

            // Atualizar o nome do plano de treino ativo para o novo nível
            let newPlanName = `Planilha Inicial Personalizada - Nível ${level.toUpperCase()}`;
            const weekRegex = /(Semana\s+)(\d+)/i;
            const match = activePlan.name?.match(weekRegex);
            if (match) {
              newPlanName = `${newPlanName} - ${match[0]}`;
            }

            await db.run(
              'UPDATE training_plans SET name = ? WHERE id = ?',
              newPlanName,
              activePlan.id
            );

            // Notificação de recalibração
            const todayYmd = formatDate(new Date());
            await db.run(`
              INSERT INTO coach_notifs (user_id, date, title, content, read)
              VALUES (?, ?, 'Planilha Recalibrada! 🔄', ?, 0)
            `, userId, todayYmd, `Identifiquei a mudança de ${levelChanged ? 'Nível' : ''}${levelChanged && goalTypeChanged ? ' e ' : ''}${goalTypeChanged ? 'Objetivo Esportivo' : ''}. Recalibrei sua planilha para a modalidade de ${goal_type} (${level === 'elite' ? 'Elite' : level === 'intermediario' ? 'Intermediário' : 'Iniciante'}) para alinhar com suas novas metas.`);
          }
        }
      }

      console.log(`Perfil e objetivos do usuário id=${userId} atualizados com sucesso no banco de dados.`);

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro na API de Perfil:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}
