/**
 * REGRAS OFICIAIS DAS MÉTRICAS DO MINDQUEST.
 *
 * ⚠️ IMPORTANTE: estes valores são apenas MÉTRICAS DE JOGO.
 * Não representam diagnóstico, avaliação psicológica nem condição real do
 * jogador. Servem só para dar feedback dentro da experiência.
 *
 * Toda alteração de métrica passa por este módulo, que garante os limites
 * e nunca deixa passar NaN, Infinity ou valores inválidos.
 */

import type { Estatisticas } from "./tipos";

/* ══════════════════ LIMITES OFICIAIS ══════════════════ */

export const LIMITES = {
  clareza: { min: 0, max: 100, inicial: 50 },
  estresse: { min: 0, max: 100, inicial: 50 },
  equilibrio: { min: 0, max: 100, inicial: 50 },
  pontos: { min: 0, max: 9999, inicial: 0 },
} as const;

/** Estatísticas iniciais oficiais (50/50/50 e 0 pontos). */
export const STATS_INICIAIS: Estatisticas = {
  clareza: LIMITES.clareza.inicial,
  estresse: LIMITES.estresse.inicial,
  equilibrio: LIMITES.equilibrio.inicial,
  pontos: LIMITES.pontos.inicial,
};

/* ══════════════════ SANEAMENTO ══════════════════ */

/**
 * Converte qualquer entrada em número finito e a prende entre min e max.
 * Rejeita NaN, Infinity, strings inválidas, null e undefined.
 */
export function prender(valor: unknown, min: number, max: number, padrao: number): number {
  // null, undefined e string vazia contam como ausência → usa o padrão.
  if (valor === null || valor === undefined || valor === "") return padrao;
  const n = Number(valor);
  if (!Number.isFinite(n)) return padrao;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Prende um valor de métrica 0–100 (padrão para clareza/estresse/equilíbrio). */
export const prender100 = (valor: unknown, padrao = 0): number => prender(valor, 0, 100, padrao);

/** Prende pontos entre 0 e 9999. */
export const prenderPontos = (valor: unknown, padrao = 0): number =>
  prender(valor, LIMITES.pontos.min, LIMITES.pontos.max, padrao);

/* ══════════════════ FUNÇÕES CENTRAIS DE ALTERAÇÃO ══════════════════ */

/** Clareza atual + delta, sempre dentro de 0–100. */
export function alterarClareza(atual: number, delta: number): number {
  return prender(prender100(atual, LIMITES.clareza.inicial) + (Number.isFinite(delta) ? delta : 0), 0, 100, LIMITES.clareza.inicial);
}

/** Estresse atual + delta, sempre dentro de 0–100. */
export function alterarEstresse(atual: number, delta: number): number {
  return prender(prender100(atual, LIMITES.estresse.inicial) + (Number.isFinite(delta) ? delta : 0), 0, 100, LIMITES.estresse.inicial);
}

/** Equilíbrio atual + delta, sempre dentro de 0–100. */
export function alterarEquilibrio(atual: number, delta: number): number {
  return prender(prender100(atual, LIMITES.equilibrio.inicial) + (Number.isFinite(delta) ? delta : 0), 0, 100, LIMITES.equilibrio.inicial);
}

/** Pontos atuais + delta, nunca negativo e no máximo 9999. */
export function adicionarPontos(atual: number, delta: number): number {
  return prender(prenderPontos(atual, 0) + (Number.isFinite(delta) ? delta : 0), LIMITES.pontos.min, LIMITES.pontos.max, 0);
}

/* ══════════════════ APLICAÇÃO DE EFEITO E VALIDAÇÃO ══════════════════ */

/** Aplica um efeito parcial passando por todas as funções centrais. */
export function aplicarEfeito(stats: Estatisticas, e: Partial<Estatisticas>): Estatisticas {
  return {
    clareza: alterarClareza(stats.clareza, e.clareza ?? 0),
    estresse: alterarEstresse(stats.estresse, e.estresse ?? 0),
    equilibrio: alterarEquilibrio(stats.equilibrio, e.equilibrio ?? 0),
    pontos: adicionarPontos(stats.pontos, e.pontos ?? 0),
  };
}

/** Garante que um objeto de estatísticas (ex.: vindo de save) está válido. */
export function sanearStats(bruto: Partial<Estatisticas> | undefined | null): Estatisticas {
  const s = bruto ?? {};
  return {
    clareza: prender100(s.clareza, LIMITES.clareza.inicial),
    estresse: prender100(s.estresse, LIMITES.estresse.inicial),
    equilibrio: prender100(s.equilibrio, LIMITES.equilibrio.inicial),
    pontos: prenderPontos(s.pontos, 0),
  };
}

/* ══════════════════ EQUILÍBRIO FINAL E CLASSIFICAÇÃO ══════════════════ */

/**
 * Equilíbrio final = (Clareza + (100 - Estresse) + Equilíbrio) / 3
 * Arredondado, sempre entre 0 e 100.
 */
export function equilibrioFinal(stats: Estatisticas): number {
  const c = prender100(stats.clareza, LIMITES.clareza.inicial);
  const est = prender100(stats.estresse, LIMITES.estresse.inicial);
  const eq = prender100(stats.equilibrio, LIMITES.equilibrio.inicial);
  return prender((c + (100 - est) + eq) / 3, 0, 100, 0);
}

export type FaixaFinal = {
  min: number;
  max: number;
  titulo: string;
  emoji: string;
};

/** Faixas de feedback do jogo (não são avaliação psicológica). */
export const FAIXAS: FaixaFinal[] = [
  { min: 0, max: 24, titulo: "Primeiros passos", emoji: "🌫️" },
  { min: 25, max: 49, titulo: "Em desenvolvimento", emoji: "🌤️" },
  { min: 50, max: 74, titulo: "Bom equilíbrio", emoji: "🌱" },
  { min: 75, max: 89, titulo: "Ótimo equilíbrio", emoji: "🌟" },
  { min: 90, max: 100, titulo: "Excelente equilíbrio", emoji: "🏆" },
];

export function classificar(valorFinal: number): FaixaFinal {
  const v = prender(valorFinal, 0, 100, 0);
  return FAIXAS.find((f) => v >= f.min && v <= f.max) ?? FAIXAS[0];
}

/* ══════════════════ FAIXAS DE PONTOS POR AÇÃO (referência) ══════════════════ */

export const PONTOS = {
  escolha: { min: 2, max: 10 },
  desafio: { min: 10, max: 20 },
  exploracao: { min: 1, max: 5 },
  conquista: { min: 10, max: 25 },
  bonus: { min: 5, max: 15 },
} as const;
