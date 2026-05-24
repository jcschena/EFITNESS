import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateHrTSS, calculatePaceTSS, autoRegulateTrainingPlan } from '@/lib/coach-engine';
import { getStravaAccessToken } from '@/lib/strava';

const VERIFY_TOKEN = 'APEX_STRAVA_TOKEN';

// Handshake de Validação do Strava (GET Request)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook Strava Validado com Sucesso!');
        return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response('Token inválido ou incorreto', { status: 403 });
  } catch (error) {
    return new Response('Erro interno', { status: 500 });
  }
}

// Recepção de Eventos do Strava (POST Request)
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const db = await getDb();

    console.log('Webhook Strava Recebido:', JSON.stringify(payload));

    // Identificar se é uma chamada do Simulador Sandbox contendo os dados prontos
    const isMock = payload.isMock === true;

    let userId = parseInt(payload.userId || '1', 10); // Default Tiago Aço
    let activityType = payload.type || 'Corrida'; // 'Corrida', 'Ciclismo'
    let distanceReal = parseFloat(payload.distance || '0'); // km
    let durationReal = parseInt(payload.duration || '0', 10); // segundos
    let avgHr = payload.avgHr ? parseInt(payload.avgHr, 10) : null;
    let maxHr = payload.maxHr ? parseInt(payload.maxHr, 10) : null;
    let avgPower = payload.avgPower ? parseInt(payload.avgPower, 10) : null;
    let cadency = payload.cadence ? parseInt(payload.cadence, 10) : null;
    let elevationGain = payload.elevationGain ? parseFloat(payload.elevationGain) : null;
    let timestamp = payload.timestamp || new Date().toISOString();
    let paceReal = payload.pace || '0:00/km';
    let tssReal = parseInt(payload.tss || '0', 10);

    // Se NÃO for mock e for o fluxo real do Strava (contendo object_id e owner_id)
    if (!isMock && payload.object_type === 'activity' && payload.object_id) {
      const stravaOwnerId = payload.owner_id;
      const activityId = payload.object_id;

      // Localizar o usuário que possui esta conta Strava vinculada
      // Para fins demonstrativos locais, se não achar, usaremos o usuário 1
      const userByStrava = await db.get(
        'SELECT id, threshold_hr, threshold_pace, strava_access_token FROM users WHERE id = ? OR strava_access_token IS NOT NULL LIMIT 1',
        userId
      );

      if (!userByStrava) {
        return NextResponse.json({ error: 'Nenhum usuário com Strava configurado' }, { status: 404 });
      }

      userId = userByStrava.id;

      // Buscar os detalhes completos da atividade na API do Strava usando o Token do usuário
      // Como no ambiente dev as chaves podem ser simuladas, faremos uma chamada mockada se o token for 'mock_...'
      const accessToken = await getStravaAccessToken(db, userId);
      
      if (accessToken && !accessToken.startsWith('mock_')) {
        try {
          const stravaResponse = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          
          if (stravaResponse.ok) {
            const stravaActivity = await stravaResponse.json();
            
            // Mapear dados do Strava para as nossas variáveis fisiológicas
            // O Strava retorna distância em metros, velocidade em m/s e duração em segundos
            distanceReal = parseFloat((stravaActivity.distance / 1000).toFixed(2));
            durationReal = stravaActivity.moving_time || stravaActivity.elapsed_time;
            avgHr = stravaActivity.has_heartrate ? Math.round(stravaActivity.average_heartrate) : null;
            maxHr = stravaActivity.has_heartrate ? Math.round(stravaActivity.max_heartrate) : null;
            avgPower = stravaActivity.device_watts ? Math.round(stravaActivity.average_watts) : null;
            cadency = stravaActivity.average_cadence ? Math.round(stravaActivity.average_cadence) : null;
            elevationGain = stravaActivity.total_elevation_gain || null;
            timestamp = stravaActivity.start_date || new Date().toISOString();
            
            // Tratar Pace
            const speedMps = stravaActivity.average_speed; // m/s
            if (speedMps > 0) {
              const paceSecondsPerKm = 1000 / speedMps;
              const mins = Math.floor(paceSecondsPerKm / 60);
              const secs = Math.round(paceSecondsPerKm % 60);
              paceReal = `${mins}:${String(secs).padStart(2, '0')}/km`;
            }

            // Converter tipo do Strava ('Run', 'Ride', 'Swim') para os nossos padrões
            if (stravaActivity.type === 'Run') activityType = 'Corrida';
            else if (stravaActivity.type === 'Ride') activityType = 'Ciclismo';
            else if (stravaActivity.type === 'Swim') activityType = 'Natacao';

          } else {
            console.warn('Falha ao obter atividade na API do Strava. Usando fallback de teste.');
          }
        } catch (fetchErr) {
          console.error('Erro na chamada da API Strava:', fetchErr);
        }
      }
    }

    // Obter dados do usuário para os cálculos de TSS
    const user = await db.get<{
      threshold_hr: number;
      threshold_pace: string;
    }>('SELECT threshold_hr, threshold_pace FROM users WHERE id = ?', userId);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Calcular o TSS se não fornecido
    if (tssReal === 0 && durationReal > 0) {
      if (activityType === 'Corrida' && paceReal !== '0:00/km') {
        tssReal = calculatePaceTSS(durationReal, paceReal, user.threshold_pace);
      } else if (avgHr) {
        tssReal = calculateHrTSS(durationReal, avgHr, user.threshold_hr);
      } else {
        tssReal = Math.round((durationReal / 3600) * 60); // fallback genérico
      }
    }

    // Tentar localizar o treino planejado correspondente no banco
    const dateStr = timestamp.split('T')[0];
    let workout = await db.get<{ id: number; plan_id: number }>(
      'SELECT id, plan_id FROM workouts WHERE date = ? AND type = ? AND status IN ("pending", "adjusted")',
      dateStr,
      activityType
    );

    // Se não achar por data, buscar o primeiro pendente geral da planilha ativa
    if (!workout) {
      workout = await db.get<{ id: number; plan_id: number }>(
        `SELECT w.id, w.plan_id FROM workouts w
         JOIN training_plans tp ON w.plan_id = tp.id
         WHERE tp.user_id = ? AND tp.active = 1 AND w.type = ? AND w.status IN ("pending", "adjusted")
         ORDER BY w.date ASC LIMIT 1`,
        userId,
        activityType
      );
    }

    const workoutId = workout ? workout.id : null;

    // Inserir registro no log de atividades (sync_source: 'Strava')
    const rawPayloadString = JSON.stringify(payload);
    await db.run(`
      INSERT INTO activity_logs (
        workout_id, user_id, sync_source, timestamp, type, distance_real, duration_real, 
        pace_real, avg_hr, max_hr, avg_power, cadency, elevation_gain, tss_real, raw_payload
      ) VALUES (?, ?, 'Strava', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      workoutId, userId, timestamp, activityType, distanceReal, durationReal,
      paceReal, avgHr, maxHr, avgPower, cadency, elevationGain, tssReal, rawPayloadString
    );

    // Se o treino foi identificado, atualizá-lo como completo
    if (workoutId) {
      await db.run(
        'UPDATE workouts SET status = "completed" WHERE id = ?',
        workoutId
      );

      // Disparar o Loop de Auto-Regulação Fisiológica
      await autoRegulateTrainingPlan(db, userId, workoutId, tssReal);
    }

    // RECALIBRAÇÃO FISIOLÓGICA AUTOMÁTICA
    // Se a atividade for de Corrida e durou pelo menos 30 minutos (1800 segundos)
    let autoCalibrated = false;
    let autoCalibrateMsg = '';
    if (activityType === 'Corrida' && durationReal >= 1800) {
      const currentUser = await db.get<{
        threshold_hr: number;
        threshold_pace: string;
        name: string;
      }>('SELECT threshold_hr, threshold_pace, name FROM users WHERE id = ?', userId);

      if (currentUser) {
        let newLthr = currentUser.threshold_hr;
        if (avgHr) {
          newLthr = avgHr;
        } else if (maxHr) {
          newLthr = Math.round(maxHr * 0.90);
        }

        const cleanPaceReal = paceReal.replace('/km', '').trim();

        if (newLthr !== currentUser.threshold_hr || cleanPaceReal !== currentUser.threshold_pace) {
          await db.run(
            'UPDATE users SET threshold_hr = ?, threshold_pace = ? WHERE id = ?',
            newLthr,
            cleanPaceReal,
            userId
          );

          autoCalibrated = true;
          const durationMins = Math.round(durationReal / 60);
          autoCalibrateMsg = `Identifiquei sua corrida de hoje com duração de ${durationMins} min (${distanceReal} km). Com base nela, recalibrei automaticamente seus limiares fisiológicos no seu perfil. Nova Frequência Limiar: ${newLthr} bpm. Novo Pace Limiar: ${cleanPaceReal}/km.`;

          const todayYmd = new Date().toISOString().split('T')[0];
          await db.run(
            `INSERT INTO coach_notifs (user_id, date, title, content, read)
             VALUES (?, ?, 'Recalibração Fisiológica Automática 🏃‍♂️', ?, 0)`,
            userId,
            todayYmd,
            autoCalibrateMsg
          );
          
          console.log(`[Recalibração Automática] Usuário ${currentUser.name} (id=${userId}) recalibrado: LTHR=${newLthr} bpm, Pace=${cleanPaceReal}.`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Atividade sincronizada via Strava com sucesso!',
      workoutAssociated: !!workoutId,
      workoutId,
      calculatedTss: tssReal,
      activityId: payload.object_id || null,
      autoCalibrated,
      autoCalibrateMsg
    });

  } catch (error: unknown) {
    console.error('Erro no processamento do Strava Webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage
    }, { status: 500 });
  }
}
