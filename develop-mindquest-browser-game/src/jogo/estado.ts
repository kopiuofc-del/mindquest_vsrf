import { useCallback, useEffect, useState } from "react";
import type { AreaId, Configuracoes, Efeito, Estatisticas, EstadoJogo, Tela } from "./tipos";
import {
  STATS_INICIAIS as STATS_OFICIAIS,
  aplicarEfeito as aplicarEfeitoMetricas,
  prender100,
  sanearStats,
} from "./metricas";

const CHAVE = "mindquest:v1";
const VERSAO = 1;

/** Estatísticas iniciais oficiais: 50/50/50 e 0 pontos (ver metricas.ts). */
export const STATS_INICIAIS: Estatisticas = { ...STATS_OFICIAIS };

export { equilibrioFinal, classificar, LIMITES } from "./metricas";

export const CONFIG_PADRAO: Configuracoes = {
  som: true,
  animacoes: true,
  altoContraste: false,
};

/** Cria um estado novo, sempre com objetos independentes. */
export function estadoNovo(config?: Partial<Configuracoes>): EstadoJogo {
  return {
    versao: VERSAO,
    stats: { ...STATS_INICIAIS },
    concluidas: [],
    config: { ...CONFIG_PADRAO, ...config },
    jornadas: 0,
    visitouMapa: false,
    telaAtual: "inicial",
    conquistas: [],
    objetos: [],
    sequencia: 0,
    melhorSequencia: 0,
    semente: 1,
    focoMemoria: 0,
  };
}

/** Telas válidas para retomada ao reabrir o jogo. */
const TELAS_RETOMAVEIS: Tela[] = ["menu", "mapa", "area1", "area2", "area3", "area4", "final"];

/** Prende um número de métrica entre 0 e 100 (mantido por compatibilidade). */
export const limitar = (n: number) => prender100(n, 0);

/** Bônus pequeno da sequência: x2 = +2, x3 = +3, x4+ = +4. Sem punição extra. */
export function bonusDaSequencia(sequencia: number): number {
  if (sequencia < 2) return 0;
  return Math.min(sequencia, 4);
}

/** Aplica um efeito às estatísticas usando as regras centrais de métricas. */
export function aplicarEfeito(stats: Estatisticas, e: Efeito): Estatisticas {
  return aplicarEfeitoMetricas(stats, e);
}

/** Lê o estado salvo tolerando dados ausentes, corrompidos ou bloqueados. */
export function carregar(): EstadoJogo {
  try {
    if (typeof localStorage === "undefined") return estadoNovo();
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return estadoNovo();

    const p = JSON.parse(bruto) as Partial<EstadoJogo>;
    const c = (p.config ?? {}) as Partial<Configuracoes>;
    const num = (v: unknown, padrao: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : padrao;
    };

    return {
      versao: VERSAO,
      // Valida e corrige qualquer valor fora dos limites vindo do save.
      stats: sanearStats(p.stats),
      concluidas: Array.isArray(p.concluidas)
        ? (Array.from(new Set(p.concluidas.map(Number).filter((n) => [1, 2, 3, 4].includes(n)))).sort() as AreaId[])
        : [],
      config: {
        som: typeof c.som === "boolean" ? c.som : CONFIG_PADRAO.som,
        animacoes: typeof c.animacoes === "boolean" ? c.animacoes : CONFIG_PADRAO.animacoes,
        altoContraste: typeof c.altoContraste === "boolean" ? c.altoContraste : CONFIG_PADRAO.altoContraste,
      },
      jornadas: Math.max(0, Math.round(num(p.jornadas, 0))),
      visitouMapa: p.visitouMapa === true,
      telaAtual: TELAS_RETOMAVEIS.includes(p.telaAtual as Tela) ? (p.telaAtual as Tela) : "menu",
      conquistas: Array.isArray(p.conquistas) ? p.conquistas.filter((id) => typeof id === "string").slice(0, 20) : [],
      objetos: Array.isArray(p.objetos) ? p.objetos.filter((id) => typeof id === "string").slice(0, 20) : [],
      sequencia: Math.max(0, Math.round(num(p.sequencia, 0))),
      melhorSequencia: Math.max(0, Math.round(num(p.melhorSequencia, 0))),
      semente: Math.max(1, Math.round(num(p.semente, 1))),
      focoMemoria: limitar(num(p.focoMemoria, 0)),
    };
  } catch {
    // localStorage bloqueado, JSON inválido ou navegação privativa.
    return estadoNovo();
  }
}

/** Grava o estado. Nunca lança erro. */
export function gravar(estado: EstadoJogo): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

export function apagar(): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(CHAVE);
  } catch {
    /* ignorado */
  }
}

/** Testa se o navegador permite persistir dados. */
export function localStorageDisponivel(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const t = "__mq_teste__";
    localStorage.setItem(t, "1");
    localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

/* ══════════════════ HOOK PRINCIPAL ══════════════════ */

export function useJogo() {
  const [estado, setEstado] = useState<EstadoJogo>(() => estadoNovo());
  const [carregado, setCarregado] = useState(false);
  const [persistencia, setPersistencia] = useState(true);

  // Carrega só no navegador, evitando qualquer erro na primeira renderização.
  useEffect(() => {
    setEstado(carregar());
    setPersistencia(localStorageDisponivel());
    setCarregado(true);
  }, []);

  // Salva a cada mudança, depois do carregamento inicial.
  useEffect(() => {
    if (carregado) gravar(estado);
  }, [estado, carregado]);

  const mudarStats = useCallback((e: Efeito) => {
    setEstado((a) => ({ ...a, stats: aplicarEfeito(a.stats, e) }));
  }, []);

  const concluirArea = useCallback((id: AreaId) => {
    setEstado((a) =>
      a.concluidas.includes(id) ? a : { ...a, concluidas: [...a.concluidas, id].sort() as AreaId[] },
    );
  }, []);

  const mudarConfig = useCallback((parcial: Partial<Configuracoes>) => {
    setEstado((a) => ({ ...a, config: { ...a.config, ...parcial } }));
  }, []);

  const marcarVisitaMapa = useCallback(() => {
    setEstado((a) => (a.visitouMapa ? a : { ...a, visitouMapa: true }));
  }, []);

  /** Guarda a tela atual para retomar o jogo depois de fechar e reabrir. */
  const registrarTela = useCallback((tela: Tela) => {
    setEstado((a) => (a.telaAtual === tela ? a : { ...a, telaAtual: tela }));
  }, []);

  /** Recomeça a jornada mantendo as configurações. */
  const definirSequencia = useCallback((sequencia: number) => {
    setEstado((a) => ({
      ...a,
      sequencia,
      melhorSequencia: Math.max(a.melhorSequencia, sequencia),
    }));
  }, []);

  const desbloquear = useCallback((id: string) => {
    let nova = false;
    setEstado((a) => {
      if (a.conquistas.includes(id)) return a;
      nova = true;
      return { ...a, conquistas: [...a.conquistas, id] };
    });
    return nova;
  }, []);

  const encontrarObjeto = useCallback((id: string) => {
    let pontos = 0;
    setEstado((a) => {
      if (a.objetos.includes(id)) return a;
      pontos = 2;
      const objetos = [...a.objetos, id];
      const conquistas = objetos.length >= 3 && !a.conquistas.includes("explorador")
        ? [...a.conquistas, "explorador"]
        : a.conquistas;
      return { ...a, objetos, conquistas, stats: aplicarEfeito(a.stats, { pontos }) };
    });
    return pontos;
  }, []);

  const registrarFoco = useCallback((precisao: number) => {
    setEstado((a) => {
      const focoMemoria = limitar(precisao);
      const conquistas =
        focoMemoria >= 70 && !a.conquistas.includes("foco") ? [...a.conquistas, "foco"] : a.conquistas;
      return { ...a, focoMemoria, conquistas };
    });
  }, []);

  const reiniciarJornada = useCallback(() => {
    setEstado((a) => ({
      ...estadoNovo(a.config),
      jornadas: a.jornadas + 1,
      visitouMapa: a.visitouMapa,
      conquistas: a.conquistas,
      melhorSequencia: a.melhorSequencia,
      semente: a.semente + 1 + Math.floor(Math.random() * 5),
    }));
  }, []);

  /** Apaga tudo, inclusive o que está no localStorage. */
  const apagarTudo = useCallback(() => {
    apagar();
    setEstado(estadoNovo());
  }, []);

  /** Uma área está liberada se for a primeira, já concluída, ou se a anterior foi concluída. */
  const areaLiberada = useCallback(
    (id: AreaId) => id === 1 || estado.concluidas.includes(id) || estado.concluidas.includes((id - 1) as AreaId),
    [estado.concluidas],
  );

  const totalConcluidas = estado.concluidas.length;
  const progresso = Math.round((totalConcluidas / 4) * 100);
  const jornadaCompleta = totalConcluidas === 4;

  return {
    estado,
    carregado,
    persistencia,
    stats: estado.stats,
    config: estado.config,
    concluidas: estado.concluidas,
    totalConcluidas,
    progresso,
    jornadaCompleta,
    areaLiberada,
    mudarStats,
    concluirArea,
    mudarConfig,
    marcarVisitaMapa,
    registrarTela,
    definirSequencia,
    desbloquear,
    encontrarObjeto,
    registrarFoco,
    reiniciarJornada,
    apagarTudo,
  };
}

export type Jogo = ReturnType<typeof useJogo>;
