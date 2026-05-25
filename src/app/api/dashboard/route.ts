import { NextResponse } from 'next/server';
import { getDb, autoCompleteExpiredRests, getCalendarToken } from '@/lib/db';
import { calculatePhysioMetrics } from '@/lib/coach-engine';
import { getCelebration } from '@/lib/celebrations';
import { syncUserStravaActivities } from '@/lib/strava';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get('userId') || '1';
    const userId = parseInt(userIdStr, 10);
    const clientDate = searchParams.get('clientDate') || undefined;

    const db = await getDb();

    // 1. Obter Usuário
    const user = await db.get<{ id: number; strava_connected: number; password?: string; birth_date?: string }>('SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Sincronização automática em segundo plano das atividades do Strava
    if (user.strava_connected) {
      try {
        await syncUserStravaActivities(db, userId);
      } catch (syncErr) {
        console.error('[Dashboard Auto-Sync] Falha ao sincronizar atividades do Strava:', syncErr);
      }
    }


    // 2. Obter Goal
    const goal = await db.get('SELECT * FROM goals WHERE user_id = ? ORDER BY date_target ASC LIMIT 1', userId);

    // 3. Obter Planilha Ativa
    const activePlan = await db.get('SELECT * FROM training_plans WHERE user_id = ? AND active = 1', userId);
    
    let workouts: any[] = [];
    if (activePlan) {
      // Alinhamento automático de datas para a semana corrente
      let today = clientDate ? new Date(clientDate + 'T12:00:00') : new Date();
      
      // Se for domingo e no relógio do sistema for 20:00 ou mais tarde, adiantamos today para simular a semana seguinte
      const systemNow = new Date();
      const isSunday = today.getDay() === 0;
      const isSundayAfter20 = isSunday && systemNow.getDay() === 0 && systemNow.getHours() >= 20;
      if (isSundayAfter20) {
        today.setDate(today.getDate() + 1); // Avança para a segunda-feira da próxima semana
      }

      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diff);
      
      const formatYmd = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      
      const startOfWeekStr = formatYmd(monday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const endOfWeekStr = formatYmd(sunday);
      
      if (activePlan.start_date !== startOfWeekStr || activePlan.end_date !== endOfWeekStr) {
        // Incrementa o número da semana no nome do plano de treinos
        let newPlanName = activePlan.name || '';
        const weekRegex = /(Semana\s+)(\d+)/i;
        const match = newPlanName.match(weekRegex);
        if (match) {
          const currentWeekNum = parseInt(match[2], 10);
          newPlanName = newPlanName.replace(weekRegex, `$1${currentWeekNum + 1}`);
        } else {
          newPlanName = newPlanName ? `${newPlanName} - Semana 2` : 'Planilha de Treinos - Semana 2';
        }

        await db.run(
          'UPDATE training_plans SET start_date = ?, end_date = ?, name = ? WHERE id = ?',
          startOfWeekStr,
          endOfWeekStr,
          newPlanName,
          activePlan.id
        );
        activePlan.start_date = startOfWeekStr;
        activePlan.end_date = endOfWeekStr;
        activePlan.name = newPlanName;
        
        // 1. Obter prova alvo do usuário (se cadastrada)
        const goal = await db.get('SELECT * FROM goals WHERE user_id = ? ORDER BY date_target ASC LIMIT 1', userId);
        const targetRace = await db.get('SELECT name FROM races WHERE user_id = ? AND is_target = 1', userId);
        const raceName = targetRace ? targetRace.name : (goal ? `sua prova alvo de ${goal.type}` : 'sua prova alvo');

        let factor = 1.10; // Fallback / Base factor (+10%)
        let phaseName = 'Fase de Base';
        let phaseDescription = 'Fase de Base (+10% vol)';
        let isRaceWeek = false;

        if (goal && goal.date_target) {
          const targetDate = new Date(goal.date_target + 'T12:00:00');
          const mondayDate = new Date(monday);
          const diffTime = targetDate.getTime() - mondayDate.getTime();
          const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));

          if (diffWeeks > 8) {
            factor = 1.10;
            phaseName = 'Fase de Base';
            phaseDescription = 'Fase de Base (+10% vol)';
          } else if (diffWeeks > 3 && diffWeeks <= 8) {
            factor = 1.12;
            phaseName = 'Fase de Construção';
            phaseDescription = 'Construção/Especificidade (+12% vol)';
          } else if (diffWeeks === 3) {
            factor = 0.85;
            phaseName = 'Polimento (Taper 1)';
            phaseDescription = 'Polimento: Taper 1 (-15% vol)';
          } else if (diffWeeks === 2) {
            factor = 0.70;
            phaseName = 'Polimento (Taper 2)';
            phaseDescription = 'Polimento: Taper 2 (-30% vol)';
          } else if (diffWeeks === 1) {
            factor = 0.50;
            phaseName = 'Semana da Prova';
            phaseDescription = 'Polimento: Pré-Prova';
            isRaceWeek = true;
          } else if (diffWeeks <= 0) {
            // A data da prova já passou ou é a mesma data de início da semana
            factor = 1.00;
            phaseName = 'Transição pós-Prova';
            phaseDescription = 'Recuperação ativa/Estabilidade';
          }
        }

        // Obter treinos cadastrados da planilha ativa para aplicar a periodização
        const planWorkouts = await db.all('SELECT * FROM workouts WHERE plan_id = ?', activePlan.id);
        let raceDayWorkoutReplaced = false;

        for (const w of planWorkouts) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + (w.day_of_week - 1));
          const workoutDateStr = formatYmd(d);
          
          // Verificar se este dia é o dia da Prova Alvo
          if (goal && goal.date_target && workoutDateStr === goal.date_target) {
            if (!raceDayWorkoutReplaced) {
              const parseTimeToSeconds = (timeStr: string): number => {
                if (!timeStr) return 3600;
                const parts = timeStr.split(':');
                if (parts.length === 3) {
                  return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
                } else if (parts.length === 2) {
                  return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60;
                }
                return 3600;
              };
              const targetTimeSecs = parseTimeToSeconds(goal.target_time || '01:00:00');
              const raceTss = goal.weekly_tss_target > 0 ? goal.weekly_tss_target : 250;

              await db.run(
                `UPDATE workouts 
                 SET date = ?, 
                     type = ?, 
                     distance_target = ?, 
                     duration_target = ?, 
                     tss_target = ?, 
                     title = ?, 
                     description = ?, 
                     status = 'pending' 
                 WHERE id = ?`,
                workoutDateStr,
                goal.type,
                goal.distance,
                targetTimeSecs,
                raceTss,
                `🔥 PROVA ALVO: ${raceName} 🏁`,
                `Chegou o grande dia! Você treinou duro, seguiu a periodização e está pronto para brilhar. Confie no processo, gerencie seu ritmo e dê o seu melhor!`,
                w.id
              );
              raceDayWorkoutReplaced = true;
            } else {
              // Outros treinos do dia da prova viram descanso
              await db.run(
                `UPDATE workouts 
                 SET date = ?, 
                     type = 'Descanso', 
                     distance_target = 0, 
                     duration_target = 0, 
                     tss_target = 0, 
                     title = 'Descanso pós-prova', 
                     description = 'Foco total na prova principal do dia.', 
                     status = 'pending' 
                 WHERE id = ?`,
                workoutDateStr,
                w.id
              );
            }
          } else {
            // Dias normais
            if (w.type !== 'Descanso' && w.type !== 'Forca') {
              const newDistance = w.distance_target > 0 ? parseFloat((w.distance_target * factor).toFixed(2)) : w.distance_target;
              const newDuration = w.duration_target > 0 ? Math.round(w.duration_target * factor) : w.duration_target;
              const newTss = w.tss_target > 0 ? Math.round(w.tss_target * factor) : w.tss_target;
              
              // Limpar sufixos antigos da descrição
              let cleanDesc = w.description || '';
              cleanDesc = cleanDesc.replace(/\s*\[Fase de Base.*?\]/g, '')
                                   .replace(/\s*\[Construção.*?\]/g, '')
                                   .replace(/\s*\[Polimento.*?\]/g, '')
                                   .replace(/\s*\[Ajustado.*?\]/g, '');
              
              // Aplicar split/capping de disponibilidade (Três Turnos)
              const hasAvailability = goal && (
                goal.train_in_morning !== undefined ||
                goal.train_at_lunch !== undefined ||
                goal.train_at_night !== undefined ||
                (goal.daily_available_hours !== undefined && goal.daily_available_hours > 0)
              );

              if (hasAvailability) {
                let trainInMorning = goal.train_in_morning !== 0;
                let morningMinutes = goal.morning_available_time ?? 60;
                let trainAtLunch = goal.train_at_lunch === 1;
                let lunchMinutes = goal.lunch_available_time ?? 0;
                let trainAtNight = goal.train_at_night !== 0;
                let nightMinutes = goal.night_available_time ?? 60;

                // Se as variáveis específicas de turnos não estiverem presentes, mas daily_available_hours estiver
                if (goal.daily_available_hours !== undefined && goal.daily_available_hours > 0 &&
                    goal.train_in_morning === undefined &&
                    goal.train_at_night === undefined) {
                  if (trainAtLunch && lunchMinutes > 0) {
                    trainInMorning = true;
                    morningMinutes = Math.max(0, goal.daily_available_hours * 60 - lunchMinutes);
                    trainAtNight = false;
                    nightMinutes = 0;
                  } else {
                    trainInMorning = true;
                    morningMinutes = goal.daily_available_hours * 60;
                    trainAtNight = false;
                    nightMinutes = 0;
                  }
                }

                const morningLimit = trainInMorning ? morningMinutes * 60 : 0;
                const lunchLimit = trainAtLunch ? lunchMinutes * 60 : 0;
                const nightLimit = trainAtNight ? nightMinutes * 60 : 0;

                const slots: { name: string; limit: number; emoji: string; titleSuffix: string }[] = [];
                if (morningLimit > 0) slots.push({ name: 'Manhã', limit: morningLimit, emoji: '🌅', titleSuffix: 'Sessão Manhã' });
                if (lunchLimit > 0) slots.push({ name: 'Almoço', limit: lunchLimit, emoji: '🥗', titleSuffix: 'Sessão Almoço' });
                if (nightLimit > 0) slots.push({ name: 'Fim do Dia', limit: nightLimit, emoji: '🌃', titleSuffix: 'Sessão Fim do Dia' });

                if (slots.length > 0) {
                  const exceedsFirstSlot = newDuration > slots[0].limit;
                  const shouldSplit = exceedsFirstSlot && slots.length > 1;

                  if (shouldSplit) {
                    // Distribuir a duração nos slots
                    let remainingDur = newDuration;
                    const sessionDurs: number[] = [];
                    for (const slot of slots) {
                      if (remainingDur <= 0) break;
                      const allocated = Math.min(remainingDur, slot.limit);
                      sessionDurs.push(allocated);
                      remainingDur -= allocated;
                    }

                    if (sessionDurs.length > 1) {
                      // Mais de uma sessão: dividimos!
                      // 1. Atualizar o treino atual para a primeira sessão
                      const firstScale = sessionDurs[0] / newDuration;
                      const firstDist = newDistance > 0 ? parseFloat((newDistance * firstScale).toFixed(2)) : 0;
                      const firstTss = Math.max(5, Math.round(newTss * firstScale));
                      let cleanTitle = w.title.replace(/\s*-\s*Sessão.*$/g, '').replace(/\s*-\s*Parte.*$/g, '');

                      await db.run(
                        `UPDATE workouts 
                         SET date = ?, 
                             distance_target = ?, 
                             duration_target = ?, 
                             tss_target = ?, 
                             title = ?, 
                             description = ?, 
                             status = 'pending' 
                         WHERE id = ?`,
                        workoutDateStr,
                        firstDist,
                        sessionDurs[0],
                        firstTss,
                        `${cleanTitle} - ${slots[0].titleSuffix} ${slots[0].emoji}`,
                        `${cleanDesc} [${slots[0].titleSuffix} - ${phaseDescription}]`,
                        w.id
                      );

                      // 2. Inserir as sessões subsequentes
                      for (let i = 1; i < sessionDurs.length; i++) {
                        const sScale = sessionDurs[i] / newDuration;
                        const sDist = newDistance > 0 ? parseFloat((newDistance * sScale).toFixed(2)) : 0;
                        const sTss = Math.max(5, Math.round(newTss * sScale));

                        await db.run(
                          `INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                          activePlan.id,
                          w.day_of_week,
                          workoutDateStr,
                          w.type,
                          sDist,
                          sessionDurs[i],
                          w.pace_target,
                          w.power_target,
                          sTss,
                          `${cleanTitle} - ${slots[i].titleSuffix} ${slots[i].emoji}`,
                          `${cleanDesc} [${slots[i].titleSuffix} - ${phaseDescription}]`
                        );
                      }
                    } else {
                      // Apenas 1 sessão (por exemplo, cabe no primeiro slot após alocação)
                      await db.run(
                        `UPDATE workouts 
                         SET date = ?, distance_target = ?, duration_target = ?, tss_target = ?, description = ?, status = 'pending' 
                         WHERE id = ?`,
                        workoutDateStr,
                        newDistance,
                        newDuration,
                        newTss,
                        `${cleanDesc} [${phaseDescription}]`,
                        w.id
                      );
                    }
                  } else {
                    // Não é para split ou só tem 1 slot. Verificamos se precisa capar.
                    const totalLimit = slots.reduce((acc, s) => acc + s.limit, 0);
                    if (newDuration > totalLimit) {
                      const scale = totalLimit / newDuration;
                      const cappedDist = newDistance > 0 ? parseFloat((newDistance * scale).toFixed(2)) : 0;
                      const cappedTss = Math.max(5, Math.round(newTss * scale));

                      await db.run(
                        `UPDATE workouts 
                         SET date = ?, 
                             distance_target = ?, 
                             duration_target = ?, 
                             tss_target = ?, 
                             description = ?, 
                             status = 'pending' 
                         WHERE id = ?`,
                        workoutDateStr,
                        cappedDist,
                        totalLimit,
                        cappedTss,
                        `${cleanDesc} [${phaseDescription}] [Ajustado para limite diário de ${totalLimit / 60} min]`,
                        w.id
                      );
                    } else {
                      await db.run(
                        `UPDATE workouts 
                         SET date = ?, distance_target = ?, duration_target = ?, tss_target = ?, description = ?, status = 'pending' 
                         WHERE id = ?`,
                        workoutDateStr,
                        newDistance,
                        newDuration,
                        newTss,
                        `${cleanDesc} [${phaseDescription}]`,
                        w.id
                      );
                    }
                  }
                } else {
                  // Sem slots ativos
                  await db.run(
                    `UPDATE workouts 
                     SET date = ?, distance_target = 0, duration_target = 0, tss_target = 0, description = ?, status = 'pending' 
                     WHERE id = ?`,
                    workoutDateStr,
                    `${cleanDesc} [Sem disponibilidade cadastrada]`,
                    w.id
                  );
                }
              } else {
                // Sem limite de disponibilidade
                await db.run(
                  `UPDATE workouts 
                   SET date = ?, distance_target = ?, duration_target = ?, tss_target = ?, description = ?, status = 'pending' 
                   WHERE id = ?`,
                  workoutDateStr,
                  newDistance,
                  newDuration,
                  newTss,
                  `${cleanDesc} [${phaseDescription}]`,
                  w.id
                );
              }
            } else if (w.type === 'Forca') {
              const newDuration = w.duration_target > 0 ? Math.round(w.duration_target * factor) : w.duration_target;
              const newTss = w.tss_target > 0 ? Math.round(w.tss_target * factor) : w.tss_target;
              
              let cleanDesc = w.description || '';
              cleanDesc = cleanDesc.replace(/\s*\[Fase de Base.*?\]/g, '')
                                   .replace(/\s*\[Construção.*?\]/g, '')
                                   .replace(/\s*\[Polimento.*?\]/g, '')
                                   .replace(/\s*\[Ajustado.*?\]/g, '');

              await db.run(
                `UPDATE workouts 
                 SET date = ?, duration_target = ?, tss_target = ?, description = ?, status = 'pending' 
                 WHERE id = ?`,
                workoutDateStr,
                newDuration,
                newTss,
                `${cleanDesc} [${phaseDescription}]`,
                w.id
              );
            } else {
              await db.run(
                `UPDATE workouts SET date = ?, status = 'pending' WHERE id = ?`,
                workoutDateStr,
                w.id
              );
            }
          }
        }

        // Criar notificação do Coach avisando que a planilha da próxima semana foi liberada
        const nextWeekMonday = new Date(monday);
        const nextWeekSunday = new Date(monday);
        nextWeekSunday.setDate(monday.getDate() + 6);
        
        const nextWeekStartFormatted = `${String(nextWeekMonday.getDate()).padStart(2, '0')}/${String(nextWeekMonday.getMonth() + 1).padStart(2, '0')}`;
        const nextWeekEndFormatted = `${String(nextWeekSunday.getDate()).padStart(2, '0')}/${String(nextWeekSunday.getMonth() + 1).padStart(2, '0')}`;
        
        const notifTitle = 'Planilha da Semana Seguinte Liberada! 🗓️';
        let notifContent = '';
        if (goal && goal.date_target) {
          const targetDateOnlyFormatted = new Date(goal.date_target + 'T12:00:00').toLocaleDateString('pt-BR');
          if (isRaceWeek) {
            notifContent = `Chegou a Semana da Prova! 🏁 Sua planilha para ${nextWeekStartFormatted} a ${nextWeekEndFormatted} foi estruturada para o Polimento Final (Taper) visando a prova "${raceName}" em ${targetDateOnlyFormatted}. Reduzimos o volume das sessões em 50% para que você chegue 100% descansado e com as pernas afiadas no dia da prova!`;
          } else {
            notifContent = `Sua planilha para a semana de ${nextWeekStartFormatted} a ${nextWeekEndFormatted} ("${newPlanName}") está pronta. Com base na proximidade da sua prova alvo "${raceName}" (${targetDateOnlyFormatted}), entramos na **${phaseName}**. Apliquei o fator de ajuste de ${factor > 1 ? '+' : ''}${Math.round((factor - 1) * 100)}% em volume/TSS para otimizar suas adaptações fisiológicas!`;
          }
        } else {
          notifContent = `Sua planilha de treinos para a semana de ${nextWeekStartFormatted} a ${nextWeekEndFormatted} ("${newPlanName}") foi atualizada e está pronta! Como seu coach, apliquei uma progressão de periodização esportiva clássica: aumentei em 10% as distâncias, durações e o TSS planejado de cada sessão para garantir sua evolução constante e supercompensação fisiológica. Bons treinos, foco na consistência! 🚀`;
        }
        
        // Verificar se já existe notificação com o mesmo conteúdo/título para este usuário
        const existingNotif = await db.get(
          "SELECT * FROM coach_notifs WHERE user_id = ? AND title = ? AND content LIKE ?",
          userId,
          notifTitle,
          `%${nextWeekStartFormatted}%`
        );
        
        if (!existingNotif) {
          const todayStr = formatYmd(systemNow);
          await db.run(
            `INSERT INTO coach_notifs (user_id, date, title, content, read)
             VALUES (?, ?, ?, ?, 0)`,
            userId,
            todayStr,
            notifTitle,
            notifContent
          );
        }
      }
      
      // Autoconcluir treinos de Descanso expirados há mais de 48h
      await autoCompleteExpiredRests(db, activePlan.id, today);

      // Obter treinos da planilha ativa
      workouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', activePlan.id);
    }

    // 4. Obter Logs de Atividades realizados na semana (todos, vinculados ou extras)
    let activityLogs: any[] = [];
    if (activePlan && workouts.length > 0) {
      const workoutIds = workouts.map(w => w.id).join(',');
      activityLogs = await db.all(`
        SELECT * FROM activity_logs 
        WHERE workout_id IN (${workoutIds})
           OR (user_id = ? AND timestamp >= ? AND timestamp <= ?)
        ORDER BY timestamp DESC
      `, userId, activePlan.start_date + 'T00:00:00', activePlan.end_date + 'T23:59:59');
    }

    // 5. Obter Notificações Recentes do Coach
    let notifications = await db.all(
      'SELECT * FROM coach_notifs WHERE user_id = ? ORDER BY id DESC LIMIT 5', 
      userId
    );

    // 5b. Verificar se todos os treinos da planilha ativa estão completos e criar notificação do Coach
    const isAllWorkoutsCompleted = workouts.length > 0 && workouts.every((w: any) => w.status === 'completed');
    if (isAllWorkoutsCompleted) {
      const existingNotif = await db.get(
        "SELECT * FROM coach_notifs WHERE user_id = ? AND title = 'Planilha Semanal 100% Cumprida!'",
        userId
      );
      if (!existingNotif) {
        const today = clientDate ? new Date(clientDate + 'T12:00:00') : new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        await db.run(
          `INSERT INTO coach_notifs (user_id, date, title, content, read)
           VALUES (?, ?, 'Planilha Semanal 100% Cumprida!', ?, 0)`,
          userId,
          todayStr,
          `Parabéns, campeão! Você completou 100% dos treinos da sua planilha esta semana. Essa constância é o combustível para alcançarmos os seus objetivos fisiológicos. Continue assim!`
        );
        
        // Recarregar notificações para incluir a nova
        notifications = await db.all(
          'SELECT * FROM coach_notifs WHERE user_id = ? ORDER BY id DESC LIMIT 5', 
          userId
        );
      }
    }

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
    const celebration = getCelebration(user.birth_date || null, clientDate);

    // 9. Gerar URL dinâmica segura do feed de calendário (iCal)
    const requestUrl = new URL(req.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const calendarToken = getCalendarToken(userId, user.password || '');
    const calendarUrl = `${baseUrl}/api/calendar?userId=${userId}&token=${calendarToken}`;

    return NextResponse.json({
      user,
      goal,
      plan: activePlan || null,
      workouts,
      activityLogs,
      notifications,
      metrics: physioMetrics,
      lastSyncedActivity: lastSyncedActivity || null,
      celebration,
      calendarUrl
    });

  } catch (error: any) {
    console.error('Erro na API de Dashboard:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
