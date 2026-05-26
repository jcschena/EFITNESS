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

    // Buscar info do treinador
    const coach = await db.get(
      'SELECT id, name, custom_logo, custom_name, custom_info, custom_color, parent_coach_id FROM users WHERE id = ? AND role = \'coach\'',
      coachId
    );

    if (!coach) {
      return NextResponse.json({ success: false, error: 'Treinador não encontrado' }, { status: 404 });
    }

    // Se for sub-professor, buscar a branding da assessoria mãe
    let brandingSource = coach;
    if (coach.parent_coach_id) {
      const parentCoach = await db.get(
        'SELECT id, name, custom_logo, custom_name, custom_info, custom_color FROM users WHERE id = ?',
        coach.parent_coach_id
      );
      if (parentCoach) {
        brandingSource = parentCoach;
      }
    }

    return NextResponse.json({
      success: true,
      branding: {
        custom_logo: brandingSource.custom_logo || '',
        custom_name: brandingSource.custom_name || '',
        custom_info: brandingSource.custom_info || '',
        custom_color: brandingSource.custom_color || ''
      }
    });
  } catch (error: any) {
    console.error('Erro na API de Branding (GET):', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { coachId, customName, customLogo, customInfo, customColor } = body;

    if (!coachId) {
      return NextResponse.json({ success: false, error: 'O parâmetro coachId é obrigatório.' }, { status: 400 });
    }

    const db = await getDb();

    // Apenas o coach principal da assessoria pode alterar o branding (ou qualquer coach)
    const coach = await db.get('SELECT id, parent_coach_id FROM users WHERE id = ? AND role = \'coach\'', coachId);
    if (!coach) {
      return NextResponse.json({ success: false, error: 'Treinador não autorizado.' }, { status: 403 });
    }

    // Altera no banco
    const targetId = coach.parent_coach_id ? coach.parent_coach_id : coach.id;

    await db.run(
      `UPDATE users 
       SET custom_logo = ?,
           custom_name = ?,
           custom_info = ?,
           custom_color = ?
       WHERE id = ?`,
      customLogo || null,
      customName ? customName.trim() : null,
      customInfo ? customInfo.trim() : null,
      customColor || null,
      targetId
    );

    return NextResponse.json({
      success: true,
      message: 'Configurações de personalização salvas com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro na API de Branding (POST):', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
