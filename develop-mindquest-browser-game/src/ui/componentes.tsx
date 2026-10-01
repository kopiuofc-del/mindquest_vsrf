import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

/* ══════════════════ BOTÃO ══════════════════ */

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "fantasma" | "sucesso" | "perigo";
  tamanho?: "sm" | "md" | "lg";
  cheio?: boolean;
};

export function Botao({ variante = "primario", tamanho = "md", cheio, className, ...rest }: BotaoProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold",
        "transition-all duration-150 active:scale-[0.97]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/60",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100",
        tamanho === "sm" && "px-3 py-1.5 text-sm",
        tamanho === "md" && "px-4 py-2.5 text-[0.95rem]",
        tamanho === "lg" && "px-6 py-3.5 text-lg",
        cheio && "w-full",
        variante === "primario" &&
          "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-950/40 hover:from-sky-400 hover:to-indigo-500",
        variante === "secundario" && "bg-white/10 text-slate-100 ring-1 ring-white/20 hover:bg-white/[0.18]",
        variante === "fantasma" && "text-slate-300 hover:bg-white/10 hover:text-white",
        variante === "sucesso" &&
          "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/40 hover:from-emerald-400 hover:to-teal-500",
        variante === "perigo" && "bg-rose-600/90 text-white hover:bg-rose-500",
        className,
      )}
    />
  );
}

/* ══════════════════ CARTÃO ══════════════════ */

export function Cartao({
  children,
  className,
  destaque,
}: {
  children: ReactNode;
  className?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-xl shadow-black/30 backdrop-blur-sm sm:p-5",
        destaque ? "border-sky-400/30 bg-sky-950/40" : "border-white/10 bg-slate-900/60",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ══════════════════ BARRA DE PROGRESSO ══════════════════ */

export function Barra({
  rotulo,
  valor,
  cor,
  invertida,
  compacta,
  comMaximo,
}: {
  rotulo: string;
  valor: number;
  cor: string;
  /** Quando true, valores altos são ruins (ex.: Estresse). */
  invertida?: boolean;
  compacta?: boolean;
  /** Quando true, mostra o valor no formato "XX/100". */
  comMaximo?: boolean;
}) {
  const seguro = Number.isFinite(valor) ? valor : 0;
  const v = Math.max(0, Math.min(100, Math.round(seguro)));
  const alerta = invertida ? v >= 70 : v <= 25;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs font-medium text-slate-300">
        <span className="truncate">{rotulo}</span>
        <span className={cn("tabular-nums font-bold", alerta ? "text-rose-300" : "text-slate-100")}>
          {v}
          {comMaximo && <span className="font-normal text-slate-500">/100</span>}
        </span>
      </div>
      <div
        className={cn("w-full overflow-hidden rounded-full bg-white/10", compacta ? "h-2" : "h-2.5")}
        role="progressbar"
        aria-label={rotulo}
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", cor)} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

/* ══════════════════ ETIQUETA ══════════════════ */

export function Etiqueta({
  children,
  tom = "cinza",
}: {
  children: ReactNode;
  tom?: "cinza" | "verde" | "ambar" | "azul" | "rosa";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        tom === "cinza" && "bg-white/10 text-slate-200",
        tom === "verde" && "bg-emerald-500/20 text-emerald-200",
        tom === "ambar" && "bg-amber-500/20 text-amber-100",
        tom === "azul" && "bg-sky-500/20 text-sky-100",
        tom === "rosa" && "bg-fuchsia-500/20 text-fuchsia-100",
      )}
    >
      {children}
    </span>
  );
}

/* ══════════════════ ESTRUTURA DE TELA ══════════════════ */

export function Tela({
  titulo,
  emoji,
  subtitulo,
  aoVoltar,
  rotuloVoltar = "Voltar",
  direita,
  children,
}: {
  titulo: string;
  emoji?: string;
  subtitulo?: string;
  aoVoltar?: () => void;
  rotuloVoltar?: string;
  direita?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-4xl animate-[surgir_0.3s_ease-out] px-3 pb-24 pt-4 sm:px-4 sm:pt-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {emoji && <span aria-hidden="true">{emoji}</span>}
            <span className="min-w-0">{titulo}</span>
          </h2>
          {subtitulo && <p className="mt-1 text-sm text-slate-400">{subtitulo}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {direita}
          {aoVoltar && (
            <Botao variante="secundario" tamanho="sm" onClick={aoVoltar}>
              ← {rotuloVoltar}
            </Botao>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

/* ══════════════════ AVISO EDUCATIVO ══════════════════ */

export function Aviso({ children, tom = "ambar" }: { children: ReactNode; tom?: "ambar" | "azul" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-xs leading-relaxed",
        tom === "ambar" ? "border-amber-400/25 bg-amber-950/25 text-amber-100/90" : "border-sky-400/25 bg-sky-950/30 text-sky-100/90",
      )}
    >
      {tom === "ambar" ? "⚠️ " : "💡 "}
      {children}
    </div>
  );
}


