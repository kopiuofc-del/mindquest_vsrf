import { AREAS } from "../jogo/areas";
import type { ObjetoMapa } from "../jogo/extras";
import type { Area, AreaId } from "../jogo/tipos";
import { Botao, Etiqueta } from "../ui/componentes";
import { cn } from "../utils/cn";

/**
 * Mapa da jornada: um painel ilustrado (SVG + CSS, sem imagens externas)
 * com as quatro áreas posicionadas e a trilha que as conecta.
 */
export default function Mapa({
  concluidas,
  areaLiberada,
  aoEntrar,
  objetos = [],
  encontrados = [],
  aoObjeto,
  objetoAberto,
}: {
  concluidas: AreaId[];
  areaLiberada: (id: AreaId) => boolean;
  aoEntrar: (a: Area) => void;
  objetos?: ObjetoMapa[];
  encontrados?: string[];
  aoObjeto?: (id: string) => void;
  objetoAberto?: string | null;
}) {
  const feita = (id: AreaId) => concluidas.includes(id);

  return (
    <div className="space-y-4">
      {/* ── Painel ilustrado ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/70 via-slate-950/80 to-emerald-950/50 shadow-xl shadow-black/40">
        <div className="pointer-events-none absolute inset-x-0 top-3 h-8 overflow-hidden" aria-hidden="true">
          <span className="absolute left-6 top-1 h-3 w-10 animate-[nuvem_9s_linear_infinite] rounded-full bg-white/10" />
          <span className="absolute left-1/3 top-2 h-2 w-8 animate-[nuvem_12s_linear_infinite] rounded-full bg-white/10" />
        </div>
        {/* Estrelas decorativas */}
        <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
          {ESTRELAS.map((e, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.t, height: e.t, opacity: e.o }}
            />
          ))}
        </div>

        {/* Trilha entre as áreas */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={TRILHA}
            fill="none"
            stroke="rgba(148,163,184,0.28)"
            strokeWidth="0.7"
            strokeDasharray="2.5 2"
            strokeLinecap="round"
          />
          <path
            d={TRILHA}
            fill="none"
            stroke="rgba(56,189,248,0.55)"
            strokeWidth="0.7"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset={100 - concluidas.length * 25}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>

        {/* Pontos das áreas */}
        <div className="relative h-[320px] w-full sm:h-[380px]">
          {AREAS.map((a) => {
            const aberta = areaLiberada(a.id);
            const ok = feita(a.id);
            return (
              <button
                key={a.id}
                onClick={() => aberta && aoEntrar(a)}
                disabled={!aberta}
                aria-label={`${a.nome}${ok ? " (concluída)" : aberta ? "" : " (bloqueada)"}`}
                title={a.nome}
                className={cn(
                  "group absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl p-1 transition-all duration-200",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/70",
                  aberta ? "cursor-pointer hover:scale-110" : "cursor-not-allowed",
                )}
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg ring-2 transition-all sm:h-16 sm:w-16 sm:text-3xl",
                    "bg-gradient-to-br",
                    a.gradiente,
                    ok ? "ring-emerald-400/80" : aberta ? a.anel : "ring-white/10 grayscale",
                    aberta && "animate-[flutuar_5s_ease-in-out_infinite]",
                  )}
                >
                  <span aria-hidden="true">{aberta ? a.emoji : "🔒"}</span>
                </span>

                {ok && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white shadow"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}

                {/* Celular: só o número (os nomes completos ficam na lista abaixo) */}
                <span
                  className={cn(
                    "mt-1.5 block text-center text-xs font-bold sm:hidden",
                    aberta ? "text-slate-200" : "text-slate-500",
                  )}
                >
                  Área {a.id}
                </span>
                {/* Tablet e desktop: nome completo */}
                <span
                  className={cn(
                    "mt-1.5 hidden max-w-[9rem] text-center text-xs font-semibold leading-tight sm:block",
                    aberta ? "text-slate-200" : "text-slate-500",
                  )}
                >
                  {a.id}. {a.nome}
                </span>
              </button>
            );
          })}
          {objetos.map((o) => {
            const achou = encontrados.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => aoObjeto?.(o.id)}
                title={o.nome}
                aria-label={`${o.nome}${achou ? ", já encontrado" : ", objeto opcional"}`}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-xl transition hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60 sm:text-2xl"
                style={{ left: `${o.x}%`, top: `${o.y}%` }}
              >
                <span className={achou ? "" : "inline-block animate-[flutuar_3.5s_ease-in-out_infinite]"}>{o.emoji}</span>
              </button>
            );
          })}
        </div>
        {objetoAberto && (
          <p className="px-4 pb-3 text-center text-xs text-emerald-100">
            ⭐ +2 · {objetos.find((o) => o.id === objetoAberto)?.mensagem}
          </p>
        )}
      </div>

      {/* ── Lista de áreas (acessível e detalhada) ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {AREAS.map((a) => {
          const aberta = areaLiberada(a.id);
          const ok = feita(a.id);
          return (
            <article
              key={a.id}
              className={cn(
                "rounded-2xl border bg-gradient-to-br p-4 transition-all duration-200",
                a.gradiente,
                ok ? "border-emerald-400/40" : "border-white/10",
                aberta ? "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30" : "opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none" aria-hidden="true">
                  {aberta ? a.emoji : "🔒"}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold leading-tight text-white">
                    {a.id}. {a.nome}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200/80">{a.resumo}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Botao
                  tamanho="sm"
                  variante={ok ? "secundario" : "primario"}
                  onClick={() => aoEntrar(a)}
                  disabled={!aberta}
                >
                  {ok ? "Revisitar" : "Explorar"}
                </Botao>
                {ok ? (
                  <Etiqueta tom="verde">✓ Concluída</Etiqueta>
                ) : aberta ? (
                  <Etiqueta tom="azul">{a.habilidade}</Etiqueta>
                ) : (
                  <Etiqueta tom="cinza">🔒 Conclua a área {a.id - 1}</Etiqueta>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** Caminho da trilha, passando pelas coordenadas das 4 áreas. */
const TRILHA = "M 18 26 Q 40 12 62 20 Q 50 44 30 68 Q 55 84 76 70";

/** Estrelinhas decorativas do fundo (posições fixas, sem aleatoriedade). */
const ESTRELAS = [
  { x: 8, y: 12, t: 2, o: 0.6 },
  { x: 24, y: 7, t: 1.5, o: 0.4 },
  { x: 42, y: 15, t: 2, o: 0.5 },
  { x: 55, y: 6, t: 1.5, o: 0.35 },
  { x: 71, y: 11, t: 2, o: 0.55 },
  { x: 88, y: 18, t: 1.5, o: 0.4 },
  { x: 92, y: 42, t: 2, o: 0.5 },
  { x: 6, y: 48, t: 1.5, o: 0.35 },
  { x: 15, y: 88, t: 2, o: 0.45 },
  { x: 45, y: 92, t: 1.5, o: 0.4 },
  { x: 62, y: 50, t: 1.5, o: 0.3 },
  { x: 84, y: 90, t: 2, o: 0.5 },
  { x: 35, y: 40, t: 1.5, o: 0.3 },
  { x: 50, y: 74, t: 1.5, o: 0.35 },
];
