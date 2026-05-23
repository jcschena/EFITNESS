import { getDb } from './db';

async function testConnection() {
  console.log('Iniciando teste de conexão com o SQLite...');
  try {
    const db = await getDb();
    
    // Testar se as tabelas foram criadas
    const users = await db.all('SELECT * FROM users');
    console.log(`Sucesso! Encontrados ${users.length} usuários no banco de dados:`);
    for (const u of users) {
      console.log(`- ID: ${u.id} | Nome: ${u.name} | Nível: ${u.level} | Garmin Conectado: ${u.garmin_connected}`);
    }

    const workouts = await db.all('SELECT * FROM workouts');
    console.log(`\nPrescrições de treino cadastradas: ${workouts.length} sessões.`);

    const goals = await db.all('SELECT * FROM goals');
    console.log(`Objetivos cadastrados: ${goals.length} metas.`);

    const notifs = await db.all('SELECT * FROM coach_notifs');
    console.log(`Notificações do coach cadastradas: ${notifs.length} mensagens.`);

    console.log('\nTeste de banco de dados concluído com sucesso total!');
  } catch (error) {
    console.error('Erro ao testar conexão do banco de dados:', error);
    process.exit(1);
  }
}

testConnection();
