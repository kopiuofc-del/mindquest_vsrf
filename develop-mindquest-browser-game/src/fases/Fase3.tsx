import { useCallback, useEffect, useMemo, useState } from "react";
import { Barra, Botao, Cartao } from "../ui/componentes";
import type { PropsFase } from "./comum";

/* ══════════════════ CONFIGURAÇÃO ══════════════════ */

type Nivel = "facil" | "medio" | "dificil";

const CONJUNTOS = [
  ["🌱", "💧", "🧠", "☀️", "🎧", "📚", "😴", "💬"],
  ["🌙", "⭐", "🎵", "🍎", "🚶", "📝", "💬", "🧩"],
  ["🌿", "🫖", "📘", "⏰", "🎨", "🤝", "💡", "🎯"],
];

const NIVEIS: Record<Nivel, { nome: string; pares: number; colunas: string; tempoAlvo: number }> = {
  facil: { nome: "Rápido", pares: 4, colunas: "grid-cols-4", tempoAlvo: 35 },
  medio: { nome: "Médio", pares: 6, colunas: "grid-cols-4", tempoAlvo: 55 },
  dificil: { nome: "Desafio", pares: 8, colunas: "grid-cols-4", tempoAlvo: 80 },
};

type Carta = { id: number; simbolo: string; encontrada: boolean };

/** Monta e embaralha o baralho (Fisher-Yates). */
function montarBaralho(nivel: Nivel, semente = 1): Carta[] {
  const base = CONJUNTOS[Math.abs(semente) % CONJUNTOS.length];
  const simbolos = base.slice(0, NIVEIS[nivel].pares);
  const baralho: Carta[] = [...simbolos, ...simbolos].map((simbolo, i) => ({
    id: i,
    simbolo,
    encontrada: false,
  }));
  for (let i = baralho.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
  }
  return baralho;
}

const formatarTempo = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ══════════════════ COMPONENTE ══════════════════ */

export default function Fase3({
  aplicarEfeito,
  concluir,
  som,
  aoSequencia,
  aoFoco,
  semente = 1,
}: PropsFase) {
  const [nivel, setNivel] = useState<Nivel>("medio");
  const [cartas, setCartas] = useState<Carta[]>(() => montarBaralho("medio", semente));
  const [dica, setDica] = useState(false);
  const [abertas, setAbertas] = useState<number[]>([]);
  const [erradas, setErradas] = useState<number[]>([]);
  const [tentativas, setTentativas] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [tempo, setTempo] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [venceu, setVenceu] = useState(false);
  const [travado, setTravado] = useState(false);
  const [resultado, setResultado] = useState<{ pontos: number; precisao: number; titulo: string } | null>(null);

  const cfg = NIVEIS[nivel];
  const totalPares = cfg.pares;

  /* ── Reinicia o tabuleiro ── */
  const reiniciar = useCallback(
    (n: Nivel) => {
      setNivel(n);
      setCartas(montarBaralho(n, semente));
      setAbertas([]);
      setErradas([]);
      setTentativas(0);
      setAcertos(0);
      setTempo(0);
      setRodando(false);
      setVenceu(false);
      setTravado(false);
      setResultado(null);
      som("clique");
    },
    [som],
  );

  /* ── Cronômetro ── */
  useEffect(() => {
    if (!rodando || venceu) return;
    const id = window.setInterval(() => setTempo((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [rodando, venceu]);

  /* ── Comparação das duas cartas abertas ── */
  useEffect(() => {
    if (abertas.length !== 2) return;
    setTravado(true);
    const [a, b] = abertas;
    const combinou = cartas[a].simbolo === cartas[b].simbolo;
    setTentativas((t) => t + 1);

    if (combinou) {
      som("bom");
      const timer = window.setTimeout(() => {
        setCartas((ant) => ant.map((c, i) => (i === a || i === b ? { ...c, encontrada: true } : c)));
        setAcertos((x) => x + 1);
        setAbertas([]);
        setTravado(false);
      }, 260);
      return () => window.clearTimeout(timer);
    }

    som("ruim");
    setErradas([a, b]);
    const timer = window.setTimeout(() => {
      setErradas([]);
      setAbertas([]);
      setTravado(false);
    }, 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abertas]);

  /* ── Verificação de vitória e cálculo da pontuação ── */
  useEffect(() => {
    if (venceu || acertos === 0 || acertos < totalPares) return;

    setVenceu(true);
    setRodando(false);
    som("conquista");

    // Precisão: 1.0 = nenhuma tentativa desperdiçada.
    const precisao = Math.min(1, totalPares / Math.max(totalPares, tentativas));
    const base = totalPares * 12;
    const bonusPrecisao = Math.round(precisao * totalPares * 8);
    const bonusTempo = Math.max(0, Math.round((cfg.tempoAlvo - tempo) / 3));
    const extra = aoSequencia?.(true) ?? 0;
    aoFoco?.(Math.round(precisao * 100));
    const pontos = Math.max(20, base + bonusPrecisao + bonusTempo + extra);

    const titulo =
      precisao >= 0.8 ? "Concentração excelente!" : precisao >= 0.55 ? "Muito bem!" : "Desafio concluído!";

    setResultado({ pontos, precisao, titulo });

    aplicarEfeito({
      clareza: 4 + Math.round(totalPares / 2),
      estresse: -(2 + Math.round(precisao * 3)),
      equilibrio: 5,
      pontos,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acertos]);

  /* ── Vira uma carta ── */
  const virar = (i: number) => {
    if (travado || venceu) return;
    if (cartas[i].encontrada || abertas.includes(i)) return;
    if (!rodando) setRodando(true);
    som("clique");
    setAbertas((ant) => [...ant, i]);
  };

  const progresso = Math.round((acertos / totalPares) * 100);
  const precisaoAtual = useMemo(
    () => (tentativas === 0 ? 100 : Math.round((acertos / tentativas) * 100)),
    [acertos, tentativas],
  );

  return (
    <div className="space-y-4">
      {/* ── Instruções e dificuldade ── */}
      <Cartao>
        <p className="text-sm leading-relaxed text-slate-300">
          🧩 Objetivo: achar os pares. O símbolo muda a cada jornada. Menos tentativas, mais pontos.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dificuldade:</span>
          {(Object.keys(NIVEIS) as Nivel[]).map((n) => (
            <Botao
              key={n}
              tamanho="sm"
              variante={nivel === n ? "primario" : "secundario"}
              onClick={() => reiniciar(n)}
              aria-pressed={nivel === n}
            >
              {NIVEIS[n].nome} · {NIVEIS[n].pares} pares
            </Botao>
          ))}
          {!dica && (
            <Botao
              tamanho="sm"
              variante="fantasma"
              onClick={() => {
                setDica(true);
                aplicarEfeito({ pontos: 3, clareza: 1 });
                som("bom");
              }}
            >
              💡 Dica rápida +3
            </Botao>
          )}
        </div>
        {dica && <p className="mt-2 text-xs text-sky-200">Comece pelos cantos e vá com calma. Atenção rende mais que pressa.</p>}
      </Cartao>

      {/* ── Painel de status do minijogo ── */}
      <Cartao>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Indicador emoji="🎯" rotulo="Tentativas" valor={String(tentativas)} />
          <Indicador emoji="⏱️" rotulo="Tempo" valor={formatarTempo(tempo)} />
          <Indicador emoji="🧩" rotulo="Pares" valor={`${acertos}/${totalPares}`} />
          <Indicador emoji="📊" rotulo="Precisão" valor={`${precisaoAtual}%`} />
        </div>

        <Barra
          rotulo="Progresso do labirinto"
          valor={progresso}
          cor="bg-gradient-to-r from-sky-400 to-indigo-400"
          compacta
        />

        {/* ── Tabuleiro ── */}
        <div className={`mt-4 grid gap-2 sm:gap-3 ${cfg.colunas}`}>
          {cartas.map((c, i) => {
            const aberta = abertas.includes(i);
            const errada = erradas.includes(i);
            const visivel = aberta || c.encontrada;

            return (
              <button
                key={c.id}
                onClick={() => virar(i)}
                disabled={c.encontrada || travado}
                aria-label={visivel ? `Carta ${c.simbolo}` : "Carta virada para baixo"}
                className={[
                  "relative aspect-square rounded-xl text-2xl font-bold sm:text-3xl",
                  "transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60",
                  c.encontrada
                    ? "animate-[brilhar_0.5s_ease-out] cursor-default border-2 border-emerald-400/70 bg-emerald-500/25 text-white"
                    : errada
                      ? "animate-[tremer_0.4s_ease-in-out] border-2 border-rose-400/70 bg-rose-500/20 text-white"
                      : aberta
                        ? "animate-[virar_0.25s_ease-out] border-2 border-sky-400/70 bg-sky-500/25 text-white"
                        : "border border-white/10 bg-gradient-to-br from-slate-700 to-slate-800 text-slate-500 hover:-translate-y-0.5 hover:from-slate-600 hover:to-slate-700 active:scale-95",
                ].join(" ")}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  {visivel ? c.simbolo : "?"}
                </span>
                {c.encontrada && (
                  <span className="absolute right-1 top-1 text-[10px] text-emerald-300" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!venceu && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Botao tamanho="sm" variante="fantasma" onClick={() => reiniciar(nivel)}>
              🔀 Embaralhar de novo
            </Botao>
            {tentativas === 0 && <span className="text-xs text-slate-500">O cronômetro começa na primeira carta.</span>}
          </div>
        )}
      </Cartao>

      {/* ── Resultado final ── */}
      {venceu && resultado && (
        <Cartao className="animate-[surgir_0.35s_ease-out] border-emerald-400/40 bg-emerald-950/45 text-center">
          <div className="animate-[flutuar_4s_ease-in-out_infinite] text-5xl" aria-hidden="true">
            🧩
          </div>
          <h3 className="mt-2 text-xl font-bold text-white">{resultado.titulo}</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-emerald-100">
            Você encontrou os {totalPares} pares em <strong>{tentativas} tentativas</strong> e{" "}
            <strong>{formatarTempo(tempo)}</strong>. Concentração é treino, não um dom: ambiente calmo, uma tarefa por
            vez e pausas curtas ajudam muito no dia a dia.
          </p>

          <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2">
            <Resumo rotulo="Tentativas" valor={String(tentativas)} cor="text-sky-300" />
            <Resumo rotulo="Tempo" valor={formatarTempo(tempo)} cor="text-slate-100" />
            <Resumo rotulo="Precisão" valor={`${Math.round(resultado.precisao * 100)}%`} cor="text-emerald-300" />
          </div>

          <div className="mx-auto mt-3 max-w-md rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Pontos conquistados</p>
            <p className="text-2xl font-extrabold tabular-nums text-amber-300">⭐ +{resultado.pontos}</p>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Botao variante="sucesso" onClick={concluir}>
              ✓ Concluir área
            </Botao>
            <Botao variante="secundario" onClick={() => reiniciar(nivel)}>
              🔄 Jogar de novo
            </Botao>
          </div>
        </Cartao>
      )}
    </div>
  );
}

/* ══════════════════ AUXILIARES ══════════════════ */

function Indicador({ emoji, rotulo, valor }: { emoji: string; rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <p className="flex items-center gap-1 text-[11px] text-slate-400">
        <span aria-hidden="true">{emoji}</span>
        {rotulo}
      </p>
      <p className="tabular-nums text-base font-bold text-white">{valor}</p>
    </div>
  );
}

function Resumo({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-2 ring-1 ring-white/10">
      <p className="text-[11px] text-slate-400">{rotulo}</p>
      <p className={`tabular-nums text-lg font-extrabold ${cor}`}>{valor}</p>
    </div>
  );
}
