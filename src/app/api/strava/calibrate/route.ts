import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { paceToSeconds, secondsToPace } from '@/lib/coach-engine';
import { getStravaAccessToken } from '@/lib/strava';
import { getLocalSportIdByStravaType } from '@/lib/sports';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDb();

    const userId = parseInt(data.userId, 10);
    const days = parseInt(data.days, 10) || 60; // Padrão 60 dias (Fisiológico)

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'ID de usuário inválido.' }, { status: 400 });
    }

    if (days !== 30 && days !== 60) {
      return NextResponse.json({ success: false, error: 'O período deve ser de 30 ou 60 dias.' }, { status: 400 });
    }

    // 1. Obter Usuário do banco
    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Obter token válido do Strava (renovando automaticamente se estiver prestes a expirar)
    const accessToken = await getStravaAccessToken(db, userId);
    const isRealConnected = user.strava_connected && accessToken && !accessToken.startsWith('mock_');

    // Variáveis que iremos calcular
    let totalActivities = 0;
    let totalDistance = 0; // km
    let totalDuration = 0; // segundos
    let maxHrObserved = 0;
    let estimatedLthr = user.threshold_hr;
    let estimatedPaceSecs = paceToSeconds(user.threshold_pace);
    let suggestedLevel = user.level;
    const activitiesList: {
      id?: number;
      name: string;
      type: string;
      distance: number;
      duration: number;
      avgHr: number | null;
      maxHr: number | null;
      date: string;
    }[] = [];
    let isFallback = false;
    let fallbackActivityName = '';

    // Data limite para a busca do período
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

    let hasColectedData = false;

    // Se conectado ao Strava Real, tentar buscar atividades
    if (isRealConnected && accessToken) {
      try {
        const response = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?after=${cutoffTimestamp}&per_page=100`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const stravaActivities = await response.json();
          if (stravaActivities && stravaActivities.length > 0) {
            hasColectedData = true;
            totalActivities = stravaActivities.length;

            stravaActivities.forEach((act: {
              id?: number;
              name: string;
              type: string;
              distance: number;
              moving_time?: number;
              elapsed_time?: number;
              has_heartrate: boolean;
              average_heartrate: number;
              max_heartrate: number;
              start_date: string;
            }) => {
              const distanceKm = parseFloat((act.distance / 1000).toFixed(2));
              const durationSec = act.moving_time || act.elapsed_time || 0;
              
              totalDistance += distanceKm;
              totalDuration += durationSec;

              const activityType = getLocalSportIdByStravaType(act.type);

              activitiesList.push({
                id: act.id,
                name: act.name,
                type: activityType,
                distance: distanceKm,
                duration: durationSec,
                avgHr: act.has_heartrate ? Math.round(act.average_heartrate) : null,
                maxHr: act.has_heartrate ? Math.round(act.max_heartrate) : null,
                date: act.start_date.split('T')[0]
              });

              if (act.has_heartrate && act.max_heartrate > maxHrObserved) {
                maxHrObserved = Math.round(act.max_heartrate);
              }
            });

            // Estimativa fisiológica a partir dos dados coletados
            if (maxHrObserved > 0) {
              estimatedLthr = Math.round(maxHrObserved * 0.90);
            }

            const runs = activitiesList.filter(a => ['Corrida', 'CorridaTrilha'].includes(a.type) && a.distance >= 3);
            if (runs.length > 0) {
              let bestPaceSecs = 9999;
              runs.forEach(run => {
                const paceSecs = run.duration / run.distance;
                if (paceSecs < bestPaceSecs) {
                  bestPaceSecs = paceSecs;
                }
              });
              estimatedPaceSecs = Math.round(bestPaceSecs * 0.95);
            }
          }
        }
      } catch (err) {
        console.error('Erro de conexão ao buscar no Strava:', err);
      }
    }

    // Se NÃO existirem dados para serem coletados no Strava (ou Strava não conectado/sem dados)
    if (!hasColectedData) {
      // Buscar no banco local a última atividade de corrida/trilha com duração >= 30 minutos (1800 segundos)
      const lastRun = await db.get(
        `SELECT * FROM activity_logs 
         WHERE user_id = ? AND type IN ('Corrida', 'CorridaTrilha') AND duration_real >= 1800 
         ORDER BY timestamp DESC LIMIT 1`,
        userId
      );

      if (!lastRun) {
        return NextResponse.json({ 
          success: false, 
          error: 'Nenhum dado encontrado no Strava e nenhuma atividade de corrida com mais de 30 minutos foi encontrada no seu histórico local para calibração. Registre uma atividade para calibrar.' 
        }, { status: 404 });
      }

      // Se encontrou, calibrar com base apenas nela!
      isFallback = true;
      fallbackActivityName = lastRun.type + ' (' + lastRun.distance_real + 'km - ' + new Date(lastRun.timestamp).toLocaleDateString('pt-BR') + ')';
      totalActivities = 1;
      totalDistance = lastRun.distance_real;
      totalDuration = lastRun.duration_real;
      maxHrObserved = lastRun.max_hr || 0;

      // Estimativa fisiológica
      // FC Limiar: Média dos batimentos da corrida, ou 90% da máxima se a média for nula.
      if (lastRun.avg_hr) {
        estimatedLthr = lastRun.avg_hr;
      } else if (lastRun.max_hr) {
        estimatedLthr = Math.round(lastRun.max_hr * 0.90);
      }

      // Ritmo Limiar: O ritmo médio desta corrida
      estimatedPaceSecs = paceToSeconds(lastRun.pace_real);
    }

    // Arredondar distância acumulada total para evitar dízimas de floats do JS
    totalDistance = parseFloat(totalDistance.toFixed(1));

    // Calcular volumes médios
    const totalWeeks = days / 7;
    const weeklyAvgHours = parseFloat((totalDuration / 3600 / totalWeeks).toFixed(1));
    const weeklyAvgKm = parseFloat((totalDistance / totalWeeks).toFixed(1));

    // Determinação do nível sugerido
    if (!isFallback) {
      if (weeklyAvgHours < 3.0) {
        suggestedLevel = 'sedentario';
      } else if (weeklyAvgHours >= 3.0 && weeklyAvgHours <= 8.0) {
        suggestedLevel = 'intermediario';
      } else {
        suggestedLevel = 'elite';
      }
    } else {
      // No fallback de uma atividade, manter o nível do usuário
      suggestedLevel = user.level;
    }

    const currentPaceSecs = paceToSeconds(user.threshold_pace);
    const differenceHr = estimatedLthr - user.threshold_hr;
    const differencePaceSecs = currentPaceSecs - estimatedPaceSecs; // Positivo = mais rápido

    return NextResponse.json({
      success: true,
      analysis: {
        days,
        totalActivities,
        totalDistance,
        totalDuration,
        weeklyAvgHours: isFallback ? parseFloat((totalDuration / 3600).toFixed(1)) : weeklyAvgHours,
        weeklyAvgKm: isFallback ? totalDistance : weeklyAvgKm,
        maxHrObserved: maxHrObserved || null,
        isFallback,
        fallbackActivityName
      },
      currentMetrics: {
        level: user.level,
        threshold_hr: user.threshold_hr,
        threshold_pace: user.threshold_pace
      },
      suggestedMetrics: {
        level: suggestedLevel,
        threshold_hr: estimatedLthr,
        threshold_pace: secondsToPace(estimatedPaceSecs).replace('/km', '')
      },
      comparison: {
        hrDiff: differenceHr,
        paceDiffSecs: differencePaceSecs,
        paceDiffStr: (differencePaceSecs > 0 ? '-' : '+') + secondsToPace(Math.abs(differencePaceSecs)).replace('/km', '')
      }
    });

  } catch (error: unknown) {
    console.error('Erro na API de Calibração:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage
    }, { status: 500 });
  }
}

