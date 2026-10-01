import type { Estatisticas } from "./tipos";

export type Conquista = {
  id: string;
  emoji: string;
  titulo: string;
  descricao: string;
};

export const CONQUISTAS: Conquista[] = [
  { id: "primeira", emoji: "🏆", titulo: "Primeira Jornada", descricao: "Complete a primeira fase." },
  { id: "mente", emoji: "🧠", titulo: "Mente Atenta", descricao: "Complete o desafio de concentração." },
  { id: "equilibrio", emoji: "🌱", titulo: "Equilíbrio", descricao: "Finalize o jogo com equilíbrio a partir de 70." },
  { id: "explorador", emoji: "⭐", titulo: "Explorador", descricao: "Encontre 3 objetos no mapa." },
  { id: "foco", emoji: "🎯", titulo: "Foco Total", descricao: "Complete a memória com boa precisão." },
];

export function conquistaPorId(id: string) {
  return CONQUISTAS.find((c) => c.id === id);
}

export type ObjetoMapa = {
  id: string;
  emoji: string;
  nome: string;
  mensagem: string;
  x: number;
  y: number;
};

export const OBJETOS: ObjetoMapa[] = [
  { id: "arvore", emoji: "🌳", nome: "Árvore", mensagem: "Pequenas pausas ajudam a organizar a rotina.", x: 7, y: 10 },
  { id: "livro", emoji: "📖", nome: "Livro", mensagem: "Anotar uma ideia tira peso da cabeça.", x: 50, y: 8 },
  { id: "banco", emoji: "🪑", nome: "Banco", mensagem: "Sentar um minuto já conta como descanso.", x: 93, y: 12 },
  { id: "fonte", emoji: "💧", nome: "Fonte", mensagem: "Beber água ajuda a manter a atenção.", x: 8, y: 90 },
  { id: "relogio", emoji: "⏰", nome: "Relógio", mensagem: "Dividir o tempo evita fazer tudo de uma vez.", x: 50, y: 92 },
  { id: "lampada", emoji: "💡", nome: "Lâmpada", mensagem: "Uma tarefa pequena já é um começo.", x: 93, y: 88 },
  { id: "planta", emoji: "🌱", nome: "Planta", mensagem: "Hábitos crescem quando se repetem aos poucos.", x: 93, y: 46 },
  { id: "simbolo", emoji: "🧩", nome: "Símbolo", mensagem: "Concentração melhora com calma, não com pressa.", x: 7, y: 48 },
];

/** Mostra 4 objetos diferentes a cada semente — exploração opcional. */
export function objetosDaSemente(semente: number): ObjetoMapa[] {
  const inicio = Math.abs(semente) % OBJETOS.length;
  return [0, 1, 2, 3].map((i) => OBJETOS[(inicio + i * 2) % OBJETOS.length]);
}

export type Evento = { id: string; emoji: string; titulo: string; texto: string; pontos: number };

export const EVENTOS: Evento[] = [
  { id: "atalho", emoji: "🌿", titulo: "Caminho alternativo", texto: "Um atalho lembra: nem tudo precisa ser resolvido do jeito mais pesado.", pontos: 5 },
  { id: "mentor", emoji: "🤖", titulo: "O Mentor aparece", texto: "Se quiser, converse com o Mentor depois. Ele é um extra, não uma etapa obrigatória.", pontos: 3 },
  { id: "desafio", emoji: "✨", titulo: "Desafio rápido", texto: "Respire uma vez antes da próxima escolha. Isso já conta como cuidado.", pontos: 5 },
  { id: "objeto", emoji: "💎", titulo: "Achado do caminho", texto: "Você notou um detalhe do mapa. Observar também é jogar.", pontos: 3 },
];

export function eventoDaSemente(semente: number): Evento {
  return EVENTOS[Math.abs(semente) % EVENTOS.length];
}

/** Mensagem educativa da tela final. Não diagnostica. */
export function mensagemFinal(stats: Estatisticas, sequencia: number): string {
  if (stats.equilibrio >= 75 && stats.estresse <= 35) {
    return "Sua jornada teve bastante espaço para pausa, organização e cuidado. Equilíbrio se treina repetindo esses passos pequenos.";
  }
  if (stats.clareza >= 70) {
    return "Você organizou bem as escolhas. Clareza cresce quando a tarefa é dividida e quando se pede ajuda.";
  }
  if (sequencia >= 3) {
    return "Sua sequência de cuidados mostra constância. Não precisa acertar tudo: manter o ritmo já faz diferença.";
  }
  return "Cada fase mostrou um jeito diferente de cuidar da rotina. Na próxima jornada, experimente outras escolhas — o mapa muda um pouco.";
}

export function formatarDelta(e: Partial<Estatisticas>, bonus = 0): string[] {
  const linhas: string[] = [];
  if (e.clareza) linhas.push(`🧠 ${e.clareza > 0 ? "+" : ""}${e.clareza}`);
  if (e.estresse) linhas.push(`⚡ ${e.estresse > 0 ? "+" : ""}${e.estresse}`);
  if (e.equilibrio) linhas.push(`🌱 ${e.equilibrio > 0 ? "+" : ""}${e.equilibrio}`);
  const pontos = (e.pontos ?? 0) + bonus;
  if (pontos) linhas.push(`⭐ ${pontos > 0 ? "+" : ""}${pontos}`);
  return linhas;
}
