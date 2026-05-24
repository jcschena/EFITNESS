import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDb();

    const userId = parseInt(data.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'ID de usuário inválido' }, { status: 400 });
    }

    const {
      name,
      birth_date,
      weight,
      level,
      threshold_hr,
      threshold_pace,
      weekly_target_hours,
      username,
      password
    } = data;

    // 1. Validações Básicas
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'O nome é obrigatório' }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({ success: false, error: 'O nome de usuário é obrigatório' }, { status: 400 });
    }

    if (!password || !password.trim()) {
      return NextResponse.json({ success: false, error: 'A senha é obrigatória' }, { status: 400 });
    }

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return NextResponse.json({ success: false, error: 'Peso deve ser um número positivo válido' }, { status: 400 });
    }

    const parsedHr = parseInt(threshold_hr, 10);
    if (isNaN(parsedHr) || parsedHr <= 0) {
      return NextResponse.json({ success: false, error: 'A frequência cardíaca de limiar deve ser um número válido' }, { status: 400 });
    }

    const parsedHours = parseInt(weekly_target_hours, 10);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      return NextResponse.json({ success: false, error: 'A meta de horas semanais deve ser um número válido' }, { status: 400 });
    }

    // Validar formato de pace MM:SS
    const paceRegex = /^\d{1,2}:\d{2}$/;
    if (!threshold_pace || !paceRegex.test(threshold_pace)) {
      return NextResponse.json({ success: false, error: 'O ritmo de limiar deve estar no formato MM:SS (ex: 5:15)' }, { status: 400 });
    }

    // 2. Verificar se o usuário existe
    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 3. Verificar se o nome de usuário já está em uso por outra pessoa
    const duplicate = await db.get(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      username.trim(),
      userId
    );
    if (duplicate) {
      return NextResponse.json({ success: false, error: 'Este nome de usuário já está em uso por outro atleta' }, { status: 400 });
    }

    // 4. Calcular idade com base na data de nascimento
    let age = user.age; // manter a anterior como fallback se não enviada
    if (birth_date) {
      const birth = new Date(birth_date);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    // 5. Atualizar no Banco de Dados
    await db.run(`
      UPDATE users 
      SET name = ?,
          birth_date = ?,
          age = ?,
          weight = ?,
          level = ?,
          threshold_hr = ?,
          threshold_pace = ?,
          weekly_target_hours = ?,
          username = ?,
          password = ?
      WHERE id = ?
    `, 
      name.trim(),
      birth_date || null,
      age,
      parsedWeight,
      level || 'intermediario',
      parsedHr,
      threshold_pace.trim(),
      parsedHours,
      username.trim(),
      password,
      userId
    );

    console.log(`Perfil do usuário id=${userId} atualizado com sucesso no banco de dados.`);

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro na API de Perfil:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}
