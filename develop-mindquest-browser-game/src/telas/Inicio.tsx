import { Botao } from "../ui/componentes";

/* ══════════════════ TELA INICIAL (splash) ══════════════════ */

const NOME_TELA: Record<string, string> = {
  mapa: "🗺️ Mapa da Jornada",
  area1: "🌫️ Vale da Preocupação",
  area2: "⚡ Cidade do Estresse",
  area3: "🧩 Labirinto da Concentração",
  area4: "🌱 Jardim do Equilíbrio",
  final: "🎉 Fim da Jornada",
};

export function TelaInicial({
  aoIniciar,
  temProgresso,
  telaSalva,
  aoRetomar,
}: {
  aoIniciar: () => void;
  temProgresso: boolean;
  telaSalva?: string | null;
  aoRetomar?: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-3.25rem)] w-full max-w-2xl animate-[surgir_0.4s_ease-out] flex-col items-center justify-center px-4 py-10 text-center">
      <div className="animate-[flutuar_4s_ease-in-out_infinite] text-7xl sm:text-8xl" aria-hidden="true">
        🧠
      </div>

      <h1 className="mt-4 bg-gradient-to-r from-sky-300 via-indigo-200 to-emerald-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl">
        MindQuest
      </h1>
      <p className="mt-1 text-lg font-semibold text-slate-300 sm:text-xl">A Jornada da Mente</p>

      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-400">
        Uma aventura educativa sobre emoções, preocupação, estresse, concentração, organização e equilíbrio no dia a
        dia.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
        <Botao tamanho="lg" cheio onClick={aoIniciar}>
          {temProgresso ? "▶ Continuar jornada" : "▶ Iniciar"}
        </Botao>

        {aoRetomar && telaSalva && NOME_TELA[telaSalva] && (
          <button
            onClick={aoRetomar}
            className="animate-[surgir_0.4s_ease-out] rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-100 transition hover:bg-sky-500/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/50"
          >
            ↩️ Retomar de onde parou
            <span className="mt-0.5 block font-semibold">{NOME_TELA[telaSalva]}</span>
          </button>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
        <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">🔌 Funciona offline</span>
        <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">🔒 Sem coleta de dados</span>
        <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">🎓 Projeto escolar</span>
      </div>

      <p className="mx-auto mt-8 max-w-md text-[11px] leading-relaxed text-slate-600">
        Jogo educativo. Não é tratamento médico ou psicológico, não faz diagnósticos e não substitui profissionais de
        saúde, professores, familiares ou outros adultos de confiança.
      </p>
    </section>
  );
}

/* ══════════════════ MENU PRINCIPAL ══════════════════ */

type ItemMenu = { emoji: string; rotulo: string; descricao: string; acao: () => void; principal?: boolean };

export function MenuPrincipal({
  aoJogar,
  aoComoJogar,
  aoSobre,
  aoConfiguracoes,
  aoMentor,
  totalConcluidas,
  pontos,
  proximaArea,
}: {
  aoJogar: () => void;
  aoComoJogar: () => void;
  aoSobre: () => void;
  aoConfiguracoes: () => void;
  aoMentor: () => void;
  totalConcluidas: number;
  pontos: number;
  proximaArea?: string;
}) {
  const emAndamento = totalConcluidas > 0 && totalConcluidas < 4;

  const itens: ItemMenu[] = [
    {
      emoji: "🎮",
      rotulo: totalConcluidas > 0 ? "Continuar jogando" : "Jogar",
      descricao: "Abrir o mapa da jornada",
      acao: aoJogar,
      principal: true,
    },
    { emoji: "🤖", rotulo: "Mentor IA", descricao: "Peça uma dica sobre o dia a dia", acao: aoMentor },
    { emoji: "📖", rotulo: "Como Jogar", descricao: "Regras, status e controles", acao: aoComoJogar },
    { emoji: "ℹ️", rotulo: "Sobre o Projeto", descricao: "Objetivo, tecnologia e avisos", acao: aoSobre },
    { emoji: "⚙️", rotulo: "Configurações", descricao: "Som, animações e dados salvos", acao: aoConfiguracoes },
  ];

  return (
    <section className="mx-auto w-full max-w-2xl animate-[surgir_0.3s_ease-out] px-4 pb-24 pt-8 text-center">
      <div className="animate-[flutuar_5s_ease-in-out_infinite] text-5xl" aria-hidden="true">
        🧠
      </div>
      <h1 className="mt-2 bg-gradient-to-r from-sky-300 via-indigo-200 to-emerald-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
        MindQuest
      </h1>
      <p className="text-sm font-semibold text-slate-400">A Jornada da Mente</p>

      {(emAndamento || totalConcluidas === 4) && (
        <div className="mx-auto mt-5 max-w-sm rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs">
          {totalConcluidas === 4 ? (
            <p className="font-semibold text-emerald-300">🎉 Jornada completa! {pontos} pontos conquistados.</p>
          ) : (
            <p className="text-sky-200">
              Jornada em andamento: <strong>{totalConcluidas} de 4</strong> áreas
              {proximaArea ? ` · próxima: ${proximaArea}` : ""}
            </p>
          )}
        </div>
      )}

      <nav className="mx-auto mt-7 grid max-w-sm gap-3" aria-label="Menu principal">
        {itens.map((it) => (
          <button
            key={it.rotulo}
            onClick={it.acao}
            className={[
              "group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-150",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60 active:scale-[0.98]",
              it.principal
                ? "border-transparent bg-gradient-to-r from-sky-500 to-indigo-600 shadow-lg shadow-indigo-950/40 hover:from-sky-400 hover:to-indigo-500"
                : "border-white/10 bg-white/[0.07] hover:border-white/20 hover:bg-white/[0.13]",
            ].join(" ")}
          >
            <span className="text-2xl transition-transform group-hover:scale-110" aria-hidden="true">
              {it.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-white">{it.rotulo}</span>
              <span className={`block text-xs ${it.principal ? "text-sky-100/80" : "text-slate-400"}`}>
                {it.descricao}
              </span>
            </span>
            <span className={`text-lg ${it.principal ? "text-white/70" : "text-slate-500"}`} aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </nav>

      <p className="mx-auto mt-8 max-w-md text-[11px] leading-relaxed text-slate-600">
        Projeto escolar educativo · Funciona inteiramente no navegador, sem internet e sem enviar dados.
      </p>
    </section>
  );
}
