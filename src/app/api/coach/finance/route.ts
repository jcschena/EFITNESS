import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coachIdStr = searchParams.get('coachId');

    if (!coachIdStr) {
      return NextResponse.json({ success: false, error: 'O parâmetro coachId é obrigatório.' }, { status: 400 });
    }

    const coachId = parseInt(coachIdStr, 10);
    const db = await getDb();

    // 1. Obter informações de Pix do treinador e verificar se é um sub-professor subordinado
    const coach = await db.get('SELECT id, name, pix_key, pix_instructions, parent_coach_id FROM users WHERE id = ? AND role = \'coach\'', coachId);
    if (!coach) {
      return NextResponse.json({ success: false, error: 'Treinador não encontrado' }, { status: 404 });
    }

    if (coach.parent_coach_id !== null) {
      return NextResponse.json({ success: false, error: 'Acesso negado. Apenas o administrador da assessoria pode acessar finanças.' }, { status: 403 });
    }

    // 2. Obter lista de atletas com suas informações financeiras
    const athletes = await db.all(`
      SELECT id, name, level, monthly_fee, payment_due_day, last_payment_date, payment_status, status 
      FROM users 
      WHERE coach_id = ? AND role = 'athlete' 
      ORDER BY name ASC
    `, coachId);

    // 3. Obter todo o histórico de pagamentos de todos os atletas desse treinador
    const payments = await db.all(`
      SELECT p.*, u.name as athlete_name 
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE u.coach_id = ?
      ORDER BY p.payment_date DESC, p.id DESC
    `, coachId);

    return NextResponse.json({
      success: true,
      coachPix: {
        key: coach.pix_key || '',
        instructions: coach.pix_instructions || ''
      },
      athletes: athletes.map(a => ({
        id: a.id,
        name: a.name,
        level: a.level,
        monthlyFee: a.monthly_fee ?? 150.00,
        paymentDueDay: a.payment_due_day ?? 10,
        lastPaymentDate: a.last_payment_date || null,
        paymentStatus: a.payment_status || 'paid',
        status: a.status || 'active'
      })),
      payments
    });

  } catch (error: any) {
    console.error('Erro na API de Finanças (GET):', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, coachId } = body;

    if (!coachId) {
      return NextResponse.json({ success: false, error: 'O parâmetro coachId é obrigatório.' }, { status: 400 });
    }

    const db = await getDb();

    // Validar se o coach existe, é realmente um treinador, e se é uma assessoria líder (parent_coach_id é nulo)
    const coach = await db.get('SELECT id, parent_coach_id FROM users WHERE id = ? AND role = \'coach\'', coachId);
    if (!coach) {
      return NextResponse.json({ success: false, error: 'Treinador não autorizado.' }, { status: 403 });
    }

    if (coach.parent_coach_id !== null) {
      return NextResponse.json({ success: false, error: 'Acesso negado. Apenas o administrador da assessoria pode gerenciar finanças.' }, { status: 403 });
    }

    if (action === 'update_pix') {
      const { pixKey, pixInstructions } = body;
      await db.run(
        'UPDATE users SET pix_key = ?, pix_instructions = ? WHERE id = ?',
        pixKey,
        pixInstructions,
        coachId
      );
      return NextResponse.json({ success: true, message: 'Configurações de Pix atualizadas com sucesso!' });
    }

    if (action === 'update_athlete_finance') {
      const { athleteId, monthlyFee, paymentDueDay } = body;
      if (!athleteId) {
        return NextResponse.json({ success: false, error: 'athleteId é obrigatório.' }, { status: 400 });
      }

      await db.run(
        'UPDATE users SET monthly_fee = ?, payment_due_day = ? WHERE id = ? AND coach_id = ?',
        parseFloat(monthlyFee) || 0,
        parseInt(paymentDueDay, 10) || 10,
        athleteId,
        coachId
      );

      return NextResponse.json({ success: true, message: 'Dados financeiros do atleta atualizados com sucesso!' });
    }

    if (action === 'record_payment') {
      const { athleteId, amount, paymentDate, referenceMonth, method } = body;

      if (!athleteId || !amount || !paymentDate || !referenceMonth || !method) {
        return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes.' }, { status: 400 });
      }

      // Inserir na tabela de pagamentos
      await db.run(
        `INSERT INTO payments (user_id, amount, payment_date, reference_month, method) 
         VALUES (?, ?, ?, ?, ?)`,
        athleteId,
        parseFloat(amount),
        paymentDate,
        referenceMonth,
        method
      );

      // Atualizar status do atleta: marcar como pago e ativo/desbloqueado
      await db.run(
        `UPDATE users 
         SET last_payment_date = ?, payment_status = 'paid', status = 'active' 
         WHERE id = ? AND coach_id = ?`,
        paymentDate,
        athleteId,
        coachId
      );

      // Criar notificação para o atleta confirmando o recebimento do pagamento
      const formattedDate = new Date(paymentDate + 'T12:00:00').toLocaleDateString('pt-BR');
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
      await db.run(
        `INSERT INTO coach_notifs (user_id, date, title, content, read)
         VALUES (?, ?, 'Pagamento Confirmado! ✅', ?, 0)`,
        athleteId,
        paymentDate,
        `Seu pagamento de ${formattedAmount} referente a ${referenceMonth} foi recebido e confirmado em ${formattedDate}. Obrigado pela parceria! Planilhas e recursos estão totalmente liberados.`
      );

      return NextResponse.json({ success: true, message: 'Pagamento registrado e acesso do atleta liberado!' });
    }

    if (action === 'toggle_block') {
      const { athleteId, newStatus } = body; // 'active' ou 'blocked'

      if (!athleteId || !newStatus) {
        return NextResponse.json({ success: false, error: 'athleteId e newStatus são obrigatórios.' }, { status: 400 });
      }

      const pStatus = newStatus === 'blocked' ? 'overdue' : 'paid';

      await db.run(
        'UPDATE users SET status = ?, payment_status = ? WHERE id = ? AND coach_id = ?',
        newStatus,
        pStatus,
        athleteId,
        coachId
      );

      if (newStatus === 'blocked') {
        // Enviar notificação avisando do bloqueio
        const todayStr = new Date().toLocaleDateString('en-CA');
        await db.run(
          `INSERT INTO coach_notifs (user_id, date, title, content, read)
           VALUES (?, ?, 'Pendência Financeira Detectada ⚠️', ?, 0)`,
          athleteId,
          todayStr,
          `Seu acesso foi temporariamente suspenso devido a pendências na mensalidade. Por favor, regularize efetuando o Pix direto na tela de aviso para desbloquear seu painel.`
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: newStatus === 'blocked' ? 'Acesso do atleta suspenso com sucesso.' : 'Acesso do atleta reestabelecido.' 
      });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 });

  } catch (error: any) {
    console.error('Erro na API de Finanças (POST):', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
