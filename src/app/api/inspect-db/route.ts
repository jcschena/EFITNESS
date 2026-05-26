import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Obter todos os usuários
    const users = await db.all('SELECT id, name, username, role, coach_id, teacher_id FROM users');
    
    // Obter todos os planos de treino
    const plans = await db.all('SELECT id, user_id, name, active, library_id FROM training_plans');
    
    // Obter metas
    const goals = await db.all('SELECT id, user_id, type, distance, date_target FROM goals');

    return NextResponse.json({
      success: true,
      users,
      plans,
      goals
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao inspecionar banco de dados'
    }, { status: 500 });
  }
}
