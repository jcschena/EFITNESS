import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get('code');
    const userIdStr = searchParams.get('state') || searchParams.get('userId') || '1';
    const userId = parseInt(userIdStr, 10);

    const db = await getDb();

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', req.url));
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    let accessToken = 'mock_strava_access_token_default';
    let refreshToken = 'mock_strava_refresh_token_default';
    let expiresAt = Math.round(Date.now() / 1000) + 36000; // +10 horas

    // Se houver chaves de integração configuradas, fazer a chamada real do Strava
    if (clientId && clientSecret && !code.startsWith('mock_')) {
      try {
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code'
          })
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token;
          expiresAt = tokenData.expires_at;
          console.log('Token do Strava trocado com sucesso para o usuário:', userId);
        } else {
          const errBody = await tokenResponse.text();
          console.error('Erro na resposta de troca de token do Strava:', errBody);
          return NextResponse.redirect(`${origin}/?error=strava_token_exchange_failed&userId=${userId}`);
        }
      } catch (err) {
        console.error('Erro ao chamar token do Strava:', err);
        return NextResponse.redirect(`${origin}/?error=strava_connection_error&userId=${userId}`);
      }
    } else {
      console.log('Executando simulação de tokens Strava OAuth para o usuário:', userId);
    }

    // Gravar tokens e marcar conexão no SQLite/PostgreSQL
    await db.run(`
      UPDATE users 
      SET strava_connected = 1,
          strava_access_token = ?,
          strava_refresh_token = ?,
          strava_token_expires = ?
      WHERE id = ?
    `, accessToken, refreshToken, expiresAt, userId);

    // Inserir uma notificação automática do coach celebrando a conexão
    const todayStr = new Date().toISOString().split('T')[0];
    await db.run(`
      INSERT INTO coach_notifs (user_id, date, title, content)
      VALUES (?, ?, 'Conexão com o Strava Estabelecida!', 'Show de bola! Conectamos sua conta com sucesso. Agora, a cada corrida, pedalada ou natação que você salvar no Strava, eu recebo os dados aqui e calculo sua carga TSS instantaneamente. Vamos pra cima!')
    `, userId, todayStr);

    // Redirecionar de volta para a página principal (onde a SPA recarregará o estado)
    return NextResponse.redirect(`${origin}/?strava_sync=success&userId=${userId}`);

  } catch (error) {
    console.error('Erro no Callback do Strava:', error);
    const { origin } = new URL(req.url);
    return NextResponse.redirect(`${origin}/?error=internal_callback_error`);
  }
}
