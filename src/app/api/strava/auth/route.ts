import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '1';

    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/strava/callback?userId=${userId}`;

    // Se as chaves do Strava não estiverem no .env, simular o redirecionamento direto para o Callback com código fictício
    if (!clientId) {
      console.log('Chaves do Strava não configuradas. Simulando fluxo de consentimento OAuth...');
      const mockCallbackUrl = `${redirectUri}&code=mock_strava_auth_code_998877`;
      return NextResponse.redirect(mockCallbackUrl);
    }

    // Fluxo Real do Strava
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=activity:read_all&approval_prompt=auto`;
    
    return NextResponse.redirect(stravaAuthUrl);

  } catch (error) {
    console.error('Erro na rota de Auth do Strava:', error);
    return NextResponse.json({ error: 'Erro ao iniciar fluxo de autorização' }, { status: 500 });
  }
}
