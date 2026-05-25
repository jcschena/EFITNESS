import { getDb } from './db';
import { findBestMatchingWorkout, getCompatibleSportTypes } from './strava';

async function runTests() {
  console.log('=== Iniciando Testes de Associação do Strava ===\n');
  const db = await getDb();
  const userId = 3; // JOAO CLAUDIO SCHENA

  // Obter o plano ativo do usuário para referências
  const activePlan = await db.get(
    'SELECT * FROM training_plans WHERE user_id = ? AND active = 1',
    userId
  );
  if (!activePlan) {
    console.error('Nenhuma planilha ativa para o usuário 3. Cadastre uma antes de prosseguir.');
    return;
  }
  console.log(`Planilha ativa: ID=${activePlan.id}, Início=${activePlan.start_date}, Fim=${activePlan.end_date}\n`);

  // Antes de rodar os testes, vamos garantir que o treino do dia 2026-05-19 está como 'pending' no banco
  // para podermos testar a associação dele.
  await db.run(
    "UPDATE workouts SET status = 'pending' WHERE plan_id = ? AND date = '2026-05-19'",
    activePlan.id
  );

  // Cenário 1: Testar o helper de compatibilidade
  console.log('--- Testando Compatibilidade de Modalidades ---');
  console.log(`Compatíveis com 'Corrida': ${JSON.stringify(getCompatibleSportTypes('Corrida'))}`);
  console.log(`Compatíveis com 'CorridaTrilha': ${JSON.stringify(getCompatibleSportTypes('CorridaTrilha'))}`);
  console.log(`Compatíveis com 'Ciclismo': ${JSON.stringify(getCompatibleSportTypes('Ciclismo'))}`);
  console.log(`Compatíveis com 'Natacao': ${JSON.stringify(getCompatibleSportTypes('Natacao'))}`);
  console.log();

  // Cenário 2: Associação por data exata (Terça-feira, 2026-05-19 é Corrida na planilha)
  console.log('--- Testando Associação por Data Exata (Mesmo Dia) ---');
  const activityTimestamp1 = '2026-05-19T07:30:00Z'; // Terça-feira de manhã
  const match1 = await findBestMatchingWorkout(db, userId, activityTimestamp1, 'Corrida');
  if (match1) {
    const workoutDetails = await db.get('SELECT * FROM workouts WHERE id = ?', match1.id);
    console.log(`✅ Sucesso! Atividade de Corrida em 2026-05-19 associada ao treino:`);
    console.log(`   - ID Treino: ${workoutDetails.id}`);
    console.log(`   - Título: "${workoutDetails.title}"`);
    console.log(`   - Data Planejada: ${workoutDetails.date}`);
    console.log(`   - Tipo: ${workoutDetails.type}`);
  } else {
    console.log('❌ Falha ao associar atividade de mesma data.');
  }
  console.log();

  // Cenário 3: Associação de tipo compatível (CorridaTrilha deve associar com treino planejado de Corrida)
  console.log('--- Testando Associação com Esportes Compatíveis (Corrida de Trilha -> Corrida) ---');
  const match2 = await findBestMatchingWorkout(db, userId, activityTimestamp1, 'CorridaTrilha');
  if (match2) {
    const workoutDetails = await db.get('SELECT * FROM workouts WHERE id = ?', match2.id);
    console.log(`✅ Sucesso! Atividade de Corrida de Trilha associada ao treino de Corrida:`);
    console.log(`   - ID Treino: ${workoutDetails.id}`);
    console.log(`   - Título: "${workoutDetails.title}"`);
    console.log(`   - Data Planejada: ${workoutDetails.date}`);
    console.log(`   - Tipo: ${workoutDetails.type}`);
  } else {
    console.log('❌ Falha ao associar esporte compatível.');
  }
  console.log();

  // Cenário 4: Associação com timezone offset (Corrida na segunda-feira à noite local, mas terça-feira UTC)
  console.log('--- Testando Timezone Offset (Local: Segunda à noite, UTC: Terça de madrugada) ---');
  // Se a atividade ocorreu na segunda local (2026-05-18T21:30:00-03:00), o UTC é terça (2026-05-19T00:30:00Z)
  // Usando start_date_local (2026-05-18T21:30:00), a data local extraída deve ser 2026-05-18 (segunda-feira).
  // Como segunda-feira é Natação no banco, a busca exata falha.
  // Pela nova regra de negócio, a busca por proximidade na semana foi desativada (só associa no mesmo dia).
  // Portanto, a associação automática deve retornar null.
  const localTimestamp = '2026-05-18T21:30:00'; // start_date_local (Segunda-feira)
  
  const match3 = await findBestMatchingWorkout(db, userId, localTimestamp, 'Corrida');
  if (match3 === null) {
    console.log(`✅ Sucesso! Corrida local de Segunda-feira NÃO foi associada automaticamente ao treino de Terça-feira (busca restrita ao mesmo dia).`);
  } else {
    const workoutDetails = await db.get('SELECT * FROM workouts WHERE id = ?', match3.id);
    console.log(`❌ Falha! Esperava-se que não houvesse associação automática para dias diferentes, mas associou ao treino:`);
    console.log(`   - ID Treino: ${workoutDetails.id}`);
    console.log(`   - Data Planejada: ${workoutDetails.date}`);
  }
  console.log();

  // Cenário 5: Associação de Remo (Remo Indoor -> Remo e Remo -> Remo Indoor)
  console.log('--- Testando Equivalência de Remo e Remo Indoor ---');
  console.log(`Compatíveis com 'Remo': ${JSON.stringify(getCompatibleSportTypes('Remo'))}`);
  console.log(`Compatíveis com 'RemoIndoor': ${JSON.stringify(getCompatibleSportTypes('RemoIndoor'))}`);
  
  // Vamos inserir um treino temporário de Remo no banco para testar o casamento
  const testWorkoutDate = '2026-05-20';
  
  // Limpar qualquer teste anterior que possa ter sobrado
  await db.run('DELETE FROM workouts WHERE plan_id = ? AND date = ? AND type = ?', activePlan.id, testWorkoutDate, 'Remo');
  
  await db.run(
    `INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, tss_target, title, description, status)
     VALUES (?, 3, ?, 'Remo', 10.0, 3600, 50, 'Treino de Remo de Teste', 'Teste de Remo', 'pending')`,
    activePlan.id, testWorkoutDate
  );

  // Tentar encontrar o treino planejado usando 'RemoIndoor'
  const matchRowingIndoor = await findBestMatchingWorkout(db, userId, `${testWorkoutDate}T08:00:00Z`, 'RemoIndoor');
  if (matchRowingIndoor) {
    const workoutDetails = await db.get('SELECT * FROM workouts WHERE id = ?', matchRowingIndoor.id);
    console.log(`✅ Sucesso! Atividade de Remo Indoor associada ao treino planejado de Remo:`);
    console.log(`   - ID Treino: ${workoutDetails.id}`);
    console.log(`   - Título: "${workoutDetails.title}"`);
    console.log(`   - Tipo Planejado: ${workoutDetails.type}`);
  } else {
    console.log('❌ Falha ao associar Remo Indoor a treino planejado de Remo.');
  }

  // Agora vamos remover o treino temporário para deixar o banco limpo
  await db.run('DELETE FROM workouts WHERE plan_id = ? AND date = ? AND type = ?', activePlan.id, testWorkoutDate, 'Remo');
  console.log();

  // Cenário 6: Auto-regulação de treino extra (não planejado)
  console.log('--- Testando Auto-regulação de Treino Extra ---');
  // Criar um treino planejado pendente para o dia seguinte (ex: 2026-05-21)
  const tomorrowWorkoutDate = '2026-05-21';
  await db.run('DELETE FROM workouts WHERE plan_id = ? AND date = ? AND type = ?', activePlan.id, tomorrowWorkoutDate, 'Corrida');
  const tempWorkoutResult = await db.run(
    `INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, tss_target, title, description, status)
     VALUES (?, 4, ?, 'Corrida', 10.0, 3600, 80, 'Treino de Corrida de Teste Amanhã', 'Amanhã', 'pending')`,
    activePlan.id, tomorrowWorkoutDate
  );
  const tempWorkoutId = tempWorkoutResult.lastID;

  // Disparar a auto-regulação simulando um treino extra não planejado de 100 TSS realizado hoje (2026-05-20)
  // Como é um treino extra, passamos workoutId = null e a data do treino extra
  const { autoRegulateTrainingPlan } = await import('./coach-engine');
  await autoRegulateTrainingPlan(db, userId, null, 100, '2026-05-20');

  // Verificar se o treino planejado para amanhã foi ajustado (reduzido) para proteção de overtraining
  const adjustedWorkout = await db.get('SELECT * FROM workouts WHERE id = ?', tempWorkoutId);
  if (adjustedWorkout && adjustedWorkout.status === 'adjusted') {
    console.log(`✅ Sucesso! O treino extra de alta intensidade regulou a planilha dos dias seguintes.`);
    console.log(`   - Novo status: ${adjustedWorkout.status}`);
    console.log(`   - Novo TSS planejado: ${adjustedWorkout.tss_target} (Original: 80)`);
    console.log(`   - Nova descrição: ${adjustedWorkout.description}`);
  } else {
    console.log('❌ Falha ao regular a planilha a partir de treino extra.');
  }

  // Limpar dados do teste
  await db.run('DELETE FROM workouts WHERE id = ?', tempWorkoutId);
  await db.run('DELETE FROM coach_notifs WHERE user_id = ? AND title = ?', userId, 'Ajuste de Carga: Proteção contra Overtraining');
  console.log();

  console.log('=== Testes Concluídos ===');
}

runTests().catch(console.error);
