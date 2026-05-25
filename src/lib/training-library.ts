// Biblioteca de Planilhas de Treinos Periodizados
// EFITNESS - Fisiologia do Exercício Científica

export interface LibraryWorkout {
  day: number; // 1 (Segunda) a 7 (Domingo)
  type: string; // 'Corrida', 'Ciclismo', 'Natacao', 'Forca', 'Descanso', 'Triathlon', 'Ultramaratona', etc.
  title: string;
  desc: string;
  dist: number; // Distância alvo em km
  dur: number; // Duração alvo em segundos
  pace: string; // Pace original (ex: '5:00/km', '2:15/100m', 'N/A') ou velocidade ('30 km/h')
  power: number; // Potência em Watts (0 se n/a)
  tss: number; // Training Stress Score original
}

export interface LibraryPlan {
  id: string;
  name: string;
  author: string;
  source: string;
  sport: string; // 'Corrida', 'Ciclismo', 'Natacao', 'Triathlon', 'Ultramaratona'
  weeks: number;
  level: 'iniciante' | 'intermediario' | 'avancado';
  description: string;
  generateWeeks: (effortPct: number) => LibraryWorkout[][];
}

// ==========================================================
// FUNÇÕES AUXILIARES PARA CALIBRAÇÃO E PARSE DE INTENSIDADE
// ==========================================================

// Converte Pace string 'MM:SS/km' ou 'MM:SS/100m' para segundos
export function parsePaceToSeconds(paceStr: string): number {
  if (!paceStr || paceStr === 'N/A') return 0;
  const clean = paceStr.split('/')[0].trim();
  const parts = clean.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 0;
}

// Converte segundos para string de pace
export function formatSecondsToPace(seconds: number, suffix: string = '/km'): string {
  if (seconds <= 0) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}${suffix}`;
}

// Converte velocidade string 'XX.X km/h' para número
export function parseSpeed(speedStr: string): number {
  if (!speedStr) return 0;
  const match = speedStr.match(/([\d.]+)\s*km\/h/i);
  return match ? parseFloat(match[1]) : 0;
}

// Calibra a intensidade de um treino específico pela regra de 3 (esforço 50% a 100%)
export function calibrateWorkout(workout: LibraryWorkout, effortPct: number): LibraryWorkout {
  const f = effortPct / 100;
  let newPace = workout.pace;
  let newPower = workout.power;
  let newTss = Math.round(workout.tss * f);
  let newDur = workout.dur;

  // 1. Calibrar Pace (Corrida / Natação)
  if (workout.pace && workout.pace !== 'N/A') {
    if (workout.pace.includes('/km')) {
      const origSecs = parsePaceToSeconds(workout.pace);
      if (origSecs > 0) {
        const newSecs = origSecs / f; // Esforço menor = pace maior (mais lento)
        newPace = formatSecondsToPace(newSecs, '/km');
        // Se a distância for fixa e maior que zero, a duração aumenta proporcionalmente
        if (workout.dist > 0) {
          newDur = Math.round(workout.dist * newSecs);
        }
      }
    } else if (workout.pace.includes('/100m')) {
      const origSecs = parsePaceToSeconds(workout.pace);
      if (origSecs > 0) {
        const newSecs = origSecs / f;
        newPace = formatSecondsToPace(newSecs, '/100m');
        // Natação: distância em metros (1km na natação é 1000m, ou seja, 10 pacotes de 100m)
        if (workout.dist > 0) {
          newDur = Math.round((workout.dist * 10) * newSecs);
        }
      }
    } else if (workout.pace.includes('km/h')) {
      // Ciclismo: velocidade diminui com o esforço
      const speed = parseSpeed(workout.pace);
      if (speed > 0) {
        const newSpeed = speed * f;
        newPace = `${newSpeed.toFixed(1)} km/h`;
        // Se a distância for fixa, a duração aumenta
        if (workout.dist > 0 && newSpeed > 0) {
          newDur = Math.round((workout.dist / newSpeed) * 3600);
        }
      }
    }
  }

  // 2. Calibrar Potência (Ciclismo)
  if (workout.power > 0) {
    newPower = Math.round(workout.power * f);
  }

  return {
    ...workout,
    pace: newPace,
    power: newPower,
    tss: Math.max(newTss, workout.tss > 0 ? 5 : 0), // Evitar zerar TSS de treinos ativos
    dur: newDur
  };
}

// ==========================================================
// ALGORITMO INTELIGENTE DE CORTE DE SEMANAS
// ==========================================================
export function getWeeksAfterCut<T>(
  originalWeeks: T[],
  weeksTarget: number,
  choice: 'inicial' | 'polimento' | 'ambos' | 'none'
): T[] {
  const N = originalWeeks.length;
  if (weeksTarget >= N || choice === 'none') {
    return originalWeeks;
  }

  const diff = N - weeksTarget;
  if (diff <= 0) return originalWeeks;

  if (choice === 'inicial') {
    // Corta as primeiras 'diff' semanas (Base)
    return originalWeeks.slice(diff);
  } 
  
  if (choice === 'polimento') {
    // A última semana (Prova) deve ser mantida. Cortamos as semanas anteriores a ela (Polimento)
    const init = originalWeeks.slice(0, weeksTarget - 1);
    const last = originalWeeks[N - 1];
    return [...init, last];
  } 
  
  if (choice === 'ambos') {
    // Corta metade no início e metade no polimento
    const cutInit = Math.floor(diff / 2);
    const cutEnd = diff - cutInit;
    
    // Início: fatiar a partir de cutInit
    const afterInit = originalWeeks.slice(cutInit);
    // Polimento: fatiar antes da última semana
    const polimentLength = afterInit.length - 1;
    const keptPoliment = polimentLength - cutEnd;
    
    const initPart = afterInit.slice(0, keptPoliment);
    const lastPart = afterInit[afterInit.length - 1];
    
    return [...initPart, lastPart];
  }

  return originalWeeks;
}

// ==========================================================
// CONSTRUÇÃO E REGISTRO DA BIBLIOTECA DE PLANILHAS
// ==========================================================

export const TRAINING_LIBRARY: Record<string, LibraryPlan> = {
  // CORRIDA
  'run_hal_higdon_10k': {
    id: 'run_hal_higdon_10k',
    name: 'Planilha de Corrida: 10K Intermediário',
    author: 'Hal Higdon',
    source: 'Hal Higdon\'s Training Programs (halhigdon.com)',
    sport: 'Corrida',
    weeks: 8,
    level: 'intermediario',
    description: 'Foco no ganho de resistência aeróbica linear e ritmo de limiar. Ideal para bater o recorde pessoal nos 10km.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 8; w++) {
        const isTaper = w === 7;
        const isRaceWeek = w === 8;
        const volumeFactor = isRaceWeek ? 0.5 : isTaper ? 0.75 : 0.8 + (w * 0.05);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Recuperação Ativa', desc: 'Descanso fisiológico completo para supercompensação.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Corrida', title: `Trote Leve Z2 (Fase ${w <= 4 ? 'Base' : 'Pico'})`, desc: 'Corrida confortável conversacional, focado em postura.', dist: parseFloat((5 * volumeFactor).toFixed(1)), dur: Math.round(5 * volumeFactor * 360), pace: '6:00/km', power: 0, tss: Math.round(30 * volumeFactor) },
          { day: 3, type: 'Corrida', title: isRaceWeek ? 'Tiro Leve Pré-Prova' : `Treino de Tiros / Ritmo Z4`, desc: isRaceWeek ? 'Tiros leves de 200m para ativação neuromuscular.' : 'Principal: 5x 400m fortes com 1:30 de trote de recuperação.', dist: isRaceWeek ? 3 : parseFloat((6 * volumeFactor).toFixed(1)), dur: isRaceWeek ? 1080 : Math.round(6 * volumeFactor * 330), pace: isRaceWeek ? '6:00/km' : '5:30/km', power: 0, tss: Math.round(45 * volumeFactor) },
          { day: 4, type: 'Corrida', title: `Corrida de Ritmo (Tempo Run Z3)`, desc: 'Treino de ritmo constante. Mantenha esforço controlado forte.', dist: parseFloat((4 * volumeFactor).toFixed(1)), dur: Math.round(4 * volumeFactor * 345), pace: '5:45/km', power: 0, tss: Math.round(35 * volumeFactor) },
          { day: 5, type: 'Descanso', title: 'Descanso', desc: 'Dia livre para alongamento e repouso.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote de Ativação' : `Longão de Fim de Semana Z2`, desc: isRaceWeek ? 'Trote bem curto para soltar a musculatura.' : `Corrida longa aeróbia. Ritmo confortável e contínuo.`, dist: isRaceWeek ? 2 : parseFloat((8 + w).toFixed(1)), dur: isRaceWeek ? 720 : Math.round((8 + w) * 360), pace: '6:00/km', power: 0, tss: Math.round(50 + (w * 5)) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO 10K 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'Chegou o dia! Concentre-se e execute a prova nos 10km no seu melhor ritmo!' : 'Aproveite o domingo para relaxar e se recuperar.', dist: isRaceWeek ? 10 : 0, dur: isRaceWeek ? 3300 : 0, pace: isRaceWeek ? '5:30/km' : 'N/A', power: 0, tss: isRaceWeek ? 85 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'run_jack_daniels_marathon': {
    id: 'run_jack_daniels_marathon',
    name: 'Planilha de Maratona: Fórmula de Daniels 2Q',
    author: 'Jack Daniels',
    source: 'Livro "Daniels\' Running Formula"',
    sport: 'Corrida',
    weeks: 12,
    level: 'avancado',
    description: 'Fórmula científica baseada em VDOT com duas sessões de qualidade por semana (Q1 e Q2). Prescrição exata de Limiar e Ritmo de Maratona.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 12; w++) {
        const isTaper = w >= 10 && w < 12;
        const isRaceWeek = w === 12;
        const volFact = isRaceWeek ? 0.45 : isTaper ? 0.70 : 0.9 + (w * 0.02);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Descanso', desc: 'Recuperação fisiológica total pós-qualidade.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Corrida', title: 'Sessão Q1: Repetições de Ritmo de Limiar (T-Pace)', desc: 'Principal: 3x 2km em ritmo de limiar aeróbico com 2 min de trote entre eles.', dist: parseFloat((10 * volFact).toFixed(1)), dur: Math.round(10 * volFact * 300), pace: '5:00/km', power: 0, tss: Math.round(75 * volFact) },
          { day: 3, type: 'Corrida', title: 'Corrida de Rodagem Leve (E-Pace)', desc: 'Trote regenerativo em Zona 2 para restabelecer fluxo sanguíneo.', dist: parseFloat((8 * volFact).toFixed(1)), dur: Math.round(8 * volFact * 345), pace: '5:45/km', power: 0, tss: Math.round(40 * volFact) },
          { day: 4, type: 'Forca', title: 'Fortalecimento Específico', desc: 'Foco em estabilidade de quadril, panturrilhas e core.', dist: 0, dur: 1800, pace: 'N/A', power: 0, tss: 15 },
          { day: 5, type: 'Corrida', title: 'Corrida Regenerativa super leve', desc: 'Trote muito fácil de soltura mecânica.', dist: parseFloat((6 * volFact).toFixed(1)), dur: Math.round(6 * volFact * 360), pace: '6:00/km', power: 0, tss: Math.round(25 * volFact) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote Curto Pré-Prova' : 'Sessão Q2: Longão com Ritmo de Maratona (M-Pace)', desc: isRaceWeek ? 'Trote rápido de véspera.' : `Principal: Corrida contínua acumulando volume aeróbico severo.`, dist: isRaceWeek ? 4 : parseFloat((14 + w).toFixed(1)), dur: isRaceWeek ? 1440 : Math.round((14 + w) * 320), pace: isRaceWeek ? '6:00/km' : '5:20/km', power: 0, tss: Math.round(90 + (w * 6)) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO: MARATONA (42.2K) 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'O dia da glória! Administre seu ritmo de maratona (M-pace) e complete a prova!' : 'Recupere-se e alimente-se bem para a próxima semana.', dist: isRaceWeek ? 42.2 : 0, dur: isRaceWeek ? 14400 : 0, pace: isRaceWeek ? '5:40/km' : 'N/A', power: 0, tss: isRaceWeek ? 320 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },

  // CICLISMO
  'bike_joe_friel_gran_fondo': {
    id: 'bike_joe_friel_gran_fondo',
    name: 'Planilha de Ciclismo: Gran Fondo 100 Milhas',
    author: 'Joe Friel',
    source: 'Livro "The Cyclist\'s Training Bible"',
    sport: 'Ciclismo',
    weeks: 12,
    level: 'intermediario',
    description: 'Planilha focada no aumento do limiar de lactato e volume de endurance na bicicleta. Estruturada em mesociclos clássicos de Joe Friel.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 12; w++) {
        const isTaper = w >= 10 && w < 12;
        const isRaceWeek = w === 12;
        const factor = isRaceWeek ? 0.45 : isTaper ? 0.70 : 0.85 + (w * 0.02);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Descanso', desc: 'Repouso total para as pernas.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Ciclismo', title: 'Treino de Cadência e Giro Leve Z2', desc: 'Giro ágil com cadência entre 90-100 rpm para eficiência mecânica.', dist: parseFloat((25 * factor).toFixed(1)), dur: Math.round(25 * factor * 130), pace: '28 km/h', power: 140, tss: Math.round(35 * factor) },
          { day: 3, type: 'Ciclismo', title: 'Intervalado de Subida (Força de Torque Z4)', desc: 'Principal: 3x 5 min em subida com cadência baixa (55-65 rpm) forçando potência.', dist: parseFloat((30 * factor).toFixed(1)), dur: Math.round(30 * factor * 125), pace: '29 km/h', power: 185, tss: Math.round(65 * factor) },
          { day: 4, type: 'Forca', title: 'Fortalecimento de Membros Inferiores', desc: 'Agachamentos excêntricos, pranchas e mobilidade.', dist: 0, dur: 2400, pace: 'N/A', power: 0, tss: 15 },
          { day: 5, type: 'Ciclismo', title: 'Giro Regenerativo Ativo Z1', desc: 'Pedal de soltura total em asfalto plano e cadência confortável.', dist: parseFloat((20 * factor).toFixed(1)), dur: Math.round(20 * factor * 144), pace: '25 km/h', power: 110, tss: Math.round(20 * factor) },
          { day: 6, type: 'Ciclismo', title: isRaceWeek ? 'Giro de Véspera' : 'Pedal Longo de Fim de Semana (Endurance Z2)', desc: isRaceWeek ? 'Giro curto para manter tônus muscular.' : 'Acumulando resistência aeróbica e testando nutrição de prova.', dist: isRaceWeek ? 15 : parseFloat((50 + w * 5).toFixed(1)), dur: isRaceWeek ? 2000 : Math.round((50 + w * 5) * 120), pace: '30 km/h', power: 155, tss: Math.round(100 + (w * 10)) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO: GRAN FONDO (160K) 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'A grande prova de endurance! Hidrate-se e distribua o esforço uniformemente.' : 'Recuperação semanal.', dist: isRaceWeek ? 160 : 0, dur: isRaceWeek ? 19800 : 0, pace: isRaceWeek ? '29.1 km/h' : 'N/A', power: isRaceWeek ? 165 : 0, tss: isRaceWeek ? 280 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'bike_hunter_allen_base': {
    id: 'bike_hunter_allen_base',
    name: 'Planilha de Ciclismo: Base Aeróbica com Potência',
    author: 'Hunter Allen',
    source: 'Peaks Coaching Group (peakscoachinggroup.com)',
    sport: 'Ciclismo',
    weeks: 6,
    level: 'avancado',
    description: 'Periodização científica baseada no FTP (Potência) para aumento do limiar de potência (FTP) e capacidade mitocondrial. Ideal para quem usa medidor de potência.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 6; w++) {
        const isTaper = w === 5;
        const isRaceWeek = w === 6;
        const factor = isRaceWeek ? 0.5 : isTaper ? 0.75 : 0.85 + (w * 0.04);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Descanso', desc: 'Repouso total pós-longo do final de semana.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Ciclismo', title: 'Sweet Spot Training (SST Z3.5)', desc: 'Principal: 2x 15 min a 90% do FTP. Carga de estresse aeróbico de alta eficiência.', dist: parseFloat((35 * factor).toFixed(1)), dur: Math.round(35 * factor * 115), pace: '31 km/h', power: 210, tss: Math.round(80 * factor) },
          { day: 3, type: 'Ciclismo', title: 'Intervalos de Vo2 Máx (Z5)', desc: 'Principal: 5x 3 min a 115% do FTP com 3 min de recuperação.', dist: parseFloat((30 * factor).toFixed(1)), dur: Math.round(30 * factor * 120), pace: '30 km/h', power: 245, tss: Math.round(90 * factor) },
          { day: 4, type: 'Ciclismo', title: 'Giro Regenerativo Ativo Z1', desc: 'Giro super leve na bike de contrarrelógio ou estrada para soltura.', dist: parseFloat((20 * factor).toFixed(1)), dur: Math.round(20 * factor * 144), pace: '25 km/h', power: 110, tss: Math.round(20 * factor) },
          { day: 5, type: 'Forca', title: 'Fortalecimento & Core Estabilidade', desc: 'Treino de core e força funcional.', dist: 0, dur: 1800, pace: 'N/A', power: 0, tss: 10 },
          { day: 6, type: 'Ciclismo', title: isRaceWeek ? 'Giro Ativação' : 'Pedal Longo com Potência Aeróbia (Tempo Z3)', desc: isRaceWeek ? 'Giro leve pré-prova.' : `Principal: Rodagem com blocos longos em Zona 3 (Tempo).`, dist: isRaceWeek ? 20 : parseFloat((60 + w * 6).toFixed(1)), dur: isRaceWeek ? 2400 : Math.round((60 + w * 6) * 110), pace: '32 km/h', power: 190, tss: Math.round(110 + (w * 12)) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO / DESAFIO DE CICLISMO 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'Dia do seu objetivo de ciclismo. Mande ver na potência calibrada!' : 'Recupere-se para a próxima semana.', dist: isRaceWeek ? 100 : 0, dur: isRaceWeek ? 11500 : 0, pace: isRaceWeek ? '31.3 km/h' : 'N/A', power: isRaceWeek ? 200 : 0, tss: isRaceWeek ? 210 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },

  // NATAÇÃO
  'swim_terry_laughlin_1500m': {
    id: 'swim_terry_laughlin_1500m',
    name: 'Planilha de Natação: Eficiência Total 1500m',
    author: 'Terry Laughlin',
    source: 'Método Total Immersion (totalimmersion.net)',
    sport: 'Natacao',
    weeks: 8,
    level: 'intermediario',
    description: 'Foco na diminuição do arrasto hidrodinâmico, deslize prolongado e técnica crawl perfeita. Ideal para nadar 1500m com baixo gasto energético.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 8; w++) {
        const factor = 0.8 + (w * 0.04);
        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Natacao', title: 'Técnica e Educativos de Deslize', desc: 'Principal: 8x 50m focando no menor número de braçadas possível (SPL).', dist: parseFloat((1.2 * factor).toFixed(1)), dur: Math.round(1.2 * factor * 1400), pace: '2:20/100m', power: 0, tss: Math.round(25 * factor) },
          { day: 2, type: 'Descanso', title: 'Descanso', desc: 'Recuperação muscular dos ombros.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 3, type: 'Natacao', title: 'Série de Ritmo e Eficiência de Braçada', desc: 'Principal: 6x 100m constante mantendo a técnica do rolamento do tronco.', dist: parseFloat((1.5 * factor).toFixed(1)), dur: Math.round(1.5 * factor * 1350), pace: '2:15/100m', power: 0, tss: Math.round(35 * factor) },
          { day: 4, type: 'Descanso', title: 'Descanso', desc: 'Alongamento leve e mobilidade de ombros.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 5, type: 'Natacao', title: 'Endurance Aeróbia Aquática', desc: 'Principal: 3x 300m contínuos com palmar e foco na pegada alta na água.', dist: parseFloat((1.8 * factor).toFixed(1)), dur: Math.round(1.8 * factor * 1300), pace: '2:10/100m', power: 0, tss: Math.round(45 * factor) },
          { day: 6, type: 'Descanso', title: 'Descanso', desc: 'Repouso de fim de semana.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 7, type: 'Natacao', title: w === 8 ? '🎯 DESAFIO 1500M CONTÍNUO 🏁' : 'Treino Longo de Piscina', desc: w === 8 ? 'Nade os 1500m contínuos aplicando a técnica de deslize.' : 'Nadada contínua longa confortável.', dist: w === 8 ? 1.5 : parseFloat((2.0 * factor).toFixed(1)), dur: w === 8 ? 2000 : Math.round((2.0 * factor) * 1320), pace: w === 8 ? '2:13/100m' : '2:12/100m', power: 0, tss: w === 8 ? 55 : Math.round(50 * factor) }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'swim_dan_daly_openwater': {
    id: 'swim_dan_daly_openwater',
    name: 'Planilha de Natação: Velocidade e Limiar em Águas Abertas',
    author: 'Dan Daly',
    source: 'Daly Method Coaching (dandaly.com)',
    sport: 'Natacao',
    weeks: 6,
    level: 'avancado',
    description: 'Treinamento de limiar anaeróbico aplicado à natação em águas abertas, com treinos intervalados de alta intensidade e ritmos de prova competitivos.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 6; w++) {
        const factor = 0.85 + (w * 0.03);
        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Natacao', title: 'Intervalado de Limiar (T-Pace)', desc: 'Principal: 10x 100m no ritmo de limiar aeróbico com 15s de descanso.', dist: parseFloat((2.0 * factor).toFixed(1)), dur: Math.round(2.0 * factor * 1150), pace: '1:55/100m', power: 0, tss: Math.round(55 * factor) },
          { day: 2, type: 'Descanso', title: 'Descanso', desc: 'Foco no relaxamento dos ombros.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 3, type: 'Natacao', title: 'Série de Velocidade Crítica (CSS)', desc: 'Principal: 4x 200m forte com foco na puxada e pernada consistente.', dist: parseFloat((2.2 * factor).toFixed(1)), dur: Math.round(2.2 * factor * 1100), pace: '1:50/100m', power: 0, tss: Math.round(65 * factor) },
          { day: 4, type: 'Descanso', title: 'Descanso', desc: 'Dia livre para recuperação.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 5, type: 'Natacao', title: 'Endurance em Águas Abertas (Simulado)', desc: 'Principal: Séries longas de 400m respirando a cada 3 braçadas para simular águas abertas.', dist: parseFloat((2.5 * factor).toFixed(1)), dur: Math.round(2.5 * factor * 1200), pace: '2:00/100m', power: 0, tss: Math.round(60 * factor) },
          { day: 6, type: 'Descanso', title: 'Descanso', desc: 'Descanso de fim de semana.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 7, type: 'Natacao', title: w === 6 ? '🎯 SIMULADO DE ÁGUAS ABERTAS 3000M 🏁' : 'Nadada Contínua Longa', desc: w === 6 ? 'Desafio de 3000m simulados contínuos em ritmo aeróbico estável.' : 'Série de endurance contínua longa.', dist: w === 6 ? 3.0 : parseFloat((2.8 * factor).toFixed(1)), dur: w === 6 ? 3600 : Math.round((2.8 * factor) * 1200), pace: w === 6 ? '2:00/100m' : '2:00/100m', power: 0, tss: w === 6 ? 90 : Math.round(75 * factor) }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },

  // TRIATHLON
  'tri_joe_friel_olympic': {
    id: 'tri_joe_friel_olympic',
    name: 'Planilha de Triathlon: Olímpico - Fase de Pico',
    author: 'Joe Friel',
    source: 'Livro "The Triathlete\'s Training Bible"',
    sport: 'Triathlon',
    weeks: 8,
    level: 'intermediario',
    description: 'Planilha periodizada de pico focando nas transições e ritmos competitivos do triathlon olímpico (1.5k natação, 40k bike, 10k corrida).',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 8; w++) {
        const isRaceWeek = w === 8;
        const isTaper = w === 7;
        const f = isRaceWeek ? 0.5 : isTaper ? 0.75 : 0.85 + (w * 0.03);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Natacao', title: 'Natação Técnica e Ritmo', desc: 'Principal: 10x 100m progressivo focando em braçada fluida.', dist: parseFloat((1.5 * f).toFixed(1)), dur: Math.round(1.5 * f * 1320), pace: '2:12/100m', power: 0, tss: Math.round(30 * f) },
          { day: 2, type: 'Ciclismo', title: 'Giro de Ritmo Z3 / Transição', desc: 'Pedal estável em ritmo moderado para adaptação metabólica.', dist: parseFloat((30 * f).toFixed(1)), dur: Math.round(30 * f * 120), pace: '30 km/h', power: 160, tss: Math.round(55 * f) },
          { day: 2, type: 'Corrida', title: 'Corrida de Transição T1', desc: 'Trote curto logo após a bike para simular a sensação da transição.', dist: parseFloat((3 * f).toFixed(1)), dur: Math.round(3 * f * 345), pace: '5:45/km', power: 0, tss: Math.round(20 * f) },
          { day: 3, type: 'Descanso', title: 'Descanso', desc: 'Recuperação fisiológica total.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 4, type: 'Ciclismo', title: 'Tiros de Limiar Sweet Spot', desc: 'Principal: 2x 15 min no Sweet Spot com cadência em 90 rpm.', dist: parseFloat((35 * f).toFixed(1)), dur: Math.round(35 * f * 115), pace: '31 km/h', power: 175, tss: Math.round(70 * f) },
          { day: 4, type: 'Corrida', title: 'Trote Regenerativo Z1', desc: 'Trote bem fácil em grama ou pista para soltura das articulações.', dist: parseFloat((4 * f).toFixed(1)), dur: Math.round(4 * f * 360), pace: '6:00/km', power: 0, tss: Math.round(20 * f) },
          { day: 5, type: 'Natacao', title: 'Natação de Endurance Z2', desc: 'Série de natação de volume aeróbico contínuo.', dist: parseFloat((2.0 * f).toFixed(1)), dur: Math.round(2.0 * f * 1320), pace: '2:12/100m', power: 0, tss: Math.round(40 * f) },
          { day: 6, type: 'Ciclismo', title: isRaceWeek ? 'Giro Ativação' : 'Pedal de Sábado + Corrida de Transição (T2)', desc: isRaceWeek ? 'Pedal curto.' : 'Treino clássico de Brick (Bike + Corrida imediata).', dist: isRaceWeek ? 15 : parseFloat((45 * f).toFixed(1)), dur: isRaceWeek ? 1800 : Math.round(45 * f * 120), pace: '30 km/h', power: 165, tss: Math.round(80 * f) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote Curto' : 'Corrida de Transição T2', desc: isRaceWeek ? 'Trote rápido.' : 'Corra imediatamente após descer da bicicleta.', dist: isRaceWeek ? 2 : parseFloat((4 * f).toFixed(1)), dur: isRaceWeek ? 660 : Math.round(4 * f * 330), pace: '5:30/km', power: 0, tss: Math.round(30 * f) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO: TRIATHLON OLÍMPICO 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'Dia de conquistar o seu objetivo! Faça a transição com calma e foco!' : 'Repouso total para começar a próxima semana com força.', dist: isRaceWeek ? 51.5 : 0, dur: isRaceWeek ? 9500 : 0, pace: isRaceWeek ? 'N/A' : 'N/A', power: 0, tss: isRaceWeek ? 180 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'tri_matt_fitzgerald_703': {
    id: 'tri_matt_fitzgerald_703',
    name: 'Planilha de Triathlon: Meio Ironman (70.3) - Método 80/20',
    author: 'Matt Fitzgerald',
    source: 'Livro "80/20 Triathlon" (8020endurance.com)',
    sport: 'Triathlon',
    weeks: 12,
    level: 'avancado',
    description: 'Metodologia científica 80/20: 80% do volume semanal em baixa intensidade (Zona 1 e 2) e 20% em alta (Zonas 3, 4 e 5). Otimização da endurance para o 70.3.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 12; w++) {
        const isRaceWeek = w === 12;
        const isTaper = w >= 10 && w < 12;
        const f = isRaceWeek ? 0.45 : isTaper ? 0.70 : 0.80 + (w * 0.02);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Natacao', title: 'Natação 80/20: Limiar e Intervalado', desc: 'Principal: 6x 200m com 150m Z2 + 50m Z4 para ganho de ritmo.', dist: parseFloat((2.0 * f).toFixed(1)), dur: Math.round(2.0 * f * 1200), pace: '2:00/100m', power: 0, tss: Math.round(45 * f) },
          { day: 2, type: 'Ciclismo', title: 'Ciclismo 80/20: Giro Aeróbico Z2', desc: 'Pedal confortável contínuo mantendo frequência cardíaca controlada.', dist: parseFloat((40 * f).toFixed(1)), dur: Math.round(40 * f * 120), pace: '30 km/h', power: 170, tss: Math.round(75 * f) },
          { day: 3, type: 'Corrida', title: 'Corrida 80/20: Intervalado VO2 Máx Z5', desc: 'Principal: 5x 800m forte com 2 min de caminhada de recuperação.', dist: parseFloat((8 * f).toFixed(1)), dur: Math.round(8 * f * 300), pace: '5:00/km', power: 0, tss: Math.round(65 * f) },
          { day: 4, type: 'Forca', title: 'Fortalecimento Geral de Pernas & Core', desc: 'Exercícios multiarticulares funcionais e de força.', dist: 0, dur: 2400, pace: 'N/A', power: 0, tss: 15 },
          { day: 5, type: 'Natacao', title: 'Natação 80/20: Soltura e Técnica Z1', desc: 'Nado muito leve focado em educativos de técnicacrawl.', dist: parseFloat((1.5 * f).toFixed(1)), dur: Math.round(1.5 * f * 1350), pace: '2:15/100m', power: 0, tss: Math.round(25 * f) },
          { day: 6, type: 'Ciclismo', title: isRaceWeek ? 'Giro de Véspera' : 'Ciclismo 80/20: Pedal Longão + Transição T2', desc: isRaceWeek ? 'Giro leve.' : 'Principal: Longão aeróbio seguido de Brick de corrida.', dist: isRaceWeek ? 20 : parseFloat((70 + w * 3).toFixed(1)), dur: isRaceWeek ? 2400 : Math.round((70 + w * 3) * 115), pace: '31.3 km/h', power: 185, tss: Math.round(130 + (w * 8)) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote' : 'Corrida Transição Brick Z2', desc: isRaceWeek ? 'Soltura.' : 'Corrida imediata após a bike.', dist: isRaceWeek ? 2 : parseFloat((6 * f).toFixed(1)), dur: isRaceWeek ? 660 : Math.round(6 * f * 330), pace: '5:30/km', power: 0, tss: Math.round(45 * f) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO: IRONMAN 70.3 (113K) 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'Seu grande desafio: 1.9k nado, 90k bike, 21.1k corrida. Controle a alimentação e vá firme!' : 'Recupere-se e comemore a semana concluída.', dist: isRaceWeek ? 113 : 0, dur: isRaceWeek ? 18000 : 0, pace: 'N/A', power: 0, tss: isRaceWeek ? 290 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },

  // ULTRAMARATONA
  'ultra_krissy_moehl_50m': {
    id: 'ultra_krissy_moehl_50m',
    name: 'Planilha de Ultramaratona: 50 Milhas (80K)',
    author: 'Krissy Moehl',
    source: 'Livro "Running Your First Ultra" (krissymoehl.com)',
    sport: 'Ultramaratona',
    weeks: 16,
    level: 'avancado',
    description: 'Volume acumulado severo de corrida em trilha com treinos longos em dias consecutivos (Back-to-Back) aos sábados e domingos para ensinar o corpo a correr sob severa fadiga muscular.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 16; w++) {
        const isRaceWeek = w === 16;
        const isTaper = w >= 13 && w < 16;
        const f = isRaceWeek ? 0.40 : isTaper ? 0.65 : 0.75 + (w * 0.015);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Descanso Fisiológico', desc: 'Descanso absoluto após o bloco consecutivo de fim de semana.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Corrida', title: 'Trote Leve Z2 / Fortalecimento', desc: 'Corrida confortável em trilha leve ou estrada de terra.', dist: parseFloat((8 * f).toFixed(1)), dur: Math.round(8 * f * 360), pace: '6:00/km', power: 0, tss: Math.round(40 * f) },
          { day: 3, type: 'Corrida', title: 'Subidas Fortes Z4 (Hill Repeats)', desc: 'Principal: 6x 400m de subida íngreme com descida confortável de trote.', dist: parseFloat((10 * f).toFixed(1)), dur: Math.round(10 * f * 345), pace: '5:45/km', power: 0, tss: Math.round(75 * f) },
          { day: 4, type: 'Forca', title: 'Fortalecimento e Mobilidade Específica', desc: 'Foco excêntrico de quadríceps, panturrilhas e core para aguentar descidas.', dist: 0, dur: 2700, pace: 'N/A', power: 0, tss: 20 },
          { day: 5, type: 'Corrida', title: 'Corrida de Soltura Z1', desc: 'Corrida muito leve para restabelecimento muscular.', dist: parseFloat((6 * f).toFixed(1)), dur: Math.round(6 * f * 390), pace: '6:30/km', power: 0, tss: Math.round(25 * f) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote Véspera' : 'Longo 1: Bloco Consecutivo de Sábado', desc: isRaceWeek ? 'Curto.' : 'Primeiro dia do treino longo consecutivo, focado em rodagem de endurance.', dist: isRaceWeek ? 5 : parseFloat((20 + w).toFixed(1)), dur: isRaceWeek ? 1800 : Math.round((20 + w) * 360), pace: '6:00/km', power: 0, tss: Math.round(110 + w * 5) },
          { day: 7, type: 'Corrida', title: isRaceWeek ? '🎯 PROVA ALVO: 50 MILHAS (80K) 🏁' : 'Longo 2: Bloco Consecutivo de Domingo', desc: isRaceWeek ? 'O grande desafio em trilha! Corra com paciência, ande subidas íngremes e hidrate-se!' : 'Segundo dia do longo consecutivo. Correndo com pernas fadigadas para simular o final da prova.', dist: isRaceWeek ? 80 : parseFloat((12 + w * 0.8).toFixed(1)), dur: isRaceWeek ? 32400 : Math.round((12 + w * 0.8) * 390), pace: isRaceWeek ? '6:45/km' : '6:30/km', power: 0, tss: isRaceWeek ? 450 : Math.round(80 + w * 4) }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'ultra_hal_koerner_100k': {
    id: 'ultra_hal_koerner_100k',
    name: 'Planilha de Ultramaratona: 100K Trail Run',
    author: 'Hal Koerner',
    source: 'Livro "Hal Koerner\'s Field Guide to Ultrarunning"',
    sport: 'Ultramaratona',
    weeks: 16,
    level: 'avancado',
    description: 'Treinamento de ultra-distância focado em desnível acumulado, corridas longas em trilha extrema e estratégias nutricionais/psicológicas para completar 100km.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 16; w++) {
        const isRaceWeek = w === 16;
        const isTaper = w >= 13 && w < 16;
        const f = isRaceWeek ? 0.35 : isTaper ? 0.60 : 0.70 + (w * 0.018);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Descanso Fisiológico', desc: 'Descanso total pós-bloco de fim de semana.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Corrida', title: 'Trote Regenerativo Z1/Z2', desc: 'Trote leve com sensação de pernas pesadas.', dist: parseFloat((10 * f).toFixed(1)), dur: Math.round(10 * f * 390), pace: '6:30/km', power: 0, tss: Math.round(45 * f) },
          { day: 3, type: 'Corrida', title: 'Treino de Ritmo e Limiar Z3/Z4', desc: 'Principal: 3x 3km no ritmo de limiar aeróbico com 3 min de caminhada ativa.', dist: parseFloat((12 * f).toFixed(1)), dur: Math.round(12 * f * 330), pace: '5:30/km', power: 0, tss: Math.round(85 * f) },
          { day: 4, type: 'Forca', title: 'Fortalecimento de Pistas & Core', desc: 'Foco excêntrico e pliometria para fortalecimento muscular na trilha.', dist: 0, dur: 2700, pace: 'N/A', power: 0, tss: 20 },
          { day: 5, type: 'Corrida', title: 'Trote Curto de Soltura Z1', desc: 'Corrida super leve conversacional.', dist: parseFloat((8 * f).toFixed(1)), dur: Math.round(8 * f * 390), pace: '6:30/km', power: 0, tss: Math.round(30 * f) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote Curto' : 'Longo Consecutivo 1 (Trilha de Montanha)', desc: isRaceWeek ? 'Trote leve.' : 'Primeiro dia do longo de fim de semana em montanha técnica com mochila de hidratação.', dist: isRaceWeek ? 5 : parseFloat((25 + w * 1.2).toFixed(1)), dur: isRaceWeek ? 2000 : Math.round((25 + w * 1.2) * 400), pace: '6:40/km', power: 0, tss: Math.round(130 + w * 6) },
          { day: 7, type: 'Corrida', title: isRaceWeek ? '🎯 PROVA ALVO: 100K TRAIL RUN 🏁' : 'Longo Consecutivo 2 (Endurance Trilha)', desc: isRaceWeek ? 'Chegou a hora de encarar os 100km! Use sua estratégia de hidratação e alimentação a cada 40 minutos!' : 'Segundo dia consecutivo de longo em trilha. Corra de forma leve e caminhe subidas.', dist: isRaceWeek ? 100 : parseFloat((15 + w).toFixed(1)), dur: isRaceWeek ? 43200 : Math.round((15 + w) * 400), pace: isRaceWeek ? '7:12/km' : '6:40/km', power: 0, tss: isRaceWeek ? 550 : Math.round(95 + w * 5) }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'run_couch_to_5k': {
    id: 'run_couch_to_5k',
    name: 'Planilha de Corrida: Do Sofá aos 5K',
    author: 'CoolRunning',
    source: 'Couch to 5K (c25k.com)',
    sport: 'Corrida',
    weeks: 8,
    level: 'iniciante',
    description: 'Desenvolvida para iniciantes saírem do sedentarismo de forma segura. Alterna intervalos de caminhada e trote leve para construir a base aeróbica.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 8; w++) {
        const totalDist = parseFloat((2 + w * 0.3).toFixed(1));
        const totalDur = Math.round((20 + w * 2.5) * 60);
        const isRaceWeek = w === 8;

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Recuperação Ativa', desc: 'Descanso fisiológico ou caminhada leve.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Corrida', title: `Trote e Caminhada (Microciclo ${w})`, desc: 'Principal: Aquecimento de 5 min caminhada. Repita intervalos de trote leve e caminhada ativa.', dist: totalDist, dur: totalDur, pace: '6:30/km', power: 0, tss: Math.round(15 + w * 2) },
          { day: 3, type: 'Descanso', title: 'Descanso', desc: 'Dia livre para alongamento e repouso.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 4, type: 'Corrida', title: 'Trote e Caminhada de Progressão', desc: 'Principal: Sessão intervalada curta focada em consistência de ritmo.', dist: totalDist, dur: totalDur, pace: '6:30/km', power: 0, tss: Math.round(15 + w * 2) },
          { day: 5, type: 'Forca', title: 'Fortalecimento de Base', desc: 'Exercícios funcionais leves (agachamento peso corporal, prancha e panturrilha).', dist: 0, dur: 900, pace: 'N/A', power: 0, tss: 8 },
          { day: 6, type: 'Corrida', title: isRaceWeek ? '🎯 DESAFIO 5K CONTÍNUO 🏁' : 'Sessão de Longo Transição Z2', desc: isRaceWeek ? 'Chegou o dia! Tente correr os 5km contínuos no seu próprio ritmo confortável!' : 'Corrida/Caminhada mais longa da semana. Foco no volume de tempo.', dist: isRaceWeek ? 5 : parseFloat((totalDist + 0.5).toFixed(1)), dur: isRaceWeek ? 1950 : Math.round((totalDur + 300)), pace: isRaceWeek ? '6:30/km' : '6:45/km', power: 0, tss: isRaceWeek ? 50 : Math.round(20 + w * 3) },
          { day: 7, type: 'Descanso', title: 'Descanso Semanal', desc: 'Recupere-se e comemore a semana concluída.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'bike_beginner_base': {
    id: 'bike_beginner_base',
    name: 'Planilha de Ciclismo: Base para Iniciantes',
    author: 'Carmichael Training Systems',
    source: 'TrainRight (trainright.com)',
    sport: 'Ciclismo',
    weeks: 6,
    level: 'iniciante',
    description: 'Planilha focada no desenvolvimento de resistência aeróbica básica na bicicleta. Ideal para ciclistas novatos construírem base e adaptação.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 6; w++) {
        const factor = 0.8 + (w * 0.05);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Descanso', desc: 'Recuperação pós-longo.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Ciclismo', title: 'Giro Confortável de Base Z2', desc: 'Pedal leve com foco em giro ágil e controle de esforço.', dist: parseFloat((15 * factor).toFixed(1)), dur: Math.round(15 * factor * 144), pace: '25 km/h', power: 100, tss: Math.round(20 * factor) },
          { day: 3, type: 'Descanso', title: 'Descanso', desc: 'Recuperação e mobilidade.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 4, type: 'Ciclismo', title: 'Giro de Ritmo Controlado Z2', desc: 'Pedal constante em asfalto plano ou rolo de treino.', dist: parseFloat((18 * factor).toFixed(1)), dur: Math.round(18 * factor * 140), pace: '25.7 km/h', power: 110, tss: Math.round(25 * factor) },
          { day: 5, type: 'Forca', title: 'Fortalecimento Core e Pernas', desc: 'Treino simples com peso do corpo visando estabilização na bike.', dist: 0, dur: 1200, pace: 'N/A', power: 0, tss: 10 },
          { day: 6, type: 'Ciclismo', title: 'Pedal Longo de Endurance Z2', desc: 'Aumentando gradualmente a distância na bike de forma muito confortável.', dist: parseFloat((25 + w * 3).toFixed(1)), dur: Math.round((25 + w * 3) * 144), pace: '25 km/h', power: 105, tss: Math.round(35 + w * 8) },
          { day: 7, type: 'Descanso', title: 'Descanso Semanal', desc: 'Aproveite o domingo para recuperar as pernas.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'swim_beginner_1000m': {
    id: 'swim_beginner_1000m',
    name: 'Planilha de Natação: Do Zero aos 1000m',
    author: 'Ruth Kazez',
    source: 'Zero to 1500m (ruthkazez.com)',
    sport: 'Natacao',
    weeks: 6,
    level: 'iniciante',
    description: 'Progrida de pequenas séries na piscina até nadar 1000 metros de forma contínua com técnicas de respiração bilateral e relaxamento na água.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 6; w++) {
        const factor = 0.75 + (w * 0.05);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Natacao', title: 'Educativo de Respiração e Técnica', desc: 'Principal: 6x 50m (25m perna com prancha / 25m crawl focado na respiração bilateral).', dist: parseFloat((0.5 * factor).toFixed(1)), dur: Math.round(0.5 * factor * 1500), pace: '2:30/100m', power: 0, tss: Math.round(15 * factor) },
          { day: 2, type: 'Descanso', title: 'Descanso', desc: 'Descanso total.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 3, type: 'Natacao', title: 'Intervalado Curto de Resistência', desc: 'Principal: 8x 25m crawl com foco no deslize e 30s de descanso entre as séries.', dist: parseFloat((0.4 * factor).toFixed(1)), dur: Math.round(0.4 * factor * 1450), pace: '2:25/100m', power: 0, tss: Math.round(12 * factor) },
          { day: 4, type: 'Descanso', title: 'Descanso', desc: 'Descanso ou alongamento leve de braços.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 5, type: 'Natacao', title: 'Série Principal de Volume', desc: 'Principal: Séries progressivas de 100m (crawl constante mantendo batida de perna suave).', dist: parseFloat((0.6 * factor).toFixed(1)), dur: Math.round(0.6 * factor * 1400), pace: '2:20/100m', power: 0, tss: Math.round(18 * factor) },
          { day: 6, type: 'Descanso', title: 'Descanso', desc: 'Descanso de fim de semana.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 7, type: 'Natacao', title: w === 6 ? '🎯 DESAFIO: 1000M CONTÍNUOS 🏁' : 'Giro Longo de Piscina', desc: w === 6 ? 'Nade 1000m de forma contínua com técnica e calma!' : 'Nadada contínua leve para ganhar confiança aeróbica.', dist: w === 6 ? 1.0 : parseFloat((0.7 * factor).toFixed(1)), dur: w === 6 ? 1350 : Math.round((0.7 * factor) * 1350), pace: w === 6 ? '2:15/100m' : '2:20/100m', power: 0, tss: w === 6 ? 35 : Math.round(20 * factor) }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'tri_beginner_sprint': {
    id: 'tri_beginner_sprint',
    name: 'Planilha de Triathlon: Meu Primeiro Sprint',
    author: 'Triathlete Magazine',
    source: 'Triathlete.com',
    sport: 'Triathlon',
    weeks: 8,
    level: 'iniciante',
    description: 'Programe-se para terminar seu primeiro Triathlon Sprint (750m natação, 20km ciclismo, 5km corrida). Foco em transições e treinos leves de adaptação.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 8; w++) {
        const isRaceWeek = w === 8;
        const isTaper = w === 7;
        const f = isRaceWeek ? 0.5 : isTaper ? 0.75 : 0.8 + (w * 0.03);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Natacao', title: 'Natação Técnica crawl', desc: 'Educativos de braçada e pernada constante na piscina.', dist: parseFloat((0.8 * f).toFixed(1)), dur: Math.round(0.8 * f * 1400), pace: '2:20/100m', power: 0, tss: Math.round(15 * f) },
          { day: 2, type: 'Ciclismo', title: 'Ciclismo Giro Z2', desc: 'Pedal em cadência confortável e controle de esforço aeróbico.', dist: parseFloat((15 * f).toFixed(1)), dur: Math.round(15 * f * 144), pace: '25 km/h', power: 110, tss: Math.round(25 * f) },
          { day: 3, type: 'Descanso', title: 'Descanso', desc: 'Recuperação fisiológica completa.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 4, type: 'Corrida', title: 'Corrida Trote / Caminhada Z2', desc: 'Intercalar corrida leve e caminhada de forma estruturada.', dist: parseFloat((3 * f).toFixed(1)), dur: Math.round(3 * f * 380), pace: '6:20/km', power: 0, tss: Math.round(18 * f) },
          { day: 5, type: 'Natacao', title: 'Natação Resistência Leve', desc: 'Série de endurance contínua com repousos confortáveis na borda.', dist: parseFloat((1.0 * f).toFixed(1)), dur: Math.round(1.0 * f * 1350), pace: '2:15/100m', power: 0, tss: Math.round(22 * f) },
          { day: 6, type: 'Ciclismo', title: isRaceWeek ? 'Giro de Véspera' : 'Ciclismo e Corrida (Treino de Transição)', desc: isRaceWeek ? 'Giro super curto de ativação.' : 'Pedalar e correr logo em seguida para simular a transição T2.', dist: isRaceWeek ? 8 : parseFloat((18 * f).toFixed(1)), dur: isRaceWeek ? 1100 : Math.round(18 * f * 140), pace: '25.7 km/h', power: 115, tss: Math.round(30 * f) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote Ativação' : 'Transição T2 (Corrida)', desc: isRaceWeek ? 'Trote rápido.' : 'Correr imediatamente após descer da bicicleta.', dist: isRaceWeek ? 1 : parseFloat((2 * f).toFixed(1)), dur: isRaceWeek ? 380 : Math.round(2 * f * 370), pace: '6:10/km', power: 0, tss: Math.round(12 * f) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO: TRIATHLON SPRINT 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'Chegou o dia! Complete os 750m nado, 20km bike e 5km corrida com sorriso no rosto!' : 'Recuperação de final de semana.', dist: isRaceWeek ? 25.75 : 0, dur: isRaceWeek ? 5400 : 0, pace: 'N/A', power: 0, tss: isRaceWeek ? 110 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'ultra_beginner_50k': {
    id: 'ultra_beginner_50k',
    name: 'Planilha de Ultramaratona: Meu Primeiro 50K',
    author: 'Hal Koerner',
    source: 'Hal Koerner\'s Field Guide to Ultrarunning',
    sport: 'Ultramaratona',
    weeks: 12,
    level: 'iniciante',
    description: 'Ideal para maratonistas que querem migrar para as trilhas. Foco em treinos em dias consecutivos (Back-to-Back) de volume moderado para adaptar musculatura à fadiga.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 12; w++) {
        const isRaceWeek = w === 12;
        const isTaper = w === 11;
        const f = isRaceWeek ? 0.45 : isTaper ? 0.70 : 0.8 + (w * 0.02);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Descanso', title: 'Descanso Fisiológico', desc: 'Recuperação do bloco consecutivo de fim de semana.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 2, type: 'Corrida', title: 'Trote Leve de Base Z2', desc: 'Corrida confortável em piso de terra ou asfalto.', dist: parseFloat((6 * f).toFixed(1)), dur: Math.round(6 * f * 365), pace: '6:05/km', power: 0, tss: Math.round(30 * f) },
          { day: 3, type: 'Corrida', title: 'Treino de Ritmo em Subidas', desc: 'Corrida em terrenos com desnível, mantendo esforço aeróbico controlado.', dist: parseFloat((8 * f).toFixed(1)), dur: Math.round(8 * f * 360), pace: '6:00/km', power: 0, tss: Math.round(45 * f) },
          { day: 4, type: 'Forca', title: 'Fortalecimento e Core', desc: 'Exercícios específicos para joelhos, core e costas.', dist: 0, dur: 1800, pace: 'N/A', power: 0, tss: 15 },
          { day: 5, type: 'Corrida', title: 'Trote Regenerativo Z1', desc: 'Soltura muscular super leve.', dist: parseFloat((5 * f).toFixed(1)), dur: Math.round(5 * f * 390), pace: '6:30/km', power: 0, tss: Math.round(20 * f) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote Curto' : 'Bloco Consecutivo Sábado: Volume Z2', desc: isRaceWeek ? 'Soltura.' : 'Primeiro dia do longo consecutivo. Foco em rodagem confortável em trilha.', dist: isRaceWeek ? 4 : parseFloat((15 + w).toFixed(1)), dur: isRaceWeek ? 1440 : Math.round((15 + w) * 370), pace: '6:10/km', power: 0, tss: Math.round(75 + w * 3) },
          { day: 7, type: 'Corrida', title: isRaceWeek ? '🎯 PROVA ALVO: ULTRA 50K 🏁' : 'Bloco Consecutivo Domingo: Fadiga Z2', desc: isRaceWeek ? 'Seu primeiro 50K! Caminhe nas subidas, hidrate-se e divirta-se na trilha!' : 'Segundo dia do longo. Correndo com pernas cansadas do sábado para adaptação.', dist: isRaceWeek ? 50 : parseFloat((10 + w * 0.5).toFixed(1)), dur: isRaceWeek ? 19800 : Math.round((10 + w * 0.5) * 390), pace: isRaceWeek ? '6:36/km' : '6:30/km', power: 0, tss: isRaceWeek ? 280 : Math.round(50 + w * 2) }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'tri_ironman_full_friel': {
    id: 'tri_ironman_full_friel',
    name: 'Planilha de Triathlon: Ironman Full Estilo Friel',
    author: 'Joe Friel',
    source: 'Livro "The Triathlete\'s Training Bible"',
    sport: 'Triathlon',
    weeks: 16,
    level: 'avancado',
    description: 'Volume intenso e periodização científica clássica para cruzar a linha de chegada dos 226km da distância máxima do Triathlon.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 16; w++) {
        const isRaceWeek = w === 16;
        const isTaper = w >= 14 && w < 16;
        const f = isRaceWeek ? 0.40 : isTaper ? 0.65 : 0.75 + (w * 0.016);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Natacao', title: 'Natação: Intervalados de Limiar', desc: 'Principal: 8x 200m em ritmo de limiar aeróbico na piscina.', dist: parseFloat((2.5 * f).toFixed(1)), dur: Math.round(2.5 * f * 1150), pace: '1:55/100m', power: 0, tss: Math.round(55 * f) },
          { day: 2, type: 'Ciclismo', title: 'Ciclismo: Sweet Spot / Ritmo', desc: 'Pedalar na Zona 3 (Sweet Spot) para adaptação mecânica muscular prolongada.', dist: parseFloat((50 * f).toFixed(1)), dur: Math.round(50 * f * 115), pace: '31.3 km/h', power: 180, tss: Math.round(90 * f) },
          { day: 2, type: 'Corrida', title: 'Corrida de Transição T1', desc: 'Correr logo após a bike para simular fadiga de pernas.', dist: parseFloat((5 * f).toFixed(1)), dur: Math.round(5 * f * 330), pace: '5:30/km', power: 0, tss: Math.round(30 * f) },
          { day: 3, type: 'Descanso', title: 'Descanso Fisiológico', desc: 'Descanso total e nutrição balanceada.', dist: 0, dur: 0, pace: 'N/A', power: 0, tss: 0 },
          { day: 4, type: 'Ciclismo', title: 'Ciclismo: Giro com Intervalos Z4', desc: 'Girar com cadência alta intercalando picos de esforço em Zona 4.', dist: parseFloat((45 * f).toFixed(1)), dur: Math.round(45 * f * 120), pace: '30 km/h', power: 195, tss: Math.round(85 * f) },
          { day: 4, type: 'Corrida', title: 'Corrida: Regenerativa Z1', desc: 'Trote super leve de soltura mecânica.', dist: parseFloat((6 * f).toFixed(1)), dur: Math.round(6 * f * 360), pace: '6:00/km', power: 0, tss: Math.round(25 * f) },
          { day: 5, type: 'Natacao', title: 'Natação: Endurance Contínua', desc: 'Série de natação de volume aeróbico contínuo na Zona 2.', dist: parseFloat((3.0 * f).toFixed(1)), dur: Math.round(3.0 * f * 1200), pace: '2:00/100m', power: 0, tss: Math.round(65 * f) },
          { day: 6, type: 'Ciclismo', title: isRaceWeek ? 'Giro Curto' : 'Ciclismo: Pedal Longão Z2 (Endurance)', desc: isRaceWeek ? 'Ativação.' : 'Acumulando volume de endurance aeróbica severa e testando nutrição de prova.', dist: isRaceWeek ? 20 : parseFloat((80 + w * 5).toFixed(1)), dur: isRaceWeek ? 2400 : Math.round((80 + w * 5) * 115), pace: '31.3 km/h', power: 165, tss: Math.round(140 + w * 8) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote' : 'Corrida de Transição T2 (Brick)', desc: isRaceWeek ? 'Soltura.' : 'Correr imediatamente após descer da bike.', dist: isRaceWeek ? 2 : parseFloat((8 * f).toFixed(1)), dur: isRaceWeek ? 660 : Math.round(8 * f * 330), pace: '5:30/km', power: 0, tss: Math.round(45 * f) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO: IRONMAN FULL (226K) 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'O grande dia! 3.8k natação, 180k bike, 42.2k corrida. Concentre-se e conquiste!' : 'Descanso total.', dist: isRaceWeek ? 226 : 0, dur: isRaceWeek ? 41400 : 0, pace: 'N/A', power: 0, tss: isRaceWeek ? 600 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  },
  'tri_ironman_full_8020': {
    id: 'tri_ironman_full_8020',
    name: 'Planilha de Triathlon: Ironman Full 80/20',
    author: 'Matt Fitzgerald',
    source: '80/20 Endurance (8020endurance.com)',
    sport: 'Triathlon',
    weeks: 16,
    level: 'avancado',
    description: 'Metodologia 80/20 aplicada à distância rainha do Triathlon. Maximiza o volume aeróbico e reduz a fadiga neuromuscular excessiva.',
    generateWeeks: (effortPct: number) => {
      const weeksData: LibraryWorkout[][] = [];
      for (let w = 1; w <= 16; w++) {
        const isRaceWeek = w === 16;
        const isTaper = w >= 14 && w < 16;
        const f = isRaceWeek ? 0.40 : isTaper ? 0.65 : 0.75 + (w * 0.015);

        const weekWorkouts: LibraryWorkout[] = [
          { day: 1, type: 'Natacao', title: 'Natação 80/20: Técnica e Limiar', desc: 'Educativos e séries de limiar intervaladas com descanso curto.', dist: parseFloat((2.2 * f).toFixed(1)), dur: Math.round(2.2 * f * 1200), pace: '2:00/100m', power: 0, tss: Math.round(45 * f) },
          { day: 2, type: 'Ciclismo', title: 'Ciclismo 80/20: Giro Aeróbico Z2', desc: 'Pedal em intensidade baixa (Zona 2) para maximizar capacidade aeróbica.', dist: parseFloat((45 * f).toFixed(1)), dur: Math.round(45 * f * 120), pace: '30 km/h', power: 170, tss: Math.round(75 * f) },
          { day: 3, type: 'Corrida', title: 'Corrida 80/20: Intervalado Z3/Z4', desc: 'Principal: Séries de ritmo (Tempo Run) em Zona 3/4 controlada.', dist: parseFloat((10 * f).toFixed(1)), dur: Math.round(10 * f * 330), pace: '5:30/km', power: 0, tss: Math.round(70 * f) },
          { day: 4, type: 'Forca', title: 'Fortalecimento Funcional', desc: 'Prevenção de lesões e fortalecimento de pernas e core.', dist: 0, dur: 2100, pace: 'N/A', power: 0, tss: 15 },
          { day: 5, type: 'Natacao', title: 'Natação 80/20: Endurance Longo Z2', desc: 'Nadada contínua longa confortável.', dist: parseFloat((2.8 * f).toFixed(1)), dur: Math.round(2.8 * f * 1200), pace: '2:00/100m', power: 0, tss: Math.round(60 * f) },
          { day: 6, type: 'Ciclismo', title: isRaceWeek ? 'Giro Curto' : 'Ciclismo 80/20: Longão + Transição T2', desc: isRaceWeek ? 'Soltura.' : 'Pedal de endurance longo em Zona 2 seguido de corrida leve.', dist: isRaceWeek ? 15 : parseFloat((75 + w * 4.5).toFixed(1)), dur: isRaceWeek ? 1800 : Math.round((75 + w * 4.5) * 115), pace: '31.3 km/h', power: 175, tss: Math.round(130 + w * 7) },
          { day: 6, type: 'Corrida', title: isRaceWeek ? 'Trote' : 'Corrida Transição Brick Z2', desc: isRaceWeek ? 'Trote.' : 'Corrida leve imediata pós-pedal.', dist: isRaceWeek ? 2 : parseFloat((6 * f).toFixed(1)), dur: isRaceWeek ? 660 : Math.round(6 * f * 330), pace: '5:30/km', power: 0, tss: Math.round(40 * f) },
          { day: 7, type: 'Descanso', title: isRaceWeek ? '🎯 PROVA ALVO: IRONMAN FULL (226K) 🏁' : 'Descanso Semanal', desc: isRaceWeek ? 'Encare os 226km no seu ritmo 80/20 calibrado! Sucesso!' : 'Recupere-se e alimente-se bem.', dist: isRaceWeek ? 226 : 0, dur: isRaceWeek ? 41400 : 0, pace: 'N/A', power: 0, tss: isRaceWeek ? 580 : 0 }
        ];

        weeksData.push(weekWorkouts.map(wk => calibrateWorkout(wk, effortPct)));
      }
      return weeksData;
    }
  }
};
