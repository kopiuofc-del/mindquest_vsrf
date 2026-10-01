import { useState } from "react";
import { Botao, Cartao, Etiqueta } from "../ui/componentes";
import type { PropsFase } from "./comum";

/** 6 blocos: suficiente para ensinar equilíbrio em poucos toques. */
const TOTAL_BLOCOS = 6;

type Atividade = { nome: string; emoji: string; ideal: number; cor: string; dica: string };

/** O ideal soma exatamente 6: um bloco para cada área do dia. */
const ATIVIDADES: Atividade[] = [
  { nome: "Estudo", emoji: "📚", ideal: 1, cor: "from-sky-500/30 to-sky-800/20", dica: "Estude em blocos curtos com pausa." },
  { nome: "Descanso", emoji: "😴", ideal: 1, cor: "from-indigo-500/30 to-indigo-800/20", dica: "Dormir bem melhora memória e humor." },
  { nome: "Alimentação", emoji: "🍽️", ideal: 1, cor: "from-emerald-500/30 to-emerald-800/20", dica: "Comer na hora certa mantém a energia." },
  { nome: "Lazer", emoji: "🎮", ideal: 1, cor: "from-fuchsia-500/30 to-fuchsia-800/20", dica: "Momentos bons recarregam você." },
  { nome: "Conversar", emoji: "💬", ideal: 1, cor: "from-amber-500/30 to-amber-800/20", dica: "Falar com quem você confia alivia." },
  { nome: "Responsabilidades", emoji: "📋", ideal: 1, cor: "from-teal-500/30 to-teal-800/20", dica: "Obrigações não podem tomar o dia todo." },
];

export default function Fase2({ aplicarEfeito, concluir, som, aoSequencia }: PropsFase) {
  const [valores, setValores] = useState<number[]>(ATIVIDADES.map(() => 0));
  const [nota, setNota] = useState<number | null>(null);

  const usados = valores.reduce((a, b) => a + b, 0);
  const restantes = TOTAL_BLOCOS - usados;

  /** Um toque no cartão adiciona um bloco; o botão − remove. */
  const adicionar = (i: number) => {
    if (nota !== null || restantes <= 0 || valores[i] >= 4) return;
    setValores((a) => a.map((v, k) => (k === i ? v + 1 : v)));
    som("clique");
  };

  const remover = (i: number) => {
    if (nota !== null || valores[i] === 0) return;
    setValores((a) => a.map((v, k) => (k === i ? v - 1 : v)));
    som("clique");
  };

  const conferir = () => {
    if (restantes > 0) return;
    const desvio = valores.reduce((a, v, i) => a + Math.abs(v - ATIVIDADES[i].ideal), 0);
    const zerados = valores.filter((v) => v === 0).length;
    const n = Math.max(0, 100 - desvio * 10 - zerados * 8);
    setNota(n);

    const extra = aoSequencia?.(n >= 45) ?? 0;
    if (n >= 75) {
      aplicarEfeito({ clareza: 6, estresse: -5, equilibrio: 6, pontos: 40 + extra });
      som("conquista");
    } else if (n >= 45) {
      aplicarEfeito({ clareza: 4, estresse: -3, equilibrio: 3, pontos: 25 + extra });
      som("bom");
    } else {
      aplicarEfeito({ clareza: 2, estresse: 2, equilibrio: -2, pontos: 12 });
      som("ruim");
    }
  };

  const recomecar = () => {
    setValores(ATIVIDADES.map(() => 0));
    setNota(null);
    som("clique");
  };

  return (
    <div className="space-y-3">
      <Cartao>
        <p className="text-sm leading-relaxed text-slate-300">
          ⚡ Toque nas áreas para gastar seus <strong>{TOTAL_BLOCOS} blocos de tempo</strong>. Um dia equilibrado
          tem um pouco de cada coisa.
        </p>
      </Cartao>

      <Cartao>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Etiqueta tom={restantes === 0 ? "verde" : "ambar"}>
            {restantes === 0 ? "✓ Tudo distribuído" : `Restam ${restantes}`}
          </Etiqueta>
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: TOTAL_BLOCOS }).map((_, i) => (
              <span
                key={i}
                className={`h-4 w-3.5 rounded-sm transition-colors duration-150 ${
                  i < restantes ? "bg-sky-400" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ATIVIDADES.map((a, i) => (
            <div
              key={a.nome}
              className={`rounded-xl border bg-gradient-to-br ${a.cor} p-2.5 transition-all ${
                valores[i] > 0 ? "border-white/35" : "border-white/10"
              }`}
            >
              <button
                onClick={() => adicionar(i)}
                disabled={nota !== null || restantes === 0}
                aria-label={`Adicionar bloco em ${a.nome}. Atual: ${valores[i]}`}
                className="w-full text-left transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60 enabled:active:scale-95 disabled:cursor-default"
              >
                <span className="flex items-start justify-between gap-1">
                  <span className="text-2xl" aria-hidden="true">
                    {a.emoji}
                  </span>
                  <span className="tabular-nums text-lg font-extrabold text-white">{valores[i]}</span>
                </span>
                <span className="mt-0.5 block text-xs font-semibold leading-tight text-white">{a.nome}</span>
              </button>

              <div className="mt-1.5 flex items-center gap-1">
                <div className="flex flex-1 gap-0.5" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, k) => (
                    <span key={k} className={`h-1.5 flex-1 rounded-full ${k < valores[i] ? "bg-white/85" : "bg-white/15"}`} />
                  ))}
                </div>
                {valores[i] > 0 && nota === null && (
                  <button
                    onClick={() => remover(i)}
                    aria-label={`Remover bloco de ${a.nome}`}
                    className="rounded px-1.5 text-xs font-bold text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    −
                  </button>
                )}
              </div>

              {nota !== null && <p className="mt-1.5 text-[11px] leading-snug text-slate-100/85">{a.dica}</p>}
            </div>
          ))}
        </div>

        {nota === null ? (
          <Botao className="mt-3" cheio onClick={conferir} disabled={restantes > 0}>
            {restantes > 0 ? `Distribua os ${restantes} blocos restantes` : "Ver meu dia →"}
          </Botao>
        ) : (
          <div className="mt-4 space-y-3">
            <div
              className={`animate-[surgir_0.25s_ease-out] rounded-xl border p-3.5 ${
                nota >= 75
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-50"
                  : nota >= 45
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-50"
                    : "border-rose-400/40 bg-rose-500/10 text-rose-50"
              }`}
            >
              <p className="text-base font-bold">Equilíbrio do dia: {nota}/100</p>
              <p className="mt-1 text-sm leading-relaxed">
                {nota >= 75
                  ? "Dia bem equilibrado! Sobrou espaço para tudo."
                  : nota >= 45
                    ? "Quase lá: algumas áreas ficaram vazias."
                    : "Desequilibrado: tudo numa área só cansa mais."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Botao variante="sucesso" onClick={concluir}>
                ✓ Concluir área
              </Botao>
              <Botao variante="secundario" onClick={recomecar}>
                🔄 Tentar de novo
              </Botao>
            </div>
          </div>
        )}
      </Cartao>
    </div>
  );
}
