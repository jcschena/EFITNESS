import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

function parseCsvPlan(csvText: string): any {
  const lines = csvText.split(/\r?\n/);
  
  let name = 'Planilha Importada';
  let sport = 'Corrida';
  let level = 'intermediario';
  let description = 'Planilha importada via link CSV/Google Sheets.';
  let author = 'Desconhecido';
  
  const workoutsByWeek: Record<number, any[]> = {};
  let headers: string[] = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Verificar metadados em linhas de comentário
    if (line.startsWith('#')) {
      const match = line.substring(1).split(':');
      if (match.length >= 2) {
        const key = match[0].trim().toLowerCase();
        const value = match.slice(1).join(':').trim();
        if (key === 'nome' || key === 'name') name = value;
        else if (key === 'esporte' || key === 'sport') sport = value;
        else if (key === 'nivel' || key === 'level') level = value;
        else if (key === 'descricao' || key === 'description') description = value;
        else if (key === 'autor' || key === 'author') author = value;
      }
      continue;
    }
    
    // Dividir colunas (suporta vírgula ou ponto e vírgula)
    const parts = line.split(/[,;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    
    // Detectar linha de cabeçalho
    if (headers.length === 0 && (parts.includes('semana') || parts.includes('week') || parts.includes('dia') || parts.includes('day'))) {
      headers = parts.map(h => h.toLowerCase());
      continue;
    }
    
    // Detectar se é metadado no corpo em formato chave-valor (ex: Nome,Planilha de Corrida)
    if (headers.length === 0 && parts.length >= 2) {
      const key = parts[0].toLowerCase();
      if (['nome', 'name', 'esporte', 'sport', 'nivel', 'level', 'descricao', 'description', 'autor', 'author'].includes(key)) {
        const value = parts[1];
        if (key === 'nome' || key === 'name') name = value;
        else if (key === 'esporte' || key === 'sport') sport = value;
        else if (key === 'nivel' || key === 'level') level = value;
        else if (key === 'descricao' || key === 'description') description = value;
        else if (key === 'autor' || key === 'author') author = value;
        continue;
      }
    }
    
    if (headers.length > 0 && parts.length >= 3) {
      const getVal = (colNames: string[]) => {
        const idx = headers.findIndex(h => colNames.includes(h));
        return idx !== -1 ? parts[idx] : '';
      };
      
      const week = parseInt(getVal(['semana', 'week']), 10);
      const day = parseInt(getVal(['dia', 'day']), 10);
      const type = getVal(['tipo', 'type']) || 'Corrida';
      const title = getVal(['titulo', 'title', 'treino', 'workout']) || 'Treino';
      const desc = getVal(['descricao', 'description', 'desc']) || '';
      const dist = parseFloat(getVal(['distancia', 'distance', 'dist'])) || 0;
      
      const durRaw = getVal(['duracao', 'duration', 'dur']);
      let dur = 0;
      if (durRaw) {
        if (durRaw.includes(':')) {
          const tParts = durRaw.split(':');
          if (tParts.length === 3) {
            dur = parseInt(tParts[0], 10) * 3600 + parseInt(tParts[1], 10) * 60 + parseInt(tParts[2], 10);
          } else if (tParts.length === 2) {
            dur = parseInt(tParts[0], 10) * 60 + parseInt(tParts[1], 10);
          }
        } else {
          dur = Math.round(parseFloat(durRaw) * 60) || 0;
        }
      }
      
      const pace = getVal(['pace', 'ritmo']) || 'N/A';
      const power = parseInt(getVal(['potencia', 'power', 'watts']), 10) || 0;
      const tss = parseInt(getVal(['tss', 'carga']), 10) || 0;
      
      if (!isNaN(week) && !isNaN(day) && day >= 1 && day <= 7) {
        if (!workoutsByWeek[week]) {
          workoutsByWeek[week] = [];
        }
        workoutsByWeek[week].push({ day, type, title, desc, dist, dur, pace, power, tss });
      }
    }
  }
  
  const weeksList = Object.keys(workoutsByWeek).map(Number).sort((a, b) => a - b);
  if (weeksList.length === 0) return null;

  const workouts: any[][] = [];
  for (const w of weeksList) {
    const weekWorkouts = Array.from({ length: 7 }, (_, i) => {
      const dayNum = i + 1;
      const found = workoutsByWeek[w].find(wk => wk.day === dayNum);
      if (found) return found;
      return {
        day: dayNum,
        type: 'Descanso',
        title: 'Descanso',
        desc: 'Dia de descanso.',
        dist: 0,
        dur: 0,
        pace: 'N/A',
        power: 0,
        tss: 0
      };
    });
    workouts.push(weekWorkouts);
  }
  
  return {
    name,
    author,
    sport,
    weeks: workouts.length,
    level,
    description,
    workouts
  };
}

function parseHtmlTables(html: string): any {
  const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi) || [];
  
  for (const tableHtml of tableMatches) {
    const rows: string[] = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    const parsedTable: string[][] = [];
    
    for (const rowHtml of rows) {
      const cells = rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
      const parsedRow = cells.map(cell => {
        return cell.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      });
      if (parsedRow.length > 0) {
        parsedTable.push(parsedRow);
      }
    }
    
    if (parsedTable.length > 0) {
      const csvLines = parsedTable.map(row => row.join(',')).join('\n');
      const plan = parseCsvPlan(csvLines);
      if (plan && plan.workouts && plan.workouts.length > 0) {
        return plan;
      }
    }
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const plans = await db.all('SELECT * FROM library_plans ORDER BY name ASC');
    
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

      // Se for um link do Google Sheets, converter automaticamente para exportação CSV
      let targetUrl = url;
      if (url.includes('docs.google.com/spreadsheets')) {
        const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (sheetIdMatch && sheetIdMatch[1]) {
          targetUrl = `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=csv`;
        }
      } else if (url.startsWith('/')) {
        const requestUrl = new URL(req.url);
        targetUrl = `${requestUrl.protocol}//${requestUrl.host}${url}`;
      }

      console.log(`Buscando planilha no link: ${targetUrl}`);
      const fetchRes = await fetch(targetUrl);
      if (!fetchRes.ok) {
        return NextResponse.json({ success: false, error: `Falha ao buscar URL: status ${fetchRes.status}` }, { status: 400 });
      }

      let planData: any = null;
      const contentType = fetchRes.headers.get('content-type') || '';
      const responseText = await fetchRes.text();
      let isJson = false;

      // 1. Tentar parsear como JSON
      if (contentType.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          planData = JSON.parse(responseText);
          if (planData.name && planData.sport && planData.weeks && planData.workouts) {
            isJson = true;
          }
        } catch (e) {
          // Ignorar e tentar outros formatos
        }
      }

      // 2. Se não for JSON, tentar parsear como CSV ou Google Sheets exportado
      if (!isJson) {
        planData = parseCsvPlan(responseText);
      }

      // 3. Se ainda assim não der, tentar extrair tabelas de uma página HTML comum
      if (!planData || !planData.workouts || planData.workouts.length === 0) {
        planData = parseHtmlTables(responseText);
      }

      // Validar dados estruturados
      if (!planData || !planData.name || !planData.sport || !planData.weeks || !planData.workouts || planData.workouts.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Não foi possível extrair os treinos do link. Certifique-se de que o link é um JSON de planilha válido, um arquivo CSV formatado, uma tabela HTML legível ou uma planilha pública do Google Sheets.' 
        }, { status: 400 });
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
