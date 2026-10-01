import { AREAS } from "../jogo/areas";
import { Aviso, Cartao, Etiqueta } from "../ui/componentes";

/* ══════════════════ COMO JOGAR ══════════════════ */

const PASSOS = [
  "Toque em 🎮 Jogar para abrir o Mapa da Jornada.",
  "Comece pelo Vale da Preocupação: as outras áreas abrem conforme você avança.",
  "🌫️ Vale: leia a situação e escolha como reagir (3 situações rápidas).",
  "⚡ Cidade: distribua 6 blocos de tempo entre as áreas do seu dia.",
  "🧩 Labirinto: vire as cartas e encontre os pares.",
  "🌱 Jardim: toque nos 5 elementos e leia as mensagens.",
  "Suas ações mudam 🧠 Clareza, ⚡ Estresse, 🌱 Equilíbrio e ⭐ Pontos.",
  "Ao concluir as quatro áreas, você chega à tela final. A partida leva cerca de 4 minutos.",
  "🤖 O Mentor IA é um extra opcional: use quando quiser, sem precisar para terminar o jogo.",
];

const STATUS = [
  { emoji: "🧠", nome: "Clareza", faixa: "0 a 100", texto: "O quanto seus pensamentos estão organizados. Quanto maior, melhor." },
  { emoji: "⚡", nome: "Estresse", faixa: "0 a 100", texto: "A tensão acumulada no dia. Quanto menor, melhor." },
  { emoji: "🌱", nome: "Equilíbrio", faixa: "0 a 100", texto: "O cuidado com descanso, pessoas e rotina. Quanto maior, melhor." },
  { emoji: "⭐", nome: "Pontos", faixa: "sem limite", texto: "Somam a cada desafio concluído na jornada." },
];

export function ComoJogar() {
  return (
    <div className="space-y-4">
      <Cartao>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Passo a passo</h3>
        <ol className="space-y-3">
          {PASSOS.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-200">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/25 text-xs font-bold text-sky-200">
                {i + 1}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </Cartao>

      <Cartao>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Status do jogador</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {STATUS.map((s) => (
            <div key={s.nome} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <span aria-hidden="true">{s.emoji}</span>
                {s.nome}
                <span className="ml-auto text-[11px] font-normal text-slate-500">{s.faixa}</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.texto}</p>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">As quatro áreas</h3>
        <ul className="space-y-2">
          {AREAS.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
              <span className="text-xl" aria-hidden="true">
                {a.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {a.id}. {a.nome}
                </p>
                <p className="text-xs leading-relaxed text-slate-400">{a.resumo}</p>
              </div>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Controles</h3>
        <p className="text-sm leading-relaxed text-slate-300">
          📱 <strong>Celular e tablet:</strong> toque nos botões e nas áreas do mapa.
          <br />
          💻 <strong>Computador:</strong> use o mouse ou o teclado — <Tecla>Tab</Tecla> navega entre os botões,{" "}
          <Tecla>Enter</Tecla> ou <Tecla>Espaço</Tecla> seleciona e <Tecla>Esc</Tecla> volta à tela anterior.
        </p>
      </Cartao>

      <Aviso>
        Este é um jogo educativo. Ele não faz diagnósticos, não indica tratamentos e não substitui profissionais de
        saúde, professores, familiares ou outros adultos de confiança.
      </Aviso>
    </div>
  );
}

function Tecla({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] text-slate-200">{children}</kbd>;
}

/* ══════════════════ SOBRE O PROJETO ══════════════════ */

const TECNOLOGIAS = ["React", "TypeScript", "Tailwind CSS", "Vite", "WebAudio", "localStorage", "Site estático"];

const TEMAS = [
  { emoji: "😟", nome: "Preocupação" },
  { emoji: "⚡", nome: "Estresse" },
  { emoji: "🎯", nome: "Concentração" },
  { emoji: "🗂️", nome: "Organização" },
  { emoji: "💚", nome: "Equilíbrio" },
  { emoji: "🤝", nome: "Pedir ajuda" },
];

export function SobreProjeto() {
  return (
    <div className="space-y-4">
      <Cartao>
        <div className="space-y-3 text-sm leading-relaxed text-slate-200">
          <p>
            <strong>MindQuest — A Jornada da Mente</strong> é um projeto escolar educativo sobre emoções,
            concentração, estresse, organização e formas saudáveis de lidar com desafios do cotidiano.
          </p>
          <p>
            A proposta é convidar à reflexão de um jeito leve: perceber emoções, organizar a rotina, treinar a atenção
            e lembrar que pedir ajuda é uma atitude saudável e inteligente.
          </p>
          <p>
            O jogador atravessa quatro áreas, cada uma com um desafio diferente, enquanto acompanha seu status de
            Clareza, Estresse, Equilíbrio e Pontos.
          </p>
        </div>
      </Cartao>

      <Cartao>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Temas trabalhados</h3>
        <div className="flex flex-wrap gap-2">
          {TEMAS.map((t) => (
            <Etiqueta key={t.nome} tom="rosa">
              {t.emoji} {t.nome}
            </Etiqueta>
          ))}
        </div>
      </Cartao>

      <Cartao>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Como foi feito</h3>
        <div className="flex flex-wrap gap-2">
          {TECNOLOGIAS.map((t) => (
            <Etiqueta key={t} tom="azul">
              {t}
            </Etiqueta>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          O jogo funciona inteiramente no navegador. Não há servidor, banco de dados, API externa, chave de acesso nem
          cadastro. Nenhum dado é enviado pela internet: o progresso fica salvo apenas no seu próprio aparelho e pode
          ser apagado a qualquer momento nas Configurações.
        </p>
      </Cartao>

      <Aviso>
        <strong>Aviso importante:</strong> este jogo não é tratamento médico ou psicológico e não faz diagnósticos. Se
        algo estiver difícil, converse com um adulto de confiança, com a escola ou com um profissional de saúde.
      </Aviso>
    </div>
  );
}
