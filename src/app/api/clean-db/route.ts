import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Deletar os perfis duplicados do João, exceto o ID 3 (que tem a conexão do Strava ativa)
    const result = await db.run(`
      DELETE FROM users 
      WHERE (
        name LIKE '%JOAO CLAUDIO SCHENA%' 
        OR name LIKE '%JOA0 CLAUDIO SCHENA%' 
        OR name LIKE '%JOAO CLAU DIO SCHENA%'
      ) 
      AND id != 3
    `);

    // Obter lista atualizada de usuários
    const users = await db.all('SELECT id, name, level, strava_connected FROM users');

    return NextResponse.json({
      success: true,
      message: 'Perfis duplicados removidos com sucesso. O ID 3 foi preservado.',
      currentUsers: users
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
