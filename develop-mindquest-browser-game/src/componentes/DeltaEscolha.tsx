import type { Efeito } from "../jogo/tipos";

/** Reação rápida da escolha: números curtos, sem tela de vitória/derrota. */
export default function DeltaEscolha({
  efeito,
  bonus,
  sequencia,
}: {
  efeito: Efeito | null;
  bonus?: number;
  sequencia?: number;
}) {
  if (!efeito) return null;
  const pontos = (efeito.pontos ?? 0) + (bonus ?? 0);
  const itens = [
    efeito.clareza ? { t: `🧠 ${efeito.clareza > 0 ? "+" : ""}${efeito.clareza}`, bom: efeito.clareza > 0 } : null,
    efeito.estresse ? { t: `⚡ ${efeito.estresse > 0 ? "+" : ""}${efeito.estresse}`, bom: efeito.estresse < 0 } : null,
    efeito.equilibrio ? { t: `🌱 ${efeito.equilibrio > 0 ? "+" : ""}${efeito.equilibrio}`, bom: efeito.equilibrio > 0 } : null,
    pontos ? { t: `⭐ ${pontos > 0 ? "+" : ""}${pontos}`, bom: pontos > 0 } : null,
  ].filter(Boolean) as { t: string; bom: boolean }[];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
      {itens.map((item) => (
        <span
          key={item.t}
          className={`animate-[surgir_0.2s_ease-out] rounded-full px-2.5 py-1 text-xs font-bold ${
            item.bom ? "bg-emerald-500/20 text-emerald-100" : "bg-amber-500/20 text-amber-100"
          }`}
        >
          {item.bom ? "✨ " : "💭 "}
          {item.t}
        </span>
      ))}
      {sequencia && sequencia >= 2 ? (
        <span className="animate-[surgir_0.2s_ease-out] rounded-full bg-orange-500/25 px-2.5 py-1 text-xs font-bold text-orange-100">
          🔥 Sequência x{Math.min(sequencia, 4)}
        </span>
      ) : null}
    </div>
  );
}
