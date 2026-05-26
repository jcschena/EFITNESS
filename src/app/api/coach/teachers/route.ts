import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coachIdStr = searchParams.get('coachId');

    if (!coachIdStr) {
      return NextResponse.json({ success: false, error: 'O parâmetro coachId é obrigatório.' }, { status: 400 });
    }

    const coachId = parseInt(coachIdStr, 10);
    const db = await getDb();

    // Obter todos os professores que pertencem a esta assessoria líder
    const teachers = await db.all(`
      SELECT id, name, username, password 
      FROM users 
      WHERE role = 'coach' AND parent_coach_id = ?
      ORDER BY name ASC
    `, coachId);

    const teachersWithCounts = [];
    for (const teacher of teachers) {
      const countObj = await db.get('SELECT COUNT(*) as count FROM users WHERE teacher_id = ? AND role = \'athlete\'', teacher.id);
      const athleteCount = countObj ? countObj.count : 0;
      teachersWithCounts.push({
        ...teacher,
        athleteCount
      });
    }

    return NextResponse.json({
      success: true,
      teachers: teachersWithCounts
    });

  } catch (error: any) {
    console.error('Erro na API de professores (GET):', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, coachId, name, username, password, teacherId } = body;

    if (!coachId) {
      return NextResponse.json({ success: false, error: 'O parâmetro coachId é obrigatório.' }, { status: 400 });
    }

    const db = await getDb();

    // Certificar de que o coach existe e é uma assessoria líder (parent_coach_id é nulo)
    const coach = await db.get('SELECT id, parent_coach_id FROM users WHERE id = ? AND role = \'coach\'', coachId);
    if (!coach || coach.parent_coach_id !== null) {
      return NextResponse.json({ success: false, error: 'Apenas assessorias líderes podem gerenciar professores.' }, { status: 403 });
    }

    if (action === 'register_teacher') {
      if (!name || !username || !password) {
        return NextResponse.json({ success: false, error: 'Nome, usuário e senha são obrigatórios.' }, { status: 400 });
      }

      // Verificar se o username já existe
      const existingUser = await db.get('SELECT id FROM users WHERE username = ?', username);
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'Este nome de usuário já está em uso.' }, { status: 400 });
      }

      // Cadastrar o professor vinculando à assessoria líder (parent_coach_id)
      await db.run(`
        INSERT INTO users (name, level, age, weight, threshold_hr, threshold_pace, weekly_target_hours, strava_connected, birth_date, username, password, role, parent_coach_id)
        VALUES (?, 'elite', 30, 70.0, 160, '4:00', 10, 0, '1996-01-01', ?, ?, 'coach', ?)
      `, name, username, password, coachId);

      return NextResponse.json({ success: true, message: `Professor "${name}" cadastrado com sucesso!` });
    }

    if (action === 'delete_teacher') {
      if (!teacherId) {
        return NextResponse.json({ success: false, error: 'O parâmetro teacherId é obrigatório.' }, { status: 400 });
      }

      // Desvincular alunos antes de excluir o professor
      await db.run('UPDATE users SET teacher_id = NULL WHERE teacher_id = ?', teacherId);

      // Deletar o professor
      await db.run('DELETE FROM users WHERE id = ? AND parent_coach_id = ? AND role = \'coach\'', teacherId, coachId);

      return NextResponse.json({ success: true, message: 'Professor excluído com sucesso! Os alunos foram desatribuídos.' });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 });

  } catch (error: any) {
    console.error('Erro na API de professores (POST):', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
