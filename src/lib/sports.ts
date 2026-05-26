export interface SportConfig {
  id: string; // ID interno usado no banco (compatível com os originais)
  name: string; // Nome legível em português brasileiro
  emoji: string; // Emoji representativo
  color: string; // Cor CSS premium (variáveis neon do layout)
  isEndurance: boolean; // Se é considerado treino aeróbico/cardio de endurance
  stravaTypes: string[]; // Tipos correspondentes retornados pela API do Strava
}

export const SPORTS_CONFIG: SportConfig[] = [
  // Modalidades Originais / Principais
  {
    id: 'Corrida',
    name: 'Corrida',
    emoji: '🏃‍♂️',
    color: 'var(--neon-green)',
    isEndurance: true,
    stravaTypes: ['Run', 'VirtualRun']
  },
  {
    id: 'Ciclismo',
    name: 'Ciclismo',
    emoji: '🚴‍♂️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['Ride', 'VirtualRide']
  },
  {
    id: 'Natacao',
    name: 'Natação',
    emoji: '🏊‍♂️',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['Swim']
  },
  {
    id: 'Forca',
    name: 'Fortalecimento',
    emoji: '💪',
    color: 'var(--neon-orange)',
    isEndurance: false,
    stravaTypes: ['WeightTraining']
  },
  {
    id: 'Saude',
    name: 'Saúde & Qualidade de Vida',
    emoji: '🌱',
    color: 'var(--neon-lime)',
    isEndurance: false,
    stravaTypes: []
  },
  {
    id: 'Musculacao',
    name: 'Musculação (Grupos Musculares)',
    emoji: '🏋️‍♀️',
    color: 'var(--neon-orange)',
    isEndurance: false,
    stravaTypes: ['WeightTraining']
  },
  {
    id: 'Descanso',
    name: 'Descanso',
    emoji: '💤',
    color: 'var(--text-muted)',
    isEndurance: false,
    stravaTypes: []
  },
  {
    id: 'Triathlon',
    name: 'Triathlon',
    emoji: '🏊‍♂️🚴‍♂️🏃‍♂️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: []
  },
  {
    id: 'Duathlon',
    name: 'Duathlon',
    emoji: '🏃‍♂️🚴‍♂️🏃‍♂️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: []
  },
  {
    id: 'Aquathlon',
    name: 'Aquathlon',
    emoji: '🏊‍♂️🏃‍♂️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: []
  },

  // Modalidades Extras do Strava (Corrida e Ciclismo Específicos)
  {
    id: 'CorridaTrilha',
    name: 'Corrida de Trilha',
    emoji: '🏃‍♂️',
    color: 'var(--neon-green)',
    isEndurance: true,
    stravaTypes: ['TrailRun']
  },
  {
    id: 'MountainBike',
    name: 'Mountain Bike',
    emoji: '🚴‍♂️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['MountainBikeRide']
  },
  {
    id: 'Gravel',
    name: 'Gravel',
    emoji: '🚴‍♂️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['GravelRide']
  },
  {
    id: 'EBike',
    name: 'E-Bike',
    emoji: '🚴‍♂️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['EBikeRide']
  },
  {
    id: 'EMountainBike',
    name: 'E-Mountain Bike',
    emoji: '🚴‍♂️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['EMountainBikeRide']
  },
  {
    id: 'BicicletaMao',
    name: 'Bicicleta de Mão',
    emoji: '♿',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['Handcycle']
  },
  {
    id: 'Velomovel',
    name: 'Velomóvel',
    emoji: '🚲',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['Velomobile']
  },

  // Esportes Aquáticos
  {
    id: 'NatacaoAguasAbertas',
    name: 'Natação em Águas Abertas',
    emoji: '🏊‍♂️',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['OpenWaterSwim']
  },
  {
    id: 'Canoagem',
    name: 'Canoagem',
    emoji: '🛶',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['Canoeing']
  },
  {
    id: 'Caiaque',
    name: 'Caiaque',
    emoji: '🛶',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['Kayaking']
  },
  {
    id: 'StandUpPaddle',
    name: 'Stand Up Paddle',
    emoji: '🏄‍♂️',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['StandUpPaddling']
  },
  {
    id: 'Surfe',
    name: 'Surfe',
    emoji: '🏄‍♂️',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['Surfing']
  },
  {
    id: 'Windsurf',
    name: 'Windsurf',
    emoji: '🏄‍♂️',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['Windsurf']
  },
  {
    id: 'Kitesurf',
    name: 'Kitesurf',
    emoji: '🏄‍♂️',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['Kitesurfing']
  },
  {
    id: 'Remo',
    name: 'Remo',
    emoji: '🚣',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['Rowing']
  },
  {
    id: 'RemoIndoor',
    name: 'Remo Indoor',
    emoji: '🚣',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['IndoorRow']
  },
  {
    id: 'Vela',
    name: 'Velejar',
    emoji: '⛵',
    color: 'var(--neon-purple)',
    isEndurance: true,
    stravaTypes: ['Sail']
  },

  // Esportes na Neve / Gelo
  {
    id: 'EsquiAlpino',
    name: 'Esqui Alpino',
    emoji: '⛷️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['AlpineSki']
  },
  {
    id: 'EsquiForaPista',
    name: 'Esqui Fora de Pista',
    emoji: '🎿',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['BackcountrySki']
  },
  {
    id: 'EsquiNordico',
    name: 'Esqui Nórdico',
    emoji: '⛷️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['NordicSki']
  },
  {
    id: 'RollerSki',
    name: 'Roller Ski',
    emoji: '⛷️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['RollerSki']
  },
  {
    id: 'Snowboard',
    name: 'Snowboard',
    emoji: '🏂',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['Snowboard']
  },
  {
    id: 'CaminhadaNeve',
    name: 'Caminhada na Neve',
    emoji: '❄️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['Snowshoe']
  },
  {
    id: 'PatinacaoGelo',
    name: 'Patinação no Gelo',
    emoji: '⛸️',
    color: 'var(--neon-cyan)',
    isEndurance: true,
    stravaTypes: ['IceSkate']
  },

  // Condicionamento Físico & Estúdio
  {
    id: 'CrossFit',
    name: 'CrossFit',
    emoji: '🏋️‍♂️',
    color: 'var(--neon-red)',
    isEndurance: false,
    stravaTypes: ['Crossfit']
  },
  {
    id: 'TreinoGeral',
    name: 'Treino Geral',
    emoji: '💪',
    color: 'var(--neon-orange)',
    isEndurance: false,
    stravaTypes: ['Workout']
  },
  {
    id: 'HIIT',
    name: 'HIIT',
    emoji: '🔥',
    color: 'var(--neon-red)',
    isEndurance: false,
    stravaTypes: ['HighIntensityIntervalTraining', 'HIIT']
  },
  {
    id: 'Ioga',
    name: 'Ioga',
    emoji: '🧘',
    color: 'var(--neon-lime)',
    isEndurance: false,
    stravaTypes: ['Yoga']
  },
  {
    id: 'Pilates',
    name: 'Pilates',
    emoji: '🧘',
    color: 'var(--neon-lime)',
    isEndurance: false,
    stravaTypes: ['Pilates']
  },
  {
    id: 'Eliptico',
    name: 'Elíptico',
    emoji: '🏃‍♂️',
    color: 'var(--text-muted)',
    isEndurance: true,
    stravaTypes: ['Elliptical']
  },
  {
    id: 'SimuladorEscada',
    name: 'Simulador de Escada',
    emoji: '🪜',
    color: 'var(--text-muted)',
    isEndurance: true,
    stravaTypes: ['StairStepper']
  },

  // Esportes Coletivos & Raquete
  {
    id: 'Futebol',
    name: 'Futebol',
    emoji: '⚽',
    color: 'var(--neon-green)',
    isEndurance: true,
    stravaTypes: ['Soccer']
  },
  {
    id: 'Tenis',
    name: 'Tênis',
    emoji: '🎾',
    color: 'var(--neon-orange)',
    isEndurance: true,
    stravaTypes: ['Tennis']
  },
  {
    id: 'Badminton',
    name: 'Badminton',
    emoji: '🏸',
    color: 'var(--neon-orange)',
    isEndurance: true,
    stravaTypes: ['Badminton']
  },
  {
    id: 'Padel',
    name: 'Padel',
    emoji: '🎾',
    color: 'var(--neon-orange)',
    isEndurance: true,
    stravaTypes: ['Padel']
  },
  {
    id: 'Squash',
    name: 'Squash',
    emoji: '🎾',
    color: 'var(--neon-orange)',
    isEndurance: true,
    stravaTypes: ['Squash']
  },
  {
    id: 'TenisMesa',
    name: 'Tênis de Mesa',
    emoji: '🏓',
    color: 'var(--neon-orange)',
    isEndurance: false,
    stravaTypes: ['TableTennis']
  },
  {
    id: 'Golfe',
    name: 'Golfe',
    emoji: '🏌️‍♂️',
    color: 'var(--neon-green)',
    isEndurance: false,
    stravaTypes: ['Golf']
  },
  {
    id: 'Escalada',
    name: 'Escalada',
    emoji: '🧗',
    color: 'var(--neon-orange)',
    isEndurance: false,
    stravaTypes: ['RockClimbing']
  },

  // Outras Atividades Aeróbicas
  {
    id: 'Caminhada',
    name: 'Caminhada',
    emoji: '🚶‍♂️',
    color: 'var(--neon-green)',
    isEndurance: true,
    stravaTypes: ['Walk']
  },
  {
    id: 'Trilha',
    name: 'Trilha',
    emoji: '🥾',
    color: 'var(--neon-orange)',
    isEndurance: true,
    stravaTypes: ['Hike']
  },
  {
    id: 'Skate',
    name: 'Skate',
    emoji: '🛹',
    color: 'var(--neon-orange)',
    isEndurance: true,
    stravaTypes: ['Skateboard']
  },
  {
    id: 'PatinacaoInline',
    name: 'Patinação Inline',
    emoji: '🛼',
    color: 'var(--neon-orange)',
    isEndurance: true,
    stravaTypes: ['InlineSkate']
  },
  {
    id: 'CadeiraRodas',
    name: 'Cadeira de Rodas',
    emoji: '♿',
    color: 'var(--neon-green)',
    isEndurance: true,
    stravaTypes: ['Wheelchair']
  }
];

// Helper para converter tipo do Strava em ID de esporte local
export function getLocalSportIdByStravaType(stravaType: string): string {
  if (!stravaType) return 'Corrida'; // Fallback
  
  const match = SPORTS_CONFIG.find(sport => 
    sport.stravaTypes.some(st => st.toLowerCase() === stravaType.toLowerCase())
  );
  
  return match ? match.id : 'Corrida';
}

// Helper para pegar a configuração do esporte por ID
export function getSportConfig(id: string): SportConfig | undefined {
  return SPORTS_CONFIG.find(sport => sport.id === id);
}

// Helper para verificar se um ID de esporte é de endurance
export function isEnduranceSport(id: string): boolean {
  const config = getSportConfig(id);
  return config ? config.isEndurance : false;
}
