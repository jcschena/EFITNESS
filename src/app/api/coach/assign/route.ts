import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { coachId, athleteId, teacherId } = body;

    if (!coachId || !athleteId) {
      return NextResponse.json({ success: false, error: 'Parâmetros coachId e athleteId são obrigatórios.' }, { status: 400 });
    }

    const db = await getDb();

    // 1. Validar se o coachId pertence a uma assessoria líder e obter/verificar dados
    const coach = await db.get('SELECT id, parent_coach_id FROM users WHERE id = ? AND role = \'coach\'', coachId);
    if (!coach) {
      return NextResponse.json({ success: false, error: 'Treinador não autorizado ou não cadastrado.' }, { status: 403 });
    }

    // Apenas a assessoria líder pode atribuir/desatribuir professores
    if (coach.parent_coach_id !== null) {
      return NextResponse.json({ success: false, error: 'Apenas assessorias líderes podem atribuir professores.' }, { status: 403 });
    }

    // 2. Se um teacherId foi fornecido, certificar que ele pertence a esta assessoria líder
    if (teacherId) {
      const teacher = await db.get(
        'SELECT id FROM users WHERE id = ? AND role = \'coach\' AND parent_coach_id = ?',
        teacherId,
        coachId
      );
      if (!teacher) {
        return NextResponse.json({ success: false, error: 'Professor não cadastrado nesta assessoria.' }, { status: 404 });
      }
    }

    // 3. Atualizar a atribuição do aluno (garantindo que o aluno pertence ao coachId líder)
    const finalTeacherId = teacherId ? teacherId : null;
    const result = await db.run(
      'UPDATE users SET teacher_id = ? WHERE id = ? AND coach_id = ? AND role = \'athlete\'',
      finalTeacherId,
      athleteId,
      coachId
    );

    // Se nenhuma linha foi afetada, o aluno não existe ou não pertence a esta assessoria
    const changes = (result as any).changes ?? 0;
    if (changes === 0) {
      const checkAthlete = await db.get('SELECT id FROM users WHERE id = ? AND coach_id = ? AND role = \'athlete\'', athleteId, coachId);
      if (!checkAthlete) {
        return NextResponse.json({ success: false, error: 'Aluno não encontrado ou não pertence a esta assessoria.' }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: true,
      message: finalTeacherId ? 'Professor atribuído com sucesso!' : 'Professor desatribuído com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro na API de atribuição de professores:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    }, { status: 500 });
  }
}
