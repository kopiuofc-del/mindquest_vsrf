import type { Estatisticas } from "../jogo/tipos";
import { Barra, Cartao } from "../ui/componentes";

/**
 * HUD do jogador: mostra Clareza, Estresse, Equilíbrio e Pontos.
 * - `variante="painel"`: cartão completo, usado no mapa.
 * - `variante="faixa"`: linha compacta, usada dentro das áreas.
 * - `variante="nu"`: só as barras, sem cartão (usado na tela final).
 */
export default function HUD({
  stats,
  variante = "painel",
}: {
  stats: Estatisticas;
  variante?: "painel" | "faixa" | "nu";
}) {
  const barras = (
    <div className={`grid gap-3 ${variante === "faixa" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
      <Barra
        rotulo="🧠 Clareza"
        valor={stats.clareza}
        cor="bg-gradient-to-r from-sky-400 to-cyan-300"
        compacta={variante === "faixa"}
        comMaximo
      />
      <Barra
        rotulo="⚡ Estresse"
        valor={stats.estresse}
        cor="bg-gradient-to-r from-amber-400 to-rose-500"
        invertida
        compacta={variante === "faixa"}
        comMaximo
      />
      <Barra
        rotulo="🌱 Equilíbrio"
        valor={stats.equilibrio}
        cor="bg-gradient-to-r from-emerald-400 to-teal-300"
        compacta={variante === "faixa"}
        comMaximo
      />
      <div className="flex items-end justify-between gap-2 rounded-lg bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
        <span className="text-xs font-medium text-slate-300">⭐ Pontos</span>
        <span className="tabular-nums text-lg font-extrabold leading-none text-amber-300">
          {Math.max(0, Math.min(9999, Math.round(Number.isFinite(stats.pontos) ? stats.pontos : 0)))}
        </span>
      </div>
    </div>
  );

  if (variante === "nu") return barras;

  return (
    <Cartao>
      {variante === "painel" && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Status do jogador</h3>
          <span className="text-xs text-slate-500">valores de 0 a 100</span>
        </div>
      )}
      {barras}
    </Cartao>
  );
}
