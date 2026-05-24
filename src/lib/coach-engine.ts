import { getDb, DatabaseClient } from './db';
import { isEnduranceSport } from './sports';

// Estruturas de Dados
export interface UserMetrics {
  threshold_hr: number;
  threshold_pace: string; // no formato 'MM:SS'
  weight: number;
}


// Converte Pace string 'MM:SS' para segundos por km
export function paceToSeconds(paceStr: string): number {
  const clean = paceStr.replace('/km', '').trim();
  const parts = clean.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 300; // default 5:00/km
}

// Converte segundos por km para string 'MM:SS'
export function secondsToPace(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}/km`;
}

/**
 * Calcula o TSS (Training Stress Score) baseado em Frequência Cardíaca (hrTSS)
 * TSS = (segundos * FC_media * IF) / (FC_limiar * 3600) * 100
 * Simplificado para hrTSS clássico:
 * TSS = (duracao_segundos * (FC_media / FC_limiar)^2 / 3600) * 100
 */
export function calculateHrTSS(durationSecs: number, avgHr: number, thresholdHr: number): number {
  if (durationSecs <= 0 || avgHr <= 0 || thresholdHr <= 0) return 0;
  const intensityFactor = avgHr / thresholdHr;
  const tss = (durationSecs * Math.pow(intensityFactor, 2) / 3600) * 100;
  return Math.round(tss);
}

/**
 * Calcula o TSS baseado em Pace (rTSS)
 * TSS = (duracao_segundos * (Pace_limiar_segundos / Pace_medio_segundos)^2 / 3600) * 100
 */
export function calculatePaceTSS(durationSecs: number, avgPaceStr: string, thresholdPaceStr: string): number {
  if (durationSecs <= 0) return 0;
  const avgPaceSecs = paceToSeconds(avgPaceStr);
  const thresholdPaceSecs = paceToSeconds(thresholdPaceStr);
  
  if (avgPaceSecs <= 0 || thresholdPaceSecs <= 0) return 0;
  
  // Como pace é inverso à velocidade, o fator de intensidade é pace_limiar / pace_medio
  const intensityFactor = thresholdPaceSecs / avgPaceSecs;
  const tss = (durationSecs * Math.pow(intensityFactor, 2) / 3600) * 100;
  return Math.round(tss);
}

/**
 * Calcula a Carga de Treinamento Aguda (ATL - Fadiga) e Crônica (CTL - Condicionamento)
 * CTL(hoje) = CTL(ontem) + (TSS_hoje - CTL(ontem)) / 42
 * ATL(hoje) = ATL(ontem) + (TSS_hoje - ATL(ontem)) / 7
 * TSB (Forma) = CTL - ATL
 */
export async function calculatePhysioMetrics(db: DatabaseClient, userId: number) {
  // Pegar todos os logs de atividade do usuário nas últimas 6 semanas
  // Para fins demonstrativos/mock, se o banco tiver poucos logs, vamos computar
  // uma estimativa baseada nas atividades realizadas e preencher o histórico
  
  const activities = await db.all(`
    SELECT al.tss_real, al.timestamp
    FROM activity_logs al
    JOIN workouts w ON al.workout_id = w.id
    JOIN training_plans tp ON w.plan_id = tp.id
    WHERE tp.user_id = ?
    ORDER BY al.timestamp ASC
  `, userId);

  let ctl = 45; // Valor base de fitness inicial para amadores
  let atl = 35; // Valor base de fadiga inicial
  
  const user = await db.get<{ level: string }>('SELECT level FROM users WHERE id = ?', userId);
  if (user && user.level === 'elite') {
    ctl = 75; // Atletas elite têm maior condicionamento crônico inicial
    atl = 65;
  }

  // Se houver treinos realizados, rodamos a fórmula diária de amortecimento
  // do modelo clássico de Banister (Coggan impulse response)
  activities.forEach((act) => {
    const tss = act.tss_real || 0;
    ctl = ctl + (tss - ctl) / 42;
    atl = atl + (tss - atl) / 7;
  });

  const tsb = ctl - atl;

  return {
    ctl: Math.round(ctl),
    atl: Math.round(atl),
    tsb: Math.round(tsb)
  };
}

/**
 * Algoritmo Científico de Auto-Regulação
 * Recalcula a planilha para evitar Overtraining ou Compensar faltas
 */
export async function autoRegulateTrainingPlan(db: DatabaseClient, userId: number, lastWorkoutId: number, lastTssReal: number) {
  // 1. Obter o treino de referência prescrito
  const lastWorkout = await db.get<{
    id: number;
    plan_id: number;
    day_of_week: number;
    date: string;
    tss_target: number;
    title: string;
    type: string;
  }>('SELECT * FROM workouts WHERE id = ?', lastWorkoutId);

  if (!lastWorkout) return;

  const tssTarget = lastWorkout.tss_target;
  const planId = lastWorkout.plan_id;
  const currentDay = lastWorkout.day_of_week;

  // Se for descanso, não há regulação necessária
  if (lastWorkout.type === 'Descanso') return;

  const tssDiff = lastTssReal - tssTarget;
  const percentDiff = tssTarget > 0 ? (tssDiff / tssTarget) * 100 : (lastTssReal > 0 ? 100 : 0);

  // Pegar os treinos restantes da semana para este plano (dias posteriores)
  const futureWorkouts = await db.all<{
    id: number;
    day_of_week: number;
    date: string;
    type: string;
    tss_target: number;
    distance_target: number;
    duration_target: number;
    pace_target: string;
    title: string;
  }>(`
    SELECT * FROM workouts 
    WHERE plan_id = ? AND day_of_week > ? AND type != 'Descanso' AND status = 'pending'
    ORDER BY day_of_week ASC
  `, planId, currentDay);

  let notificationTitle = '';
  let notificationContent = '';
  let updatedSomething = false;

  // Caso 1: Risco de Overtraining (TSS Executado > 15% acima da meta ou excedeu muito o volume)
  if (percentDiff > 15 && tssDiff > 15) {
    notificationTitle = 'Ajuste de Carga: Proteção contra Overtraining';
    notificationContent = `Identifiquei que sua sessão "${lastWorkout.title}" gerou uma sobrecarga de ${Math.round(percentDiff)}% acima do planejado (TSS executado: ${lastTssReal} vs planejado: ${tssTarget}). Para mitigar o risco de lesão e fadiga excessiva (ATL elevada), ajustei a intensidade e o volume das suas próximas sessões da semana.`;

    // Reduzir proporcionalmente os treinos dos próximos dias da semana
    // O próximo treino de alta intensidade (ou longo) sofre uma redução de ~15% a 20%
    // E os regenerativos diminuem levemente para focar em supercompensação.
    for (const fw of futureWorkouts) {
      let reductionFactor = 0.15; // 15% de redução padrão
      if (fw.type === 'Forca') reductionFactor = 0; // Não reduz força
      if (['Corrida', 'CorridaTrilha'].includes(fw.type) && fw.title.toLowerCase().includes('longo')) reductionFactor = 0.20; // Reduz mais o longo

      if (reductionFactor > 0) {
        const newTss = Math.round(fw.tss_target * (1 - reductionFactor));
        const newDist = fw.distance_target > 0 ? parseFloat((fw.distance_target * (1 - reductionFactor)).toFixed(1)) : 0;
        const newDur = fw.duration_target > 0 ? Math.round(fw.duration_target * (1 - reductionFactor)) : 0;
        
        let newPaceStr = fw.pace_target;
        if (['Corrida', 'CorridaTrilha'].includes(fw.type) && fw.pace_target !== 'N/A') {
          // Ajusta o ritmo planejado deixando-o ligeiramente mais lento (recuperação)
          const currentPaceSecs = paceToSeconds(fw.pace_target);
          const adjustedPaceSecs = Math.round(currentPaceSecs * 1.05); // 5% mais lento
          newPaceStr = secondsToPace(adjustedPaceSecs);
        }

        await db.run(`
          UPDATE workouts 
          SET tss_target = ?, distance_target = ?, duration_target = ?, pace_target = ?, status = 'adjusted',
              description = description || ' [Ajustado por Carga Anterior Elevada]'
          WHERE id = ?
        `, newTss, newDist, newDur, newPaceStr, fw.id);
        
        updatedSomething = true;
      }
    }
  } 
  // Caso 2: Sessão Sub-realizada ou Pulada (TSS Executado < 40% do alvo, ou pulou)
  else if (lastTssReal < tssTarget * 0.4) {
    notificationTitle = 'Ajuste de Planejamento: Recuperação de Volume';
    notificationContent = `Notamos que o treino de ontem "${lastWorkout.title}" foi sub-realizado ou pulado (TSS real: ${lastTssReal} vs planejado: ${tssTarget}). Para manter o volume crônico de condicionamento (CTL) sem comprometer a sua recuperação, redistribuí parte da carga não realizada suavemente nas próximas sessões de endurance desta semana.`;

    // Redistribuir 40% do TSS faltante de forma diluída nas sessões de endurance restantes da semana (máximo +15% de aumento por treino)
    const tssMissing = tssTarget - lastTssReal;
    const tssToRedistribute = Math.round(tssMissing * 0.4); // Redistribui apenas 40% para evitar pico de carga
    
    const enduranceWorkouts = futureWorkouts.filter(fw => isEnduranceSport(fw.type));
    
    if (enduranceWorkouts.length > 0 && tssToRedistribute > 0) {
      const tssAddPerWorkout = Math.round(tssToRedistribute / enduranceWorkouts.length);
      
      for (const fw of enduranceWorkouts) {
        // Limitar o aumento a 20 TSS para não sobrecarregar
        const actualAdd = Math.min(tssAddPerWorkout, 20);
        const newTss = fw.tss_target + actualAdd;
        
        // Aumenta ligeiramente a distância/duração
        const multiplier = (newTss / fw.tss_target);
        const newDist = fw.distance_target > 0 ? parseFloat((fw.distance_target * multiplier).toFixed(1)) : 0;
        const newDur = fw.duration_target > 0 ? Math.round(fw.duration_target * multiplier) : 0;

        await db.run(`
          UPDATE workouts 
          SET tss_target = ?, distance_target = ?, duration_target = ?, status = 'adjusted',
              description = description || ' [Ajustado para Compensar Volume]'
          WHERE id = ?
        `, newTss, newDist, newDur, fw.id);
        
        updatedSomething = true;
      }
    }
  }

  // Se houve ajustes reais, insere a notificação no painel do usuário
  if (updatedSomething) {
    const todayStr = new Date().toISOString().split('T')[0];
    await db.run(`
      INSERT INTO coach_notifs (user_id, date, title, content, read)
      VALUES (?, ?, ?, ?, 0)
    `, userId, todayStr, notificationTitle, notificationContent);
  }
}
