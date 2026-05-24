import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { syncUserStravaActivities } from '@/lib/strava';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDb();
    
    const userId = parseInt(data.userId, 10);
    
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'ID de usuário inválido.' }, { status: 400 });
    }

    // Executar a sincronização das atividades
    const result = await syncUserStravaActivities(db, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na rota de sincronização manual do Strava:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    }, { status: 500 });
  }
}
