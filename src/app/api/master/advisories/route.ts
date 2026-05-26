import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const db = await getDb();

    // 1. Obter todas as assessorias (role = 'coach')
    const coaches = await db.all(`
      SELECT id, name, username, password, role 
      FROM users 
      WHERE role = 'coach' AND username != 'coach' AND parent_coach_id IS NULL
      ORDER BY name ASC
    `);

    const advisories = [];

    for (const coach of coaches) {
      // Obter o cupom único (chave de acesso) deste treinador
      const accessKey = await db.get('SELECT key_code, active FROM access_keys WHERE coach_id = ? LIMIT 1', coach.id);
      
      // Contar atletas vinculados
      const athleteCountObj = await db.get('SELECT COUNT(*) as count FROM users WHERE coach_id = ? AND role = \'athlete\'', coach.id);
      const athleteCount = athleteCountObj ? athleteCountObj.count : 0;

      advisories.push({
        id: coach.id,
        name: coach.name,
        username: coach.username,
        password: coach.password,
        keyCode: accessKey ? accessKey.key_code : 'Sem Cupom',
        keyActive: accessKey ? accessKey.active === 1 : false,
        athleteCount
      });
    }

    // Obter estatísticas gerais para o Master Dashboard
    const totalAdvisories = advisories.length;
    const totalAthletesObj = await db.get('SELECT COUNT(*) as count FROM users WHERE role = \'athlete\'');
    const totalAthletes = totalAthletesObj ? totalAthletesObj.count : 0;

    return NextResponse.json({
      success: true,
      advisories,
      stats: {
        totalAdvisories,
        totalAthletes
      }
    });

  } catch (error: any) {
    console.error('Erro na API Master (GET):', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, username, password, keyCode, coachId } = body;
    const db = await getDb();

    if (action === 'register_coach') {
      if (!name || !username || !password || !keyCode) {
        return NextResponse.json({ success: false, error: 'Todos os campos são obrigatórios para cadastro.' }, { status: 400 });
      }

      // Verificar se o username do coach já existe
      const existingUser = await db.get('SELECT id FROM users WHERE username = ?', username);
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'Este nome de usuário já está em uso.' }, { status: 400 });
      }

      // Verificar se o keyCode do cupom já existe
      const existingKey = await db.get('SELECT id FROM access_keys WHERE key_code = ?', keyCode.toUpperCase().trim());
      if (existingKey) {
        return NextResponse.json({ success: false, error: 'Este código de cupom já está cadastrado por outra assessoria.' }, { status: 400 });
      }

      // 1. Criar o Coach
      const coachInsert = await db.run(`
        INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected, birth_date, username, password, role)
        VALUES (?, 'elite', 40, 70.0, 160, '4:00', 10, 0, '1986-01-01', ?, ?, 'coach')
      `, name, username, password);

      const newCoachId = coachInsert.lastID;

      // 2. Criar a chave de acesso única para alunos (com limite ilimitado: 999999)
      if (newCoachId) {
        await db.run(`
          INSERT INTO access_keys (key_code, coach_id, max_athletes, active)
          VALUES (?, ?, 999999, 1)
        `, keyCode.toUpperCase().trim(), newCoachId);
      }

      return NextResponse.json({ 
        success: true, 
        message: `Assessoria "${name}" cadastrada com sucesso! Cupom único: ${keyCode.toUpperCase().trim()}` 
      });
    }

    if (action === 'delete_coach') {
      if (!coachId) {
        return NextResponse.json({ success: false, error: 'coachId é obrigatório para exclusão.' }, { status: 400 });
      }

      // Limpar chave de acesso
      await db.run('DELETE FROM access_keys WHERE coach_id = ?', coachId);
      
      // Limpar os atletas desse coach (desvincular definindo coach_id = NULL)
      await db.run('UPDATE users SET coach_id = NULL WHERE coach_id = ? AND role = \'athlete\'', coachId);

      // Deletar o coach
      await db.run('DELETE FROM users WHERE id = ? AND role = \'coach\'', coachId);

      return NextResponse.json({ success: true, message: 'Assessoria excluída com sucesso! Os alunos foram desvinculados.' });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 });

  } catch (error: any) {
    console.error('Erro na API Master (POST):', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
