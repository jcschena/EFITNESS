import { Pool } from 'pg';
import path from 'path';
import type { Database } from 'sqlite';

// Interface unificada para abstrair o banco de dados (SQLite ou PostgreSQL)
export interface DatabaseClient {
  get<T = any>(query: string, ...params: any[]): Promise<T | undefined>;
  all<T = any>(query: string, ...params: any[]): Promise<T[]>;
  run(query: string, ...params: any[]): Promise<{ lastID?: number }>;
  exec(query: string): Promise<void>;
}

let dbInstance: DatabaseClient | null = null;

// Função principal de acesso ao Banco de Dados
export async function getDb(): Promise<DatabaseClient> {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL || 
                      process.env.SUPABASE_DATABASE_URL || 
                      process.env.POSTGRES_URL_NON_POOLING || 
                      process.env.POSTGRES_URL;

  if (databaseUrl) {
    console.log('Ambiente de produção/nuvem detectado. Conectando ao PostgreSQL (Supabase)...');
    const pgAdapter = new PostgreSQLAdapter(databaseUrl);
    await pgAdapter.connect();
    dbInstance = pgAdapter;
  } else {
    // Se estiver rodando na Vercel (produção na nuvem), proibir o uso do SQLite
    if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
      throw new Error('Banco de dados PostgreSQL não configurado. Por favor, adicione a variável de ambiente DATABASE_URL nas configurações do seu projeto na Vercel com a conexão do Supabase.');
    }

    console.log('Ambiente de desenvolvimento local detectado. Conectando ao SQLite...');
    const sqliteAdapter = new SQLiteAdapter();
    await sqliteAdapter.connect();
    dbInstance = sqliteAdapter;
  }

  return dbInstance;
}

// Helper para converter parâmetros de '?' (SQLite) para '$1, $2' (PostgreSQL)
function translateQuery(query: string): string {
  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

// ==========================================
// 1. ADAPTADOR POSTGRESQL (SUPABASE / CLOUD)
// ==========================================
class PostgreSQLAdapter implements DatabaseClient {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Exigido pelo Supabase para conexões externas seguras
      }
    });
  }

  async connect() {
    // Tenta conectar e criar o schema de tabelas no PostgreSQL
    await this.initializeSchema();
  }

  async get<T = any>(query: string, ...params: any[]): Promise<T | undefined> {
    const translated = translateQuery(query);
    const result = await this.pool.query(translated, params);
    return result.rows[0] as T | undefined;
  }

  async all<T = any>(query: string, ...params: any[]): Promise<T[]> {
    const translated = translateQuery(query);
    const result = await this.pool.query(translated, params);
    return result.rows as T[];
  }

  async run(query: string, ...params: any[]): Promise<{ lastID?: number }> {
    const translated = translateQuery(query);
    // No PostgreSQL, para retornar o ID inserido, adicionamos RETURNING id na query se for INSERT
    let finalQuery = translated;
    if (query.trim().toUpperCase().startsWith('INSERT ')) {
      // Remover ponto e vírgula se houver no final
      const cleanQuery = finalQuery.trim().replace(/;$/, '');
      finalQuery = `${cleanQuery} RETURNING id`;
    }
    
    const result = await this.pool.query(finalQuery, params);
    const lastID = result.rows[0]?.id;
    return { lastID };
  }

  async exec(query: string): Promise<void> {
    // Executa múltiplos statements (usado principalmente na inicialização)
    await this.pool.query(query);
  }

  private async initializeSchema() {
    // Traduzir o DDL de criação do SQLite para PostgreSQL
    const ddl = getInitialSchemaDDL()
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
      .replace(/REAL/g, 'DOUBLE PRECISION')
      .replace(/PRAGMA foreign_keys = ON/g, ''); // Ignorar pragma no Postgres

    try {
      await this.exec(ddl);
      console.log('Schema do PostgreSQL verificado/criado com sucesso.');

      // Verificar se há dados no banco
      const userCheck = await this.get('SELECT COUNT(*) as count FROM users');
      if (userCheck && parseInt(userCheck.count, 10) === 0) {
        console.log('Banco de dados PostgreSQL vazio. Rodando seed inicial...');
        await seedDatabase(this);
      }
    } catch (err) {
      console.error('Erro ao inicializar schema do PostgreSQL:', err);
    }
  }
}

// ==========================================
// 2. ADAPTADOR SQLite (DESENVOLVIMENTO LOCAL)
// ==========================================
class SQLiteAdapter implements DatabaseClient {
  private db!: Database;

  async connect() {
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');

    const dbPath = path.resolve(process.cwd(), 'efitness.db');
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await this.db.run('PRAGMA foreign_keys = ON');
    
    // Iniciar Schema no SQLite
    const ddl = getInitialSchemaDDL();
    await this.db.exec(ddl);

    const userCheck = await this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (userCheck && userCheck.count === 0) {
      console.log('Banco de dados SQLite vazio. Rodando seed inicial...');
      await seedDatabase(this);
    }
  }

  async get<T = any>(query: string, ...params: any[]): Promise<T | undefined> {
    return await this.db.get<T>(query, ...params);
  }

  async all<T = any>(query: string, ...params: any[]): Promise<T[]> {
    return await this.db.all<T[]>(query, ...params);
  }

  async run(query: string, ...params: any[]): Promise<{ lastID?: number }> {
    const res = await this.db.run(query, ...params);
    return { lastID: res.lastID };
  }

  async exec(query: string): Promise<void> {
    await this.db.exec(query);
  }
}

// ==========================================
// 3. SCHEMA DDL E SEED DE DADOS
// ==========================================
function getInitialSchemaDDL(): string {
  return `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight REAL NOT NULL,
      threshold_hr INTEGER NOT NULL,
      threshold_pace TEXT NOT NULL,
      weekly_target_hours INTEGER NOT NULL,
      strava_connected INTEGER DEFAULT 0,
      strava_access_token TEXT,
      strava_refresh_token TEXT,
      strava_token_expires INTEGER
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      distance REAL NOT NULL,
      date_target TEXT NOT NULL,
      target_time TEXT,
      weekly_tss_target INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS training_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      distance_target REAL,
      duration_target INTEGER,
      pace_target TEXT,
      power_target INTEGER,
      tss_target INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY(plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER,
      sync_source TEXT DEFAULT 'Strava',
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      distance_real REAL NOT NULL,
      duration_real INTEGER NOT NULL,
      pace_real TEXT NOT NULL,
      avg_hr INTEGER,
      max_hr INTEGER,
      avg_power INTEGER,
      cadency INTEGER,
      elevation_gain REAL,
      tss_real INTEGER NOT NULL,
      raw_payload TEXT,
      FOREIGN KEY(workout_id) REFERENCES workouts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coach_notifs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
}

function getWeekDates(): Date[] {
  const current = new Date();
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function seedDatabase(db: DatabaseClient) {
  // 1. Inserir usuários
  const eliteUserId = (await db.run(`
    INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected, strava_access_token)
    VALUES ('Tiago "Aço" Silva', 'elite', 32, 68.5, 172, '3:45', 18, 1, 'mock_strava_token_elite')
  `)).lastID;

  const sedentarioUserId = (await db.run(`
    INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected)
    VALUES ('Ana Santos', 'sedentario', 45, 82.0, 145, '8:30', 4, 0)
  `)).lastID;

  if (!eliteUserId || !sedentarioUserId) return;

  // 2. Inserir objetivos
  await db.run(`
    INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
    VALUES (?, 'Triathlon', 226.2, ?, '09:45:00', 650)
  `, eliteUserId, formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)));

  await db.run(`
    INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
    VALUES (?, 'Corrida', 5.0, ?, '00:35:00', 120)
  `, sedentarioUserId, formatDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)));

  // 3. Inserir planos
  const weekDates = getWeekDates();
  const startDateStr = formatDate(weekDates[0]);
  const endDateStr = formatDate(weekDates[6]);

  const elitePlanId = (await db.run(`
    INSERT INTO training_plans (user_id, name, start_date, end_date, active)
    VALUES (?, 'Periodização Específica Ironman - Semana 8', ?, ?, 1)
  `, eliteUserId, startDateStr, endDateStr)).lastID;

  const sedentarioPlanId = (await db.run(`
    INSERT INTO training_plans (user_id, name, start_date, end_date, active)
    VALUES (?, 'Transição Sedentarismo Ativo - Semana 3', ?, ?, 1)
  `, sedentarioUserId, startDateStr, endDateStr)).lastID;

  if (!elitePlanId || !sedentarioPlanId) return;

  // 4. Inserir treinos
  // Elite
  const eliteWorkouts = [
    { day: 1, type: 'Ciclismo', dist: 45.0, dur: 5400, pace: '30.0 km/h', power: 195, tss: 55, title: 'Giro de Recuperação Ativa (Z1/Z2)', desc: 'Foco em manter cadência alta (90-95 rpm) e pressão leve nos pedais.' },
    { day: 2, type: 'Corrida', dist: 14.0, dur: 3960, pace: '4:45/km', power: 0, tss: 85, title: 'Intervalado de Limiar de Lactato (Z4)', desc: 'Principal: 5x 1500m em ritmo de limiar (3:45/km) com 2 min de recuperação.' },
    { day: 3, type: 'Natacao', dist: 3.2, dur: 3600, pace: '1:52/100m', power: 0, tss: 60, title: 'Endurance Aeróbia com Palmar/Flutuador', desc: 'Principal: 3x 800m constante mantendo ritmo de Meio Iron.' },
    { day: 4, type: 'Ciclismo', dist: 60.0, dur: 7200, pace: '30.0 km/h', power: 240, tss: 110, title: 'Intervalos de Potência - Tempo/SST', desc: 'Principal: 3x 20 min a 88% do FTP (240W) com cadência em 85 rpm.' },
    { day: 5, type: 'Forca', dist: 0.0, dur: 2700, pace: 'N/A', power: 0, tss: 25, title: 'Fortalecimento Específico & Core', desc: 'Foco em agachamentos, pranchas e exercícios excêntricos de panturrilha.' },
    { day: 6, type: 'Corrida', dist: 32.0, dur: 9000, pace: '4:40/km', power: 0, tss: 260, title: 'Corrida Longa de Resistência (Z2 Aeróbia)', desc: 'Manter ritmo constante em Zona 2. Hidratação e nutrição obrigatórias.' },
    { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Recuperação Fisiológica Total', desc: 'Descanso completo para supercompensação muscular.' }
  ];

  for (const w of eliteWorkouts) {
    await db.run(`
      INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, elitePlanId, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
  }

  // Sedentario
  const sedentarioWorkouts = [
    { day: 1, type: 'Corrida', dist: 3.5, dur: 1800, pace: '8:30/km', power: 0, tss: 20, title: 'Caminhada & Trote Intervalado 1:2', desc: 'Aquecimento: 5 min. Principal: 8x (1 min trote leve + 2 min caminhando).' },
    { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso e Regeneração', desc: 'Descanso absoluto para adaptação articular.' },
    { day: 3, type: 'Forca', dist: 0.0, dur: 1800, pace: 'N/A', power: 0, tss: 12, title: 'Funcional e Mobilidade para Iniciantes', desc: 'Pontes de glúteo, flexões na parede e alongamento dinâmico.' },
    { day: 4, type: 'Corrida', dist: 4.0, dur: 2100, pace: '8:20/km', power: 0, tss: 25, title: 'Caminhada & Trote Intervalado 1:1.5', desc: 'Principal: 8x (1 min 15s trote + 1 min 45s caminhando).' },
    { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso e Regeneração', desc: 'Dia de repouso completo.' },
    { day: 6, type: 'Corrida', dist: 4.5, dur: 2400, pace: '8:15/km', power: 0, tss: 35, title: 'Desafio Aeróbico Semanal (Trote Longo)', desc: 'Tentar correr 2 blocos de 5 minutos contínuos separados por 3 min de caminhada.' },
    { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso de Final de Semana', desc: 'Aproveite o domingo para relaxar.' }
  ];

  for (const w of sedentarioWorkouts) {
    await db.run(`
      INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, sedentarioPlanId, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
  }

  // Notificações
  await db.run(`
    INSERT INTO coach_notifs (user_id, date, title, content)
    VALUES (?, ?, 'Bem-vindo ao APEX Coach AI!', 'Eu sou o seu Treinador Virtual. Analisei suas metas e montei sua planilha semanal de treinos dinâmicos. Sempre que você treinar e subir sua atividade no Strava, os dados serão sincronizados aqui e eu ajustarei seus treinos automaticamente para evitar overtraining ou compensar a falta. Vamos com tudo!')
  `, eliteUserId, formatDate(new Date()));

  await db.run(`
    INSERT INTO coach_notifs (user_id, date, title, content)
    VALUES (?, ?, 'Sua Jornada Começa Aqui!', 'Parabéns por dar o primeiro passo para sair do sedentarismo! Montei uma planilha segura de caminhada e corrida intervalada para você. Sem cobrança de ritmo, foque no conforto. Vamos usar o Strava para acompanhar sua evolução e comemorar cada vitória. Estou aqui para te guiar.')
  `, sedentarioUserId, formatDate(new Date()));
}
