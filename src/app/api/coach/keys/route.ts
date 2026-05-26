import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { coachId, keyCode, maxAthletes } = data;

    if (!coachId || !keyCode) {
      return NextResponse.json({ success: false, error: 'coachId e keyCode são obrigatórios.' }, { status: 400 });
    }

    const cleanKey = keyCode.trim().toUpperCase();
    const db = await getDb();

    // Verificar se a chave já existe
    const existingKey = await db.get('SELECT id FROM access_keys WHERE key_code = ?', cleanKey);
    if (existingKey) {
      return NextResponse.json({ success: false, error: 'Esta chave de acesso já existe.' }, { status: 400 });
    }

    // Criar chave
    await db.run(
      'INSERT INTO access_keys (key_code, coach_id, max_athletes, active) VALUES (?, ?, ?, 1)',
      cleanKey,
      parseInt(coachId, 10),
      maxAthletes ? parseInt(maxAthletes, 10) : 10
    );

    return NextResponse.json({
      success: true,
      message: `Chave de acesso "${cleanKey}" criada com sucesso!`
    });

  } catch (error: any) {
    console.error('Erro na API de geração de chaves:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    }, { status: 500 });
  }
}
