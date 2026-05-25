import { NextResponse } from 'next/server';
import { getDb, autoCompleteExpiredRests } from '@/lib/db';
import { calculatePhysioMetrics } from '@/lib/coach-engine';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getCelebration } from '@/lib/celebrations';

// Instanciar o SDK do Gemini se a chave estiver configurada
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Lógica de Fallback do Coach IA em Fisiologia do Exercício
function getFallbackCoachResponse(
  message: string, 
  user: any, 
  goal: any, 
  metrics: any, 
  weeklyWorkouts: any[],
  activityLogs: any[],
  clientDate?: string
): string {
  const msg = message.toLowerCase();
  
  // Calcular totais semanais
  const totalTssTarget = weeklyWorkouts.reduce((acc, w) => acc + w.tss_target, 0);
  const totalTssReal = activityLogs.reduce((acc, al) => acc + (al.tss_real || 0), 0);
  const completedCount = weeklyWorkouts.filter(w => w.status === 'completed').length;
  let response = `[Fisiologista de Fallback Ativado - Chave Gemini API não detectada]\n\n`;

  const firstName = user.name.split(' ')[0];

  const celebration = getCelebration(user.birth_date, clientDate);
  if (celebration) {
    if (celebration.type === 'birthday') {
      response += `🎉 🎂 FELIZ ANIVERSÁRIO, ${firstName.toUpperCase()}!!! 🥳 🎈\nQue este novo ciclo traga muita saúde, paz, conquistas e, claro, muitos quilômetros de evolução na pista e na vida! Aproveite muito o seu dia, comemore bastante e conte comigo para seguir evoluindo de forma segura! 🥂\n\n`;
    } else {
      response += `🎉 ${celebration.name.toUpperCase()}!!! 🌟\n${celebration.message}\n\n`;
    }
  }

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
    response += `Eu leio seu ritmo, FC média e potência. Se você der um gás extra que não tava planejado (estourando o TSS), eu entro em ação na hora e ajusto os treinos dos dias seguintes para proteger suas articulações. É o nosso seguro contra lesões! A sincronização é 100% automática e integrada com seu Strava real.`;
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
    const { userId, message, chatHistory, clientDate } = await req.json();
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
    let activityLogs: any[] = [];
    if (activePlan) {
      const today = clientDate ? new Date(clientDate + 'T12:00:00') : new Date();
      await autoCompleteExpiredRests(db, activePlan.id, today);
      workouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC, id ASC', activePlan.id);
      
      // Carregar os logs de atividade da semana corrente (vinculados ou extras)
      activityLogs = await db.all(`
        SELECT * FROM activity_logs 
        WHERE user_id = ? 
          AND timestamp >= ? 
          AND timestamp <= ?
      `, uId, activePlan.start_date + 'T00:00:00', activePlan.end_date + 'T23:59:59');
    }

    // 4. Calcular métricas fisiológicas acumuladas (CTL, ATL, TSB)
    const metrics = await calculatePhysioMetrics(db, uId);

    // Se a API do Gemini não estiver configurada, disparar o fallback
    if (!ai) {
      const fallbackReply = getFallbackCoachResponse(message, user, goal, metrics, workouts, activityLogs, clientDate);
      return NextResponse.json({ reply: fallbackReply, dbUpdated: false });
    }

    // Calcular TSS real acumulado na semana
    const totalTssReal = activityLogs.reduce((acc, al) => acc + (al.tss_real || 0), 0);

    // 5. Configurar o Contexto Fisiológico Científico no Prompt do Gemini
    const workoutsSummary = workouts.map(w => {
      return `- ID: ${w.id}, Dia ${w.day_of_week} (${w.date}): ${w.title} [Tipo: ${w.type || 'N/A'}, Status: ${w.status}, Prescrito: ${w.distance_target || 0}km, Carga: ${w.tss_target || 0} TSS, Ritmo: ${w.pace_target || 'N/A'}, Potência: ${w.power_target || 0}W, Duração: ${w.duration_target || 0}s]`;
    }).join('\n');

    const celebration = getCelebration(user.birth_date, clientDate);
    let celebrationPrompt = '';
    if (celebration) {
      if (celebration.type === 'birthday') {
        celebrationPrompt = `\n[HOJE É O ANIVERSÁRIO DO ATLETA! Você DEVE começar sua resposta parabenizando o usuário calorosamente pelo seu aniversário. Use confetes virtuais em texto, deseje saúde, conquistas, prosperidade nos treinos e comemore essa data festiva antes de entrar nas análises técnicas.]\n`;
      } else {
        celebrationPrompt = `\n[HOJE É UMA DATA COMEMORATIVA: ${celebration.name}! Você DEVE começar sua resposta felicitando o atleta por esta data comemorativa (${celebration.message}) e fazendo uma analogia motivacional positiva com os treinos dele.]\n`;
      }
    }

    const systemInstruction = `
Você é o ULTRA COACH, um lendário treinador de endurance e ex-atleta de elite com Doutorado em Fisiologia do Exercício.
Você é conselheiro científico do usuário e gerencia sua carga de treino utilizando a metodologia Training Stress Score (TSS).
${celebrationPrompt}

Seu perfil de atleta atual:
- Nome: ${user.name}
- Nível de Condicionamento: ${user.level} (elite/intermediario/sedentario)
- Peso: ${user.weight} kg
- Frequência Cardíaca de Limiar (Lactato): ${user.threshold_hr} bpm
- Ritmo (Pace) de Limiar: ${user.threshold_pace}/km
- Carga Alvo Semanal: ${goal ? goal.weekly_tss_target : 300} TSS
- Carga Realizada Acumulada Semanal: ${totalTssReal} TSS (Soma de toda fadiga/esforço acumulado no Strava/Manual nesta semana, incluindo treinos planejados e treinos extras/não planejados)

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
6. **Ajuste de Treinos/Planilha:** Se o usuário solicitar explicitamente alterações, ajustes ou redimensionamento do planejamento (ex: reduzir distância de terça, remover o longo, mudar dia de descanso, alterar ritmo/pace, etc.), você DEVE chamar a função (tool) 'adjustWorkout' para registrar essa alteração no banco de dados. Nunca afirme que alterou a planilha sem de fato invocar a função correspondente.
`;

    // 6. Chamar a API do Gemini com suporte a Tools
    let dbUpdated = false;
    let replyText = '';

    try {
      const model = ai.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction,
        tools: [
          {
            functionDeclarations: [
              {
                name: 'adjustWorkout',
                description: 'Ajusta ou altera os detalhes de um treino específico na planilha do atleta no banco de dados. Chame essa função quando o atleta pedir explicitamente para alterar a planilha ou treinos específicos (ex: diminuir volume, mudar distância, trocar descanso de dia, alterar ritmo/pace).',
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {
                    workoutId: { type: SchemaType.INTEGER, description: 'O ID único do treino a ser modificado.' },
                    type: { type: SchemaType.STRING, description: 'O tipo do treino: Corrida, Ciclismo, Natacao, Descanso, Forca, CorridaTrilha, Duathlon, Aquathlon.' },
                    title: { type: SchemaType.STRING, description: 'O título descritivo do treino.' },
                    description: { type: SchemaType.STRING, description: 'Nova instrução, descrição ou notas para o treino.' },
                    distance_target: { type: SchemaType.NUMBER, description: 'A distância alvo em KM (use 0 para treinos sem distância como descanso ou força).' },
                    duration_target: { type: SchemaType.INTEGER, description: 'A duração alvo em segundos (ex: 3600 para 1 hora).' },
                    pace_target: { type: SchemaType.STRING, description: 'O ritmo (pace) alvo em formato MM:SS/km ou MM:SS/100m (ex: "5:30/km", ou "N/A").' },
                    power_target: { type: SchemaType.INTEGER, description: 'A potência alvo em Watts (W) se aplicável (caso contrário 0).' },
                    tss_target: { type: SchemaType.INTEGER, description: 'A carga alvo estimada em TSS (Training Stress Score).' },
                    status: { type: SchemaType.STRING, description: 'O status do treino, defina como "adjusted" se foi modificado pelo coach.' }
                  },
                  required: ['workoutId']
                }
              }
            ]
          }
        ]
      });
      
      // Formatar histórico para o Gemini e garantir alternância estrita (regras da API)
      const rawHistory = (chatHistory || []).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const formattedHistory: any[] = [];
      for (const msg of rawHistory) {
        if (formattedHistory.length === 0) {
          // O primeiro item do histórico precisa ser obrigatoriamente do 'user'
          if (msg.role === 'user') {
            formattedHistory.push(msg);
          }
        } else {
          // Garantir que as roles alternem estritamente entre 'user' e 'model'
          const lastMsg = formattedHistory[formattedHistory.length - 1];
          if (lastMsg.role !== msg.role) {
            formattedHistory.push(msg);
          }
        }
      }

      const chat = model.startChat({
        history: formattedHistory
      });

      let result = await chat.sendMessage(message);
      
      // Verificar se o modelo decidiu chamar uma função
      const functionCalls = result.response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const functionResponses = [];
        for (const call of functionCalls) {
          if (call.name === 'adjustWorkout') {
            const args = call.args as any;
            const workoutId = parseInt(args.workoutId, 10);
            
            if (!workoutId) {
              functionResponses.push({
                functionResponse: {
                  name: 'adjustWorkout',
                  response: { success: false, error: 'O parâmetro workoutId é obrigatório.' }
                }
              });
              continue;
            }
            
            try {
              // Construir a query de atualização dinâmica
              const updates: string[] = [];
              const values: any[] = [];
              
              if (args.type !== undefined) { updates.push('type = ?'); values.push(args.type); }
              if (args.title !== undefined) { updates.push('title = ?'); values.push(args.title); }
              if (args.description !== undefined) { updates.push('description = ?'); values.push(args.description); }
              if (args.distance_target !== undefined) { updates.push('distance_target = ?'); values.push(args.distance_target); }
              if (args.duration_target !== undefined) { updates.push('duration_target = ?'); values.push(args.duration_target); }
              if (args.pace_target !== undefined) { updates.push('pace_target = ?'); values.push(args.pace_target); }
              if (args.power_target !== undefined) { updates.push('power_target = ?'); values.push(args.power_target); }
              if (args.tss_target !== undefined) { updates.push('tss_target = ?'); values.push(args.tss_target); }
              
              // Sempre que ajustado pelo coach, muda o status para 'adjusted'
              updates.push('status = ?');
              values.push(args.status !== undefined ? args.status : 'adjusted');
              
              if (updates.length > 1) { // Pelo menos um campo editado + status
                values.push(workoutId);
                await db.run(
                  `UPDATE workouts SET ${updates.join(', ')} WHERE id = ?`,
                  ...values
                );
                dbUpdated = true;
                
                // Inserir notificação correspondente
                const todayStr = clientDate || new Date().toISOString().split('T')[0];
                const workoutInfo = await db.get('SELECT title FROM workouts WHERE id = ?', workoutId);
                const workoutTitle = workoutInfo ? workoutInfo.title : 'Treino';
                
                await db.run(
                  `INSERT INTO coach_notifs (user_id, date, title, content, read)
                   VALUES (?, ?, ?, ?, 0)`,
                  uId,
                  todayStr,
                  'Planilha Ajustada pelo Treinador',
                  `Ajustei as métricas do treino "${workoutTitle}" (ID: ${workoutId}) de acordo com a nossa conversa.`
                );
                
                functionResponses.push({
                  functionResponse: {
                    name: 'adjustWorkout',
                    response: { success: true, message: `Treino ${workoutId} atualizado no banco de dados com sucesso.` }
                  }
                });
              } else {
                functionResponses.push({
                  functionResponse: {
                    name: 'adjustWorkout',
                    response: { success: false, error: 'Nenhum campo de atualização foi fornecido.' }
                  }
                });
              }
            } catch (err: any) {
              console.error('Erro ao executar adjustWorkout no banco:', err);
              functionResponses.push({
                functionResponse: {
                  name: 'adjustWorkout',
                  response: { success: false, error: `Erro interno no banco de dados: ${err.message}` }
                }
              });
            }
          }
        }
        
        // Enviar as respostas das funções de volta ao chat para receber a resposta final em texto
        result = await chat.sendMessage(functionResponses);
      }

      replyText = result.response.text();
    } catch (apiError: any) {
      console.warn('Erro ao chamar API do Gemini (usando fallback de fisiologia):', apiError);
      
      // Fallback amigável se a API der erro
      const fallbackReply = getFallbackCoachResponse(
        message, 
        user, 
        goal, 
        metrics, 
        workouts, 
        activityLogs, 
        clientDate
      );
      
      replyText = `Opa, campeão! Tive um pico temporário de acessos aos meus servidores de IA agora, mas não esquente! Usando o meu motor local de fisiologia, aqui vai a minha orientação:\n\n${fallbackReply}`;
    }

    return NextResponse.json({ reply: replyText, dbUpdated });

  } catch (error: any) {
    console.error('Erro na API do Coach Chat:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
