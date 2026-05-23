import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculatePhysioMetrics } from '@/lib/coach-engine';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instanciar o SDK do Gemini se a chave estiver configurada
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Lógica de Fallback do Coach IA em Fisiologia do Exercício
function getFallbackCoachResponse(
  message: string, 
  user: any, 
  goal: any, 
  metrics: any, 
  weeklyWorkouts: any[]
): string {
  const msg = message.toLowerCase();
  
  // Calcular totais semanais
  const totalTssTarget = weeklyWorkouts.reduce((acc, w) => acc + w.tss_target, 0);
  const totalTssReal = weeklyWorkouts.reduce((acc, w) => acc + (w.status === 'completed' ? w.tss_target : 0), 0); // simplificado
  const completedCount = weeklyWorkouts.filter(w => w.status === 'completed').length;
   let response = `[Fisiologista de Fallback Ativado - Chave Gemini API não detectada]\n\n`;

  const firstName = user.name.split(' ')[0];

  if (msg.includes('cansad') || msg.includes('fadiga') || msg.includes('dor') || msg.includes('exausto')) {
    response += `Fala, ${firstName}! Cara, tô de olho nas suas métricas e te entendo perfeitamente. Sua Fadiga Aguda (ATL) tá batendo em **${metrics.atl}** e seu status de Forma (TSB) tá em **${metrics.tsb}** hoje.\n\n`;
    
    if (metrics.tsb < -10) {
      response += `Você entrou na zona vermelha de estresse de treino (TSB: ${metrics.tsb}). Olha, como seu treinador e seu amigo: **hoje é dia de segurar a onda!** A dor e o cansaço são as suas fibras musculares pedindo arrego após tanta sobrecarga ácida. Foca em dormir bem (tenta bater 8 horas de sono, beleza?), hidrata bastante e respeita o treino regenerativo de hoje. A gente só evolui na supercompensação, que acontece no descanso. Tamo junto nessa recuperação!`;
    } else {
      response += `Seu status de Forma (TSB) tá em **${metrics.tsb}**, o que é um estresse super aceitável. Esse cansaço de hoje pode ser só uma noite ruim de sono ou falta de carbo nas últimas refeições. Vai pro aquecimento leve; se sentir que o coração tá respondendo bem, manda bala no treino. Se travar, reduz a intensidade sem culpa. O importante é o seu bem-estar!`;
    }
  } 
  else if (msg.includes('amanhã') || msg.includes('amanha') || msg.includes('proximo treino') || msg.includes('próximo treino')) {
    const nextWorkout = weeklyWorkouts.find(w => w.status === 'pending' || w.status === 'adjusted');
    if (nextWorkout) {
      response += `Fala, campeão! Amanhã o bicho pega de um jeito bom: **${nextWorkout.title}** (${nextWorkout.type}).\n`;
      response += `- O que temos na planilha: ${nextWorkout.distance_target > 0 ? nextWorkout.distance_target + ' km' : ''} ${nextWorkout.pace_target !== 'N/A' ? '@ ' + nextWorkout.pace_target : ''} ${nextWorkout.power_target > 0 ? '@ ' + nextWorkout.power_target + 'W' : ''}\n`;
      response += `- Carga calculada: **${nextWorkout.tss_target} TSS**.\n\n`;
      response += `Cientificamente, esse treino vai ser animal para ${nextWorkout.type === 'Corrida' && nextWorkout.title.includes('Longo') ? 'aumentar seu volume mitocondrial e te dar casca' : 'ensinar seu corpo a limpar o lactato em ritmos mais fortes'}. Como sua Forma (TSB: ${metrics.tsb}) tá legal, você tá mais do que pronto! Vai lá, se diverte e me conta como foi!`;
    } else {
      response += `Cara, não achei nenhum treino pendente para os próximos dias no sistema. Você destruiu a planilha dessa semana! Hora de descansar, curtir o final de semana e deixar que eu planeje seu próximo microciclo. Parabéns pela dedicação!`;
    }
  }
  else if (msg.includes('garmin') || msg.includes('sincroniz') || msg.includes('relógio') || msg.includes('relogio')) {
    response += `A nossa ponte com o Garmin Connect tá tinindo! Sempre que você aperta o "Salvar" no relógio, ele manda a atividade direto pro meu webhook.\n\n`;
    response += `Eu leio seu ritmo, FC média e potência. Se você der um gás extra que não tava planejado (estourando o TSS), eu entro em ação na hora e ajusto os treinos dos dias seguintes para proteger suas articulações. É o nosso seguro contra lesões! Dá pra testar isso agora mesmo usando o **Simulador Strava** ali na barra superior, dá uma olhada!`;
  }
  else if (msg.includes('objetivo') || msg.includes('meta') || msg.includes('ironman') || msg.includes('maratona')) {
    response += `Nossa grande missão é o **${goal.type} de ${goal.distance} km** no dia **${goal.date_target}**, e a gente vai chegar lá voando! \n\n`;
    response += `Para te dar a supercompensação perfeita no dia da prova, nossa meta semanal tá em **${totalTssTarget} TSS**. Até agora, você já completou **${completedCount} treinos** e acumulou **${totalTssReal} TSS**. Você tá no caminho certo, orgulho do seu foco. Vamos continuar firmes!`;
  }
  else {
    response += `E aí, parceiro! Como estão as pernas e a cabeça hoje? \n\n`;
    response += `Lembrando dos nossos números: seu peso tá em **${user.weight} kg** e seus limiares são ${user.threshold_hr} bpm e pace de ${user.threshold_pace}/km. Nosso Fitness (CTL) acumulado tá em **${metrics.ctl}**.\n\n`;
    response += `O que tá passando aí na mente sobre os treinos? Quer trocar uma ideia sobre a planilha, ritmo ou algum incômodo? Conta comigo!`;
  }

  return response;
}

export async function POST(req: Request) {
  try {
    const { userId, message, chatHistory } = await req.json();
    const db = await getDb();

    const uId = parseInt(userId || '1', 10);

    // 1. Carregar perfil completo do usuário
    const user = await db.get('SELECT * FROM users WHERE id = ?', uId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Carregar objetivo ativo
    const goal = await db.get('SELECT * FROM goals WHERE user_id = ? ORDER BY date_target ASC LIMIT 1', uId);

    // 3. Carregar planilha e treinos da semana corrente
    const activePlan = await db.get('SELECT * FROM training_plans WHERE user_id = ? AND active = 1', uId);
    let workouts: any[] = [];
    if (activePlan) {
      workouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC', activePlan.id);
    }

    // 4. Calcular métricas fisiológicas acumuladas (CTL, ATL, TSB)
    const metrics = await calculatePhysioMetrics(db, uId);

    // Se a API do Gemini não estiver configurada, disparar o fallback
    if (!ai) {
      const fallbackReply = getFallbackCoachResponse(message, user, goal, metrics, workouts);
      return NextResponse.json({ reply: fallbackReply });
    }

    // 5. Configurar o Contexto Fisiológico Científico no Prompt do Gemini
    const workoutsSummary = workouts.map(w => {
      return `- Dia ${w.day_of_week} (${w.date}): ${w.title} [Status: ${w.status}, Prescrito: ${w.distance_target}km, Carga: ${w.tss_target} TSS]`;
    }).join('\n');

    const systemInstruction = `
Você é o Coach APEX, um lendário treinador de endurance e ex-atleta de elite com Doutorado em Fisiologia do Exercício.
Você é conselheiro científico do usuário e gerencia sua carga de treino utilizando a metodologia Training Stress Score (TSS).

Seu perfil de atleta atual:
- Nome: ${user.name}
- Nível de Condicionamento: ${user.level} (elite/intermediario/sedentario)
- Peso: ${user.weight} kg
- Frequência Cardíaca de Limiar (Lactato): ${user.threshold_hr} bpm
- Ritmo (Pace) de Limiar: ${user.threshold_pace}/km
- Carga Alvo Semanal: ${goal ? goal.weekly_tss_target : 300} TSS

Métricas Fisiológicas Atuais do Atleta:
- CTL (Fitness/Condicionamento Crônico): ${metrics.ctl} (Representa o estresse acumulado de longo prazo)
- ATL (Fadiga Aguda): ${metrics.atl} (Representa o cansaço dos treinos recentes das últimas semanas)
- TSB (Forma/Estresse Balance): ${metrics.tsb} (Diferença entre Fitness e Fadiga: CTL - ATL. Valores muito negativos como abaixo de -20 indicam risco de overtraining; valores perto de 0 a +10 indicam fase de polimento/pronto para prova)

Objetivo Esportivo:
- Prova Alvo: ${goal ? goal.type + ' de ' + goal.distance + ' km' : 'Qualidade de vida'}
- Data da prova: ${goal ? goal.date_target : 'N/A'}
- Meta de tempo: ${goal ? goal.target_time : 'N/A'}

Planilha de treinos da semana corrente:
${workoutsSummary}

Diretrizes de Comportamento (Persona do Coach):
1. **Comunicação Descontraída e Motivacional:** Responda de forma extremamente acolhedora, amigável e descontraída (use termos calorosos como "campeão", "parceiro", "vamos juntos", "fala meu velho"). Você deve agir como um amigo muito próximo que se importa de verdade com o sucesso, a saúde mental e o bem-estar do atleta. 
2. **Autoridade Científica e Fisiológica:** Apesar do tom amigável e leve, mantenha o rigor científico em segundo plano. Explique os dados técnicos de forma compreensível e conectada ao corpo dele (ex: explicando o papel da supercompensação, acúmulo de lactato, depleção de glicogênio e zonas Z1 a Z5 de FC de forma acessível mas PhD).
3. **Análise Baseada nos Dados:** Utilize os dados reais do atleta (CTL, ATL, TSB, desvios de TSS) nas suas respostas. Se o usuário estiver sentindo cansaço, use as métricas para corroborar e se solidarizar ("Cara, com essa ATL lá em cima e Forma em ${metrics.tsb}, é super normal se sentir quebrado. Vamos cuidar desse corpo!").
4. **Preocupação e Apoio:** Incentive-o em caso de falhas de treino ("Relaxa, acontece! A vida corrida às vezes atrapalha. Não vamos nos desesperar, já dei um tapa na planilha...") e celebre as vitórias.
5. Fale sempre em Português Brasileiro (pt-BR), de forma concisa e estruturada.
`;

    // 6. Chamar a API do Gemini
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Formatar histórico para o Gemini
    const formattedHistory = (chatHistory || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
      systemInstruction: systemInstruction
    });

    const result = await chat.sendMessage(message);
    const replyText = result.response.text();

    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error('Erro na API do Coach Chat:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
