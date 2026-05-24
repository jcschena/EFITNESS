import { DatabaseClient } from './db';
import { calculateHrTSS, calculatePaceTSS, autoRegulateTrainingPlan } from './coach-engine';
import { getLocalSportIdByStravaType } from './sports';

/**
 * Obtém o token de acesso do Strava válido para o usuário.
 * Caso esteja expirado ou prestes a expirar, renova automaticamente usando o refresh_token.
 */
export async function getStravaAccessToken(db: DatabaseClient, userId: number): Promise<string | null> {
  const user = await db.get<{
    strava_access_token: string;
    strava_refresh_token: string;
    strava_token_expires: number;
    strava_connected: number;
  }>(
    'SELECT strava_access_token, strava_refresh_token, strava_token_expires, strava_connected FROM users WHERE id = ?',
    userId
  );

  if (!user || !user.strava_connected || !user.strava_access_token) {
    return null;
  }

  // Se o token for mockado, retorna ele mesmo
  if (user.strava_access_token.startsWith('mock_')) {
    return user.strava_access_token;
  }

  const nowSecs = Math.round(Date.now() / 1000);
  
  // Se o token expira em menos de 5 minutos, nós renovamos!
  if (!user.strava_token_expires || user.strava_token_expires - nowSecs < 300) {
    console.log(`[Strava] Token do usuário ${userId} expirado ou prestes a expirar. Renovando...`);
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (clientId && clientSecret && user.strava_refresh_token) {
      try {
        const response = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: user.strava_refresh_token,
            grant_type: 'refresh_token'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const newAccessToken = data.access_token;
          const newRefreshToken = data.refresh_token || user.strava_refresh_token;
          const newExpiresAt = data.expires_at;

          // Atualizar o banco de dados
          await db.run(
            `UPDATE users 
             SET strava_access_token = ?, 
                 strava_refresh_token = ?, 
                 strava_token_expires = ? 
             WHERE id = ?`,
            newAccessToken,
            newRefreshToken,
            newExpiresAt,
            userId
          );

          console.log(`[Strava] Token do usuário ${userId} renovado com sucesso!`);
          return newAccessToken;
        } else {
          const errBody = await response.text();
          console.error(`[Strava] Erro ao renovar token do usuário ${userId}:`, errBody);
        }
      } catch (err) {
        console.error(`[Strava] Falha de conexão ao tentar renovar token do usuário ${userId}:`, err);
      }
    }
  }

  return user.strava_access_token;
}

/**
 * Sincroniza atividades do Strava recentes para o usuário.
 */
export async function syncUserStravaActivities(
  db: DatabaseClient,
  userId: number
): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    const user = await db.get<{
      id: number;
      strava_connected: number;
      strava_access_token: string;
      threshold_hr: number;
      threshold_pace: string;
    }>('SELECT id, strava_connected, strava_access_token, threshold_hr, threshold_pace FROM users WHERE id = ?', userId);

    if (!user || !user.strava_connected) {
      return { success: false, syncedCount: 0, errors: ['Strava não conectado para este usuário.'] };
    }

    const accessToken = await getStravaAccessToken(db, userId);
    if (!accessToken) {
      return { success: false, syncedCount: 0, errors: ['Não foi possível obter um token de acesso válido do Strava.'] };
    }

    let stravaActivities: any[] = [];

    if (accessToken.startsWith('mock_')) {
      console.log(`[Strava Sync] Usuário com conta mock (${userId}). Sincronização ignorada pois simuladores foram desativados.`);
      return { success: true, syncedCount: 0, errors: [] };
    } else {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${cutoffTimestamp}&per_page=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, syncedCount: 0, errors: [`Erro na API do Strava: ${response.status} - ${errText}`] };
      }

      stravaActivities = await response.json();
    }

    if (!stravaActivities || stravaActivities.length === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    for (const act of stravaActivities) {
      try {
        const activityId = act.id;
        
        const existingLog = await db.get(
          `SELECT id FROM activity_logs 
           WHERE user_id = ? AND (timestamp = ? OR raw_payload LIKE ? OR raw_payload LIKE ?)`,
          userId, act.start_date, `%${activityId}%`, `%"id":${activityId}%`
        );

        if (existingLog) {
          continue;
        }

        const distanceReal = parseFloat((act.distance / 1000).toFixed(2));
        const durationReal = act.moving_time || act.elapsed_time || 0;
        const avgHr = act.has_heartrate ? Math.round(act.average_heartrate) : null;
        const maxHr = act.has_heartrate ? Math.round(act.max_heartrate) : null;
        const avgPower = act.device_watts ? Math.round(act.average_watts) : null;
        const cadency = act.average_cadence ? Math.round(act.average_cadence) : null;
        const elevationGain = act.total_elevation_gain || null;
        const timestamp = act.start_date || new Date().toISOString();
        
        let paceReal = '0:00/km';
        const speedMps = act.average_speed;
        if (speedMps > 0) {
          const paceSecondsPerKm = 1000 / speedMps;
          const mins = Math.floor(paceSecondsPerKm / 60);
          const secs = Math.round(paceSecondsPerKm % 60);
          paceReal = `${mins}:${String(secs).padStart(2, '0')}/km`;
        }

        const activityType = getLocalSportIdByStravaType(act.type);

        let tssReal = 0;
        if (['Corrida', 'CorridaTrilha'].includes(activityType) && paceReal !== '0:00/km') {
          tssReal = calculatePaceTSS(durationReal, paceReal, user.threshold_pace);
        } else if (avgHr) {
          tssReal = calculateHrTSS(durationReal, avgHr, user.threshold_hr);
        } else {
          tssReal = Math.round((durationReal / 3600) * 60);
        }

        const dateStr = timestamp.split('T')[0];
        let workout = await db.get<{ id: number; plan_id: number }>(
          "SELECT id, plan_id FROM workouts WHERE date = ? AND type = ? AND status IN ('pending', 'adjusted')",
          dateStr,
          activityType
        );

        if (!workout) {
          workout = await db.get<{ id: number; plan_id: number }>(
            `SELECT w.id, w.plan_id FROM workouts w
             JOIN training_plans tp ON w.plan_id = tp.id
             WHERE tp.user_id = ? AND tp.active = 1 AND w.type = ? AND w.status IN ('pending', 'adjusted')
             ORDER BY w.date ASC LIMIT 1`,
            userId,
            activityType
          );
        }

        const workoutId = workout ? workout.id : null;
        const rawPayloadString = JSON.stringify(act);
        
        await db.run(`
          INSERT INTO activity_logs (
            workout_id, user_id, sync_source, timestamp, type, distance_real, duration_real, 
            pace_real, avg_hr, max_hr, avg_power, cadency, elevation_gain, tss_real, raw_payload
          ) VALUES (?, ?, 'Strava', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          workoutId, userId, timestamp, activityType, distanceReal, durationReal,
          paceReal, avgHr, maxHr, avgPower, cadency, elevationGain, tssReal, rawPayloadString
        );

        if (workoutId) {
          await db.run(
            'UPDATE workouts SET status = "completed" WHERE id = ?',
            workoutId
          );
          await autoRegulateTrainingPlan(db, userId, workoutId, tssReal);
        }

        if (['Corrida', 'CorridaTrilha'].includes(activityType) && durationReal >= 1800) {
          let newLthr = user.threshold_hr;
          if (avgHr) {
            newLthr = avgHr;
          } else if (maxHr) {
            newLthr = Math.round(maxHr * 0.90);
          }

          const cleanPaceReal = paceReal.replace('/km', '').trim();

          if (newLthr !== user.threshold_hr || cleanPaceReal !== user.threshold_pace) {
            await db.run(
              'UPDATE users SET threshold_hr = ?, threshold_pace = ? WHERE id = ?',
              newLthr,
              cleanPaceReal,
              userId
            );

            const durationMins = Math.round(durationReal / 60);
            const autoCalibrateMsg = `Identifiquei sua corrida sincronizada de ${durationMins} min (${distanceReal} km). Com base nela, recalibrei automaticamente seus limiares fisiológicos no seu perfil. Nova Frequência Limiar: ${newLthr} bpm. Novo Pace Limiar: ${cleanPaceReal}/km.`;

            const todayYmd = new Date().toISOString().split('T')[0];
            await db.run(
              `INSERT INTO coach_notifs (user_id, date, title, content, read)
               VALUES (?, ?, 'Recalibração Fisiológica Automática 🏃‍♂️', ?, 0)`,
              userId,
              todayYmd,
              autoCalibrateMsg
            );
          }
        }

        syncedCount++;
      } catch (actErr: any) {
        console.error(`Erro ao sincronizar atividade do Strava:`, actErr);
        errors.push(`Erro na atividade ID ${act.id || 'desconhecido'}: ${actErr.message || actErr}`);
      }
    }

    return { success: true, syncedCount, errors };

  } catch (err: any) {
    console.error('Erro na sincronização de atividades do Strava:', err);
    return { success: false, syncedCount: 0, errors: [err.message || err] };
  }
}
