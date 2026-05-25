import { Pool } from 'pg';
import path from 'path';
import type { Database } from 'sqlite';
import crypto from 'crypto';

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

      // Migrations incrementais
      try {
        await this.exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TEXT;');
      } catch (e) {
        console.warn('Erro ao rodar migration birth_date no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;');
      } catch (e) {
        console.warn('Erro ao rodar migration username no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;');
      } catch (e) {
        console.warn('Erro ao rodar migration password no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_id INTEGER;');
      } catch (e) {
        console.warn('Erro ao rodar migration user_id no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE goals ADD COLUMN IF NOT EXISTS daily_available_hours DOUBLE PRECISION;');
      } catch (e) {
        console.warn('Erro ao rodar migration goals.daily_available_hours no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE goals ADD COLUMN IF NOT EXISTS train_in_morning INTEGER DEFAULT 1;');
      } catch (e) {
        console.warn('Erro ao rodar migration goals.train_in_morning no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE goals ADD COLUMN IF NOT EXISTS morning_available_time INTEGER DEFAULT 60;');
      } catch (e) {
        console.warn('Erro ao rodar migration goals.morning_available_time no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE goals ADD COLUMN IF NOT EXISTS train_at_lunch INTEGER DEFAULT 0;');
      } catch (e) {
        console.warn('Erro ao rodar migration goals.train_at_lunch no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE goals ADD COLUMN IF NOT EXISTS lunch_available_time INTEGER DEFAULT 0;');
      } catch (e) {
        console.warn('Erro ao rodar migration goals.lunch_available_time no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE goals ADD COLUMN IF NOT EXISTS train_at_night INTEGER DEFAULT 1;');
      } catch (e) {
        console.warn('Erro ao rodar migration goals.train_at_night no Postgres:', e);
      }
      try {
        await this.exec('ALTER TABLE goals ADD COLUMN IF NOT EXISTS night_available_time INTEGER DEFAULT 60;');
      } catch (e) {
        console.warn('Erro ao rodar migration goals.night_available_time no Postgres:', e);
      }
      try {
        await this.exec(`
          CREATE TABLE IF NOT EXISTS races (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            organizer TEXT,
            website TEXT,
            date_time TEXT NOT NULL,
            sport_type TEXT NOT NULL,
            distance DOUBLE PRECISION NOT NULL,
            country TEXT,
            city TEXT,
            is_target INTEGER DEFAULT 0
          );
        `);
      } catch (e) {
        console.warn('Erro ao rodar migration races no Postgres:', e);
      }

      // Limpar atletas duplicados "JOAO CLAUDIO SCHENA"
      try {
        await this.exec(`
          DELETE FROM users 
          WHERE TRIM(UPPER(name)) = 'JOAO CLAUDIO SCHENA' 
            AND id != (
              SELECT id FROM users 
              WHERE TRIM(UPPER(name)) = 'JOAO CLAUDIO SCHENA' 
              ORDER BY CASE WHEN strava_access_token IS NOT NULL THEN 0 ELSE 1 END, id ASC 
              LIMIT 1
            );
        `);
        // Definir aniversário padrão para o João caso esteja nulo
        await this.exec(`
          UPDATE users 
          SET birth_date = '1985-05-23' 
          WHERE TRIM(UPPER(name)) = 'JOAO CLAUDIO SCHENA' 
            AND (birth_date IS NULL OR birth_date = '');
        `);
        // Atualizar user_id nos logs antigos que possam ter ficado orfãos
        await this.exec(`
          UPDATE activity_logs 
          SET user_id = (
            SELECT tp.user_id 
            FROM workouts w 
            JOIN training_plans tp ON w.plan_id = tp.id 
            WHERE w.id = activity_logs.workout_id
          )
          WHERE user_id IS NULL AND workout_id IS NOT NULL;
        `);
      } catch (e) {
        console.warn('Erro ao limpar duplicados ou atualizar logs no Postgres:', e);
      }

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

    // Migrations incrementais no SQLite
    try {
      await this.db.exec('ALTER TABLE users ADD COLUMN birth_date TEXT;');
    } catch (e) {
      // Ignorar se já existe
    }
    try {
      await this.db.exec('ALTER TABLE users ADD COLUMN username TEXT;');
    } catch (e) {
      // Ignorar se já existe
    }
    try {
      await this.db.exec('ALTER TABLE users ADD COLUMN password TEXT;');
    } catch (e) {
      // Ignorar se já existe
    }
    try {
      await this.db.exec('ALTER TABLE activity_logs ADD COLUMN user_id INTEGER;');
    } catch (e) {
      // Ignorar se já existe
    }
    try {
      await this.db.exec('ALTER TABLE goals ADD COLUMN daily_available_hours REAL;');
    } catch (e) {}
    try {
      await this.db.exec('ALTER TABLE goals ADD COLUMN train_in_morning INTEGER DEFAULT 1;');
    } catch (e) {}
    try {
      await this.db.exec('ALTER TABLE goals ADD COLUMN morning_available_time INTEGER DEFAULT 60;');
    } catch (e) {}
    try {
      await this.db.exec('ALTER TABLE goals ADD COLUMN train_at_lunch INTEGER DEFAULT 0;');
    } catch (e) {}
    try {
      await this.db.exec('ALTER TABLE goals ADD COLUMN lunch_available_time INTEGER DEFAULT 0;');
    } catch (e) {}
    try {
      await this.db.exec('ALTER TABLE goals ADD COLUMN train_at_night INTEGER DEFAULT 1;');
    } catch (e) {}
    try {
      await this.db.exec('ALTER TABLE goals ADD COLUMN night_available_time INTEGER DEFAULT 60;');
    } catch (e) {}
    try {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS races (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          organizer TEXT,
          website TEXT,
          date_time TEXT NOT NULL,
          sport_type TEXT NOT NULL,
          distance REAL NOT NULL,
          country TEXT,
          city TEXT,
          is_target INTEGER DEFAULT 0,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
    } catch (e) {
      // Ignorar se já existe
    }

    // Limpar atletas duplicados "JOAO CLAUDIO SCHENA" no SQLite
    try {
      await this.db.exec(`
        DELETE FROM users 
        WHERE TRIM(UPPER(name)) = 'JOAO CLAUDIO SCHENA' 
          AND id != (
            SELECT id FROM users 
            WHERE TRIM(UPPER(name)) = 'JOAO CLAUDIO SCHENA' 
            ORDER BY CASE WHEN strava_access_token IS NOT NULL THEN 0 ELSE 1 END, id ASC 
            LIMIT 1
          );
      `);
      // Definir aniversário padrão para o João caso esteja nulo no SQLite
      await this.db.exec(`
        UPDATE users 
        SET birth_date = '1985-05-23' 
        WHERE TRIM(UPPER(name)) = 'JOAO CLAUDIO SCHENA' 
          AND (birth_date IS NULL OR birth_date = '');
      `);
      // Atualizar user_id nos logs antigos que possam ter ficado orfãos no SQLite
      await this.db.exec(`
        UPDATE activity_logs 
        SET user_id = (
          SELECT tp.user_id 
          FROM workouts w 
          JOIN training_plans tp ON w.plan_id = tp.id 
          WHERE w.id = activity_logs.workout_id
        )
        WHERE user_id IS NULL AND workout_id IS NOT NULL;
      `);
    } catch (e) {
      console.warn('Erro ao limpar duplicados ou atualizar logs no SQLite:', e);
    }

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
      strava_token_expires INTEGER,
      birth_date TEXT,
      username TEXT,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      distance REAL NOT NULL,
      date_target TEXT NOT NULL,
      target_time TEXT,
      weekly_tss_target INTEGER NOT NULL,
      daily_available_hours REAL,
      train_in_morning INTEGER DEFAULT 1,
      morning_available_time INTEGER DEFAULT 60,
      train_at_lunch INTEGER DEFAULT 0,
      lunch_available_time INTEGER DEFAULT 0,
      train_at_night INTEGER DEFAULT 1,
      night_available_time INTEGER DEFAULT 60,
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
      user_id INTEGER,
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
      FOREIGN KEY(workout_id) REFERENCES workouts(id) ON DELETE SET NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
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

    CREATE TABLE IF NOT EXISTS races (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      organizer TEXT,
      website TEXT,
      date_time TEXT NOT NULL,
      sport_type TEXT NOT NULL,
      distance REAL NOT NULL,
      country TEXT,
      city TEXT,
      is_target INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
}

export function getWeekDates(clientDate?: string): Date[] {
  const current = clientDate ? new Date(clientDate + 'T12:00:00') : new Date();
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current);
  monday.setDate(diff);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function generateWorkoutsForPlan(
  goalType: string, 
  level: string,
  availability?: {
    daily_available_hours?: number;
    train_in_morning?: number;
    morning_available_time?: number;
    train_at_lunch?: number;
    lunch_available_time?: number;
    train_at_night?: number;
    night_available_time?: number;
  }
): any[] {
  const workoutsToInsert: any[] = [];
  const normalizedGoal = goalType ? goalType.trim() : 'Corrida';
  const normalizedLevel = level ? level.trim() : 'intermediario';

  if (normalizedGoal === 'Triathlon') {
    if (normalizedLevel === 'sedentario') {
      workoutsToInsert.push(
        { day: 1, type: 'Natacao', dist: 0.8, dur: 1500, pace: '3:07/100m', power: 0, tss: 15, title: 'Natação Técnica Iniciante', desc: 'Foco na respiração bilateral e alinhamento do quadril. Use flutuador se necessário.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Recuperação Ativa', desc: 'Permita que suas articulações se adaptem ao volume inicial.' },
        { day: 3, type: 'Ciclismo', dist: 15.0, dur: 2100, pace: '25.7 km/h', power: 120, tss: 25, title: 'Giro Super Leve Plano', desc: 'Giro leve aeróbico conversacional para ganho de base.' },
        { day: 4, type: 'Corrida', dist: 3.0, dur: 1440, pace: '8:00/km', power: 0, tss: 18, title: 'Trote Leve (Transição)', desc: 'Aquecimento caminhando. Alternar trote leve com caminhada confortável.' },
        { day: 4, type: 'Forca', dist: 0.0, dur: 1800, pace: 'N/A', power: 0, tss: 10, title: 'Mobilidade & Core', desc: 'Sessão leve para fortalecimento do core e estabilidade articular.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia de repouso completo.' },
        { day: 6, type: 'Ciclismo', dist: 15.0, dur: 2100, pace: '25.7 km/h', power: 120, tss: 25, title: 'Giro de Sábado', desc: 'Pedal leve de fim de semana para ganhar confiança.' },
        { day: 6, type: 'Corrida', dist: 2.0, dur: 960, pace: '8:00/km', power: 0, tss: 12, title: 'Trote de Adaptação T2', desc: 'Trote curto logo após o ciclismo para adaptar as pernas à transição.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Aproveite o domingo para relaxar e se recuperar.' }
      );
    } else if (normalizedLevel === 'elite') {
      workoutsToInsert.push(
        { day: 1, type: 'Ciclismo', dist: 45.0, dur: 5400, pace: '30.0 km/h', power: 195, tss: 55, title: 'Giro de Recuperação Ativa (Z1/Z2)', desc: 'Foco em manter cadência alta (90-95 rpm) e pressão leve nos pedais.' },
        { day: 2, type: 'Natacao', dist: 3.0, dur: 3600, pace: '1:50/100m', power: 0, tss: 55, title: 'Técnica e Endurance Z2', desc: 'Principal: Séries longas de 400m focando no ritmo aeróbico contínuo.' },
        { day: 2, type: 'Corrida', dist: 10.0, dur: 2700, pace: '4:30/km', power: 0, tss: 65, title: 'Corrida de Transição T1', desc: 'Corrida em ritmo leve a moderado logo após o treino de natação.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 2700, pace: 'N/A', power: 0, tss: 20, title: 'Fortalecimento Específico & Core', desc: 'Foco em agachamentos, pranchas e exercícios excêntricos.' },
        { day: 4, type: 'Ciclismo', dist: 60.0, dur: 7200, pace: '30.0 km/h', power: 235, tss: 110, title: 'Intervalos de Potência - Sweet Spot (SST)', desc: 'Principal: 3x 15 min a 90% do FTP (Watts) com cadência controlada.' },
        { day: 4, type: 'Corrida', dist: 8.0, dur: 2400, pace: '5:00/km', power: 0, tss: 45, title: 'Corrida Regenerativa Leve', desc: 'Corrida super leve para soltar as pernas e limpar o lactato.' },
        { day: 5, type: 'Natacao', dist: 3.2, dur: 3600, pace: '1:52/100m', power: 0, tss: 60, title: 'Endurance Aeróbia com Palmar/Flutuador', desc: 'Principal: 3x 800m constante mantendo ritmo de Meio Iron.' },
        { day: 6, type: 'Ciclismo', dist: 90.0, dur: 10800, pace: '30.0 km/h', power: 200, tss: 180, title: 'Longo de Ciclismo de Endurance', desc: 'Simulação de ritmo de prova Ironman. Hidratação e nutrição obrigatórias.' },
        { day: 6, type: 'Corrida', dist: 5.0, dur: 1500, pace: '5:00/km', power: 0, tss: 30, title: 'Transição Rápida T2', desc: 'Corrida rápida de 5km logo após descer da bike para simular a sensação da prova.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Supercompensação Fisiológica', desc: 'Descanso completo para adaptação e supercompensação muscular.' }
      );
    } else {
      // Intermediário (Triathlon)
      workoutsToInsert.push(
        { day: 1, type: 'Natacao', dist: 1.5, dur: 2100, pace: '2:20/100m', power: 0, tss: 30, title: 'Técnica de Natação', desc: 'Trabalho de braçada, deslize e eficiência na água.' },
        { day: 2, type: 'Ciclismo', dist: 25.0, dur: 3000, pace: '30.0 km/h', power: 150, tss: 45, title: 'Giro Leve Aeróbico', desc: 'Manter effort controlado em Zona 2 para ganho de base aeróbia.' },
        { day: 3, type: 'Corrida', dist: 8.0, dur: 2880, pace: '6:00/km', power: 0, tss: 55, title: 'Corrida Leve Z2', desc: 'Foco em ritmo conversacional e controle da FC.' },
        { day: 4, type: 'Natacao', dist: 1.8, dur: 2400, pace: '2:13/100m', power: 0, tss: 35, title: 'Endurance Leve Aquática', desc: 'Séries contínuas focando em manter a técnica mesmo sob leve fadiga.' },
        { day: 4, type: 'Forca', dist: 0.0, dur: 2400, pace: 'N/A', power: 0, tss: 15, title: 'Fortalecimento Geral de Pernas & Core', desc: 'Agachamentos, passadas e pranchas para estabilização.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia de repouso total para tempo de adaptação.' },
        { day: 6, type: 'Ciclismo', dist: 40.0, dur: 4800, pace: '30.0 km/h', power: 160, tss: 75, title: 'Pedal Longo de Sábado', desc: 'Aumentando a rodagem semanal de ciclismo em ritmo estável.' },
        { day: 6, type: 'Corrida', dist: 4.0, dur: 1560, pace: '6:30/km', power: 0, tss: 30, title: 'Transição T2 Curta', desc: 'Calçar o tênis e correr leve logo após descer da bicicleta.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Dia livre para relaxamento e recuperação.' }
      );
    }
  } else if (normalizedGoal === 'Duathlon') {
    if (normalizedLevel === 'sedentario') {
      workoutsToInsert.push(
        { day: 1, type: 'Corrida', dist: 3.0, dur: 1440, pace: '8:00/km', power: 0, tss: 18, title: 'Trote Leve Iniciante', desc: 'Aquecimento de 5 minutos caminhando e depois trote super controlado.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Permita que os músculos se recuperem.' },
        { day: 3, type: 'Ciclismo', dist: 15.0, dur: 2400, pace: '22.5 km/h', power: 100, tss: 25, title: 'Pedal de Adaptação Plano', desc: 'Giro no plano sem subidas duras, mantendo cadência uniforme.' },
        { day: 4, type: 'Corrida', dist: 2.5, dur: 1200, pace: '8:00/km', power: 0, tss: 15, title: 'Caminhada & Trote (T2)', desc: 'Aquecimento de 5 min, depois alternar 1 min de trote com 1 min de caminhada.' },
        { day: 4, type: 'Forca', dist: 0.0, dur: 1800, pace: 'N/A', power: 0, tss: 10, title: 'Fortalecimento Core Leve', desc: 'Abdominais simples, pontes e alongamentos para lombar.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Recuperação completa.' },
        { day: 6, type: 'Ciclismo', dist: 20.0, dur: 3000, pace: '24.0 km/h', power: 110, tss: 30, title: 'Pedal Desafio de Sábado', desc: 'Pedalar um pouco mais longe em ritmo leve de passeio ativo.' },
        { day: 6, type: 'Corrida', dist: 1.5, dur: 720, pace: '8:00/km', power: 0, tss: 10, title: 'Trote Curto de Transição T2', desc: 'Trote bem curto logo após descer da bike para acostumar as pernas.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Dia livre para relaxamento.' }
      );
    } else if (normalizedLevel === 'elite') {
      workoutsToInsert.push(
        { day: 1, type: 'Corrida', dist: 8.0, dur: 2160, pace: '4:30/km', power: 0, tss: 45, title: 'Corrida Leve Aeróbia', desc: 'Treino regenerativo aeróbico confortável em Z2.' },
        { day: 2, type: 'Ciclismo', dist: 30.0, dur: 3600, pace: '30.0 km/h', power: 180, tss: 50, title: 'Giro de Giro de Manhã', desc: 'Giro aeróbico focado em cadência constante e ritmo uniforme.' },
        { day: 2, type: 'Corrida', dist: 10.0, dur: 2580, pace: '4:18/km', power: 0, tss: 65, title: 'Ritmo de Prova Z3', desc: 'Principal: 4x 2000m em ritmo de prova (Pace ~3:55/km) com 2 min de descanso.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 2700, pace: 'N/A', power: 0, tss: 20, title: 'Fortalecimento Específico Duathlon', desc: 'Foco em força de cadeia posterior (glúteos/panturrilhas) e estabilizadores de quadril.' },
        { day: 4, type: 'Ciclismo', dist: 50.0, dur: 6000, pace: '30.0 km/h', power: 235, tss: 90, title: 'Sweet Spot SST no Pedal', desc: 'Principal: 2x 20 min em Sweet Spot (Watts) com cadência controlada.' },
        { day: 4, type: 'Corrida', dist: 6.0, dur: 1800, pace: '5:00/km', power: 0, tss: 35, title: 'Corrida de Transição T2', desc: 'Corrida de soltura logo após o treino de ciclismo.' },
        { day: 5, type: 'Corrida', dist: 12.0, dur: 3120, pace: '4:20/km', power: 0, tss: 80, title: 'Intervalado de VO2 Máx', desc: 'Principal: 6x 1000m forte com recuperação de 90 segundos.' },
        { day: 6, type: 'Ciclismo', dist: 80.0, dur: 9600, pace: '30.0 km/h', power: 210, tss: 150, title: 'Pedal Longo de Endurance', desc: 'Pedal longo focado em simulação aeróbica de prova de duathlon.' },
        { day: 6, type: 'Corrida', dist: 4.0, dur: 1080, pace: '4:30/km', power: 0, tss: 25, title: 'Corrida Transição Rápida', desc: 'Transição rápida correndo forte para acostumar com as pernas pesadas.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso e Supercompensação', desc: 'Descanso fisiológico total para assimilação da carga.' }
      );
    } else {
      // Intermediário (Duathlon)
      workoutsToInsert.push(
        { day: 1, type: 'Corrida', dist: 6.0, dur: 1980, pace: '5:30/km', power: 0, tss: 35, title: 'Corrida de Base Z2', desc: 'Corrida leve aeróbia conversacional.' },
        { day: 2, type: 'Ciclismo', dist: 30.0, dur: 3600, pace: '30.0 km/h', power: 150, tss: 50, title: 'Pedal de Ritmo', desc: 'Giro focado em manter o esforço uniforme no plano.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 2400, pace: 'N/A', power: 0, tss: 15, title: 'Fortalecimento Pernas & Core', desc: 'Trabalho focado na estabilidade de quadril e core para suportar a transição.' },
        { day: 4, type: 'Corrida', dist: 8.0, dur: 2760, pace: '5:45/km', power: 0, tss: 55, title: 'Tempo Run (Limiar)', desc: 'Principal: 20 min contínuos em ritmo forte de limiar aeróbico.' },
        { day: 4, type: 'Ciclismo', dist: 20.0, dur: 2400, pace: '30.0 km/h', power: 135, tss: 30, title: 'Giro Regenerativo de Tarde', desc: 'Giro super leve na bike para soltar as fibras musculares das pernas.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para recuperação.' },
        { day: 6, type: 'Ciclismo', dist: 45.0, dur: 5400, pace: '30.0 km/h', power: 160, tss: 80, title: 'Pedal Longo de Sábado', desc: 'Aumentando a capacidade aeróbica com rodagem mais longa.' },
        { day: 6, type: 'Corrida', dist: 3.0, dur: 1080, pace: '6:00/km', power: 0, tss: 20, title: 'Transição T2 Leve', desc: 'Corrida de trote leve logo após descer da bicicleta.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Repouso total para supercompensar.' }
      );
    }
  } else if (normalizedGoal === 'Aquathlon') {
    if (normalizedLevel === 'sedentario') {
      workoutsToInsert.push(
        { day: 1, type: 'Natacao', dist: 0.8, dur: 1500, pace: '3:07/100m', power: 0, tss: 15, title: 'Natação Adaptada Leve', desc: 'Técnica de natação focando em deslize e eficiência de braçada.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso ativo', desc: 'Descanso ativo para adaptação neuromuscular.' },
        { day: 3, type: 'Corrida', dist: 3.0, dur: 1440, pace: '8:00/km', power: 0, tss: 18, title: 'Caminhada & Trote Leve', desc: 'Alternar trote com caminhada confortável focando na postura.' },
        { day: 4, type: 'Natacao', dist: 0.6, dur: 1200, pace: '3:20/100m', power: 0, tss: 12, title: 'Soltura Aquática de Manhã', desc: 'Natação tranquila focada em exercícios técnicos e relaxamento.' },
        { day: 4, type: 'Forca', dist: 0.0, dur: 1800, pace: 'N/A', power: 0, tss: 10, title: 'Fortalecimento Core & Estabilidade', desc: 'Trabalho de core para sustentação do corpo na natação e corrida.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Recuperação total.' },
        { day: 6, type: 'Corrida', dist: 4.0, dur: 1920, pace: '8:00/km', power: 0, tss: 25, title: 'Trote Longo de Sábado', desc: 'Volume aeróbico confortável alternando trote com caminhada leve.' },
        { day: 6, type: 'Natacao', dist: 0.5, dur: 1080, pace: '3:36/100m', power: 0, tss: 10, title: 'Natação Técnica Soltura', desc: 'Giro leve na água com educativos para o estilo crawl.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Repouso total.' }
      );
    } else if (normalizedLevel === 'elite') {
      workoutsToInsert.push(
        { day: 1, type: 'Natacao', dist: 2.5, dur: 3000, pace: '2:00/100m', power: 0, tss: 45, title: 'Técnica e Intervalos de Ritmo', desc: 'Principal: 10x 100m em ritmo forte com 15 segundos de descanso.' },
        { day: 2, type: 'Natacao', dist: 3.0, dur: 3600, pace: '2:00/100m', power: 0, tss: 55, title: 'Endurance Aquática Z2', desc: 'Natação contínua aeróbica focada na eficiência mecânica.' },
        { day: 2, type: 'Corrida', dist: 12.0, dur: 3120, pace: '4:20/km', power: 0, tss: 80, title: 'Corrida de Ritmo Z3', desc: 'Principal: Corrida constante mantendo intensidade aeróbia média-alta.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 2700, pace: 'N/A', power: 0, tss: 20, title: 'Fortalecimento Específico Ombros & Pernas', desc: 'Exercícios funcionais com foco na propulsão na água e proteção articular na corrida.' },
        { day: 4, type: 'Natacao', dist: 2.8, dur: 3300, pace: '1:57/100m', power: 0, tss: 50, title: 'Intervalos Aeróbicos Aquáticos', desc: 'Principal: 3x 500m progressivo com 30s de descanso.' },
        { day: 4, type: 'Corrida', dist: 8.0, dur: 2400, pace: '5:00/km', power: 0, tss: 45, title: 'Corrida Regenerativa Leve', desc: 'Trote de soltura aeróbica em asfalto plano.' },
        { day: 5, type: 'Corrida', dist: 14.0, dur: 3600, pace: '4:17/km', power: 0, tss: 95, title: 'Intervalado de VO2 Máx na Pista', desc: 'Principal: 5x 1200m em ritmo forte conversando com limiar anaeróbico.' },
        { day: 6, type: 'Corrida', dist: 22.0, dur: 6000, pace: '4:32/km', power: 0, tss: 150, title: 'Longo de Fim de Semana', desc: 'Corrida longa focado em resistência aeróbia e endurance.' },
        { day: 6, type: 'Natacao', dist: 1.5, dur: 1800, pace: '2:00/100m', power: 0, tss: 25, title: 'Transição e Soltura Técnica', desc: 'Natação leve em estilo crawl focado em soltura muscular de braços.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso e Supercompensação', desc: 'Repouso fisiológico absoluto.' }
      );
    } else {
      // Intermediário (Aquathlon)
      workoutsToInsert.push(
        { day: 1, type: 'Natacao', dist: 1.5, dur: 2100, pace: '2:20/100m', power: 0, tss: 30, title: 'Técnica de Braçadas crawl', desc: 'Foco na pegada, tração e empurre. Exercícios técnicos.' },
        { day: 2, type: 'Corrida', dist: 6.0, dur: 1980, pace: '5:30/km', power: 0, tss: 35, title: 'Corrida Leve Aeróbica Z2', desc: 'Corrida confortável em ritmo conversacional.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 2400, pace: 'N/A', power: 0, tss: 15, title: 'Fortalecimento Geral Core & Estabilidade', desc: 'Fortalecimento core e estabilizadores para suportar a natação e corrida.' },
        { day: 4, type: 'Natacao', dist: 1.8, dur: 2400, pace: '2:13/100m', power: 0, tss: 35, title: 'Endurance de Natação', desc: 'Manter braçada alongada em séries longas aeróbicas.' },
        { day: 4, type: 'Corrida', dist: 8.0, dur: 2760, pace: '5:45/km', power: 0, tss: 55, title: 'Treino de Ritmo (Tempo Run)', desc: 'Principal: 20 min contínuos em ritmo de prova (Pace conversacional forte).' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para descanso.' },
        { day: 6, type: 'Corrida', dist: 10.0, dur: 3600, pace: '6:00/km', power: 0, tss: 70, title: 'Corrida Longa de Fim de Semana', desc: 'Aumentando o volume aeróbico semanal de corrida.' },
        { day: 6, type: 'Natacao', dist: 1.2, dur: 1680, pace: '2:20/100m', power: 0, tss: 22, title: 'Soltura Técnica Aquática', desc: 'Série de natação muito leve focada em soltura muscular de braços.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Repouso total.' }
      );
    }
  } else if (normalizedGoal === 'Ciclismo') {
    if (normalizedLevel === 'sedentario') {
      workoutsToInsert.push(
        { day: 1, type: 'Ciclismo', dist: 12.0, dur: 1800, pace: '24.0 km/h', power: 90, tss: 15, title: 'Giro de Adaptação', desc: 'Pedal leve no plano para adaptar a musculatura à bike.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Recuperação.' },
        { day: 3, type: 'Ciclismo', dist: 15.0, dur: 2400, pace: '22.5 km/h', power: 100, tss: 22, title: 'Giro Leve Plano', desc: 'Pedal confortável mantendo cadência uniforme acima de 85 rpm.' },
        { day: 4, type: 'Forca', dist: 0.0, dur: 1800, pace: 'N/A', power: 0, tss: 10, title: 'Fortalecimento Core & Lombar', desc: 'Trabalho de fortalecimento para estabilidade da coluna na bike.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Recuperação.' },
        { day: 6, type: 'Ciclismo', dist: 20.0, dur: 3000, pace: '24.0 km/h', power: 110, tss: 35, title: 'Pedal Desafio de Sábado', desc: 'Aumentando o tempo de pedal aeróbico em ritmo leve.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Aproveite o domingo para relaxar.' }
      );
    } else if (normalizedLevel === 'elite') {
      workoutsToInsert.push(
        { day: 1, type: 'Ciclismo', dist: 40.0, dur: 4800, pace: '30.0 km/h', power: 175, tss: 45, title: 'Giro Regenerativo Leve', desc: 'Giro super fácil de soltura em Zona 1.' },
        { day: 2, type: 'Ciclismo', dist: 60.0, dur: 6600, pace: '32.7 km/h', power: 245, tss: 110, title: 'Intervalos de Limiar (Lactato)', desc: 'Principal: 4x 8 min em Z4 (Watts) com 4 min de recuperação leve.' },
        { day: 3, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Fisiológico', desc: 'Dia livre para recuperação do estresse articular e muscular.' },
        { day: 4, type: 'Ciclismo', dist: 75.0, dur: 8400, pace: '32.1 km/h', power: 235, tss: 130, title: 'Intervalado Sweet Spot (SST)', desc: 'Principal: 3x 15 min em Sweet Spot (Watts) com cadência controlada.' },
        { day: 5, type: 'Forca', dist: 0.0, dur: 2700, pace: 'N/A', power: 0, tss: 20, title: 'Fortalecimento de Quadríceps & Core', desc: 'Agachamentos pesados e trabalho excêntrico.' },
        { day: 6, type: 'Ciclismo', dist: 120.0, dur: 13200, pace: '32.7 km/h', power: 215, tss: 220, title: 'Treino Longo de Endurance', desc: 'Pedal longo focado em rodagem aeróbia acumulada.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Recuperação Fisiológica', desc: 'Descanso total.' }
      );
    } else {
      // Intermediário (Ciclismo)
      workoutsToInsert.push(
        { day: 1, type: 'Ciclismo', dist: 25.0, dur: 3300, pace: '27.3 km/h', power: 130, tss: 30, title: 'Giro Leve Aeróbico', desc: 'Giro plano confortável em Zona 2 para ganho de base aeróbia.' },
        { day: 2, type: 'Ciclismo', dist: 40.0, dur: 4800, pace: '30.0 km/h', power: 170, tss: 65, title: 'Intervalos de Subida / Força', desc: 'Principal: 5x 3 min em subida com cadência baixa (50-60 rpm) forçando torque.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 2400, pace: 'N/A', power: 0, tss: 15, title: 'Fortalecimento Geral Core & Quadríceps', desc: 'Fortalecimento geral com foco nos membros inferiores.' },
        { day: 4, type: 'Ciclismo', dist: 35.0, dur: 4200, pace: '30.0 km/h', power: 160, tss: 55, title: 'Giro de Ritmo Z3', desc: 'Principal: 30 min contínuos na zona de tempo (esforço moderado/forte).' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para recuperação.' },
        { day: 6, type: 'Ciclismo', dist: 60.0, dur: 7800, pace: '27.7 km/h', power: 150, tss: 110, title: 'Pedal Longo de Sábado', desc: 'Aumentando a quilometragem semanal em ritmo confortável aeróbico.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Aproveite o domingo para relaxar e se recuperar.' }
      );
    }
  } else if (normalizedGoal === 'Natacao') {
    if (normalizedLevel === 'sedentario') {
      workoutsToInsert.push(
        { day: 1, type: 'Natacao', dist: 0.6, dur: 1200, pace: '3:20/100m', power: 0, tss: 10, title: 'Natação Adaptada Leve', desc: 'Trabalho de técnica de pernada e flutuação para iniciantes.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Descanso.' },
        { day: 3, type: 'Natacao', dist: 0.8, dur: 1500, pace: '3:07/100m', power: 0, tss: 15, title: 'Técnica de Respiração & Flutuação', desc: 'Exercícios educativos para controle de respiração bilateral.' },
        { day: 4, type: 'Forca', dist: 0.0, dur: 1800, pace: 'N/A', power: 0, tss: 10, title: 'Fortalecimento Mobilidade Ombros', desc: 'Trabalho leve com foco na amplitude articular do manguito rotador.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Descanso.' },
        { day: 6, type: 'Natacao', dist: 1.0, dur: 1800, pace: '3:00/100m', power: 0, tss: 22, title: 'Desafio 1000m Técnica', desc: 'Nadar séries curtas mantendo foco na técnica de braçada.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Repouso.' }
      );
    } else if (normalizedLevel === 'elite') {
      workoutsToInsert.push(
        { day: 1, type: 'Natacao', dist: 2.5, dur: 3000, pace: '2:00/100m', power: 0, tss: 40, title: 'Natação Regenerativa & Técnica', desc: 'Natação solta focando em deslize, educativos de braçada e virada.' },
        { day: 2, type: 'Natacao', dist: 3.5, dur: 4200, pace: '2:00/100m', power: 0, tss: 75, title: 'Intervalado de VO2 Máx Aquático', desc: 'Principal: 12x 100m forte em ritmo de velocidade aeróbia máxima.' },
        { day: 3, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Fisiológico', desc: 'Descanso completo para ombros e tronco.' },
        { day: 4, type: 'Natacao', dist: 3.0, dur: 3600, pace: '2:00/100m', power: 0, tss: 60, title: 'Endurance Aeróbia (Z2)', desc: 'Séries contínuas de 400m e 800m mantendo ritmo estável Z2.' },
        { day: 5, type: 'Forca', dist: 0.0, dur: 2700, pace: 'N/A', power: 0, tss: 20, title: 'Fortalecimento Ombros & Core', desc: 'Trabalho com elásticos e halteres para fortalecimento do manguito rotador.' },
        { day: 6, type: 'Natacao', dist: 4.5, dur: 5400, pace: '2:00/100m', power: 0, tss: 100, title: 'Longo com Palmar/Nadadeira', desc: 'Séries de força e volume aeróbico usando palmar.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Recuperação Fisiológica', desc: 'Descanso completo.' }
      );
    } else {
      // Intermediário (Natação)
      workoutsToInsert.push(
        { day: 1, type: 'Natacao', dist: 1.5, dur: 2100, pace: '2:20/100m', power: 0, tss: 25, title: 'Técnica e Braçadas Leves', desc: 'Educativos crawl focando no rolamento do tronco e puxada.' },
        { day: 2, type: 'Natacao', dist: 2.0, dur: 2700, pace: '2:15/100m', power: 0, tss: 45, title: 'Séries Curtas de Ritmo', desc: 'Principal: 8x 50m em ritmo forte mantendo boa técnica.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 2400, pace: 'N/A', power: 0, tss: 15, title: 'Fortalecimento Geral Ombros & Dorsal', desc: 'Trabalho de fortalecimento geral com foco no core e membros superiores.' },
        { day: 4, type: 'Natacao', dist: 1.8, dur: 2400, pace: '2:13/100m', power: 0, tss: 35, title: 'Endurance Leve Z2', desc: 'Séries contínuas focando em manter a frequência cardíaca baixa.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para recuperação.' },
        { day: 6, type: 'Natacao', dist: 2.5, dur: 3600, pace: '2:24/100m', power: 0, tss: 60, title: 'Treino Longo Contínuo', desc: 'Natação de volume aeróbico contínuo focado em deslize.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Aproveite o domingo para relaxar e se recuperar.' }
      );
    }
  } else {
    // Corrida (Padrão)
    if (normalizedLevel === 'sedentario') {
      workoutsToInsert.push(
        { day: 1, type: 'Corrida', dist: 3.0, dur: 1800, pace: '8:30/km', power: 0, tss: 20, title: 'Trote Intervalado Inicial (1:2)', desc: 'Aquecimento de 5 min caminhando. Principal: 6x (1 min trote muito leve + 2 min caminhando). Foco em manter o esforço aeróbico super leve.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Ativo', desc: 'Dia de repouso completo. Deixe seus músculos se adaptarem.' },
        { day: 3, type: 'Forca', dist: 0.0, dur: 1800, pace: 'N/A', power: 0, tss: 12, title: 'Fortalecimento e Mobilidade Core', desc: 'Exercícios leves usando o peso do corpo para melhorar postura e estabilidade das articulações.' },
        { day: 4, type: 'Corrida', dist: 3.5, dur: 2100, pace: '8:30/km', power: 0, tss: 22, title: 'Caminhada & Trote Consistente', desc: 'Aquecimento: 5 min caminhando. Principal: 8x (1 min trote leve + 1.5 min caminhada). Respire de forma calma.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para recuperação.' },
        { day: 6, type: 'Corrida', dist: 4.0, dur: 2400, pace: '8:20/km', power: 0, tss: 30, title: 'Trote Estável de Fim de Semana', desc: 'Aquecimento: 5 min caminhando. Tente correr 5 minutos contínuos duas vezes com 3 min de caminhada entre eles. Complete o tempo em caminhada ativa.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Semanal', desc: 'Descanse totalmente para começar bem o próximo ciclo.' }
      );
    } else if (normalizedLevel === 'elite') {
      workoutsToInsert.push(
        { day: 1, type: 'Corrida', dist: 8.0, dur: 2400, pace: '5:00/km', power: 0, tss: 40, title: 'Corrida Regenerativa Leve', desc: 'Corrida confortável em Z1/Z2 para restabelecer fluxo sanguíneo e soltar as articulações.' },
        { day: 2, type: 'Corrida', dist: 12.0, dur: 3240, pace: '4:30/km', power: 0, tss: 90, title: 'Treino Intervalado de VO2 Máx', desc: 'Principal: 5x 1000m forte (Pace ~3:45/km) com 2 min de recuperação ativa de trote.' },
        { day: 3, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso Fisiológico Completo', desc: 'Recuperação total para assimilação celular dos estímulos intervalados.' },
        { day: 4, type: 'Corrida', dist: 10.0, dur: 2880, pace: '4:48/km', power: 0, tss: 75, title: 'Corrida de Ritmo Z3 (Tempo Run)', desc: 'Corrida em ritmo firme mantendo intensidade linear constante próximo ao limiar de lactato.' },
        { day: 5, type: 'Forca', dist: 0.0, dur: 2700, pace: 'N/A', power: 0, tss: 25, title: 'Força Máxima Específica', desc: 'Treino resistido focado em membros inferiores, potência excêntrica de panturrilhas e quadríceps.' },
        { day: 6, type: 'Corrida', dist: 24.0, dur: 6912, pace: '4:48/km', power: 0, tss: 220, title: 'Longo de Endurance Z2 Aeróbia', desc: 'Grande volume semanal. Corrida longa constante em ritmo aeróbico confortável para adaptação capilar.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Supercompensação Ativa', desc: 'Descanso completo para assimilação metabólica e restauração de estoques de glicogênio.' }
      );
    } else {
      // Intermediário (Corrida)
      workoutsToInsert.push(
        { day: 1, type: 'Corrida', dist: 6.0, dur: 2160, pace: '6:00/km', power: 0, tss: 35, title: 'Corrida Leve Aeróbia Z2', desc: 'Corrida confortável em ritmo conversacional para ganho de base aeróbia.' },
        { day: 2, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Permita que seus músculos se recuperem do estresse acumulado.' },
        { day: 3, type: 'Corrida', dist: 8.0, dur: 2880, pace: '5:45/km', power: 0, tss: 60, title: 'Treino de Ritmo / Tempo Run', desc: 'Principal: 20 min contínuos em ritmo moderado/forte (Pace ~5:10/km). Excelente estímulo de limiar.' },
        { day: 4, type: 'Forca', dist: 0.0, dur: 2400, pace: 'N/A', power: 0, tss: 15, title: 'Fortalecimento Geral de Pernas & Core', desc: 'Agachamentos, passadas e pranchas para estabilização articular.' },
        { day: 5, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia livre para relaxamento e regeneração.' },
        { day: 6, type: 'Corrida', dist: 12.0, dur: 4680, pace: '6:30/km', power: 0, tss: 110, title: 'Treino Longo de Fim de Semana', desc: 'O treino mais longo da semana. Foco em ritmo estável de Zona 2. Hidrate-se bem antes e depois.' },
        { day: 7, type: 'Descanso', dist: 0.0, dur: 0, pace: 'N/A', power: 0, tss: 0, title: 'Descanso', desc: 'Dia de repouso total.' }
      );
    }
  }

  let trainInMorning = availability?.train_in_morning !== 0;
  let morningMinutes = availability?.morning_available_time ?? 60;
  let trainAtLunch = availability?.train_at_lunch === 1;
  let lunchMinutes = availability?.lunch_available_time ?? 0;
  let trainAtNight = availability?.train_at_night !== 0;
  let nightMinutes = availability?.night_available_time ?? 60;

  // Se as variáveis específicas de turnos não estiverem presentes, mas daily_available_hours estiver
  if (availability && availability.daily_available_hours !== undefined &&
      availability.train_in_morning === undefined &&
      availability.train_at_night === undefined) {
    if (trainAtLunch && lunchMinutes > 0) {
      trainInMorning = true;
      morningMinutes = Math.max(0, availability.daily_available_hours * 60 - lunchMinutes);
      trainAtNight = false;
      nightMinutes = 0;
    } else {
      trainInMorning = true;
      morningMinutes = availability.daily_available_hours * 60;
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
    const adjustedWorkouts: any[] = [];

    for (const w of workoutsToInsert) {
      if (w.type === 'Descanso' || w.type === 'Forca') {
        adjustedWorkouts.push(w);
        continue;
      }

      const exceedsFirstSlot = w.dur > slots[0].limit;
      const shouldSplit = exceedsFirstSlot && slots.length > 1;

      if (shouldSplit) {
        // Distribuir a duração nos slots
        let remainingDur = w.dur;
        const sessionDurs: number[] = [];
        for (const slot of slots) {
          if (remainingDur <= 0) break;
          const allocated = Math.min(remainingDur, slot.limit);
          sessionDurs.push(allocated);
          remainingDur -= allocated;
        }

        if (sessionDurs.length > 1) {
          // Mais de uma sessão: dividimos!
          for (let i = 0; i < sessionDurs.length; i++) {
            const sScale = sessionDurs[i] / w.dur;
            const sDist = w.dist > 0 ? parseFloat((w.dist * sScale).toFixed(2)) : 0;
            const sTss = Math.max(5, Math.round(w.tss * sScale));

            adjustedWorkouts.push({
              day: w.day,
              type: w.type,
              dist: sDist,
              dur: sessionDurs[i],
              pace: w.pace,
              power: w.power,
              tss: sTss,
              title: `${w.title} - ${slots[i].titleSuffix} ${slots[i].emoji}`,
              desc: `Parte ${i + 1}: ${slots[i].titleSuffix}. ${w.desc}`
            });
          }
        } else {
          // Apenas 1 sessão
          adjustedWorkouts.push(w);
        }
      } else {
        // Não é para split ou só tem 1 slot. Verificamos se precisa capar.
        const totalLimit = slots.reduce((acc, s) => acc + s.limit, 0);
        if (w.dur > totalLimit) {
          const scale = totalLimit / w.dur;
          adjustedWorkouts.push({
            day: w.day,
            type: w.type,
            dist: w.dist > 0 ? parseFloat((w.dist * scale).toFixed(2)) : 0,
            dur: totalLimit,
            pace: w.pace,
            power: w.power,
            tss: Math.max(5, Math.round(w.tss * scale)),
            title: w.title,
            desc: `${w.desc} [Ajustado para limite diário de ${totalLimit / 60} min]`
          });
        } else {
          adjustedWorkouts.push(w);
        }
      }
    }
    return adjustedWorkouts;
  }

  return workoutsToInsert;
}

async function seedDatabase(db: DatabaseClient) {
  // 1. Inserir usuários
  const eliteUserId = (await db.run(`
    INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected, strava_access_token, birth_date, username, password)
    VALUES ('Tiago "Aço" Silva', 'elite', 32, 68.5, 172, '3:45', 18, 1, 'mock_strava_token_elite', '1994-05-24', 'tiago', '123456')
  `)).lastID;

  const sedentarioUserId = (await db.run(`
    INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected, birth_date, username, password)
    VALUES ('Ana Santos', 'sedentario', 45, 82.0, 145, '8:30', 4, 0, '1981-05-24', 'ana', '123456')
  `)).lastID;

  const joaoUserId = (await db.run(`
    INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected, birth_date, username, password)
    VALUES ('JOAO CLAUDIO SCHENA', 'intermediario', 40, 75.0, 162, '5:15', 6, 0, '1985-05-23', 'jcschena', '1953Bigu$')
  `)).lastID;

  if (!eliteUserId || !sedentarioUserId || !joaoUserId) return;

  // 2. Inserir objetivos
  await db.run(`
    INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
    VALUES (?, 'Triathlon', 226.2, ?, '09:45:00', 650)
  `, eliteUserId, formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)));

  await db.run(`
    INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
    VALUES (?, 'Corrida', 5.0, ?, '00:35:00', 120)
  `, sedentarioUserId, formatDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)));

  await db.run(`
    INSERT INTO goals (user_id, type, distance, date_target, target_time, weekly_tss_target)
    VALUES (?, 'Corrida', 10.0, ?, '00:55:00', 240)
  `, joaoUserId, formatDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)));

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

  const joaoPlanId = (await db.run(`
    INSERT INTO training_plans (user_id, name, start_date, end_date, active)
    VALUES (?, 'Planilha Inicial Personalizada - João Claudio', ?, ?, 1)
  `, joaoUserId, startDateStr, endDateStr)).lastID;

  if (!elitePlanId || !sedentarioPlanId || !joaoPlanId) return;

  // 4. Inserir treinos usando o gerador centralizado
  // Elite (Triathlon)
  const eliteWorkouts = generateWorkoutsForPlan('Triathlon', 'elite');
  for (const w of eliteWorkouts) {
    await db.run(`
      INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, elitePlanId, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
  }

  // Sedentario (Corrida)
  const sedentarioWorkouts = generateWorkoutsForPlan('Corrida', 'sedentario');
  for (const w of sedentarioWorkouts) {
    await db.run(`
      INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, sedentarioPlanId, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
  }

  // João Claudio (Intermediário - Corrida)
  const joaoWorkouts = generateWorkoutsForPlan('Corrida', 'intermediario');
  for (const w of joaoWorkouts) {
    await db.run(`
      INSERT INTO workouts (plan_id, day_of_week, date, type, distance_target, duration_target, pace_target, power_target, tss_target, title, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, joaoPlanId, w.day, formatDate(weekDates[w.day - 1]), w.type, w.dist, w.dur, w.pace, w.power, w.tss, w.title, w.desc);
  }
}

export async function autoCompleteExpiredRests(db: DatabaseClient, planId: number, today: Date) {
  const pendingRests = await db.all(
    "SELECT * FROM workouts WHERE plan_id = ? AND type = 'Descanso' AND status = 'pending'",
    planId
  );
  
  for (const w of pendingRests) {
    if (!w.date) continue;
    const targetDateEnd = new Date(w.date + 'T23:59:59');
    const diffTime = today.getTime() - targetDateEnd.getTime();
    if (diffTime > 48 * 60 * 60 * 1000) {
      await db.run(
        "UPDATE workouts SET status = 'completed' WHERE id = ?",
        w.id
      );
    }
  }
}

export function getCalendarToken(userId: number, passwordHash: string): string {
  return crypto
    .createHash('sha256')
    .update(`${userId}-${passwordHash || 'default_salt'}`)
    .digest('hex')
    .substring(0, 16);
}
