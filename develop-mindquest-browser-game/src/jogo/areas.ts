import type { Area } from "./tipos";

/** As quatro áreas da jornada, na ordem em que são liberadas. */
export const AREAS: Area[] = [
  {
    id: 1,
    tela: "area1",
    emoji: "🌫️",
    nome: "Vale da Preocupação",
    resumo: "3 situações do dia a dia: escolha como reagir.",
    habilidade: "Lidar com preocupações",
    gradiente: "from-slate-500/30 to-slate-800/25",
    anel: "ring-slate-300/40",
    x: 18,
    y: 26,
  },
  {
    id: 2,
    tela: "area2",
    emoji: "⚡",
    nome: "Cidade do Estresse",
    resumo: "Distribua 6 blocos de tempo e equilibre o seu dia.",
    habilidade: "Organização da rotina",
    gradiente: "from-amber-500/30 to-orange-800/25",
    anel: "ring-amber-300/50",
    x: 62,
    y: 20,
  },
  {
    id: 3,
    tela: "area3",
    emoji: "🧩",
    nome: "Labirinto da Concentração",
    resumo: "Jogo da memória: encontre todos os pares.",
    habilidade: "Foco e atenção",
    gradiente: "from-sky-500/30 to-indigo-800/25",
    anel: "ring-sky-300/50",
    x: 30,
    y: 68,
  },
  {
    id: 4,
    tela: "area4",
    emoji: "🌱",
    nome: "Jardim do Equilíbrio",
    resumo: "Toque nos 5 elementos e descubra o que ajuda.",
    habilidade: "Bem-estar e apoio",
    gradiente: "from-emerald-500/30 to-teal-800/25",
    anel: "ring-emerald-300/50",
    x: 76,
    y: 70,
  },
];

export const areaPorId = (id: number) => AREAS.find((a) => a.id === id);
