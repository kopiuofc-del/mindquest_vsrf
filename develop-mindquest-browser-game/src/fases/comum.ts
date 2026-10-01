import type { Som } from "../jogo/audio";
import type { Efeito } from "../jogo/tipos";

/** Contrato usado por todas as fases do jogo. */
export type PropsFase = {
  /** Aplica uma mudança nas estatísticas do jogador. */
  aplicarEfeito: (e: Efeito) => void;
  /** Marca a área como concluída e volta ao mapa. */
  concluir: () => void;
  /** Toca um efeito sonoro (respeita a preferência do jogador). */
  som: (s: Som) => void;
  /** Indica se a área já foi concluída antes (rejogando). */
  concluida: boolean;
  /** Sequência atual de cuidados (combo). */
  sequencia?: number;
  /** Atualiza a sequência e devolve o bônus de pontos. */
  aoSequencia?: (boa: boolean) => number;
  /** Precisão 0–100 da memória, para a conquista de foco. */
  aoFoco?: (precisao: number) => void;
  /** Muda símbolos e detalhes entre partidas. */
  semente?: number;
};
