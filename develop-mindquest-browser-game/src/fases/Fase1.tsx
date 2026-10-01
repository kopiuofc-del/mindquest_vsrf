import { useState } from "react";
import type { Efeito } from "../jogo/tipos";
import DeltaEscolha from "../componentes/DeltaEscolha";
import { Botao, Cartao, Etiqueta } from "../ui/componentes";
import type { PropsFase } from "./comum";

type Tom = "cuidado" | "impulso";

type Opcao = { texto: string; tom: Tom; efeito: Efeito; retorno: string };
type Situacao = { emoji: string; titulo: string; enunciado: string; opcoes: Opcao[] };

/** 3 situações curtas — a fase inteira leva menos de 1 minuto. */
const SITUACOES: Situacao[] = [
  {
    emoji: "📝",
    titulo: "Prova amanhã",
    enunciado: "É noite, tem prova amanhã e você só pensa que vai se sair mal.",
    opcoes: [
      {
        texto: "Virar a noite estudando.",
        tom: "impulso",
        efeito: { clareza: -2, estresse: 4, equilibrio: -2, pontos: 8 },
        retorno: "Sem sono, a mente fica mais cansada. Descansar também é estudar.",
      },
      {
        texto: "Estudar por partes, com pausas.",
        tom: "cuidado",
        efeito: { clareza: 6, estresse: -4, equilibrio: 4, pontos: 25 },
        retorno: "Partes menores organizam o cérebro e diminuem o peso da tarefa.",
      },
      {
        texto: "Falar com um colega ou professor.",
        tom: "cuidado",
        efeito: { clareza: 5, estresse: -4, equilibrio: 5, pontos: 25 },
        retorno: "Falar sobre a preocupação mostra que você não está sozinho nisso.",
      },
      {
        texto: "Revisar só o que já sabe.",
        tom: "impulso",
        efeito: { clareza: 1, estresse: 2, equilibrio: -1, pontos: 12 },
        retorno: "Revisar o fácil alivia, mas deixa a parte difícil para depois.",
      },
    ],
  },
  {
    emoji: "📋",
    titulo: "Tarefas demais",
    enunciado: "Sua lista cresceu e parece que nada vai caber no dia.",
    opcoes: [
      {
        texto: "Tentar fazer tudo de uma vez.",
        tom: "impulso",
        efeito: { clareza: -2, estresse: 4, equilibrio: -2, pontos: 8 },
        retorno: "Tudo ao mesmo tempo divide a atenção. Um passo por vez rende mais.",
      },
      {
        texto: "Anotar tudo e escolher 3 prioridades.",
        tom: "cuidado",
        efeito: { clareza: 6, estresse: -4, equilibrio: 4, pontos: 25 },
        retorno: "Escrever tira o peso da cabeça e mostra por onde começar.",
      },
      {
        texto: "Pedir ajuda para organizar.",
        tom: "cuidado",
        efeito: { clareza: 5, estresse: -4, equilibrio: 5, pontos: 25 },
        retorno: "Pedir ajuda não é fraqueza: é um jeito esperto de resolver.",
      },
      {
        texto: "Fazer só a tarefa mais fácil.",
        tom: "impulso",
        efeito: { clareza: 1, estresse: 1, equilibrio: 0, pontos: 12 },
        retorno: "Começar pelo fácil ajuda, se o restante não for esquecido.",
      },
    ],
  },
  {
    emoji: "💬",
    titulo: "Mensagem estranha",
    enunciado: "Um amigo mandou uma mensagem curta e você achou que ele ficou bravo.",
    opcoes: [
      {
        texto: "Reler mil vezes imaginando o pior.",
        tom: "impulso",
        efeito: { clareza: -2, estresse: 4, equilibrio: -2, pontos: 8 },
        retorno: "Reler aumenta a preocupação sem trazer informação nova.",
      },
      {
        texto: "Respirar, dar um tempo e responder depois.",
        tom: "cuidado",
        efeito: { clareza: 5, estresse: -5, equilibrio: 4, pontos: 25 },
        retorno: "Uma pausa antes de responder evita mal-entendidos.",
      },
      {
        texto: "Perguntar o que ele quis dizer.",
        tom: "cuidado",
        efeito: { clareza: 6, estresse: -3, equilibrio: 4, pontos: 25 },
        retorno: "Perguntar resolve bem mais rápido do que adivinhar.",
      },
      {
        texto: "Responder na hora, sem pensar.",
        tom: "impulso",
        efeito: { clareza: -1, estresse: 3, equilibrio: -1, pontos: 10 },
        retorno: "Responder no impulso pode aumentar o mal-entendido.",
      },
    ],
  },
];

/** Embaralha com semente para a segunda partida não repetir a primeira. */
function embaralharPorSemente<T>(lista: T[], semente: number): T[] {
  let n = Math.abs(semente) + 17;
  const aleatorio = () => {
    n = (n * 16807) % 2147483647;
    return (n - 1) / 2147483646;
  };
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Fisher–Yates: embaralha uma cópia, sem alterar o original. */
function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Índice da alternativa com mais pontos (usada só para variar a posição). */
function indiceMelhor(opcoes: Opcao[]) {
  return opcoes.reduce((melhor, o, i) => ((o.efeito.pontos ?? 0) > (opcoes[melhor].efeito.pontos ?? 0) ? i : melhor), 0);
}

/**
 * Embaralha todas as alternativas de cada situação.
 * A opção de maior pontuação não fica na mesma posição nas três situações.
 */
export function prepararSituacoes(base: Situacao[] = SITUACOES): Situacao[] {
  const deck = base.map((sit) => ({ ...sit, opcoes: embaralhar(sit.opcoes) }));
  const posicoes = deck.map((sit) => indiceMelhor(sit.opcoes));

  if (new Set(posicoes).size === 1 && deck[1]) {
    const sit = deck[1];
    const atual = posicoes[1];
    const destino = (atual + 1) % sit.opcoes.length;
    [sit.opcoes[atual], sit.opcoes[destino]] = [sit.opcoes[destino], sit.opcoes[atual]];
  }

  return deck;
}

export default function Fase1({ aplicarEfeito, concluir, som, sequencia = 0, aoSequencia, semente = 1 }: PropsFase) {
  const [indice, setIndice] = useState(0);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [cuidados, setCuidados] = useState(0);
  const [terminou, setTerminou] = useState(false);
  const [delta, setDelta] = useState<Efeito | null>(null);
  const [bonus, setBonus] = useState(0);
  const [seqVista, setSeqVista] = useState(sequencia);
  /** Ordem embaralhada por entrada na fase; a semente muda ao rejogar. */
  const [deck] = useState(() => prepararSituacoes(embaralharPorSemente(SITUACOES, semente)));

  const s = deck[indice];

  const escolher = (i: number) => {
    if (escolhida !== null) return;
    const o = s.opcoes[i];
    const boa = o.tom === "cuidado";
    const extra = aoSequencia?.(boa) ?? 0;
    const efeito = { ...o.efeito, pontos: (o.efeito.pontos ?? 0) + extra };
    setEscolhida(i);
    setDelta(o.efeito);
    setBonus(extra);
    setSeqVista(boa ? Math.min(sequencia + 1, 8) : 0);
    aplicarEfeito(efeito);
    if (boa) setCuidados((c) => c + 1);
    som(boa ? "bom" : "ruim");
  };

  const avancar = () => {
    if (indice + 1 < SITUACOES.length) {
      setIndice(indice + 1);
      setEscolhida(null);
      setDelta(null);
      som("clique");
    } else {
      setTerminou(true);
      som("conquista");
    }
  };

  if (terminou) {
    return (
      <Cartao className="border-emerald-400/30 bg-emerald-950/40 text-center">
        <div className="animate-[flutuar_4s_ease-in-out_infinite] text-5xl" aria-hidden="true">
          🌤️
        </div>
        <h3 className="mt-2 text-xl font-bold text-white">A névoa ficou mais leve</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-emerald-100">
          <strong>{cuidados}</strong> de {SITUACOES.length} escolhas de cuidado. O jeito de reagir muda o tamanho da
          preocupação.
        </p>
        <Botao variante="sucesso" className="mt-4" onClick={concluir}>
          ✓ Concluir área
        </Botao>
      </Cartao>
    );
  }

  return (
    <div className="space-y-3">
      <Cartao>
        <p className="text-sm leading-relaxed text-slate-300">
          🌫️ Escolha como reagir. Não existe escolha perfeita — existe a que ajuda mais.
        </p>
      </Cartao>

      <Cartao>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Etiqueta tom="azul">
            {indice + 1} de {SITUACOES.length}
          </Etiqueta>
          <Etiqueta tom="verde">💚 {cuidados}</Etiqueta>
        </div>

        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <span aria-hidden="true">{s.emoji}</span>
          {s.titulo}
        </h3>
        <p className="mb-3 mt-1 text-sm leading-relaxed text-slate-200">{s.enunciado}</p>

        <div className="grid gap-2.5">
          {s.opcoes.map((o, i) => {
            const ativa = escolhida === i;
            return (
              <button
                key={o.texto}
                onClick={() => escolher(i)}
                disabled={escolhida !== null}
                className={[
                  "rounded-xl border p-3.5 text-left text-sm transition-all duration-150",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60",
                  escolhida === null
                    ? "border-white/15 bg-white/5 text-slate-100 hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-white/10"
                    : ativa
                      ? o.tom === "cuidado"
                        ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-50"
                        : "border-amber-400/60 bg-amber-500/15 text-amber-50"
                      : "border-white/10 bg-white/5 text-slate-400 opacity-50",
                ].join(" ")}
              >
                <span className="font-medium">{o.texto}</span>
                {ativa && <span className="mt-1.5 block leading-relaxed opacity-90">💡 {o.retorno}</span>}
              </button>
            );
          })}
        </div>

        <DeltaEscolha efeito={delta} bonus={bonus} sequencia={seqVista} />

        {escolhida !== null && (
          <Botao className="mt-3" cheio onClick={avancar}>
            {indice + 1 < SITUACOES.length ? "Próxima →" : "Ver resultado →"}
          </Botao>
        )}
      </Cartao>
    </div>
  );
}
