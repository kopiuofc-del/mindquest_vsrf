import { useCallback, useEffect, useMemo, useState } from "react";
import { AREAS, areaPorId } from "./jogo/areas";
import { tocar, type Som } from "./jogo/audio";
import { bonusDaSequencia, classificar, equilibrioFinal, useJogo } from "./jogo/estado";
import { CONQUISTAS, eventoDaSemente, mensagemFinal, objetosDaSemente } from "./jogo/extras";
import type { Area, AreaId, Tela as TelaId } from "./jogo/tipos";
import HUD from "./componentes/HUD";
import Mapa from "./componentes/Mapa";
import MentorIA from "./componentes/MentorIA";
import { TelaInicial, MenuPrincipal } from "./telas/Inicio";
import { ComoJogar, SobreProjeto } from "./telas/Informacoes";
import TelaConfiguracoes from "./telas/Configuracoes";
import Fase1 from "./fases/Fase1";
import Fase2 from "./fases/Fase2";
import Fase3 from "./fases/Fase3";
import Fase4 from "./fases/Fase4";
import { Aviso, Barra, Botao, Cartao, Etiqueta, Tela } from "./ui/componentes";

/** Para onde o botão "voltar" / tecla Esc leva em cada tela. */
const VOLTAR_PARA: Partial<Record<TelaId, TelaId>> = {
  menu: "inicial",
  mapa: "menu",
  comojogar: "menu",
  sobre: "menu",
  config: "menu",
  final: "mapa",
  area1: "mapa",
  area2: "mapa",
  area3: "mapa",
  area4: "mapa",
};

export default function App() {
  const jogo = useJogo();
  const { config, stats, concluidas, totalConcluidas, progresso, jornadaCompleta, areaLiberada } = jogo;

  const [tela, setTela] = useState<TelaId>("inicial");
  /** Última tela de jogo visitada (mapa/area1..area4), para dar contexto ao Mentor. */
  const [ultimaFase, setUltimaFase] = useState<"mapa" | "area1" | "area2" | "area3" | "area4" | null>(null);
  const [notificacao, setNotificacao] = useState<string | null>(null);
  const [retomada, setRetomada] = useState<TelaId | null>(null);
  const [objetoAberto, setObjetoAberto] = useState<string | null>(null);
  const [eventoVisto, setEventoVisto] = useState(false);

  /* ── Som (repassado às fases) ── */
  const som = useCallback((s: Som) => tocar(s, config.som), [config.som]);

  /* ── Navegação ── */
  const irPara = useCallback(
    (destino: TelaId, efeito: Som = "clique") => {
      tocar(efeito, config.som);
      setTela(destino);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
    },
    [config.som],
  );

  const voltar = useCallback(() => {
    const destino = VOLTAR_PARA[tela];
    if (destino) irPara(destino);
  }, [tela, irPara]);

  /* ── Tecla Esc volta uma tela ── */
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && VOLTAR_PARA[tela]) voltar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [tela, voltar]);

  /* ── Preferências visuais aplicadas ao <body> ── */
  useEffect(() => {
    try {
      document.body.classList.toggle("sem-animacoes", !config.animacoes);
      document.body.classList.toggle("alto-contraste", config.altoContraste);
    } catch {
      /* ignorado */
    }
  }, [config.animacoes, config.altoContraste]);

  /* ── Notificação temporária ── */
  useEffect(() => {
    if (!notificacao) return;
    const t = window.setTimeout(() => setNotificacao(null), 1800);
    return () => window.clearTimeout(t);
  }, [notificacao]);

  /* ── Retomada: guarda a tela salva assim que o progresso é carregado ── */
  useEffect(() => {
    if (!jogo.carregado) return;
    const salva = jogo.estado.telaAtual;
    if (salva && salva !== "inicial" && salva !== "menu") setRetomada(salva);
    // Roda apenas uma vez, quando o save termina de carregar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jogo.carregado]);

  /* ── Registra a tela atual para permitir retomar depois ── */
  useEffect(() => {
    if (jogo.carregado) jogo.registrarTela(tela);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tela, jogo.carregado]);

  /* ── Guarda a última tela de gameplay (o Mentor usa para dar contexto) ── */
  useEffect(() => {
    if (tela === "mapa" || tela === "area1" || tela === "area2" || tela === "area3" || tela === "area4") {
      setUltimaFase(tela);
    }
  }, [tela]);

  /* ── Ações do jogo ── */
  const abrirMapa = useCallback(() => {
    jogo.marcarVisitaMapa();
    irPara("mapa", "abrir");
  }, [jogo, irPara]);

  const entrarNaArea = useCallback(
    (a: Area) => {
      if (!areaLiberada(a.id)) {
        setNotificacao(`🔒 Conclua a área ${a.id - 1} para liberar esta.`);
        tocar("ruim", config.som);
        return;
      }
      irPara(a.tela, "abrir");
    },
    [areaLiberada, irPara, config.som],
  );

  const aoSequencia = useCallback(
    (boa: boolean) => {
      const seq = boa ? Math.min(jogo.estado.sequencia + 1, 8) : 0;
      jogo.definirSequencia(seq);
      return boa ? bonusDaSequencia(seq) : 0;
    },
    [jogo],
  );

  const concluirArea = useCallback(
    (id: AreaId) => {
      const jaEstava = concluidas.includes(id);
      jogo.concluirArea(id);
      if (!jaEstava) {
        const extra = aoSequencia(true);
        jogo.mudarStats({ clareza: 6, estresse: -5, equilibrio: 6, pontos: 25 + extra });
        if (id === 1) jogo.desbloquear("primeira");
        if (id === 3) jogo.desbloquear("mente");
        if (id === 4 && jogo.stats.equilibrio + 6 >= 70) jogo.desbloquear("equilibrio");
        tocar("conquista", config.som);
        const proxima = areaPorId(id + 1);
        setNotificacao(
          proxima ? `✅ Área concluída! ${proxima.emoji} ${proxima.nome} desbloqueada.` : "🎉 Todas as áreas concluídas!",
        );
      }
      setTela("mapa");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
    },
    [jogo, concluidas, config.som, aoSequencia],
  );

  const reiniciar = useCallback(() => {
    jogo.reiniciarJornada();
    setEventoVisto(false);
    setObjetoAberto(null);
    tocar("clique", config.som);
    setNotificacao("🔄 Nova jornada iniciada. A ordem das escolhas mudou.");
    setTela("mapa");
  }, [jogo, config.som]);

  const proximaArea = useMemo(() => AREAS.find((a) => !concluidas.includes(a.id)), [concluidas]);
  const temProgresso = totalConcluidas > 0 || stats.pontos > 0;
  const mostrarBarraSuperior = tela !== "inicial";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#1e293b_0%,#0b1220_45%,#070b18_100%)] text-slate-100">
      {/* ══════════ BARRA SUPERIOR ══════════ */}
      {mostrarBarraSuperior && (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-2 sm:px-4">
            <button
              onClick={() => irPara("menu")}
              className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/50"
              aria-label="Ir para o menu principal"
            >
              <span className="text-lg" aria-hidden="true">
                🧠
              </span>
              <span className="truncate text-sm font-bold tracking-tight text-white">
                MindQuest
                <span className="hidden font-normal text-slate-500 sm:inline"> · A Jornada da Mente</span>
              </span>
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <Etiqueta tom={jornadaCompleta ? "verde" : "cinza"}>{totalConcluidas}/4</Etiqueta>
              <Etiqueta tom="ambar">⭐ {stats.pontos}</Etiqueta>
              <button
                onClick={() => {
                  const novo = !config.som;
                  jogo.mudarConfig({ som: novo });
                  tocar("clique", novo);
                }}
                aria-pressed={config.som}
                title={config.som ? "Desligar som" : "Ligar som"}
                className="rounded-lg bg-white/10 px-2 py-1.5 text-sm ring-1 ring-white/15 transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/50"
              >
                {config.som ? "🔊" : "🔇"}
              </button>
            </div>
          </div>

          {/* Linha de progresso da jornada */}
          <div className="h-0.5 w-full bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-[width] duration-700 ease-out"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </header>
      )}

      {/* ══════════ NOTIFICAÇÃO ══════════ */}
      {notificacao && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4">
          <div className="animate-[surgir_0.25s_ease-out] rounded-full border border-emerald-400/40 bg-emerald-600/95 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
            {notificacao}
          </div>
        </div>
      )}

      <main>
        {/* ══════════ TELA INICIAL ══════════ */}
        {tela === "inicial" && (
          <TelaInicial
            aoIniciar={() => irPara("menu", "abrir")}
            temProgresso={temProgresso}
            telaSalva={retomada}
            aoRetomar={retomada ? () => irPara(retomada, "abrir") : undefined}
          />
        )}

        {/* ══════════ MENU PRINCIPAL ══════════ */}
        {tela === "menu" && (
          <MenuPrincipal
            aoJogar={abrirMapa}
            aoComoJogar={() => irPara("comojogar")}
            aoSobre={() => irPara("sobre")}
            aoConfiguracoes={() => irPara("config")}
            aoMentor={() => irPara("mentor", "abrir")}
            totalConcluidas={totalConcluidas}
            pontos={stats.pontos}
            proximaArea={proximaArea ? `${proximaArea.emoji} ${proximaArea.nome}` : undefined}
          />
        )}

        {/* ══════════ MAPA ══════════ */}
        {tela === "mapa" && (
          <Tela
            titulo="Mapa da Jornada"
            emoji="🗺️"
            subtitulo="Toque em uma área para explorá-la. Cada uma treina uma habilidade diferente."
            aoVoltar={() => irPara("menu")}
            rotuloVoltar="Menu"
          >
            <div className="space-y-4">
              <HUD stats={stats} />

              <Cartao>
                <Barra
                  rotulo={`Progresso da jornada — ${totalConcluidas} de 4 áreas`}
                  valor={progresso}
                  cor="bg-gradient-to-r from-sky-400 to-emerald-400"
                />
              </Cartao>

              {!eventoVisto && (
                <Cartao>
                  <p className="text-sm font-semibold text-white">
                    {eventoDaSemente(jogo.estado.semente).emoji} {eventoDaSemente(jogo.estado.semente).titulo}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{eventoDaSemente(jogo.estado.semente).texto}</p>
                  <Botao
                    tamanho="sm"
                    className="mt-2"
                    onClick={() => {
                      const ev = eventoDaSemente(jogo.estado.semente);
                      jogo.mudarStats({ pontos: ev.pontos, equilibrio: 1 });
                      setEventoVisto(true);
                      setNotificacao(`⭐ +${ev.pontos} no evento`);
                      som("bom");
                    }}
                  >
                    Coletar +{eventoDaSemente(jogo.estado.semente).pontos}
                  </Botao>
                </Cartao>
              )}

              <Mapa
                concluidas={concluidas}
                areaLiberada={areaLiberada}
                aoEntrar={entrarNaArea}
                objetos={objetosDaSemente(jogo.estado.semente)}
                encontrados={jogo.estado.objetos}
                objetoAberto={objetoAberto}
                aoObjeto={(id) => {
                  const ganho = jogo.encontrarObjeto(id);
                  setObjetoAberto(id);
                  if (ganho > 0) {
                    setNotificacao("⭐ Encontrou um objeto: +2");
                    som("bom");
                  }
                }}
              />

              {jornadaCompleta && (
                <Cartao className="border-emerald-400/40 bg-emerald-950/40 text-center">
                  <p className="text-sm text-emerald-100">🎉 Você percorreu as quatro áreas da jornada!</p>
                  <Botao variante="sucesso" className="mt-3" onClick={() => irPara("final", "conquista")}>
                    Ver o final da jornada →
                  </Botao>
                </Cartao>
              )}

              <Cartao>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    🤖
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white">Precisa de uma dica?</h3>
                    <p className="text-xs text-slate-400">
                      Converse com o Mentor IA sobre uma situação do seu dia a dia.
                    </p>
                  </div>
                  <Botao tamanho="sm" variante="secundario" onClick={() => irPara("mentor", "abrir")}>
                    Abrir Mentor
                  </Botao>
                </div>
              </Cartao>
            </div>
          </Tela>
        )}

        {/* ══════════ ÁREAS (desafios chegam na próxima etapa) ══════════ */}
        {AREAS.map(
          (a) =>
            tela === a.tela && (
              <Tela
                key={a.id}
                titulo={a.nome}
                emoji={a.emoji}
                subtitulo={a.resumo}
                aoVoltar={() => irPara("mapa")}
                rotuloVoltar="Mapa"
                direita={concluidas.includes(a.id) ? <Etiqueta tom="verde">✓ Concluída</Etiqueta> : undefined}
              >
                <div className="space-y-4">
                  <HUD stats={stats} variante="faixa" />

                  {concluidas.includes(a.id) && (
                    <p className="rounded-xl border border-emerald-400/25 bg-emerald-950/30 px-4 py-2.5 text-center text-xs text-emerald-200">
                      ✓ Você já concluiu esta área. Pode jogar de novo à vontade — os pontos continuam contando.
                    </p>
                  )}

                  {a.id === 1 && (
                    <Fase1
                      aplicarEfeito={jogo.mudarStats}
                      concluir={() => concluirArea(1)}
                      som={som}
                      concluida={concluidas.includes(1)}
                      sequencia={jogo.estado.sequencia}
                      aoSequencia={aoSequencia}
                      semente={jogo.estado.semente}
                    />
                  )}
                  {a.id === 2 && (
                    <Fase2
                      aplicarEfeito={jogo.mudarStats}
                      concluir={() => concluirArea(2)}
                      som={som}
                      concluida={concluidas.includes(2)}
                      aoSequencia={aoSequencia}
                    />
                  )}
                  {a.id === 3 && (
                    <Fase3
                      aplicarEfeito={jogo.mudarStats}
                      concluir={() => concluirArea(3)}
                      som={som}
                      concluida={concluidas.includes(3)}
                      aoSequencia={aoSequencia}
                      aoFoco={jogo.registrarFoco}
                      semente={jogo.estado.semente}
                    />
                  )}
                  {a.id === 4 && (
                    <Fase4
                      aplicarEfeito={jogo.mudarStats}
                      concluir={() => concluirArea(4)}
                      som={som}
                      concluida={concluidas.includes(4)}
                    />
                  )}
                </div>
              </Tela>
            ),
        )}

        {/* ══════════ MENTOR IA ══════════ */}
        {tela === "mentor" && (
          <Tela
            titulo="Mentor IA"
            emoji="🤖"
            subtitulo="Personagem do jogo que responde offline, sem internet."
            aoVoltar={() => irPara(jogo.estado.visitouMapa ? "mapa" : "menu")}
            rotuloVoltar="Voltar"
          >
            <MentorIA
              som={som}
              contexto={{
                ultimaFase,
                stats,
                concluidas,
                conquistas: jogo.estado.conquistas,
                objetos: jogo.estado.objetos,
                jornadas: jogo.estado.jornadas,
                sequencia: jogo.estado.sequencia,
                melhorSequencia: jogo.estado.melhorSequencia,
              }}
            />
          </Tela>
        )}

        {/* ══════════ COMO JOGAR ══════════ */}
        {tela === "comojogar" && (
          <Tela titulo="Como Jogar" emoji="📖" aoVoltar={() => irPara("menu")} rotuloVoltar="Menu">
            <ComoJogar />
          </Tela>
        )}

        {/* ══════════ SOBRE ══════════ */}
        {tela === "sobre" && (
          <Tela titulo="Sobre o Projeto" emoji="ℹ️" aoVoltar={() => irPara("menu")} rotuloVoltar="Menu">
            <SobreProjeto />
          </Tela>
        )}

        {/* ══════════ CONFIGURAÇÕES ══════════ */}
        {tela === "config" && (
          <Tela titulo="Configurações" emoji="⚙️" aoVoltar={() => irPara("menu")} rotuloVoltar="Menu">
            <TelaConfiguracoes
              config={config}
              stats={stats}
              totalConcluidas={totalConcluidas}
              jornadas={jogo.estado.jornadas}
              persistencia={jogo.persistencia}
              aoMudarConfig={jogo.mudarConfig}
              aoApagarTudo={jogo.apagarTudo}
            />
          </Tela>
        )}

        {/* ══════════ TELA FINAL ══════════ */}
        {tela === "final" && (
          <Tela titulo="Fim da Jornada" emoji="🌅" aoVoltar={() => irPara("mapa")} rotuloVoltar="Mapa">
            <div className="space-y-4">
              <Cartao className="border-emerald-400/30 bg-gradient-to-br from-emerald-900/45 to-sky-900/35 text-center">
                <div className="animate-[flutuar_4s_ease-in-out_infinite] text-5xl" aria-hidden="true">
                  🎉
                </div>
                <h3 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">🌱 Você chegou ao Equilíbrio!</h3>
                <p className="mt-1 text-sm text-emerald-200">Quatro áreas concluídas</p>

                {(() => {
                  const valorFinal = equilibrioFinal(stats);
                  const faixa = classificar(valorFinal);
                  return (
                    <div className="mx-auto mt-4 w-full max-w-xs rounded-2xl border border-emerald-400/30 bg-emerald-950/40 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                        Equilíbrio final (métrica do jogo)
                      </p>
                      <p className="text-4xl font-extrabold tabular-nums text-white">
                        {valorFinal}
                        <span className="text-lg font-normal text-emerald-300">/100</span>
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-emerald-100">
                        {faixa.emoji} {faixa.titulo}
                      </p>
                    </div>
                  );
                })()}

                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-100">
                  {mensagemFinal(stats, jogo.estado.melhorSequencia)}
                </p>
              </Cartao>

              <Cartao>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Estatísticas finais</h3>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Placar emoji="🧠" rotulo="Clareza final" valor={stats.clareza} cor="text-sky-300" />
                  <Placar emoji="⚡" rotulo="Estresse final" valor={stats.estresse} cor="text-amber-300" />
                  <Placar emoji="🌱" rotulo="Equilíbrio final" valor={stats.equilibrio} cor="text-emerald-300" />
                  <Placar emoji="⭐" rotulo="Pontos totais" valor={stats.pontos} cor="text-fuchsia-300" semLimite />
                </div>

                <div className="mt-4">
                  <HUD stats={stats} variante="nu" />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Etiqueta tom="verde">✓ 4 de 4 áreas concluídas</Etiqueta>
                  <Etiqueta tom="azul">🗺️ Jornada nº {jogo.estado.jornadas + 1}</Etiqueta>
                  {jogo.estado.melhorSequencia >= 2 && (
                    <Etiqueta tom="ambar">🔥 Melhor sequência x{Math.min(jogo.estado.melhorSequencia, 4)}</Etiqueta>
                  )}
                </div>
              </Cartao>

              <Cartao>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">🏆 Conquistas</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONQUISTAS.map((c) => {
                    const ok = jogo.estado.conquistas.includes(c.id);
                    return (
                      <div key={c.id} className={`rounded-xl px-3 py-2 ring-1 ${ok ? "bg-emerald-500/10 ring-emerald-400/30" : "bg-white/5 ring-white/10 opacity-60"}`}>
                        <p className="text-sm font-bold text-white">
                          {c.emoji} {c.titulo} {ok ? "✓" : ""}
                        </p>
                        <p className="text-xs text-slate-400">{c.descricao}</p>
                      </div>
                    );
                  })}
                </div>
              </Cartao>

              <Cartao>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                  <span aria-hidden="true">💚</span> O que levar desta jornada
                </h3>
                <ul className="space-y-1.5 text-sm leading-relaxed text-slate-300">
                  <li>🌫️ Preocupações diminuem quando você as divide em passos pequenos e fala sobre elas.</li>
                  <li>⚡ Um dia equilibrado reserva espaço para obrigações, descanso, pessoas e prazer.</li>
                  <li>🧩 Concentração é treino: ambiente calmo, uma tarefa por vez e pausas curtas ajudam.</li>
                  <li>🌱 Cuidar da mente é hábito diário — e pedir ajuda é uma atitude inteligente.</li>
                </ul>
              </Cartao>

              <Aviso>
                O MindQuest é um jogo educativo escolar. Ele não faz diagnósticos e não substitui o apoio de
                profissionais de saúde, professores, familiares ou outros adultos de confiança.
              </Aviso>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Botao variante="sucesso" onClick={reiniciar} cheio className="sm:w-auto">
                  🔄 Jogar novamente
                </Botao>
                <Botao variante="secundario" onClick={() => irPara("menu")} cheio className="sm:w-auto">
                  🏠 Voltar ao menu
                </Botao>
                <Botao variante="fantasma" onClick={() => irPara("mentor")} cheio className="sm:w-auto">
                  🤖 Falar com o Mentor IA
                </Botao>
              </div>
              <p className="text-center text-[11px] text-slate-600">
                "Jogar novamente" reinicia a campanha · "Voltar ao menu" mantém o progresso salvo
              </p>
            </div>
          </Tela>
        )}
      </main>

      {mostrarBarraSuperior && (
        <footer className="border-t border-white/5 px-4 py-6 text-center text-[11px] leading-relaxed text-slate-600">
          MindQuest — A Jornada da Mente · Projeto escolar educativo
          <br />
          Funciona offline, sem servidor e sem coletar dados.
        </footer>
      )}
    </div>
  );
}

/* ══════════════════ AUXILIAR DA TELA FINAL ══════════════════ */

function Placar({
  emoji,
  rotulo,
  valor,
  cor,
  semLimite,
}: {
  emoji: string;
  rotulo: string;
  valor: number;
  cor: string;
  semLimite?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-3 text-center ring-1 ring-white/10">
      <p className="text-xl" aria-hidden="true">
        {emoji}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{rotulo}</p>
      <p className={`mt-0.5 text-2xl font-extrabold tabular-nums ${cor}`}>
        {valor}
        {!semLimite && <span className="text-xs font-normal text-slate-500">/100</span>}
      </p>
    </div>
  );
}
