import { getDb, getCalendarToken } from '@/lib/db';

function formatDateToICS(dateStr: string): string {
  // input: "2026-05-24"
  // output: "20260524"
  return dateStr.replace(/-/g, '');
}

function getNextDayICS(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function escapeICS(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r?\n/g, '\\n');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get('userId');
    const token = searchParams.get('token');

    if (!userIdStr || !token) {
      return new Response('Parâmetros userId ou token ausentes', { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);
    const db = await getDb();

    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      return new Response('Usuário não encontrado', { status: 404 });
    }

    const expectedToken = getCalendarToken(userId, user.password || '');
    if (token !== expectedToken) {
      return new Response('Acesso não autorizado: token inválido', { status: 401 });
    }

    // Buscar todos os treinos vinculados a todas as planilhas do usuário
    const workouts = await db.all(
      `SELECT w.* FROM workouts w 
       JOIN training_plans tp ON w.plan_id = tp.id 
       WHERE tp.user_id = ? 
       ORDER BY w.date ASC`,
      userId
    );

    const todayStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ULTRA COACH//NONSGML Training Calendar//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Treinos - ULTRA COACH',
      'X-WR-TIMEZONE:America/Sao_Paulo',
      'X-WR-CALDESC:Sua planilha de treinos sincronizada pelo ULTRA COACH'
    ];

    for (const w of workouts) {
      const isRest = w.type === 'Descanso';
      
      const summaryPrefix = w.type === 'Corrida' ? '🏃' :
                            w.type === 'Ciclismo' ? '🚴' :
                            w.type === 'Natacao' ? '🏊' :
                            w.type === 'Forca' ? '💪' :
                            w.type === 'Descanso' ? '😴' : '⚡';

      const typeName = w.type === 'Corrida' ? 'Corrida' :
                       w.type === 'Ciclismo' ? 'Ciclismo' :
                       w.type === 'Natacao' ? 'Natação' :
                       w.type === 'Forca' ? 'Fortalecimento' :
                       w.type === 'Descanso' ? 'Descanso' : w.type;

      const title = `${summaryPrefix} [${typeName}] ${w.title}`;
      const startICS = formatDateToICS(w.date);
      const endICS = getNextDayICS(w.date);
      
      const descriptionLines: string[] = [];
      if (w.description) {
        descriptionLines.push(w.description);
      }
      
      if (!isRest) {
        descriptionLines.push('');
        if (w.distance_target > 0) {
          descriptionLines.push(`Distância Prescrita: ${w.distance_target.toFixed(2).replace('.', ',')} km`);
        }
        if (w.duration_target > 0) {
          const hours = Math.floor(w.duration_target / 3600);
          const minutes = Math.floor((w.duration_target % 3600) / 60);
          const seconds = w.duration_target % 60;
          const timeStr = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
          ].join(':');
          descriptionLines.push(`Duração Prescrita: ${timeStr}`);
        }
        if (w.pace_target && w.pace_target !== 'N/A') {
          descriptionLines.push(`Ritmo Alvo (Pace): ${w.pace_target} /km`);
        }
        if (w.power_target > 0) {
          descriptionLines.push(`Potência Alvo: ${w.power_target} W`);
        }
        if (w.tss_target > 0) {
          descriptionLines.push(`Carga Estimada: ${w.tss_target} TSS`);
        }
      }
      
      descriptionLines.push(`Status do Treino: ${w.status === 'completed' ? 'Concluído' : 'Pendente'}`);
      
      const cleanSummary = escapeICS(title);
      const cleanDescription = escapeICS(descriptionLines.join('\n'));

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:workout-${w.id}@ultra.coach`);
      icsContent.push(`DTSTAMP:${todayStr}`);
      icsContent.push(`DTSTART;VALUE=DATE:${startICS}`);
      icsContent.push(`DTEND;VALUE=DATE:${endICS}`);
      icsContent.push(`SUMMARY:${cleanSummary}`);
      icsContent.push(`DESCRIPTION:${cleanDescription}`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('TRANSP:TRANSPARENT'); // Garante que o evento não bloqueia a agenda como "Ocupado"
      icsContent.push('END:VEVENT');
    }

    icsContent.push('END:VCALENDAR');

    const body = icsContent.join('\r\n');

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="workouts.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('Erro ao gerar feed iCal:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
}
