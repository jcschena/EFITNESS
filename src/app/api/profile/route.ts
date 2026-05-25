import { NextResponse } from 'next/server';
import { getDb, getWeekDates, formatDate, generateWorkoutsForPlan } from '@/lib/db';

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
          password = ?
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
