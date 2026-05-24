export interface Celebration {
  isCelebration: boolean;
  type: 'birthday' | 'holiday' | 'sports_day' | null;
  name: string;
  message: string;
}

export function getCelebration(birthDateStr: string | null, currentDateStr?: string): Celebration | null {
  // currentDateStr no formato YYYY-MM-DD (ou pega a data atual se omitido)
  let today = new Date();
  if (currentDateStr) {
    today = new Date(currentDateStr + 'T12:00:00'); // Evitar problemas de timezone
  }
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const mmdd = `${month}-${day}`;

  // 1. Verificar Aniversário
  if (birthDateStr) {
    const birthParts = birthDateStr.split('-');
    if (birthParts.length === 3) {
      const birthMonth = birthParts[1];
      const birthDay = birthParts[2];
      if (birthMonth === month && birthDay === day) {
        return {
          isCelebration: true,
          type: 'birthday',
          name: 'Aniversário',
          message: 'Parabéns pelo seu aniversário! Que a sua linha de chegada biológica esteja cada vez mais distante e que você celebre com muita saúde, força, foco e grandes conquistas na pista!'
        };
      }
    }
  }

  // 2. Feriados e Datas Importantes (MM-DD)
  const holidays: Record<string, { name: string; message: string; type: 'holiday' | 'sports_day' }> = {
    '01-01': { name: 'Ano Novo', message: 'Feliz Ano Novo! Que este novo ciclo traga muitos quilômetros de evolução, saúde e novos recordes pessoais!', type: 'holiday' },
    '04-21': { name: 'Tiradentes', message: 'Feriado de Tiradentes! Bom dia para um treino com garra e determinação.', type: 'holiday' },
    '05-01': { name: 'Dia do Trabalho', message: 'Feliz Dia do Trabalho! Hoje é dia de comemorar descansando o corpo ou fazendo aquele treino longo com calma.', type: 'holiday' },
    '09-07': { name: 'Independência do Brasil', message: 'Dia da Independência do Brasil! Que tal celebrar correndo com liberdade e buscando sua independência fisiológica?', type: 'holiday' },
    '10-12': { name: 'Nossa Senhora Aparecida / Dia das Crianças', message: 'Feriado de 12 de Outubro! Dia de resgatar a leveza da infância e correr com alegria.', type: 'holiday' },
    '11-02': { name: 'Finados', message: 'Dia de Finados. Um bom momento para respeitar o descanso do corpo e recuperar a musculatura.', type: 'holiday' },
    '11-15': { name: 'Proclamação da República', message: 'Dia da Proclamação da República! Proclame sua melhor performance hoje!', type: 'holiday' },
    '12-25': { name: 'Natal', message: 'Feliz Natal! O melhor presente é manter o corpo ativo e a saúde em dia. Boas festas e ótimos treinos!', type: 'holiday' },
    
    // Datas Esportivas Importantes
    '08-07': { name: 'Dia do Maratonista', message: 'Feliz Dia do Maratonista! Cada passo longo é uma vitória da mente sobre a matéria. Parabéns pela persistência!', type: 'sports_day' },
    '09-01': { name: 'Dia do Profissional de Educação Física', message: 'Dia do Profissional de Educação Física! Respeito máximo a quem planeja e periodiza nossa saúde e treinos.', type: 'sports_day' },
    '12-21': { name: 'Dia do Atleta', message: 'Feliz Dia do Atleta! Parabéns pela sua dedicação diária, superando limites e mantendo o foco em cada planilha!', type: 'sports_day' },
  };

  if (holidays[mmdd]) {
    const hol = holidays[mmdd];
    return {
      isCelebration: true,
      type: hol.type,
      name: hol.name,
      message: hol.message
    };
  }

  return null;
}
