import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // 1. Desativar a planilha científica (ID 10)
    await db.run('UPDATE training_plans SET active = 0 WHERE user_id = 3 AND id = 10');
    
    // 2. Ativar a planilha da assessoria (ID 3)
    await db.run('UPDATE training_plans SET active = 1 WHERE user_id = 3 AND id = 3');
    
    // Obter o estado final para confirmação
    const plans = await db.all('SELECT id, user_id, name, active, library_id FROM training_plans WHERE user_id = 3');

    return NextResponse.json({
      success: true,
      message: 'Planilhas atualizadas com sucesso no banco de dados de produção.',
      plans
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao atualizar banco de dados'
    }, { status: 500 });
  }
}
