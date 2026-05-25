import { NextResponse } from 'next/server';
import { getDb, getWeekDates, formatDate } from '@/lib/db';
import { TRAINING_LIBRARY, getWeeksAfterCut } from '@/lib/training-library';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDb();

    const userId = parseInt(data.userId || '1', 10);
    const libraryId = data.libraryId;
    const effortPct = parseInt(data.effortPct || '100', 10);
    const cutChoice = data.cutChoice || 'none'; // 'inicial', 'polimento', 'ambos', 'none'
    const clientDate = data.clientDate; // YYYY-MM-DD

    // 1. Validar Usuário
    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Validar Planilha da Biblioteca
    const libraryPlan = TRAINING_LIBRARY[libraryId];
    if (!libraryPlan) {
      return NextResponse.json({ error: 'Planilha não encontrada na biblioteca' }, { status: 400 });
    }

    // 3. Obter datas da semana corrente
    const systemToday = clientDate ? new Date(clientDate + 'T12:00:00') : new Date();
    // Alinhamento Padrão de Segunda a Domingo
    const day = systemToday.getDay();
    const diff = systemToday.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(systemToday);
    monday.setDate(diff);
    
    const startOfWeekStr = formatDate(monday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endOfWeekStr = formatDate(sunday);

    // 4. Obter Objetivo Ativo
    const goal = await db.get('SELECT * FROM goals WHERE user_id = ? ORDER BY date_target ASC LIMIT 1', userId);

    let totalWeeks = libraryPlan.weeks;
    let actualWeeksToUse = libraryPlan.weeks;
    let finalCutChoice = cutChoice;

    // Gerar os índices de semanas da planilha original (0 a weeks - 1)
    const originalWeekIndices = Array.from({ length: totalWeeks }, (_, i) => i);
    let selectedWeekIndices = [...originalWeekIndices];

    // 5. Verificar compatibilidade com Prova Alvo se cadastrada
    if (goal && goal.date_target) {
      const targetDate = new Date(goal.date_target + 'T12:00:00');
      const mondayDate = new Date(startOfWeekStr + 'T12:00:00');
      
      const diffTime = targetDate.getTime() - mondayDate.getTime();
      // Diferença em semanas arredondada para cima
      const weeksAvailable = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));

      if (weeksAvailable > 0 && weeksAvailable < totalWeeks) {
        // Se as semanas disponíveis forem menores do que as semanas da planilha
        actualWeeksToUse = weeksAvailable;
        if (finalCutChoice === 'none') {
          finalCutChoice = 'ambos'; // Fallback
        }
        
        // Cortar os índices de semanas usando o algoritmo
        selectedWeekIndices = getWeeksAfterCut(originalWeekIndices, weeksAvailable, finalCutChoice as any);
      } else {
        finalCutChoice = 'none';
      }
    } else {
      finalCutChoice = 'none';
    }

    // 6. Desativar plano anterior
    await db.run('UPDATE training_plans SET active = 0 WHERE user_id = ?', userId);

    // 7. Criar novo plano ativo da biblioteca
    const planName = `${libraryPlan.name} (${libraryPlan.author}) - Calibrada a ${effortPct}%`;
    const planInsert = await db.run(`
      INSERT INTO training_plans (
        user_id, name, start_date, end_date, active, 
        library_id, effort_pct, cut_choice, current_week, total_weeks, start_cycle_date
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, 1, ?, ?)
    `, 
      userId, 
      planName, 
      startOfWeekStr, 
      endOfWeekStr, 
      libraryId, 
      effortPct, 
      finalCutChoice, 
      actualWeeksToUse, 
      startOfWeekStr
    );

    const planId = planInsert.lastID;

    // 8. Obter e Calibrar os treinos da primeira semana (índice mapeado pelo selectedWeekIndices[0])
    const originalWeeksData = libraryPlan.generateWeeks(effortPct);
    const firstWeekIndex = selectedWeekIndices[0];
    const firstWeekWorkouts = originalWeeksData[firstWeekIndex];

    const weekDates = getWeekDates(startOfWeekStr);

    // 9. Inserir treinos da Semana 1 no banco
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
        wkPowerValue(w.power),
        w.tss,
        w.title,
        w.desc
      );
    }

    // 10. Atualizar Objetivo do Usuário (opcional: se não houver ou se o esporte for diferente)
    if (!goal || goal.type !== libraryPlan.sport) {
      // Define uma prova alvo fictícia/estimada no fim da planilha
      const raceDistance = libraryId.includes('100k') ? 100 : libraryId.includes('50m') ? 80 : libraryId.includes('703') ? 113 : libraryId.includes('olympic') ? 51.5 : libraryId.includes('marathon') ? 42.2 : 10;
      const targetTime = libraryPlan.sport === 'Corrida' ? '00:50:00' : libraryPlan.sport === 'Ciclismo' ? '03:30:00' : '01:00:00';
      
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + (actualWeeksToUse * 7) - 1); // Domingo da última semana do ciclo
      const targetDateStr = formatDate(targetDate);

      if (goal) {
        await db.run(`
          UPDATE goals 
          SET type = ?, distance = ?, date_target = ?, target_time = ?
          WHERE id = ?
        `, libraryPlan.sport, raceDistance, targetDateStr, targetTime, goal.id);
      } else {
        await db.run(`
          INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
          VALUES (?, ?, ?, ?, ?, ?)
        `, userId, libraryPlan.sport, raceDistance, targetDateStr, targetTime, 250);
      }
    }

    // 11. Criar Notificação de Boas-vindas para o novo plano
    const weekCountMsg = actualWeeksToUse === totalWeeks 
      ? `completa de ${totalWeeks} semanas`
      : `ajustada para ${actualWeeksToUse} semanas (corte estratégico: ${finalCutChoice === 'inicial' ? 'semanas iniciais' : finalCutChoice === 'polimento' ? 'fase de polimento' : 'misto'})`;

    await db.run(`
      INSERT INTO coach_notifs (user_id, date, title, content, read)
      VALUES (?, ?, ?, ?, 0)
    `,
      userId,
      formatDate(systemToday),
      'Planilha Periodizada Ativada! 📅',
      `Você ativou a planilha "${libraryPlan.name}" de ${libraryPlan.author} (Fonte: ${libraryPlan.source}). A periodização foi ${weekCountMsg} e calibrada para ${effortPct}% do seu esforço. Seus treinos da Semana 1 já estão disponíveis!`
    );

    return NextResponse.json({
      success: true,
      planId,
      message: 'Planilha aplicada e calibrada com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro na API de aplicar planilha:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}

// Helper para evitar valores nulos de power no banco
function wkPowerValue(p: any): number {
  return typeof p === 'number' ? p : 0;
}
