import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      SUPABASE_DATABASE_URL_EXISTS: !!process.env.SUPABASE_DATABASE_URL,
      POSTGRES_URL_NON_POOLING_EXISTS: !!process.env.POSTGRES_URL_NON_POOLING,
      POSTGRES_URL_EXISTS: !!process.env.POSTGRES_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set (defaults to localhost:3000)',
      STRAVA_CLIENT_ID_EXISTS: !!process.env.STRAVA_CLIENT_ID,
      STRAVA_CLIENT_ID_VALUE: process.env.STRAVA_CLIENT_ID ? `${process.env.STRAVA_CLIENT_ID.substring(0, 3)}...` : 'not set',
      STRAVA_CLIENT_SECRET_EXISTS: !!process.env.STRAVA_CLIENT_SECRET,
      GEMINI_API_KEY_EXISTS: !!process.env.GEMINI_API_KEY,
      GEMINI_RELATED_KEYS: Object.keys(process.env).filter(k => 
        k.toUpperCase().includes('GEMINI') || 
        k.toUpperCase().includes('GOOGLE') || 
        k.toUpperCase().includes('AI') || 
        k.toUpperCase().includes('KEY')
      ),
    },
    database: {
      status: 'unknown',
      error: null,
      users: [],
    }
  };

  try {
    const db = await getDb();
    diagnostics.database.status = 'connected';
    
    // Limpar logs do Strava importados com erro para o usuário 3
    const deleteRes = await db.run("DELETE FROM activity_logs WHERE sync_source = 'Strava' AND user_id = 3");
    diagnostics.database.deleteResult = deleteRes;

    // Resetar treinos do plano 3 para pendente (exceto o manual de id 64)
    const updateRes = await db.run("UPDATE workouts SET status = 'pending' WHERE plan_id = 3 AND status = 'completed' AND id != 64");
    diagnostics.database.updateResult = updateRes;

  } catch (err: any) {
    diagnostics.database.status = 'failed';
    diagnostics.database.error = err.message || String(err);
  }

  return NextResponse.json(diagnostics);
}
