import { getDb } from '/Users/jcschena/Documents/EFITNESS/src/lib/db';
import { GET } from '/Users/jcschena/Documents/EFITNESS/src/app/api/dashboard/route';

async function runTest() {
  console.log('=== Testando Todas as Fases da Periodização + Disponibilidade do Atleta ===\n');
  const db = await getDb();
  const userId = 3;

  // 1. Fazer backup dos dados originais
  const originalPlan = await db.get('SELECT * FROM training_plans WHERE user_id = ? AND active = 1', userId);
  if (!originalPlan) {
    console.error('Nenhum plano ativo encontrado para o usuário 3');
    return;
  }
  
  const originalWorkouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', originalPlan.id);
  const originalGoal = await db.get('SELECT * FROM goals WHERE user_id = ? ORDER BY date_target ASC LIMIT 1', userId);
  const originalRace = await db.get('SELECT * FROM races WHERE user_id = ? AND is_target = 1', userId);

  console.log(`[Backup] Plano: "${originalPlan.name}"`);
  console.log(`[Backup] Prova Alvo Original: ${originalRace ? `"${originalRace.name}"` : 'Nenhuma'}`);
  
  let success = true;

  // Função auxiliar para resetar o banco de dados antes de cada teste
  async function resetDBState() {
    await db.run(
      'UPDATE training_plans SET start_date = ?, end_date = ?, name = ? WHERE id = ?',
      originalPlan.start_date,
      originalPlan.end_date,
      'Planilha Inicial Personalizada - João Claudio',
      originalPlan.id
    );

    // Deletar qualquer workout novo gerado por splits e restaurar os originais
    await db.run('DELETE FROM workouts WHERE plan_id = ?', originalPlan.id);
    for (const orig of originalWorkouts) {
      await db.run(
        `INSERT INTO workouts (id, plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        orig.id,
        orig.plan_id,
        orig.day_of_week,
        orig.date,
        orig.type,
        orig.distance_target,
        orig.duration_target,
        orig.pace_target,
        orig.power_target,
        orig.tss_target,
        orig.title,
        orig.description,
        orig.status
      );
    }

    await db.run("DELETE FROM coach_notifs WHERE user_id = ? AND title = 'Planilha da Semana Seguinte Liberada! 🗓️'", userId);
  }

  // --- CENÁRIO 1: Disponibilidade Capada (sem almoço) ---
  console.log('\n--- Testando Disponibilidade Diária Restrita de 1 Hora (Sem almoço) ---');
  await resetDBState();

  // Definir prova alvo com disponibilidade de 1.0 hora e sem treino no almoço
  await db.run('DELETE FROM goals WHERE user_id = ?', userId);
  await db.run(
    `INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target, daily_available_hours, train_at_lunch, lunch_available_time)
     VALUES (?, 'Corrida', 10.0, '2026-08-10', '00:50:00', 240, 1.0, 0, 0)`,
    userId
  );

  // Executar simulação de Rollover (clientDate = 2026-06-01)
  let req = new Request(`http://localhost:3000/api/dashboard?userId=${userId}&clientDate=2026-06-01`);
  let response = await GET(req);
  let data = await response.json();

  if (!response.ok) {
    console.error('❌ Erro no rollover do Cenário 1:', data);
    success = false;
  } else {
    const updatedWorkouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', originalPlan.id);
    
    // O treino de natação (Day 1) original tinha 2100s. Multiplicado por 1.10 = 2310s (abaixo de 3600s, deve passar direto).
    // O treino longo (Day 6) original tinha 3600s. Multiplicado por 1.10 = 3960s (excede 3600s, deve ser capado para 3600s).
    const day6Workout = updatedWorkouts.find(w => w.day_of_week === 6 && w.type === 'Corrida');
    if (!day6Workout) {
      console.error('❌ Treino de sábado sumiu!');
      success = false;
    } else {
      if (day6Workout.duration_target !== 3600) {
        console.error(`❌ Treino de sábado não foi capado corretamente! Esperado: 3600 s, Obtido: ${day6Workout.duration_target} s`);
        success = false;
      } else {
        console.log(`✅ Treino de sábado capado corretamente para 3600s (limite diário de 1h).`);
        console.log(`   Distância final: ${day6Workout.distance_target} km (Escalada de 11.0 km)`);
        console.log(`   TSS final: ${day6Workout.tss_target} (Escalado de 77 TSS)`);
        console.log(`   Descrição: "${day6Workout.description}"`);
      }
    }
  }

  // --- CENÁRIO 2: Divisão de Treinos (Com almoço - Compatibilidade) ---
  console.log('\n--- Testando Divisão de Treino com Almoço Disponível (Compatibilidade) ---');
  await resetDBState();

  // Definir prova alvo com limite de 1.0 hora, treino no almoço ativado, e 30 minutos disponíveis no almoço
  await db.run('DELETE FROM goals WHERE user_id = ?', userId);
  await db.run(
    `INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target, daily_available_hours, train_at_lunch, lunch_available_time)
     VALUES (?, 'Corrida', 10.0, '2026-08-10', '00:50:00', 240, 1.0, 1, 30)`,
    userId
  );

  // Executar simulação de Rollover (clientDate = 2026-06-01)
  req = new Request(`http://localhost:3000/api/dashboard?userId=${userId}&clientDate=2026-06-01`);
  response = await GET(req);
  data = await response.json();

  if (!response.ok) {
    console.error('❌ Erro no rollover do Cenário 2:', data);
    success = false;
  } else {
    const updatedWorkouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', originalPlan.id);
    
    // O treino longo (Day 6) original tinha 3600s. Multiplicado por 1.10 = 3960s (excede 3600s, e deve ser dividido!)
    // Deve haver 2 treinos para o day_of_week = 6 de tipo 'Corrida'
    const day6Runs = updatedWorkouts.filter(w => w.day_of_week === 6 && w.type === 'Corrida');
    if (day6Runs.length !== 2) {
      console.error(`❌ Treino de sábado não foi dividido! Esperado: 2 sessões, Obtido: ${day6Runs.length} sessões`);
      success = false;
    } else {
      const lunchSession = day6Runs.find(w => w.title.includes('Sessão Almoço'));
      const morningSession = day6Runs.find(w => w.title.includes('Sessão Manhã'));

      if (!lunchSession || !morningSession) {
        console.error('❌ Sessões de almoço/manhã não encontradas com esses títulos.');
        success = false;
      } else {
        console.log('✅ Treino longo de sábado dividido com sucesso em 2 sessões!');
        console.log(`   Sessão Manhã: Dur: ${morningSession.duration_target} s (60m) | Dist: ${morningSession.distance_target} km | TSS: ${morningSession.tss_target}`);
        console.log(`   Sessão Almoço: Dur: ${lunchSession.duration_target} s (6m) | Dist: ${lunchSession.distance_target} km | TSS: ${lunchSession.tss_target}`);
        
        if (morningSession.duration_target !== 3600) {
          console.error(`❌ Duração da manhã incorreta. Esperada: 3600s, Obtida: ${morningSession.duration_target}s`);
          success = false;
        }
        if (lunchSession.duration_target !== 360) { // 3960 - 3600 = 360s (6m)
          console.error(`❌ Duração do almoço incorreta. Esperada: 360s, Obtida: ${lunchSession.duration_target}s`);
          success = false;
        }
      }
    }
  }

  // --- CENÁRIO 3: Divisão em 2 Turnos (Manhã + Fim do Dia) ---
  console.log('\n--- Testando Divisão de Treino em Dois Turnos (Manhã + Fim do Dia) ---');
  await resetDBState();

  // Definir prova alvo com os turnos ativos:
  // - Manhã: 45 min (2700s)
  // - Almoço: Inativo
  // - Fim do Dia: 45 min (2700s)
  // Total disponível: 90 min (1.5h / 5400s)
  await db.run('DELETE FROM goals WHERE user_id = ?', userId);
  await db.run(
    `INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target, train_in_morning, morning_available_time, train_at_lunch, lunch_available_time, train_at_night, night_available_time)
     VALUES (?, 'Corrida', 10.0, '2026-08-10', '00:50:00', 240, 1, 45, 0, 0, 1, 45)`,
    userId
  );

  // Executar simulação de Rollover (clientDate = 2026-06-01)
  req = new Request(`http://localhost:3000/api/dashboard?userId=${userId}&clientDate=2026-06-01`);
  response = await GET(req);
  data = await response.json();

  if (!response.ok) {
    console.error('❌ Erro no rollover do Cenário 3:', data);
    success = false;
  } else {
    const updatedWorkouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', originalPlan.id);
    
    // O treino longo (Day 6) original tinha 3600s. Multiplicado por 1.10 = 3960s (excede o primeiro slot de 2700s)
    // Deve ser dividido em 2 sessões:
    // - Sessão Manhã: 2700s (45m)
    // - Sessão Fim do Dia: 1260s (21m) (3960 - 2700 = 1260s)
    const day6Runs = updatedWorkouts.filter(w => w.day_of_week === 6 && w.type === 'Corrida');
    if (day6Runs.length !== 2) {
      console.error(`❌ Treino de sábado no Cenário 3 não foi dividido corretamente! Esperado: 2 sessões, Obtido: ${day6Runs.length} sessões`);
      success = false;
    } else {
      const morningSession = day6Runs.find(w => w.title.includes('Sessão Manhã'));
      const nightSession = day6Runs.find(w => w.title.includes('Sessão Fim do Dia'));

      if (!morningSession || !nightSession) {
        console.error('❌ Sessões de manhã/fim do dia não encontradas com esses títulos no Cenário 3.');
        success = false;
      } else {
        console.log('✅ Treino longo de sábado no Cenário 3 dividido com sucesso em 2 sessões!');
        console.log(`   Sessão Manhã: Dur: ${morningSession.duration_target} s (45m) | Dist: ${morningSession.distance_target} km | TSS: ${morningSession.tss_target}`);
        console.log(`   Sessão Fim do Dia: Dur: ${nightSession.duration_target} s (21m) | Dist: ${nightSession.distance_target} km | TSS: ${nightSession.tss_target}`);
        
        if (morningSession.duration_target !== 2700) {
          console.error(`❌ Duração da manhã no Cenário 3 incorreta. Esperada: 2700s, Obtida: ${morningSession.duration_target}s`);
          success = false;
        }
        if (nightSession.duration_target !== 1260) {
          console.error(`❌ Duração do fim do dia no Cenário 3 incorreta. Esperada: 1260s, Obtida: ${nightSession.duration_target}s`);
          success = false;
        }
      }
    }
  }

  // --- CENÁRIO 4: Divisão Completa em 3 Sessões ---
  console.log('\n--- Testando Divisão Completa em Três Sessões (Manhã, Almoço e Fim do Dia) ---');
  await resetDBState();

  // Definir prova alvo com os 3 turnos ativos, com limites baixos:
  // - Manhã: 30 min (1800s)
  // - Almoço: 30 min (1800s)
  // - Fim do Dia: 30 min (1800s)
  // Total disponível: 90 min (5400s)
  await db.run('DELETE FROM goals WHERE user_id = ?', userId);
  await db.run(
    `INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target, train_in_morning, morning_available_time, train_at_lunch, lunch_available_time, train_at_night, night_available_time)
     VALUES (?, 'Corrida', 10.0, '2026-08-10', '00:50:00', 240, 1, 30, 1, 30, 1, 30)`,
    userId
  );

  // Executar simulação de Rollover (clientDate = 2026-06-01)
  req = new Request(`http://localhost:3000/api/dashboard?userId=${userId}&clientDate=2026-06-01`);
  response = await GET(req);
  data = await response.json();

  if (!response.ok) {
    console.error('❌ Erro no rollover do Cenário 4:', data);
    success = false;
  } else {
    const updatedWorkouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', originalPlan.id);
    
    // O treino longo (Day 6) original tinha 3600s. Multiplicado por 1.10 = 3960s.
    // Deve ser dividido em 3 sessões:
    // - Sessão Manhã: 1800s (30m)
    // - Sessão Almoço: 1800s (30m)
    // - Sessão Fim do Dia: 360s (6m) (3960 - 3600 = 360s)
    const day6Runs = updatedWorkouts.filter(w => w.day_of_week === 6 && w.type === 'Corrida');
    if (day6Runs.length !== 3) {
      console.error(`❌ Treino de sábado no Cenário 4 não foi dividido em 3 sessões! Esperado: 3 sessões, Obtido: ${day6Runs.length} sessões`);
      success = false;
    } else {
      const morningSession = day6Runs.find(w => w.title.includes('Sessão Manhã'));
      const lunchSession = day6Runs.find(w => w.title.includes('Sessão Almoço'));
      const nightSession = day6Runs.find(w => w.title.includes('Sessão Fim do Dia'));

      if (!morningSession || !lunchSession || !nightSession) {
        console.error('❌ Sessões de manhã/almoço/noite não encontradas com esses títulos no Cenário 4.');
        success = false;
      } else {
        console.log('✅ Treino longo de sábado no Cenário 4 dividido com sucesso em 3 sessões!');
        console.log(`   Sessão Manhã: Dur: ${morningSession.duration_target} s (30m) | Dist: ${morningSession.distance_target} km | TSS: ${morningSession.tss_target}`);
        console.log(`   Sessão Almoço: Dur: ${lunchSession.duration_target} s (30m) | Dist: ${lunchSession.distance_target} km | TSS: ${lunchSession.tss_target}`);
        console.log(`   Sessão Fim do Dia: Dur: ${nightSession.duration_target} s (6m) | Dist: ${nightSession.distance_target} km | TSS: ${nightSession.tss_target}`);
        
        if (morningSession.duration_target !== 1800) {
          console.error(`❌ Duração da manhã no Cenário 4 incorreta. Esperada: 1800s, Obtida: ${morningSession.duration_target}s`);
          success = false;
        }
        if (lunchSession.duration_target !== 1800) {
          console.error(`❌ Duração do almoço no Cenário 4 incorreta. Esperada: 1800s, Obtida: ${lunchSession.duration_target}s`);
          success = false;
        }
        if (nightSession.duration_target !== 360) {
          console.error(`❌ Duração do fim do dia no Cenário 4 incorreta. Esperada: 360s, Obtida: ${nightSession.duration_target}s`);
          success = false;
        }
      }
    }
  }

  // --- RESTAURAR DADOS ORIGINAIS DO BANCO ---
  console.log('\nRestaurando o banco de dados original...');
  await db.run('DELETE FROM goals WHERE user_id = ?', userId);
  if (originalGoal) {
    await db.run(
      `INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target, daily_available_hours, train_in_morning, morning_available_time, train_at_lunch, lunch_available_time, train_at_night, night_available_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      userId,
      originalGoal.type,
      originalGoal.distance,
      originalGoal.date_target,
      originalGoal.target_time,
      originalGoal.weekly_tss_target,
      originalGoal.daily_available_hours,
      originalGoal.train_in_morning ?? 1,
      originalGoal.morning_available_time ?? 60,
      originalGoal.train_at_lunch ?? 0,
      originalGoal.lunch_available_time ?? 0,
      originalGoal.train_at_night ?? 1,
      originalGoal.night_available_time ?? 60
    );
  }

  await db.run('UPDATE races SET is_target = 0 WHERE user_id = ?', userId);
  if (originalRace) {
    await db.run('UPDATE races SET is_target = 1 WHERE id = ?', originalRace.id);
  }

  await db.run(
    'UPDATE training_plans SET start_date = ?, end_date = ?, name = ? WHERE id = ?',
    originalPlan.start_date,
    originalPlan.end_date,
    originalPlan.name,
    originalPlan.id
  );

  await db.run('DELETE FROM workouts WHERE plan_id = ?', originalPlan.id);
  for (const orig of originalWorkouts) {
    await db.run(
      `INSERT INTO workouts (id, plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      orig.id,
      orig.plan_id,
      orig.day_of_week,
      orig.date,
      orig.type,
      orig.distance_target,
      orig.duration_target,
      orig.pace_target,
      orig.power_target,
      orig.tss_target,
      orig.title,
      orig.description,
      orig.status
    );
  }

  await db.run("DELETE FROM coach_notifs WHERE user_id = ? AND title = 'Planilha da Semana Seguinte Liberada! 🗓️'", userId);

  console.log('\n=== Conclusão Geral dos Testes ===');
  if (success) {
    console.log('🎉 EXCELENTE! TODOS OS TESTES DE DISPONIBILIDADE E DIVISÃO PASSARAM COM SUCESSO!');
  } else {
    console.error('❌ HOUVE FALHAS EM ALGUNS CENÁRIOS DE DISPONIBILIDADE.');
    process.exit(1);
  }
}

runTest().catch(console.error);
