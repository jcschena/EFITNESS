import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const db = await getDb();
    // Query all plans from the library_plans table
    const plans = await db.all('SELECT * FROM library_plans ORDER BY name ASC');
    
    // Parse workouts_json for each plan
    const parsedPlans = plans.map(p => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      author: p.author || 'Desconhecido',
      source: p.source || 'Importado',
      sport: p.sport,
      weeks: p.weeks,
      level: p.level,
      description: p.description || '',
      workouts: JSON.parse(p.workouts_json)
    }));

    return NextResponse.json({ success: true, plans: parsedPlans });
  } catch (error: any) {
    console.error('Erro ao buscar planilhas da biblioteca:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const data = await req.json();
    const { action, userId } = data;

    const parsedUserId = userId ? parseInt(userId, 10) : null;

    if (action === 'import') {
      const { url } = data;
      if (!url) {
        return NextResponse.json({ success: false, error: 'URL do link é obrigatória' }, { status: 400 });
      }

      // Fetch the URL
      let targetUrl = url;
      // If user inputs a relative link like /planilhas/..., resolve it locally
      if (url.startsWith('/')) {
        const requestUrl = new URL(req.url);
        targetUrl = `${requestUrl.protocol}//${requestUrl.host}${url}`;
      }

      console.log(`Buscando planilha no link: ${targetUrl}`);
      const fetchRes = await fetch(targetUrl);
      if (!fetchRes.ok) {
        return NextResponse.json({ success: false, error: `Falha ao buscar URL: status ${fetchRes.status}` }, { status: 400 });
      }

      const planData = await fetchRes.json();

      // Validate structure
      if (!planData.name || !planData.sport || !planData.weeks || !planData.workouts) {
        return NextResponse.json({ success: false, error: 'JSON da planilha é inválido ou faltam campos obrigatórios (name, sport, weeks, workouts)' }, { status: 400 });
      }

      const id = planData.id || `imported_${crypto.randomBytes(4).toString('hex')}`;
      const name = planData.name;
      const author = planData.author || 'Desconhecido';
      const source = planData.source || url;
      const sport = planData.sport;
      const weeks = parseInt(planData.weeks, 10);
      const level = planData.level || 'intermediario';
      const description = planData.description || '';
      const workouts_json = JSON.stringify(planData.workouts);

      // Save to database (upsert)
      const existing = await db.get('SELECT id FROM library_plans WHERE id = ?', id);
      if (existing) {
        await db.run(`
          UPDATE library_plans
          SET name = ?, author = ?, source = ?, sport = ?, weeks = ?, level = ?, description = ?, workouts_json = ?
          WHERE id = ?
        `, name, author, source, sport, weeks, level, description, workouts_json, id);
      } else {
        await db.run(`
          INSERT INTO library_plans (id, user_id, name, author, source, sport, weeks, level, description, workouts_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, id, parsedUserId, name, author, source, sport, weeks, level, description, workouts_json);
      }

      return NextResponse.json({ success: true, message: 'Planilha importada com sucesso!', planId: id });
    } else if (action === 'create') {
      const { plan } = data;
      if (!plan || !plan.name || !plan.sport || !plan.weeks || !plan.workouts) {
        return NextResponse.json({ success: false, error: 'Dados da planilha inválidos' }, { status: 400 });
      }

      const id = `custom_${crypto.randomBytes(6).toString('hex')}`;
      const name = plan.name;
      const author = plan.author || 'Atleta';
      const source = plan.source || 'Criada no App';
      const sport = plan.sport;
      const weeks = parseInt(plan.weeks, 10);
      const level = plan.level || 'intermediario';
      const description = plan.description || '';
      const workouts_json = JSON.stringify(plan.workouts);

      await db.run(`
        INSERT INTO library_plans (id, user_id, name, author, source, sport, weeks, level, description, workouts_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, id, parsedUserId, name, author, source, sport, weeks, level, description, workouts_json);

      return NextResponse.json({ success: true, message: 'Planilha criada e salva com sucesso!', planId: id });
    } else {
      return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Erro na API de biblioteca:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
