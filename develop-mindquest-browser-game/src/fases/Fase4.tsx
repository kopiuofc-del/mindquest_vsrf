import { useState } from "react";
import { Barra, Botao, Cartao, Etiqueta } from "../ui/componentes";
import type { PropsFase } from "./comum";

/* ══════════════════ ELEMENTOS DO JARDIM ══════════════════ */

type Elemento = {
  chave: string;
  emoji: string;
  nome: string;
  titulo: string;
  mensagem: string;
  pratica: string;
  cor: string;
  /** Posição no cenário, em porcentagem. */
  x: number;
  y: number;
};

const ELEMENTOS: Elemento[] = [
  {
    chave: "descanso",
    emoji: "🌱",
    nome: "Descanso",
    titulo: "Descansar faz parte da rotina",
    mensagem:
      "Dormir bem e fazer pausas melhora memória, humor e atenção. Descanso não é preguiça: é manutenção.",
    pratica: "Na prática: marque também a hora de parar.",
    cor: "from-lime-500/30 to-emerald-800/25",
    x: 16,
    y: 62,
  },
  {
    chave: "conversa",
    emoji: "💬",
    nome: "Conversar com alguém",
    titulo: "Falar é buscar apoio",
    mensagem:
      "Contar o que você sente para alguém de confiança alivia o peso e ajuda a enxergar saídas.",
    pratica: "Na prática: conte algo do seu dia para alguém hoje.",
    cor: "from-amber-500/30 to-orange-800/25",
    x: 38,
    y: 33,
  },
  {
    chave: "organizacao",
    emoji: "📋",
    nome: "Organização",
    titulo: "Dividir deixa mais fácil",
    mensagem:
      "Quebrar uma tarefa grande em partes menores torna tudo mais fácil de administrar.",
    pratica: "Na prática: escolha as 3 tarefas mais importantes de amanhã.",
    cor: "from-sky-500/30 to-indigo-800/25",
    x: 62,
    y: 58,
  },
  {
    chave: "prazer",
    emoji: "🎮",
    nome: "Atividades agradáveis",
    titulo: "Prazer também é cuidado",
    mensagem:
      "Música, esporte, desenho ou jogos recarregam a energia e fazem parte de uma rotina saudável.",
    pratica: "Na prática: reserve um tempo do dia para algo que você gosta.",
    cor: "from-fuchsia-500/30 to-purple-800/25",
    x: 84,
    y: 36,
  },
  {
    chave: "apoio",
    emoji: "👩‍⚕️",
    nome: "Apoio profissional",
    titulo: "Pedir ajuda é cuidado",
    mensagem:
      "Psicólogos, médicos e a equipe da escola podem orientar quem precisa de ajuda. Procurar apoio é cuidar de si.",
    pratica: "Lembrete: este jogo é educativo e não substitui esse apoio.",
    cor: "from-emerald-500/30 to-teal-800/25",
    x: 50,
    y: 80,
  },
];

/* ══════════════════ COMPONENTE ══════════════════ */

export default function Fase4({ aplicarEfeito, concluir, som }: PropsFase) {
  const [visitados, setVisitados] = useState<string[]>([]);
  const [ativo, setAtivo] = useState<Elemento | null>(null);

  const explorar = (el: Elemento) => {
    setAtivo(el);
    if (!visitados.includes(el.chave)) {
      const novos = [...visitados, el.chave];
      setVisitados(novos);
      aplicarEfeito({ clareza: 2, estresse: -1, equilibrio: 2, pontos: 15 });
      som(novos.length === ELEMENTOS.length ? "conquista" : "bom");
    } else {
      som("clique");
    }
  };

  const total = ELEMENTOS.length;
  const completo = visitados.length === total;
  const progresso = Math.round((visitados.length / total) * 100);

  return (
    <div className="space-y-4">
      {/* ── Instruções ── */}
      <Cartao>
        <p className="text-sm leading-relaxed text-slate-300">
          🌱 Toque nos {total} elementos do jardim para descobrir o que ajuda a manter o equilíbrio.
        </p>
        <div className="mt-3">
          <Barra
            rotulo={`Elementos explorados — ${visitados.length} de ${total}`}
            valor={progresso}
            cor="bg-gradient-to-r from-emerald-400 to-lime-300"
            compacta
          />
        </div>
      </Cartao>

      {/* ── Cenário do jardim ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-sky-900/50 via-emerald-950/60 to-emerald-900/40 shadow-xl shadow-black/40">
        {/* Céu, sol e nuvens */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute right-6 top-5 h-12 w-12 rounded-full bg-amber-300/40 blur-[2px]" />
          <div className="absolute right-5 top-4 h-14 w-14 animate-[pulsar_5s_ease-in-out_infinite] rounded-full bg-amber-200/20 blur-xl" />
          <div className="absolute left-8 top-7 h-4 w-14 rounded-full bg-white/10" />
          <div className="absolute left-14 top-5 h-5 w-10 rounded-full bg-white/10" />
          <div className="absolute left-1/2 top-10 h-3 w-12 rounded-full bg-white/[0.07]" />
        </div>

        {/* Colinas */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 24 Q 22 12 45 22 Q 70 32 100 18 L100 40 L0 40 Z" fill="rgba(16,185,129,0.14)" />
          <path d="M0 32 Q 30 22 58 31 Q 80 37 100 28 L100 40 L0 40 Z" fill="rgba(16,185,129,0.20)" />
        </svg>

        {/* Elementos interativos */}
        <div className="relative h-[300px] w-full sm:h-[340px]">
          {ELEMENTOS.map((el) => {
            const visto = visitados.includes(el.chave);
            const selecionado = ativo?.chave === el.chave;
            return (
              <button
                key={el.chave}
                onClick={() => explorar(el)}
                aria-label={`${el.nome}${visto ? " (já explorado)" : ""}`}
                aria-pressed={selecionado}
                title={el.nome}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl p-1 transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/70"
                style={{ left: `${el.x}%`, top: `${el.y}%` }}
              >
                <span
                  className={[
                    "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg ring-2 transition-all sm:h-16 sm:w-16 sm:text-3xl",
                    el.cor,
                    selecionado
                      ? "ring-sky-300/90"
                      : visto
                        ? "ring-emerald-400/70"
                        : "animate-[flutuar_4s_ease-in-out_infinite] ring-white/25",
                  ].join(" ")}
                >
                  <span aria-hidden="true">{el.emoji}</span>
                </span>

                {visto && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white shadow"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}

                <span className="mt-1.5 block max-w-[5.25rem] text-center text-[11px] font-semibold leading-tight text-slate-100 sm:max-w-[8.5rem]">
                  {el.nome}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mensagem educativa ── */}
      {ativo ? (
        <Cartao
          key={ativo.chave}
          className="animate-[surgir_0.3s_ease-out] border-emerald-400/30 bg-emerald-950/35"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden="true">
              {ativo.emoji}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">{ativo.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-100/90">{ativo.mensagem}</p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-200/90">🔎 {ativo.pratica}</p>
            </div>
          </div>
        </Cartao>
      ) : (
        <Cartao>
          <p className="text-center text-sm text-slate-400">
            👆 Toque em um elemento do jardim para ler a mensagem dele.
          </p>
        </Cartao>
      )}

      {/* ── Lista acessível ── */}
      <Cartao>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Elementos do jardim</h3>
        <div className="flex flex-wrap gap-2">
          {ELEMENTOS.map((el) => {
            const visto = visitados.includes(el.chave);
            return (
              <button
                key={el.chave}
                onClick={() => explorar(el)}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60",
                  visto
                    ? "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40"
                    : "bg-white/10 text-slate-200 ring-white/15 hover:bg-white/20",
                ].join(" ")}
              >
                {el.emoji} {el.nome} {visto && "✓"}
              </button>
            );
          })}
        </div>
      </Cartao>

      {/* ── Conclusão ── */}
      {completo && (
        <Cartao className="animate-[surgir_0.35s_ease-out] border-emerald-400/40 bg-emerald-950/45 text-center">
          <div className="animate-[flutuar_4s_ease-in-out_infinite] text-5xl" aria-hidden="true">
            🌿
          </div>
          <h3 className="mt-2 text-xl font-bold text-white">Jardim totalmente explorado!</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-emerald-100">
            Equilíbrio não é estar bem o tempo todo: é repetir pequenos hábitos — descansar, conversar, organizar,
            se divertir e pedir ajuda quando precisar.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Etiqueta tom="verde">✓ {total} de {total} elementos</Etiqueta>
            <Etiqueta tom="ambar">⭐ +{total * 15} pontos</Etiqueta>
          </div>
          <Botao variante="sucesso" className="mt-5" onClick={concluir}>
            ✓ Concluir área e finalizar a jornada
          </Botao>
        </Cartao>
      )}
    </div>
  );
}
