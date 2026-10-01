/**
 * Efeitos sonoros curtos gerados pelo próprio navegador (WebAudio).
 * Não carrega nenhum arquivo externo. Se o navegador não suportar,
 * falha em silêncio e o jogo continua funcionando normalmente.
 */

type Construtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const W = window as unknown as { AudioContext?: Construtor; webkitAudioContext?: Construtor };
    const C = W.AudioContext ?? W.webkitAudioContext;
    if (!C) return null;
    if (!ctx) ctx = new C();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export type Som = "clique" | "abrir" | "bom" | "ruim" | "conquista";

const PRESETS: Record<Som, { notas: number[]; dur: number; tipo: OscillatorType; vol: number }> = {
  clique: { notas: [440], dur: 0.05, tipo: "triangle", vol: 0.045 },
  abrir: { notas: [392, 587], dur: 0.1, tipo: "sine", vol: 0.05 },
  bom: { notas: [523, 784], dur: 0.12, tipo: "sine", vol: 0.055 },
  ruim: { notas: [300, 200], dur: 0.14, tipo: "sine", vol: 0.045 },
  conquista: { notas: [523, 659, 784, 1047], dur: 0.14, tipo: "sine", vol: 0.055 },
};

export function tocar(som: Som, ligado: boolean): void {
  if (!ligado) return;
  const c = contexto();
  if (!c) return;
  try {
    const p = PRESETS[som];
    p.notas.forEach((freq, i) => {
      const osc = c.createOscillator();
      const ganho = c.createGain();
      osc.type = p.tipo;
      osc.frequency.value = freq;
      const t0 = c.currentTime + i * p.dur;
      ganho.gain.setValueAtTime(0.0001, t0);
      ganho.gain.exponentialRampToValueAtTime(p.vol, t0 + 0.01);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur);
      osc.connect(ganho);
      ganho.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + p.dur + 0.02);
    });
  } catch {
    /* sem áudio: o jogo segue normalmente */
  }
}
