export interface NutritionMonthTip {
  monthName: string;
  title: string;
  focus: string;
  source: string;
  sourceUrl: string;
  generalGuideline: string;
  preWorkout: string;
  duringWorkout: string;
  postWorkout: string;
  hydrationTip: string;
}

export interface StretchingExercise {
  id: string;
  name: string;
  target: string;
  duration: string;
  steps: string[];
  safetyTip: string;
  imageEmoji?: string;
}

export interface StretchingCategory {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  exercises: StretchingExercise[];
}

export const NUTRITION_DATA: Record<number, NutritionMonthTip> = {
  0: {
    monthName: "Janeiro",
    title: "Hidratação & Reposição Eletrolítica no Verão",
    focus: "Performance sob calor extremo, prevenção de cãibras e desidratação crônica.",
    source: "Gatorade Sports Science Institute (GSSI)",
    sourceUrl: "https://www.gssiweb.org",
    generalGuideline: "Durante o verão, a taxa de suor aumenta significativamente. A perda de fluidos e de sódio compromete o volume sanguíneo e a capacidade de refrigeração do corpo, gerando fadiga precoce. Pesar-se antes e depois do treino ajuda a estimar sua taxa de suor (1 kg perdido = ~1 litro de líquido).",
    preWorkout: "Consuma 500ml a 700ml de água ou bebida eletrolítica nas 2 a 3 horas que antecedem o treino para garantir que o corpo inicie em estado de eohidratação.",
    duringWorkout: "Em sessões com mais de 60 minutos, consuma entre 500ml e 1000ml de fluidos por hora. Prefira bebidas isotônicas contendo sódio (460-690 mg/L) para acelerar a absorção de água e prevenir a hiponatremia.",
    postWorkout: "Reponha 150% do peso perdido durante o treino nas 4 a 6 horas seguintes. Se perdeu 1 kg de peso corporal, beba 1,5 litros de água ou bebidas com eletrólitos.",
    hydrationTip: "Evite beber volumes excessivos de água pura em treinos muito longos; sem sódio, isso pode diluir os eletrólitos do sangue."
  },
  1: {
    monthName: "Fevereiro",
    title: "Nutrição na Fase de Base e Volume Esportivo",
    focus: "Densidade de nutrientes e recuperação de glicogênio em treinos longos de baixa intensidade.",
    source: "TrainingPeaks Guidelines",
    sourceUrl: "https://www.trainingpeaks.com",
    generalGuideline: "A fase de base exige consistência energética. O corpo utiliza uma mistura de gorduras e carboidratos em intensidades baixas (Zonas 1 e 2). O foco nutricional deve ser em alimentos densos em nutrientes para suportar o volume crescente de quilometragem e otimizar a biogênese mitocondrial.",
    preWorkout: "Faça uma refeição rica em carboidratos complexos de baixo a médio índice glicêmico (ex: aveia, batata doce) 2 a 3 horas antes para liberação gradual de glicose.",
    duringWorkout: "Em treinos de Z1/Z2 acima de 2 horas, consuma de 30g a 45g de carboidratos por hora. Alimentos reais como bananas e pequenos sanduíches com mel são ótimas opções.",
    postWorkout: "Garanta uma ingestão imediata de carboidratos e proteínas (relação 3:1 ou 4:1) para repor os estoques de glicogênio e iniciar a regeneração das fibras musculares.",
    hydrationTip: "Mesmo em intensidades baixas, o suor ocorre. Mantenha ingestão contínua de água pura ou diluída."
  },
  2: {
    monthName: "Março",
    title: "Combustível para Sessões de Alta Intensidade (VO2 Máximo)",
    focus: "Maximização de glicogênio muscular ativo e prevenção de desconforto gastrointestinal.",
    source: "Mayo Clinic Sports Nutrition",
    sourceUrl: "https://www.mayoclinic.org",
    generalGuideline: "Treinos intervalados de alta intensidade (tiros na pista, subidas de bike) dependem quase que exclusivamente de vias anaeróbias e glicólise rápida. A disponibilidade de glicogênio muscular e a glicose rápida no sangue são os fatores limitantes para atingir a potência prescrita.",
    preWorkout: "Consuma carboidratos de rápida digestão e alto índice glicêmico 30 a 60 minutos antes (ex: banana com mel, geleia de frutas ou biscoito de arroz). Evite gorduras e excesso de fibras.",
    duringWorkout: "Para sessões intensas menores que 60 minutos, bochechos com bebidas ricas em carboidratos podem estimular receptores cerebrais para manter o esforço sem sobrecarregar o estômago.",
    postWorkout: "Consuma carboidratos simples imediatamente após o treino para aproveitar a alta atividade da enzima glicogênio sintase.",
    hydrationTip: "Beba água em pequenos goles frequentes durante o aquecimento e intervalos para evitar a sensação de estômago cheio."
  },
  3: {
    monthName: "Abril",
    title: "Suplementação Estratégica: Cafeína e Nitratos",
    focus: "Otimização da eficiência de oxigênio e modulação da percepção subjetiva de esforço.",
    source: "Gatorade Sports Science Institute (GSSI)",
    sourceUrl: "https://www.gssiweb.org",
    generalGuideline: "A cafeína e o nitrato são dos poucos suplementos esportivos com alto nível de evidência científica A. O nitrato reduz o custo de oxigênio do exercício, enquanto a cafeína atua no sistema nervoso central reduzindo a sensação de fadiga.",
    preWorkout: "Consuma nitrato (ex: 300-500ml de suco de beterraba concentrado) 2 a 3 horas antes de treinos fortes. A cafeína (3 a 6 mg por kg) deve ser ingerida 45 a 60 minutos antes.",
    duringWorkout: "Em treinos muito longos, doses fracionadas de cafeína (ex: géis com cafeína) no terço final da atividade podem dar o estímulo psicológico necessário.",
    postWorkout: "Priorize antioxidantes vindos de alimentos inteiros (ex: frutas vermelhas, uvas escuras) em vez de megadoses sintéticas de Vitamina C/E, para não atenuar as adaptações naturais do treino.",
    hydrationTip: "A cafeína em doses normais não desidrata durante o exercício. Consuma sua dose com água comum."
  },
  4: {
    monthName: "Maio",
    title: "Treinamento Intestinal e Altas Taxas de Carboidratos",
    focus: "Adaptação digestiva para absorver 60g a 90g de carboidratos por hora em provas longas.",
    source: "TrainingPeaks Nutrition Science",
    sourceUrl: "https://www.trainingpeaks.com",
    generalGuideline: "A capacidade do intestino de absorver carboidratos pode ser treinada. Utilizar múltiplos transportadores de glicose (via SGLT1) e frutose (via GLUT5) em uma proporção de 2:1 ou 1:0.8 permite absorver mais de 60g/hora, evitando cãibras estomacais.",
    preWorkout: "Acostume-se a fazer treinos longos alimentado. Treinar repetidamente em jejum atrofia os transportadores intestinais de glicose.",
    duringWorkout: "Em treinos longos (>2,5h), consuma sistematicamente entre 60g e 90g de carboidratos por hora na forma de géis, isotônicos ou palatinose. Pratique essa estratégia semanalmente.",
    postWorkout: "Uma refeição completa com proteínas e carboidratos deve ser consumida logo após sessões de treino intestinal para auxiliar a regeneração intestinal.",
    hydrationTip: "Beba água junto com os géis de carboidrato. Géis concentrados sem água puxam água do sangue para o intestino, causando diarreia."
  },
  5: {
    monthName: "Junho",
    title: "Síntese Proteica e Recuperação Muscular no Outono/Inverno",
    focus: "Manutenção de massa magra, saúde estrutural e balanço de nitrogênio positivo.",
    source: "Mayo Clinic Research",
    sourceUrl: "https://www.mayoclinic.org",
    generalGuideline: "A recuperação muscular ideal depende de um suprimento constante de aminoácidos essenciais. Atletas de endurance necessitam de 1,4g a 2,0g de proteína por kg de peso corporal por dia para reparar os danos induzidos pelas contrações excêntricas e pelo catabolismo das sessões longas.",
    preWorkout: "Uma pequena quantidade de proteína de fácil digestão (ex: BCAA ou whey isolado) pode ser consumida se o jejum prévio for superior a 4 horas.",
    duringWorkout: "Geralmente não é recomendada a ingestão de proteína durante o exercício, mas em ultramaratonas ou treinos superiores a 5 horas, a adição de pequenas quantidades de proteína pode mitigar a quebra muscular.",
    postWorkout: "Consuma entre 20g e 30g de proteína de alta qualidade (rica em leucina, como whey, ovos ou proteína de ervilha) em até 2 horas após o término do treino.",
    hydrationTip: "O consumo de proteínas aumenta a carga renal de solutos. Certifique-se de aumentar a ingestão de água para manter a urina clara."
  },
  6: {
    monthName: "Julho",
    title: "Hidratação Silenciosa em Climas Frios",
    focus: "Combater a redução da percepção de sede sob baixas temperaturas.",
    source: "Gatorade Sports Science Institute (GSSI)",
    sourceUrl: "https://www.gssiweb.org",
    generalGuideline: "No frio, a vasoconstrição periférica desloca mais sangue para o núcleo do corpo, o que inibe a liberação de vasopressina (o hormônio da sede), reduzindo a percepção de sede em até 40%. No entanto, a perda de água via respiração (pelo ar seco e frio) e suor sob camadas de roupa continua alta.",
    preWorkout: "Mantenha o hábito de beber água regularmente nas horas anteriores ao treino, sem depender do sinal fisiológico da sede.",
    duringWorkout: "Use alertas no relógio para beber líquidos a cada 15-20 minutos. Prefira levar bebidas em garrafas térmicas para evitar que a água congele ou fique excessivamente gelada.",
    postWorkout: "Bebidas quentes como chás e sopas ricas em sódio ajudam a reidratar, aquecer o corpo e repor minerais perdidos.",
    hydrationTip: "Bebidas mornas com carboidratos (como chá adoçado) são muito bem aceitas pelo trato digestivo em treinos frios."
  },
  7: {
    monthName: "Agosto",
    title: "Prevenção de Distúrbios Gastrointestinais em Longa Distância",
    focus: "Gerenciamento do fluxo sanguíneo esplâncnico e seleção de alimentos de fácil digestão.",
    source: "TrainingPeaks Guidelines",
    sourceUrl: "https://www.trainingpeaks.com",
    generalGuideline: "Durante o exercício forte, até 80% do fluxo sanguíneo é desviado do estômago para os músculos em trabalho. Alimentos difíceis de digerir ficam parados no trato gastrointestinal, causando náuseas, gases, refluxo ou diarreia.",
    preWorkout: "Evite fibras insolúveis (cereais integrais), alimentos muito gordurosos, alimentos picantes e excesso de frutose nas 12 a 24 horas antes de treinos longos ou provas.",
    duringWorkout: "Prefira fontes de carboidratos com osmolaridade equilibrada. Se o estômago começar a fechar, reduza a intensidade do exercício por 10 a 15 minutos para restaurar o fluxo sanguíneo gástrico.",
    postWorkout: "Consuma alimentos líquidos ou pastosos nas primeiras horas pós-treino se o apetite estiver suprimido ou o estômago estiver irritado.",
    hydrationTip: "Monitore a osmolaridade de suas bebidas isotônicas. Misturas muito concentradas atrasam o esvaziamento gástrico."
  },
  8: {
    monthName: "Setembro",
    title: "Periodização Nutricional Diária (Train Low, Train High)",
    focus: "Alternância estratégica de disponibilidade de carboidratos para sinalização celular adaptativa.",
    source: "Mayo Clinic & GSSI Joint Reviews",
    sourceUrl: "https://www.gssiweb.org",
    generalGuideline: "Nem todo treino deve ser feito com alta carga de carboidratos. A técnica de treinar com baixos estoques de glicogênio (Train Low) em sessões leves potencializa a queima de gordura e a biogênese mitocondrial. Já sessões de alta intensidade devem ser feitas com estoques cheios (Train High) para máxima potência.",
    preWorkout: "Para treinos regenerativos leves ou Z1 (<90 min), realize-os em jejum ou após uma refeição apenas proteica. Para treinos de ritmo ou tiros, consuma carboidratos generosamente antes.",
    duringWorkout: "Nos treinos de 'Train Low', consuma apenas água e eletrólitos. Nos treinos de 'Train High', abasteça-se com 60-90g de carboidratos/hora.",
    postWorkout: "Após um treino 'Train Low', mantenha a ingestão de proteínas e evite pressa para repor carboidratos se o próximo treino for leve.",
    hydrationTip: "Treinos com baixo carboidrato exigem atenção redobrada aos eletrólitos para prevenir cãibras decorrentes da fadiga neuromuscular precoce."
  },
  9: {
    monthName: "Outubro",
    title: "Protocolo Científico de Carbo-Loading (Carga de Glicogênio)",
    focus: "Supercompensar as reservas de glicogênio muscular nas 36-48h que antecedem provas-alvo.",
    source: "Gatorade Sports Science Institute (GSSI)",
    sourceUrl: "https://www.gssiweb.org",
    generalGuideline: "O carbo-loading clássico de uma semana está ultrapassado. Protocolos modernos mostram que 36 a 48 horas de descanso físico associado a uma alta ingestão de carboidratos (8g a 12g por kg de peso corporal por dia) são suficientes para saturar as reservas de glicogênio sem causar ganho excessivo de gordura.",
    preWorkout: "Reduza drasticamente o volume e intensidade dos treinos (polimento). O glicogênio só acumula se o músculo não o estiver gastando.",
    duringWorkout: "Evite treinar nas 36 horas pré-prova. Se fizer um trote leve, consuma carboidratos imediatamente depois.",
    postWorkout: "Escolha carboidratos de fácil digestão, baixo resíduo (baixo teor de fibras) para evitar acúmulo fecal e sensação de peso no dia da prova (ex: arroz branco, macarrão comum, suco de uva, batata).",
    hydrationTip: "Cada grama de glicogênio estocado carrega cerca de 3g de água. É normal ganhar de 1 a 1.5kg durante o loading; este peso é água de hidratação útil para a prova."
  },
  10: {
    monthName: "Novembro",
    title: "Estratégia Nutricional para o Dia da Prova (Race Day)",
    focus: "Cronograma de alimentação horária para manter energia estável e evitar fadiga.",
    source: "TrainingPeaks Practice Guides",
    sourceUrl: "https://www.trainingpeaks.com",
    generalGuideline: "A regra fundamental do dia da prova é: NUNCA experimente nada que não tenha testado exaustivamente nos treinos longos. A alimentação pré-prova deve focar em repor o glicogênio hepático consumido durante o sono e manter a glicemia estável na largada.",
    preWorkout: "Consuma de 1g a 3g de carboidratos por kg de peso corporal 3 a 4 horas antes da largada. Faça uma refeição pobre em gorduras, fibras e proteínas de difícil digestão.",
    duringWorkout: "Inicie o reabastecimento a partir de 20-30 minutos de prova. Siga a meta testada: 60g a 90g de carboidratos por hora, intercalando fontes sólidas, géis e líquidos de acordo com o ritmo.",
    postWorkout: "Consuma 1g/kg de carboidratos e 20-25g de proteínas nos primeiros 30 minutos pós-prova para acelerar o processo inflamatório saudável de reconstrução muscular.",
    hydrationTip: "Beba água junto com todo gel de carboidrato para garantir que a osmolaridade estomacal seja correta e a absorção ocorra rapidamente."
  },
  11: {
    monthName: "Dezembro",
    title: "Off-Season, Transição e Moderação Nutricional",
    focus: "Redução calórica proporcional ao menor volume de treino, controle inflamatório.",
    source: "Mayo Clinic Guidelines",
    sourceUrl: "https://www.mayoclinic.org",
    generalGuideline: "O período de transição ou off-season é fundamental para a recuperação mental e física do atleta. Com a redução drástica no volume de treinos, a ingestão energética diária deve ser ajustada para evitar o ganho excessivo de gordura corporal, sem contudo impor restrições severas que impeçam a cura de pequenas lesões crônicas.",
    preWorkout: "Em treinos de manutenção leves, não há necessidade de suplementos energéticos específicos. Comida comum em pequenas porções é suficiente.",
    duringWorkout: "Água pura é geralmente suficiente para atividades abaixo de 60 a 75 minutos conduzidas em intensidades moderadas.",
    postWorkout: "Aproveite para consumir alimentos frescos, saladas variadas e fontes saudáveis de gordura (azeite, abacate, castanhas) para combater a inflamação sistêmica residual da temporada.",
    hydrationTip: "Mantenha a ingestão básica de água ao longo do dia para apoiar a função renal e a digestão, mesmo sem o estresse térmico dos treinos fortes."
  }
};

export const STRETCHING_DATA: StretchingCategory[] = [
  {
    id: "dynamic",
    title: "Alongamento Dinâmico (Pré-Treino)",
    description: "Movimentos controlados e contínuos indicados para preparar os músculos, aumentar a temperatura corporal e lubrificar as articulações antes da atividade física. Melhora a performance e previne lesões.",
    source: "Harvard Health Publishing & Mayo Clinic",
    sourceUrl: "https://www.health.harvard.edu",
    exercises: [
      {
        id: "d1",
        name: "Balanço de Pernas (Frontal e Lateral)",
        target: "Quadril, Glúteos e Posterior de Coxa",
        duration: "15 a 20 repetições por perna",
        steps: [
          "Apoie-se em uma parede ou poste firme para manter o equilíbrio.",
          "Mantenha a perna de apoio ligeiramente flexionada.",
          "Balance a outra perna suavemente para frente e para trás, aumentando a amplitude progressivamente.",
          "Em seguida, faça o balanço lateral (cruzando na frente do corpo e abrindo para o lado).",
          "Repita o processo com a outra perna."
        ],
        safetyTip: "Não force o movimento além do seu limite natural de amplitude. O balanço deve ser fluido e controlado, sem trancos.",
        imageEmoji: "🦵"
      },
      {
        id: "d2",
        name: "Passada com Torção de Tronco (Walking Lunges)",
        target: "Quadríceps, Flexores do Quadril, Core e Coluna Torácica",
        duration: "10 a 12 passadas no total",
        steps: [
          "Dê um passo largo para a frente com a perna direita e flexione os joelhos até que a coxa direita fique paralela ao chão.",
          "Mantenha o joelho esquerdo alinhado logo acima do calcanhar.",
          "Gire o tronco lentamente para o lado direito (sobre a perna da frente).",
          "Retorne o tronco ao centro, levante-se avançando a perna esquerda e repita o movimento girando para o lado esquerdo."
        ],
        safetyTip: "Evite que o joelho da frente ultrapasse a linha da ponta dos pés para não sobrecarregar a patela.",
        imageEmoji: "🚶‍♂️"
      },
      {
        id: "d3",
        name: "Círculos com os Quadris",
        target: "Articulação Coxofemoral e Lombar",
        duration: "10 círculos para cada lado",
        steps: [
          "Fique em pé, com os pés afastados na largura dos ombros e as mãos apoiadas na cintura.",
          "Realize movimentos circulares amplos com o quadril, como se estivesse usando um bambolê.",
          "Complete as repetições em sentido horário e depois mude para o sentido anti-horário."
        ],
        safetyTip: "Mantenha os joelhos levemente destravados e execute o movimento de forma suave, sem pressa.",
        imageEmoji: "🔄"
      },
      {
        id: "d4",
        name: "Balanço de Braços e Abertura de Peito",
        target: "Peitorais, Ombros e Costas",
        duration: "15 a 20 repetições",
        steps: [
          "Fique em pé com a postura ereta e os pés bem apoiados.",
          "Abra os braços lateralmente na altura dos ombros, alongando o peito.",
          "Em seguida, cruze os braços na frente do corpo de forma rítmica, alternando qual braço fica por cima.",
          "Continue alternando entre abrir e cruzar."
        ],
        safetyTip: "Mantenha os ombros relaxados e longe das orelhas enquanto balança os braços.",
        imageEmoji: "🙆‍♂️"
      }
    ]
  },
  {
    id: "static",
    title: "Alongamento Estático (Pós-Treino)",
    description: "Posições mantidas sem movimento recomendadas para o final do treino, quando os músculos estão quentes. O objetivo é relaxar as fibras musculares, reduzir a tensão acumulada e desenvolver flexibilidade a longo prazo.",
    source: "Mayo Clinic Guide to Stretching",
    sourceUrl: "https://www.mayoclinic.org",
    exercises: [
      {
        id: "s1",
        name: "Alongamento de Panturrilha na Parede",
        target: "Gastrocnêmio e Sóleo (Panturrilhas)",
        duration: "Segurar por 30 a 45 segundos de cada lado",
        steps: [
          "Fique de frente para uma parede a cerca de um passo de distância.",
          "Coloque as duas mãos na parede na altura dos ombros.",
          "Dê um passo para trás com a perna direita, mantendo o calcanhar direito totalmente apoiado no chão e a perna esticada.",
          "Flexione levemente o joelho esquerdo (da frente) e incline o quadril para a frente até sentir o alongamento na panturrilha direita.",
          "Troque as pernas e repita."
        ],
        safetyTip: "Nunca balance durante o alongamento estático. Mantenha a posição firme e respire fundo.",
        imageEmoji: "🦶"
      },
      {
        id: "s2",
        name: "Alongamento de Posterior em Pé (Hamstrings)",
        target: "Isquiotibiais (Posteriores de Coxa)",
        duration: "Segurar por 30 a 45 segundos",
        steps: [
          "Fique em pé com os pés paralelos e próximos.",
          "Flexione levemente os joelhos e incline o tronco para a frente a partir dos quadris.",
          "Deixe a cabeça e os braços pesarem em direção ao chão.",
          "Tente manter as pernas o mais estendidas possível, sem bloquear totalmente os joelhos.",
          "Respire profundamente e relaxe a coluna."
        ],
        safetyTip: "Não force a descida puxando com os braços. Deixe apenas a gravidade agir. Se sentir dor na lombar, flexione mais os joelhos.",
        imageEmoji: "🧘‍♂️"
      },
      {
        id: "s3",
        name: "Alongamento de Quadríceps em Pé",
        target: "Quadríceps (Frente da Coxa)",
        duration: "Segurar por 30 segundos de cada lado",
        steps: [
          "Fique em pé e apoie uma das mãos em uma parede ou objeto firme se necessário.",
          "Flexione o joelho direito para trás e segure o tornozelo direito com a mão direita.",
          "Puxe suavemente o calcanhar em direção ao glúteo, mantendo os joelhos alinhados e próximos um do outro.",
          "Mantenha o tronco ereto e contraia levemente o abdômen.",
          "Repita com a perna esquerda."
        ],
        safetyTip: "Evite inclinar o tronco para a frente ou afastar o joelho dobrado para o lado para não torcer a articulação.",
        imageEmoji: "🧍‍♂️"
      },
      {
        id: "s4",
        name: "Alongamento de Peitoral e Ombros",
        target: "Peitorais e Deltoide Anterior",
        duration: "Segurar por 30 a 45 segundos",
        steps: [
          "Fique em pé com a postura ereta.",
          "Entrelace os dedos das mãos atrás das costas.",
          "Estenda os braços e levante-os suavemente para longe do corpo, abrindo o peito e unindo as escápulas.",
          "Mantenha o olhar apontado para a frente."
        ],
        safetyTip: "Não curve a lombar para trás; o movimento deve vir da abertura dos ombros e do peito.",
        imageEmoji: "👐"
      }
    ]
  },
  {
    id: "running",
    title: "Alongamento Focado em Corrida",
    description: "Série específica para corredores, focando nos grupos musculares que mais sofrem impacto e sobrecarga durante a corrida, como panturrilhas, flexores do quadril e glúteos.",
    source: "Runner's World Injury Prevention & Mayo Clinic",
    sourceUrl: "https://www.mayoclinic.org",
    exercises: [
      {
        id: "r1",
        name: "Alongamento do Flexor do Quadril (Psoas Lunge)",
        target: "Íliopsoas e Reto Femoral",
        duration: "Segurar por 30 a 45 segundos de cada lado",
        steps: [
          "Dê um passo à frente com o pé direito e ajoelhe-se com o joelho esquerdo no chão (use um colchonete para conforto).",
          "Mantenha o pé direito à frente de forma que o joelho direito fique dobrado em 90 graus.",
          "Desloque o peso do quadril suavemente para a frente e para baixo até sentir alongar a frente do quadril esquerdo.",
          "Mantenha as costas eretas e contraia o glúteo esquerdo.",
          "Repita invertendo as pernas."
        ],
        safetyTip: "Não permita que a lombar curve excessivamente para a frente. Mantenha o core ativo para proteger a coluna.",
        imageEmoji: "🧘"
      },
      {
        id: "r2",
        name: "Alongamento da Banda Iliotibial (IT Band)",
        target: "Banda IT e Tensor da Fáscia Lata (Lateral da Coxa)",
        duration: "Segurar por 30 a 45 segundos de cada lado",
        steps: [
          "Fique em pé e cruze a perna esquerda por trás da perna direita.",
          "Incline o tronco suavemente para o lado direito, empurrando o quadril esquerdo para o lado oposto.",
          "Você deve sentir um alongamento ao longo da parte externa da coxa esquerda.",
          "Troque o cruzamento das pernas e incline para o outro lado."
        ],
        safetyTip: "Use uma parede para apoiar a mão se sentir desequilíbrio.",
        imageEmoji: "🧍"
      },
      {
        id: "r3",
        name: "Alongamento de Glúteo Sentado (Figura 4)",
        target: "Glúteos e Rotadores do Quadril (Piriforme)",
        duration: "Segurar por 30 a 45 segundos de cada lado",
        steps: [
          "Sente-se em uma cadeira firme ou no chão com as pernas estendidas.",
          "Dobre a perna direita e apoie o tornozelo direito sobre a coxa esquerda, logo acima do joelho.",
          "Mantenha as costas eretas e incline o tronco lentamente para a frente a partir do quadril.",
          "Pressione suavemente o joelho direito para baixo para intensificar o alongamento no glúteo direito.",
          "Repita com a perna esquerda."
        ],
        safetyTip: "Mantenha a coluna o mais reta possível. Evite curvar as costas (corcunda) para tentar descer mais.",
        imageEmoji: "🪑"
      }
    ]
  },
  {
    id: "cycling",
    title: "Alongamento Focado em Ciclismo",
    description: "Série projetada para aliviar a postura encurtada do ciclista, abrindo o peito, alongando a lombar, pescoço e aliviando a tensão acumulada nos quadríceps e glúteos.",
    source: "Physical Therapy Guidelines for Cyclists",
    sourceUrl: "https://www.health.harvard.edu",
    exercises: [
      {
        id: "c1",
        name: "Alongamento de Lombar e Glúteos (Torção Espinal)",
        target: "Lombar, Eretores da Espinha e Glúteos",
        duration: "Segurar por 40 segundos de cada lado",
        steps: [
          "Deite-se de costas em um colchonete com os joelhos dobrados e pés apoiados no chão.",
          "Abra os braços lateralmente no chão na altura dos ombros, mantendo as palmas para cima.",
          "Deixe os dois joelhos caírem juntos lentamente para o lado esquerdo, tentando mantê-los o mais próximo do chão possível.",
          "Vire a cabeça para olhar em direção à mão direita, mantendo o ombro direito apoiado no chão.",
          "Respire fundo por 40 segundos, volte ao centro e repita para o outro lado."
        ],
        safetyTip: "Se os joelhos não tocarem o chão, coloque uma almofada abaixo deles para apoio. Não force o ombro oposto a sair do chão.",
        imageEmoji: "🛌"
      },
      {
        id: "c2",
        name: "Abertura de Ombros e Peito na Parede",
        target: "Peitoral Maior, Ombros e Coluna Torácica",
        duration: "Segurar por 30 a 45 segundos",
        steps: [
          "Fique de frente para uma parede a dois passos de distância.",
          "Apoie as palmas das mãos na parede um pouco acima da linha da cintura.",
          "Incline o tronco para a frente a partir do quadril, empurrando o peito em direção ao chão e mantendo os braços esticados.",
          "Mantenha as pernas paralelas e joelhos ligeiramente destravados.",
          "Relaxe o pescoço, deixando a cabeça descer entre os braços."
        ],
        safetyTip: "Ajuste a distância para não forçar excessivamente os ombros. O alongamento deve ser confortável nas axilas e peito.",
        imageEmoji: "🧱"
      },
      {
        id: "c3",
        name: "Alongamento de Pescoço e Trapézio",
        target: "Trapézio Superior e Escalenos (Pescoço)",
        duration: "Segurar por 20 a 30 segundos para cada lado",
        steps: [
          "Sente-se com a coluna ereta ou fique em pé.",
          "Coloque a mão direita sobre o lado esquerdo da cabeça.",
          "Incline suavemente a cabeça em direção ao ombro direito, aplicando uma leve pressão com a mão.",
          "Para intensificar, empurre a mão esquerda em direção ao chão.",
          "Mantenha os ombros relaxados e troque o lado."
        ],
        safetyTip: "Seja extremamente delicado com o pescoço. A pressão deve ser sutil e gradual, sem movimentos bruscos.",
        imageEmoji: "🧘‍♂️"
      }
    ]
  }
];
