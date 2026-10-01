import { useEffect, useMemo, useRef, useState } from "react";
import type { Som } from "../jogo/audio";
import {
  IDIOMAS,
  NOME_INTENT,
  SUGESTOES,
  detectarIdioma,
  responder,
  totalIntencoes,
  totalRespostas,
  type ContextoMentor,
  type Idioma,
  type Intent,
} from "../jogo/mentor";
import { Aviso, Botao, Cartao, Etiqueta } from "../ui/componentes";
import { cn } from "../utils/cn";

type Mensagem = {
  id: number;
  de: "jogador" | "mentor";
  texto: string;
  idioma?: Idioma;
  intent?: Intent;
};

const LIMITE = 300;

const TEXTOS = {
  pt: {
    subtitulo: "Personagem do jogo · funciona offline",
    intro:
      "Olá! Eu sou o Mentor do MindQuest. Posso explicar o jogo, as fases, os pontos ou as estatísticas — pergunte à vontade.",
    idioma: "Idioma",
    sugestoes: "Sugestões rápidas",
    vazio: "Escreva uma pergunta ou toque em uma sugestão.",
    voce: "Você",
    enviar: "Enviar",
    limpar: "🧹 Limpar",
    placeholder: "Ex.: qual é o meu objetivo?",
    escrevendo: "Mentor está escrevendo",
    disponivel: "● Disponível",
    extra: "Extra opcional",
    campo: "Escreva sua pergunta para o Mentor",
    contagem: (n: number) => `${n} mensagens na conversa`,
    contagemVazia: "Conversa vazia",
    caracteres: (n: number) => `${n} caracteres restantes`,
    disclaimer:
      "O Mentor IA é um personagem fictício e educativo deste jogo escolar. Ele não faz diagnósticos, não indica tratamentos e não substitui psicólogos, médicos, professores, familiares ou outros adultos de confiança.",
    contagemResp: (r: number, c: number) => `Base local: ${r} respostas em ${c} intenções, com contexto da partida.`,
  },
  en: {
    subtitulo: "Game character · works offline",
    intro:
      "Hi! I am the MindQuest Mentor. I can explain the game, its phases, points and stats — ask away.",
    idioma: "Language",
    sugestoes: "Quick suggestions",
    vazio: "Type a question or tap a suggestion.",
    voce: "You",
    enviar: "Send",
    limpar: "🧹 Clear",
    placeholder: "E.g.: what is my goal?",
    escrevendo: "Mentor is typing",
    disponivel: "● Available",
    extra: "Optional extra",
    campo: "Type your question for the Mentor",
    contagem: (n: number) => `${n} messages in the chat`,
    contagemVazia: "Empty chat",
    caracteres: (n: number) => `${n} characters left`,
    disclaimer:
      "The AI Mentor is a fictional educational character in this school game. It does not diagnose, does not prescribe treatment and does not replace psychologists, doctors, teachers, family or trusted adults.",
    contagemResp: (r: number, c: number) => `Local base: ${r} responses across ${c} intents, using your game context.`,
  },
  es: {
    subtitulo: "Personaje del juego · funciona sin conexión",
    intro:
      "¡Hola! Soy el Mentor de MindQuest. Puedo explicar el juego, las fases, los puntos y las estadísticas — pregunta libremente.",
    idioma: "Idioma",
    sugestoes: "Sugerencias rápidas",
    vazio: "Escribe una pregunta o toca una sugerencia.",
    voce: "Tú",
    enviar: "Enviar",
    limpar: "🧹 Limpiar",
    placeholder: "Ej.: ¿cuál es mi objetivo?",
    escrevendo: "El Mentor está escribiendo",
    disponivel: "● Disponible",
    extra: "Extra opcional",
    campo: "Escribe tu pregunta para el Mentor",
    contagem: (n: number) => `${n} mensajes en la conversación`,
    contagemVazia: "Conversación vacía",
    caracteres: (n: number) => `${n} caracteres restantes`,
    disclaimer:
      "El Mentor IA es un personaje ficticio y educativo de este juego escolar. No hace diagnósticos, no indica tratamientos y no sustituye a psicólogos, médicos, docentes, familiares u otros adultos de confianza.",
    contagemResp: (r: number, c: number) => `Base local: ${r} respuestas en ${c} intenciones, con contexto de la partida.`,
  },
};

export default function MentorIA({
  som,
  contexto,
}: {
  som: (s: Som) => void;
  contexto: ContextoMentor;
}) {
  const [idioma, setIdioma] = useState<Idioma>("pt");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [digitando, setDigitando] = useState(false);
  const historico = useRef<Intent[]>([]);
  const proximoId = useRef(1);
  const fimDaLista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const temporizador = useRef<number | null>(null);

  const t = TEXTOS[idioma];

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ block: "nearest" });
  }, [mensagens, digitando]);

  // Cancela resposta pendente ao sair da tela.
  useEffect(() => {
    return () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    };
  }, []);

  // Auto-ajusta idioma na primeira pergunta se o jogador claramente escreveu
  // em outro idioma, sem sobrescrever escolha manual posterior.
  const autoIdiomaFeito = useRef(false);

  const enviar = (bruto?: string) => {
    const conteudo = (bruto ?? texto).trim();
    if (!conteudo || digitando) return;

    // Auto-detect só na primeira pergunta
    let idiomaResposta = idioma;
    if (!autoIdiomaFeito.current && mensagens.length === 0) {
      const detectado = detectarIdioma(conteudo, idioma);
      if (detectado !== idioma) {
        idiomaResposta = detectado;
        setIdioma(detectado);
      }
      autoIdiomaFeito.current = true;
    }

    const idJogador = proximoId.current++;
    setMensagens((m) => [...m, { id: idJogador, de: "jogador", texto: conteudo }]);
    setTexto("");
    setDigitando(true);
    som("clique");

    const resposta = responder(conteudo, idiomaResposta, contexto, historico.current);
    historico.current.push(resposta.intent);
    if (historico.current.length > 20) historico.current.shift();

    temporizador.current = window.setTimeout(() => {
      setMensagens((m) => [
        ...m,
        { id: proximoId.current++, de: "mentor", texto: resposta.texto, idioma: resposta.idioma, intent: resposta.intent },
      ]);
      setDigitando(false);
      temporizador.current = null;
      som("bom");
    }, 260);
  };

  const limpar = () => {
    setMensagens([]);
    historico.current = [];
    autoIdiomaFeito.current = false;
    som("clique");
    campo.current?.focus();
  };

  const trocarIdioma = (novo: Idioma) => {
    setIdioma(novo);
    autoIdiomaFeito.current = true; // decisão manual, não sobrescrever
    som("clique");
  };

  const restante = LIMITE - texto.length;
  const sugestoes = useMemo(() => SUGESTOES[idioma], [idioma]);

  return (
    <div className="space-y-4">
      {/* ── Apresentação ── */}
      <Cartao destaque>
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 animate-[flutuar_4s_ease-in-out_infinite] items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/40 to-indigo-700/40 text-2xl ring-2 ring-sky-400/40"
            aria-hidden="true"
          >
            🤖
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="flex flex-wrap items-center gap-2 text-base font-bold text-white">
              Mentor IA
              <Etiqueta tom="verde">{t.disponivel}</Etiqueta>
              <Etiqueta tom="azul">{t.extra}</Etiqueta>
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{t.intro}</p>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {t.contagemResp(totalRespostas(), totalIntencoes())}
            </p>
          </div>
        </div>

        {/* Seletor de idioma */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t.idioma}:</span>
          {IDIOMAS.map((i) => (
            <button
              key={i.id}
              onClick={() => trocarIdioma(i.id)}
              aria-pressed={idioma === i.id}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60",
                idioma === i.id
                  ? "bg-sky-500/25 text-white ring-sky-400/60"
                  : "bg-white/10 text-slate-200 ring-white/15 hover:bg-white/20",
              )}
            >
              {i.flag} {i.nome}
            </button>
          ))}
        </div>
      </Cartao>

      {/* ── Conversa ── */}
      <Cartao>
        <div
          className="max-h-[22rem] min-h-[8rem] space-y-3 overflow-y-auto pr-1"
          role="log"
          aria-live="polite"
          aria-label="Mentor IA"
        >
          {mensagens.length === 0 && !digitando && (
            <div className="py-8 text-center">
              <p className="text-3xl" aria-hidden="true">
                💭
              </p>
              <p className="mt-2 text-sm text-slate-400">{t.vazio}</p>
            </div>
          )}

          {mensagens.map((m) => (
            <div key={m.id} className={m.de === "jogador" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[88%] animate-[surgir_0.25s_ease-out] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.de === "jogador"
                    ? "rounded-br-sm bg-sky-600/85 text-white"
                    : "rounded-bl-sm bg-white/[0.09] text-slate-100 ring-1 ring-white/10",
                ].join(" ")}
              >
                <span className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-70">
                  {m.de === "jogador" ? t.voce : "🤖 Mentor IA"}
                  {m.intent && m.idioma && NOME_INTENT[m.idioma][m.intent] && (
                    <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal">
                      {NOME_INTENT[m.idioma][m.intent]}
                    </span>
                  )}
                </span>
                {m.texto}
              </div>
            </div>
          ))}

          {digitando && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.09] px-4 py-3 ring-1 ring-white/10">
                <span className="sr-only">{t.escrevendo}</span>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-[pulsar_1s_ease-in-out_infinite] rounded-full bg-sky-300"
                    style={{ animationDelay: `${i * 0.15}s` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={fimDaLista} />
        </div>

        {/* Sugestões */}
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t.sugestoes}</p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                disabled={digitando}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-200 ring-1 ring-white/15 transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Campo */}
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
        >
          <label className="sr-only" htmlFor="campo-mentor">
            {t.campo}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="campo-mentor"
              ref={campo}
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, LIMITE))}
              placeholder={t.placeholder}
              maxLength={LIMITE}
              autoComplete="off"
              disabled={digitando}
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/40 disabled:opacity-60"
            />
            <div className="flex gap-2">
              <Botao type="submit" disabled={!texto.trim() || digitando} className="flex-1 sm:flex-none">
                {t.enviar}
              </Botao>
              {mensagens.length > 0 && (
                <Botao type="button" variante="secundario" onClick={limpar} className="flex-1 sm:flex-none">
                  {t.limpar}
                </Botao>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{mensagens.length > 0 ? t.contagem(mensagens.length) : t.contagemVazia}</span>
            <span className={restante < 40 ? "text-amber-300" : ""}>{t.caracteres(restante)}</span>
          </div>
        </form>
      </Cartao>

      <Aviso>{t.disclaimer}</Aviso>
    </div>
  );
}
