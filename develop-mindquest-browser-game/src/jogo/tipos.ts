/** Identificador de cada área do mapa. */
export type AreaId = 1 | 2 | 3 | 4;

/** Telas navegáveis do aplicativo. */
export type Tela =
  | "inicial"
  | "menu"
  | "mapa"
  | "comojogar"
  | "sobre"
  | "config"
  | "mentor"
  | "final"
  | "area1"
  | "area2"
  | "area3"
  | "area4";

/** Estatísticas do jogador exibidas no HUD. */
export type Estatisticas = {
  /** 0–100 — o quanto os pensamentos estão organizados. */
  clareza: number;
  /** 0–100 — tensão acumulada. Quanto menor, melhor. */
  estresse: number;
  /** 0–100 — cuidado com descanso, pessoas e rotina. */
  equilibrio: number;
  /** Pontuação acumulada (sem teto). */
  pontos: number;
};

/** Alteração parcial aplicada às estatísticas. */
export type Efeito = Partial<Estatisticas>;

/** Preferências ajustáveis em Configurações. */
export type Configuracoes = {
  som: boolean;
  animacoes: boolean;
  altoContraste: boolean;
};

/** Tudo que é persistido no localStorage. */
export type EstadoJogo = {
  versao: number;
  stats: Estatisticas;
  concluidas: AreaId[];
  config: Configuracoes;
  jornadas: number;
  visitouMapa: boolean;
  /** Última tela em que o jogador estava (retomada ao reabrir o jogo). */
  telaAtual: Tela;
  /** Conquistas desbloqueadas (ids). */
  conquistas: string[];
  /** Objetos do mapa já encontrados nesta jornada. */
  objetos: string[];
  /** Sequência atual de escolhas/desafios de cuidado. */
  sequencia: number;
  /** Maior sequência da jornada. */
  melhorSequencia: number;
  /** Muda a cada "Jogar novamente" para variar ordem e eventos. */
  semente: number;
  /** Precisão da última memória (0–100), para a conquista de foco. */
  focoMemoria: number;
};

/** Metadados de uma área do mapa. */
export type Area = {
  id: AreaId;
  tela: Tela;
  emoji: string;
  nome: string;
  resumo: string;
  habilidade: string;
  gradiente: string;
  anel: string;
  /** Posição no mapa ilustrado, em porcentagem. */
  x: number;
  y: number;
};
