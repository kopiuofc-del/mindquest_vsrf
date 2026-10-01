import { useState } from "react";
import type { Configuracoes as Config, Estatisticas } from "../jogo/tipos";
import { Aviso, Botao, Cartao } from "../ui/componentes";

/* Linha de opção liga/desliga */
function Opcao({
  emoji,
  titulo,
  descricao,
  ativo,
  rotuloAtivo,
  rotuloInativo,
  aoAlternar,
}: {
  emoji: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  rotuloAtivo: string;
  rotuloInativo: string;
  aoAlternar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="min-w-0 flex-1">
        <h4 className="flex items-center gap-2 text-sm font-bold text-white">
          <span aria-hidden="true">{emoji}</span>
          {titulo}
        </h4>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{descricao}</p>
      </div>
      <Botao
        tamanho="sm"
        variante={ativo ? "primario" : "secundario"}
        onClick={aoAlternar}
        aria-pressed={ativo}
        className="shrink-0"
      >
        {ativo ? rotuloAtivo : rotuloInativo}
      </Botao>
    </div>
  );
}

export default function TelaConfiguracoes({
  config,
  stats,
  totalConcluidas,
  jornadas,
  persistencia,
  aoMudarConfig,
  aoApagarTudo,
}: {
  config: Config;
  stats: Estatisticas;
  totalConcluidas: number;
  jornadas: number;
  persistencia: boolean;
  aoMudarConfig: (p: Partial<Config>) => void;
  aoApagarTudo: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [apagado, setApagado] = useState(false);

  const apagar = () => {
    aoApagarTudo();
    setConfirmando(false);
    setApagado(true);
    window.setTimeout(() => setApagado(false), 1800);
  };

  return (
    <div className="space-y-4">
      <Cartao>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Preferências</h3>
        <div className="space-y-2">
          <Opcao
            emoji="🔊"
            titulo="Efeitos sonoros"
            descricao="Sons curtos gerados pelo próprio navegador, sem arquivos externos."
            ativo={config.som}
            rotuloAtivo="🔊 Ligado"
            rotuloInativo="🔇 Desligado"
            aoAlternar={() => aoMudarConfig({ som: !config.som })}
          />
          <Opcao
            emoji="✨"
            titulo="Animações"
            descricao="Desative para uma experiência mais estática e com menos movimento."
            ativo={config.animacoes}
            rotuloAtivo="✨ Ativadas"
            rotuloInativo="⏸️ Desativadas"
            aoAlternar={() => aoMudarConfig({ animacoes: !config.animacoes })}
          />
          <Opcao
            emoji="🔆"
            titulo="Alto contraste"
            descricao="Aumenta o contraste dos textos para facilitar a leitura."
            ativo={config.altoContraste}
            rotuloAtivo="🔆 Ativado"
            rotuloInativo="🌙 Padrão"
            aoAlternar={() => aoMudarConfig({ altoContraste: !config.altoContraste })}
          />
        </div>
      </Cartao>

      <Cartao>
        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
          <span aria-hidden="true">💾</span> Dados salvos
        </h3>
        <p className="text-xs leading-relaxed text-slate-400">
          O progresso, as estatísticas e estas preferências ficam guardados apenas no seu navegador (localStorage).
          Nada é enviado pela internet.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Info rotulo="Áreas concluídas" valor={`${totalConcluidas}/4`} cor="text-sky-300" />
          <Info rotulo="Jornadas iniciadas" valor={String(jornadas + 1)} cor="text-slate-100" />
          <Info rotulo="Pontos" valor={String(stats.pontos)} cor="text-amber-300" />
          <Info rotulo="Equilíbrio" valor={String(stats.equilibrio)} cor="text-emerald-300" />
        </div>

        {!persistencia && (
          <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-400/25">
            ⚠️ Seu navegador está bloqueando o armazenamento local (isso é comum em navegação privativa). O jogo
            funciona normalmente, mas o progresso não será mantido ao fechar a aba.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!confirmando ? (
            <Botao variante="perigo" tamanho="sm" onClick={() => setConfirmando(true)}>
              🗑️ Apagar progresso
            </Botao>
          ) : (
            <>
              <span className="text-sm text-rose-200">Apagar tudo e recomeçar?</span>
              <Botao variante="perigo" tamanho="sm" onClick={apagar}>
                Sim, apagar
              </Botao>
              <Botao variante="secundario" tamanho="sm" onClick={() => setConfirmando(false)}>
                Cancelar
              </Botao>
            </>
          )}
          {apagado && <span className="text-sm font-semibold text-emerald-300">✓ Progresso apagado.</span>}
        </div>
      </Cartao>

      <Aviso tom="azul">
        Dica: se você estiver usando um computador compartilhado, pode apagar o progresso ao terminar de jogar.
      </Aviso>
    </div>
  );
}

function Info({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <p className="text-[11px] text-slate-400">{rotulo}</p>
      <p className={`text-lg font-extrabold tabular-nums ${cor}`}>{valor}</p>
    </div>
  );
}
