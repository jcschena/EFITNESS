import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // 1. Atualizar o nível do atleta jcschena (id=3) para 'elite' (Avançado)
    await db.run("UPDATE users SET level = 'elite' WHERE id = 3");
    
    // 2. Renomear o plano personalizado do João se for necessário (opcional, mas bom para consistência)
    await db.run("UPDATE training_plans SET name = 'Planilha Inicial Personalizada - Nível AVANÇADO - Semana 3' WHERE id = 3");
    
    // Obter o estado final para confirmação
    const user = await db.get('SELECT id, name, level FROM users WHERE id = 3');
    const plans = await db.all('SELECT id, name, active FROM training_plans WHERE user_id = 3');

    return NextResponse.json({
      success: true,
      message: 'Nível do atleta e plano atualizados com sucesso para Avançado no banco de dados de produção.',
      user,
      plans
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao atualizar banco de dados'
    }, { status: 500 });
  }
}
