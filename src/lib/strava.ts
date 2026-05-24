import { DatabaseClient } from './db';

/**
 * Obtém o token de acesso do Strava válido para o usuário.
 * Caso esteja expirado ou prestes a expirar, renova automaticamente usando o refresh_token.
 */
export async function getStravaAccessToken(db: DatabaseClient, userId: number): Promise<string | null> {
  const user = await db.get<{
    strava_access_token: string;
    strava_refresh_token: string;
    strava_token_expires: number;
    strava_connected: number;
  }>(
    'SELECT strava_access_token, strava_refresh_token, strava_token_expires, strava_connected FROM users WHERE id = ?',
    userId
  );

  if (!user || !user.strava_connected || !user.strava_access_token) {
    return null;
  }

  // Se o token for mockado, retorna ele mesmo
  if (user.strava_access_token.startsWith('mock_')) {
    return user.strava_access_token;
  }

  const nowSecs = Math.round(Date.now() / 1000);
  
  // Se o token expira em menos de 5 minutos, nós renovamos!
  if (!user.strava_token_expires || user.strava_token_expires - nowSecs < 300) {
    console.log(`[Strava] Token do usuário ${userId} expirado ou prestes a expirar. Renovando...`);
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (clientId && clientSecret && user.strava_refresh_token) {
      try {
        const response = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: user.strava_refresh_token,
            grant_type: 'refresh_token'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const newAccessToken = data.access_token;
          const newRefreshToken = data.refresh_token || user.strava_refresh_token;
          const newExpiresAt = data.expires_at;

          // Atualizar o banco de dados
          await db.run(
            `UPDATE users 
             SET strava_access_token = ?, 
                 strava_refresh_token = ?, 
                 strava_token_expires = ? 
             WHERE id = ?`,
            newAccessToken,
            newRefreshToken,
            newExpiresAt,
            userId
          );

          console.log(`[Strava] Token do usuário ${userId} renovado com sucesso!`);
          return newAccessToken;
        } else {
          const errBody = await response.text();
          console.error(`[Strava] Erro ao renovar token do usuário ${userId}:`, errBody);
        }
      } catch (err) {
        console.error(`[Strava] Falha de conexão ao tentar renovar token do usuário ${userId}:`, err);
      }
    }
  }

  return user.strava_access_token;
}
