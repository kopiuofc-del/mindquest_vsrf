/**
 * MENTOR IA — motor 100% LOCAL, sem API, sem servidor, sem internet.
 *
 * O motor combina três camadas para parecer mais inteligente sem sair do
 * dispositivo:
 *
 *   1. Detecção de intenção multilíngue (PT/EN/ES) por palavras-chave
 *      ponderadas. As palavras de todos os idiomas são testadas ao mesmo
 *      tempo, então o jogador pode escrever em qualquer um dos três.
 *
 *   2. Contexto da partida: fase visitada, estatísticas, conquistas,
 *      objetos coletados, sequência e progresso. As respostas usam esses
 *      dados como placeholders ({clareza}, {restam}, {faseAtual}...) e
 *      recebem complementos dinâmicos (ex.: sinaliza estresse alto).
 *
 *   3. Memória curta de conversa: um histórico de intenções recentes
 *      evita repetir a mesma frase logo em seguida.
 *
 * Segurança: educativo, nunca diagnostica, nunca substitui profissionais,
 * nunca sugere medicação e não traz conteúdo gráfico, de automutilação
 * ou suicídio.
 */

import type { AreaId, Estatisticas } from "./tipos";

/* ══════════════════ IDIOMAS ══════════════════ */

export type Idioma = "pt" | "en" | "es";

export const IDIOMAS: { id: Idioma; nome: string; flag: string }[] = [
  { id: "pt", nome: "Português", flag: "🇧🇷" },
  { id: "en", nome: "English", flag: "🇺🇸" },
  { id: "es", nome: "Español", flag: "🇪🇸" },
];

/** Remove acentos, pontuação e coloca em minúsculas com espaços nas bordas. */
export function normalizar(texto: string): string {
  return (
    " " +
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿¡?!.,;:()"'`´]/g, " ")
      .replace(/\s+/g, " ")
      .trim() +
    " "
  );
}

/** Marcadores curtos para detectar o idioma do texto. */
const MARCADORES_IDIOMA: Record<Idioma, string[]> = {
  pt: [
    "voce", "vc ", " nao ", "esta ", "estou", " meu ", " minha ", "fase", "obrigad",
    " ola ", " oi ", "como funciona", "quanto tempo", "ja terminei", "por que",
    " qual ", " ganho ", " perdi ", " agora ", " ainda ", "significa", "consegui",
  ],
  en: [
    " you ", " the ", " what ", " why ", " how ", " are ", " am ", " my ", " i ",
    "i'm", "how do", "what is", "points", "phase", "goal", "hello", "hi ", "thanks",
    "thank", "means", "should", "can i", "did i", "help",
  ],
  es: [
    " que ", " como ", "por que", " tu ", " estas ", " mi ", " hola ", "gracias",
    "jugar", "juego", "puntos", " fase ", " ahora ", " ya ", "significa", "hago",
    "cual ", "cómo",
  ],
};

/** Devolve o idioma mais provável do texto ou o idioma padrão. */
export function detectarIdioma(texto: string, padrao: Idioma = "pt"): Idioma {
  const t = normalizar(texto);
  let melhor: Idioma = padrao;
  let maior = 0;
  (Object.keys(MARCADORES_IDIOMA) as Idioma[]).forEach((id) => {
    let s = 0;
    for (const p of MARCADORES_IDIOMA[id]) if (t.includes(p)) s += p.trim().length;
    if (s > maior) {
      maior = s;
      melhor = id;
    }
  });
  return maior === 0 ? padrao : melhor;
}

/* ══════════════════ INTENÇÕES ══════════════════ */

export type Intent =
  // Convívio
  | "saudacao"
  | "agradecimento"
  | "quem_e_vc"
  // Meta / regras
  | "objetivo"
  | "o_que_faco"
  | "como_pontos"
  | "perdi_pontos"
  | "como_fase"
  | "terminei"
  | "o_que_falta"
  | "desbloquear"
  | "voltar_fase"
  | "reiniciar"
  | "configuracoes"
  | "duracao"
  | "conquistas"
  | "exploracao"
  // Significado das estatísticas
  | "significado_clareza"
  | "significado_estresse"
  | "significado_equilibrio"
  | "significado_pontos"
  // Diagnóstico do jogo
  | "estatistica_baixa"
  | "estatistica_alta"
  | "estresse_jogo"
  // Dicas por fase
  | "dica_area1"
  | "dica_area2"
  | "dica_area3"
  | "dica_area4"
  // Temas educativos do dia a dia
  | "preocupacao_vida"
  | "cansaco_vida"
  | "organizacao_vida"
  | "amigos_familia"
  | "apoio_profissional"
  // Fallback
  | "desconhecido";

type MarcadoresIntent = { pt?: string[]; en?: string[]; es?: string[] };

/** Palavras-chave por intenção, em cada idioma. */
const INTENCOES: Record<Intent, MarcadoresIntent> = {
  saudacao: {
    pt: ["ola ", " oi ", "bom dia", "boa tarde", "boa noite", "e ai "],
    en: ["hello", "hi ", "hey ", "good morning", "good evening"],
    es: ["hola", "buen dia", "buenas"],
  },
  agradecimento: {
    pt: ["obrigado", "obrigada", "valeu"],
    en: ["thanks", "thank you", "thx"],
    es: ["gracias"],
  },
  quem_e_vc: {
    pt: ["quem e voce", "quem e vc", "voce e uma ia", "voce e humano"],
    en: ["who are you", "are you an ai", "are you human"],
    es: ["quien eres", "eres humano", "eres una ia"],
  },
  objetivo: {
    pt: ["meu objetivo", "qual e o objetivo", "objetivo do jogo", "objetivo do mindquest", "o que preciso fazer", "para que serve o jogo", "sobre o que e o jogo"],
    en: ["my goal", "the goal", "objective", "what do i need to do", "what is this game about"],
    es: ["mi objetivo", "el objetivo", "para que sirve el juego", "de que trata el juego"],
  },
  o_que_faco: {
    pt: ["o que eu faco", "o que faco agora", "o que devo fazer", "e agora", "estou perdido"],
    en: ["what do i do", "what should i do", "what now", "i'm stuck"],
    es: ["que hago", "que hago ahora", "que deberia hacer", "estoy perdido"],
  },
  como_pontos: {
    pt: ["como ganho pontos", "como ganhar mais pontos", "como consigo pontos", "mais pontos", "como pontuar"],
    en: ["how do i earn points", "how to get points", "how to score", "more points"],
    es: ["como gano puntos", "como conseguir puntos", "mas puntos"],
  },
  perdi_pontos: {
    pt: ["perdi pontos", "por que perdi", "meus pontos caiu", "pontos diminuiram"],
    en: ["why did i lose points", "lost points", "i lost points"],
    es: ["perdi puntos", "por que perdi puntos"],
  },
  como_fase: {
    pt: ["como funciona essa fase", "como funciona a fase", "como jogar essa fase", "essa fase e diferente"],
    en: ["how does this phase work", "how does this area work", "how do i play this phase"],
    es: ["como funciona esta fase", "como se juega esta fase"],
  },
  terminei: {
    pt: ["ja terminei", "ja acabei", "e o final", "e o fim"],
    en: ["did i finish", "am i done", "is this the end"],
    es: ["ya termine", "ya acabe", "es el final"],
  },
  o_que_falta: {
    pt: ["o que falta", "falta muito", "quanto falta", "estou perto do fim"],
    en: ["what is left", "whats left", "what's left", "how much is left", "am i close", "how much left"],
    es: ["que falta", "cuanto falta", "estoy cerca del final"],
  },
  desbloquear: {
    pt: ["como desbloqueio", "esta bloqueada", "como abrir a area", "como abrir a fase"],
    en: ["how do i unlock", "it's locked", "how to open the area"],
    es: ["como desbloqueo", "esta bloqueada", "como abrir el area"],
  },
  voltar_fase: {
    pt: ["posso voltar", "voltar para uma fase", "refazer fase", "jogar de novo a fase"],
    en: ["can i go back", "replay the phase", "redo the area"],
    es: ["puedo volver", "rehacer la fase", "jugar de nuevo la fase"],
  },
  reiniciar: {
    pt: ["como reinicio", "reiniciar o jogo", "comecar de novo", "resetar", "apagar progresso"],
    en: ["how do i restart", "reset", "start over", "delete progress"],
    es: ["como reinicio", "empezar de nuevo", "resetear", "borrar progreso"],
  },
  configuracoes: {
    pt: ["como mudo o som", "desligar som", "desligar animacoes", "configuracoes"],
    en: ["how do i change sound", "turn off sound", "settings"],
    es: ["como cambio el sonido", "apagar sonido", "configuracion"],
  },
  duracao: {
    pt: ["quanto tempo dura", "quanto tempo leva", "quanto dura o jogo"],
    en: ["how long does it take", "how long is the game"],
    es: ["cuanto dura", "cuanto tiempo lleva"],
  },
  conquistas: {
    pt: ["o que sao conquistas", "como pego conquistas", "como desbloqueio conquistas"],
    en: ["what are achievements", "how do i get achievements"],
    es: ["que son los logros", "como consigo logros"],
  },
  exploracao: {
    pt: ["o que sao os objetos", "para que servem os objetos", "encontrei um objeto", "exploracao"],
    en: ["what are the objects", "found an object", "exploration"],
    es: ["que son los objetos", "encontre un objeto", "exploracion"],
  },
  significado_clareza: {
    pt: ["o que e clareza", "o que significa clareza", "para que serve clareza"],
    en: ["what is clarity", "what does clarity mean"],
    es: ["que es claridad", "que significa claridad"],
  },
  significado_estresse: {
    pt: ["o que e estresse", "o que significa estresse", "para que serve estresse"],
    en: ["what is stress", "what does stress mean"],
    es: ["que es estres", "que significa estres"],
  },
  significado_equilibrio: {
    pt: ["o que e equilibrio", "o que significa equilibrio", "para que serve equilibrio"],
    en: ["what is balance", "what does balance mean"],
    es: ["que es equilibrio", "que significa equilibrio"],
  },
  significado_pontos: {
    pt: ["o que sao os pontos", "para que servem os pontos", "para que serve a pontuacao"],
    en: ["what are the points", "what is the score for"],
    es: ["que son los puntos", "para que sirven los puntos"],
  },
  estatistica_baixa: {
    pt: ["equilibrio esta baixo", "por que meu equilibrio", "clareza baixa", "por que minha clareza"],
    en: ["balance is low", "why is my balance low", "clarity is low", "why is my clarity low"],
    es: ["equilibrio esta bajo", "por que mi equilibrio", "claridad esta baja"],
  },
  estatistica_alta: {
    pt: ["estresse esta alto", "por que meu estresse", "estresse subiu"],
    en: ["stress is high", "why is my stress high", "stress went up"],
    es: ["estres esta alto", "por que mi estres", "estres subio"],
  },
  estresse_jogo: {
    pt: ["muito estresse no jogo", "o jogo esta me estressando", "estou estressado no jogo"],
    en: ["too much stress in the game", "the game is stressing me"],
    es: ["mucho estres en el juego", "el juego me estresa"],
  },
  dica_area1: {
    pt: ["vale da preocupacao", "dica do vale"],
    en: ["valley of worry", "worry valley hint"],
    es: ["valle de la preocupacion"],
  },
  dica_area2: {
    pt: ["cidade do estresse", "dica da cidade"],
    en: ["city of stress"],
    es: ["ciudad del estres"],
  },
  dica_area3: {
    pt: ["labirinto da concentracao", "dica do labirinto", "jogo da memoria"],
    en: ["focus labyrinth", "memory game"],
    es: ["laberinto de la concentracion"],
  },
  dica_area4: {
    pt: ["jardim do equilibrio", "dica do jardim"],
    en: ["garden of balance"],
    es: ["jardin del equilibrio"],
  },
  preocupacao_vida: {
    pt: ["estou preocupado", "estou ansioso", "muita ansiedade", "com medo"],
    en: ["i am worried", "i am anxious", "i feel scared"],
    es: ["estoy preocupado", "estoy ansioso", "tengo miedo"],
  },
  cansaco_vida: {
    pt: ["estou cansado", "muito cansado", "sem energia", "esgotado"],
    en: ["i am tired", "very tired", "no energy", "exhausted"],
    es: ["estoy cansado", "muy cansado", "sin energia"],
  },
  organizacao_vida: {
    pt: ["minha rotina bagunca", "muitas tarefas", "nao consigo me organizar", "estou desorganizado"],
    en: ["my routine is a mess", "too many tasks", "i can't organize"],
    es: ["mi rutina es un desastre", "muchas tareas", "no puedo organizarme"],
  },
  amigos_familia: {
    pt: ["briguei com amigo", "problema em casa", "briga com a mae", "briga com o pai"],
    en: ["fought with a friend", "problem at home", "argued with mom"],
    es: ["me pelee con un amigo", "problema en casa"],
  },
  apoio_profissional: {
    pt: ["preciso de ajuda", "com quem posso falar", "psicologo", "profissional de saude"],
    en: ["i need help", "who can i talk to", "psychologist"],
    es: ["necesito ayuda", "con quien puedo hablar", "psicologo"],
  },
  desconhecido: {},
};

/* ══════════════════ RESPOSTAS ══════════════════ */

type RespostasTri = Record<Idioma, string[]>;

/**
 * Templates de resposta por intenção, em três idiomas.
 * Placeholders disponíveis:
 *   {clareza} {estresse} {equilibrio} {pontos}
 *   {concluidas} {restam} {proxima} {faseAtual}
 */
const RESPOSTAS: Record<Intent, RespostasTri> = {
  saudacao: {
    pt: [
      "Olá! Eu sou o Mentor do MindQuest. Posso explicar as fases, os pontos ou as estatísticas — pergunte à vontade.",
      "Oi! Você já está com {pontos} pontos e {concluidas} de 4 áreas concluídas. Em que posso ajudar?",
    ],
    en: [
      "Hi! I am the MindQuest Mentor. I can explain phases, points and stats — ask away.",
      "Hello! You already have {pontos} points and {concluidas} of 4 areas done. How can I help?",
    ],
    es: [
      "¡Hola! Soy el Mentor de MindQuest. Puedo explicar las fases, los puntos o las estadísticas.",
      "¡Hola! Ya tienes {pontos} puntos y {concluidas} de 4 áreas completadas. ¿En qué te ayudo?",
    ],
  },
  agradecimento: {
    pt: ["De nada! Se surgir outra dúvida sobre o jogo, é só chamar.", "Fico feliz em ajudar. Boa jornada por aí!"],
    en: ["You're welcome! If another question comes up, just ask.", "Glad to help. Enjoy the journey!"],
    es: ["¡De nada! Si aparece otra duda del juego, avísame.", "Con gusto. ¡Buena jornada!"],
  },
  quem_e_vc: {
    pt: [
      "Sou um personagem do MindQuest, um assistente educativo que roda no seu próprio aparelho — sem internet, sem servidor.",
      "Sou o Mentor: um sistema local que responde a partir do que está acontecendo na sua partida. Não substituo profissionais.",
    ],
    en: [
      "I'm a MindQuest character, an educational assistant that runs on your device — no internet, no server.",
      "I'm the Mentor: a local system that answers based on your current game. I don't replace professionals.",
    ],
    es: [
      "Soy un personaje de MindQuest, un asistente educativo que corre en tu dispositivo, sin internet.",
      "Soy el Mentor: un sistema local que responde según tu partida. No sustituyo a profesionales.",
    ],
  },
  objetivo: {
    pt: [
      "O objetivo é atravessar as 4 áreas da jornada. Suas escolhas mudam 🧠 Clareza, ⚡ Estresse e 🌱 Equilíbrio. Você está em {concluidas}/4.",
      "Você percorre Vale → Cidade → Labirinto → Jardim. No fim, o jogo calcula um Equilíbrio final a partir das suas estatísticas.",
    ],
    en: [
      "The goal is to cross 4 areas. Your choices change 🧠 Clarity, ⚡ Stress and 🌱 Balance. You are at {concluidas}/4.",
      "You go through Valley → City → Labyrinth → Garden. At the end, the game shows a final Balance based on your stats.",
    ],
    es: [
      "El objetivo es cruzar las 4 áreas. Tus elecciones cambian 🧠 Claridad, ⚡ Estrés y 🌱 Equilibrio. Vas por {concluidas}/4.",
      "Recorres Valle → Ciudad → Laberinto → Jardín. Al final, el juego calcula un Equilibrio final con tus estadísticas.",
    ],
  },
  o_que_faco: {
    pt: [
      "Agora vale abrir o Mapa e entrar em {proxima}. Você tem {clareza} de Clareza, {estresse} de Estresse e {equilibrio} de Equilíbrio.",
      "Próximo passo: {proxima}. Ainda faltam {restam} área(s) para chegar ao final.",
    ],
    en: [
      "Now open the Map and enter {proxima}. You have {clareza} Clarity, {estresse} Stress and {equilibrio} Balance.",
      "Next step: {proxima}. {restam} area(s) left to reach the end.",
    ],
    es: [
      "Ahora abre el Mapa y entra en {proxima}. Tienes {clareza} de Claridad, {estresse} de Estrés y {equilibrio} de Equilibrio.",
      "Siguiente paso: {proxima}. Faltan {restam} área(s) para el final.",
    ],
  },
  como_pontos: {
    pt: [
      "Ganha pontos ao escolher (~2–10), concluir fases (~10–20), explorar objetos (~1–5) e desbloquear conquistas (~10–25). Seu total: {pontos}.",
      "Escolhas de cuidado somam mais, e o combo 🔥 dá +2 a +4 extras. Você está com {pontos} pontos.",
    ],
    en: [
      "You earn points by choosing (~2–10), finishing phases (~10–20), exploring objects (~1–5) and unlocking achievements (~10–25). Total: {pontos}.",
      "Caring choices score more, and the 🔥 combo adds +2 to +4. You have {pontos} points.",
    ],
    es: [
      "Ganas puntos al elegir (~2–10), completar fases (~10–20), explorar objetos (~1–5) y logros (~10–25). Total: {pontos}.",
      "Las elecciones de cuidado suman más y el combo 🔥 da +2 a +4 extra. Tienes {pontos} puntos.",
    ],
  },
  perdi_pontos: {
    pt: [
      "Pontos não caem no MindQuest — o mínimo é 0. Se ganhou pouco, provavelmente foi uma escolha de impulso, que rende só ~5–10.",
      "O contador de pontos nunca fica negativo. O que muda para baixo com escolhas ruins é a 🧠 Clareza e o 🌱 Equilíbrio.",
    ],
    en: [
      "Points don't go down here — minimum is 0. If you earned little, it was likely an impulse choice, worth ~5–10.",
      "Score never turns negative. Bad choices lower 🧠 Clarity and 🌱 Balance instead.",
    ],
    es: [
      "Los puntos no bajan — el mínimo es 0. Si ganaste poco, fue una elección de impulso, vale ~5–10.",
      "El puntaje nunca es negativo. Las malas elecciones bajan 🧠 Claridad y 🌱 Equilibrio.",
    ],
  },
  como_fase: {
    pt: ["Você está em {faseAtual}. Cada área tem uma mecânica própria — se quiser detalhes, pergunte pela área.", "Nesta fase ({faseAtual}), cada ação altera suas estatísticas na hora."],
    en: ["You're at {faseAtual}. Each area has its own mechanic — ask by area for details.", "In this phase ({faseAtual}), every action updates your stats instantly."],
    es: ["Estás en {faseAtual}. Cada área tiene su mecánica — pregunta por el área para detalles.", "En esta fase ({faseAtual}), cada acción cambia tus estadísticas al instante."],
  },
  terminei: {
    pt: ["Você concluiu {concluidas} de 4 áreas. {restam} área(s) restante(s).", "Ainda não! Faltam {restam} área(s) — a próxima é {proxima}."],
    en: ["You completed {concluidas} of 4 areas. {restam} area(s) to go.", "Not yet! {restam} area(s) left — next is {proxima}."],
    es: ["Completaste {concluidas} de 4 áreas. Faltan {restam}.", "Aún no. Faltan {restam} área(s) — la siguiente es {proxima}."],
  },
  o_que_falta: {
    pt: ["Faltam {restam} área(s). Próxima: {proxima}.", "Você está com {concluidas}/4. Se quiser fechar rápido, siga para {proxima}."],
    en: ["{restam} area(s) left. Next: {proxima}.", "You're at {concluidas}/4. To finish fast, head to {proxima}."],
    es: ["Faltan {restam} área(s). Siguiente: {proxima}.", "Vas {concluidas}/4. Para terminar rápido, ve a {proxima}."],
  },
  desbloquear: {
    pt: ["Cada área abre quando você conclui a anterior. Você já concluiu {concluidas}, então a próxima liberada é {proxima}.", "Áreas travadas aparecem com 🔒. Termine a atual para abrir a próxima."],
    en: ["Each area opens when you finish the previous one. You've done {concluidas}, so next is {proxima}.", "Locked areas show 🔒. Finish the current one to open the next."],
    es: ["Cada área se abre al terminar la anterior. Completaste {concluidas}, sigue {proxima}.", "Las áreas bloqueadas muestran 🔒. Termina la actual para abrir la siguiente."],
  },
  voltar_fase: {
    pt: ["Sim! Depois de concluir uma área, ela fica marcada com ✓ e você pode jogar de novo pelo Mapa.", "Áreas concluídas ficam sempre acessíveis. Basta abrir o Mapa e tocar nela."],
    en: ["Yes! Once an area is done, it gets a ✓ and you can replay it from the Map.", "Completed areas stay accessible. Just open the Map and tap them."],
    es: ["¡Sí! Al completar un área queda con ✓ y puedes jugarla otra vez desde el Mapa.", "Las áreas completadas siguen accesibles desde el Mapa."],
  },
  reiniciar: {
    pt: ["Para recomeçar a jornada, use o botão \"Jogar novamente\" na tela final. Para apagar todo o progresso, vá em ⚙️ Configurações → Apagar progresso.", "Você pode recomeçar sem apagar o histórico: as conquistas ficam guardadas mesmo em uma nova jornada."],
    en: ["To restart the journey, use \"Play again\" on the final screen. To erase all progress, go to ⚙️ Settings → Erase progress.", "You can start over without wiping data: achievements survive a new journey."],
    es: ["Para reiniciar la jornada, usa \"Jugar de nuevo\" en la pantalla final. Para borrar todo, ve a ⚙️ Configuración → Borrar progreso.", "Puedes empezar de nuevo sin perder logros — estos se guardan entre jornadas."],
  },
  configuracoes: {
    pt: ["Em ⚙️ Configurações você liga/desliga som, animações e alto contraste. Também dá para apagar o progresso.", "O botão 🔊/🔇 no topo alterna o som na hora. As outras opções ficam em Configurações."],
    en: ["In ⚙️ Settings you toggle sound, animations and high contrast. You can also erase progress there.", "The 🔊/🔇 button on top toggles sound. Other options are in Settings."],
    es: ["En ⚙️ Configuración cambias sonido, animaciones y alto contraste. También borras el progreso.", "El botón 🔊/🔇 alterna el sonido al instante. Las demás opciones están en Configuración."],
  },
  duracao: {
    pt: ["Uma partida completa leva cerca de 3 a 5 minutos.", "É rápido: dá para terminar em menos de 5 minutos."],
    en: ["A full run takes about 3 to 5 minutes.", "It's quick — you can finish in under 5 minutes."],
    es: ["Una partida completa dura unos 3 a 5 minutos.", "Es rápido: se termina en menos de 5 minutos."],
  },
  conquistas: {
    pt: ["Conquistas são medalhas do jogo (🏆 Primeira Jornada, 🧠 Mente Atenta, 🌱 Equilíbrio, ⭐ Explorador, 🎯 Foco Total). Ficam salvas no seu aparelho.", "Você desbloqueia conquistas ao concluir fases, explorar objetos e ter boa precisão na memória."],
    en: ["Achievements are game badges (🏆 First Journey, 🧠 Sharp Mind, 🌱 Balance, ⭐ Explorer, 🎯 Total Focus). Saved on your device.", "You unlock them by finishing phases, exploring objects and getting good memory accuracy."],
    es: ["Los logros son medallas (🏆 Primera Jornada, 🧠 Mente Atenta, 🌱 Equilibrio, ⭐ Explorador, 🎯 Enfoque Total). Se guardan en tu dispositivo.", "Se desbloquean al terminar fases, explorar objetos y tener buena precisión en la memoria."],
  },
  exploracao: {
    pt: ["Os objetos do Mapa são opcionais: cada um dá +2 pontos e uma dica curta. Você já encontrou {clareza} — ops, quer dizer {pontos} pontos totais.", "Explorar é rápido: um toque em cada objeto do Mapa vale pontos e uma frase educativa."],
    en: ["Map objects are optional: each gives +2 points and a short tip. You currently have {pontos} points.", "Exploration is quick: one tap per object on the Map for points and a short educational line."],
    es: ["Los objetos del Mapa son opcionales: cada uno da +2 puntos y una pista corta. Tienes {pontos} puntos.", "Explorar es rápido: un toque en cada objeto del Mapa da puntos y una frase educativa."],
  },
  significado_clareza: {
    pt: [
      "🧠 Clareza (agora em {clareza}/100) é o quanto seus pensamentos estão organizados no jogo. Sobe com escolhas ponderadas.",
      "Clareza representa atenção e tomada de decisão — só métrica do jogo, não é diagnóstico. Sua Clareza: {clareza}/100.",
    ],
    en: [
      "🧠 Clarity (currently {clareza}/100) is how organized your thoughts are in-game. It rises with thoughtful choices.",
      "Clarity means attention and decision-making — game metric only, not a diagnosis. Yours: {clareza}/100.",
    ],
    es: [
      "🧠 Claridad (ahora en {clareza}/100) es qué tan organizados están tus pensamientos en el juego. Sube con elecciones cuidadosas.",
      "Claridad es atención y decisión — solo métrica del juego, no diagnóstico. La tuya: {clareza}/100.",
    ],
  },
  significado_estresse: {
    pt: ["⚡ Estresse é a pressão acumulada nos desafios. Vai de 0 a 100; quanto menor, melhor. O seu: {estresse}/100.", "Estresse sobe com escolhas de impulso e cai com pausas e organização. Métrica do jogo, não avaliação real."],
    en: ["⚡ Stress is the pressure built up in challenges (0–100). Lower is better. Yours: {estresse}/100.", "Stress rises with impulsive choices and falls with breaks and organization. Game metric, not real assessment."],
    es: ["⚡ Estrés es la presión acumulada en los desafíos (0–100). Cuanto menor, mejor. El tuyo: {estresse}/100.", "El estrés sube con impulsos y baja con pausas y organización. Métrica del juego, no evaluación real."],
  },
  significado_equilibrio: {
    pt: ["🌱 Equilíbrio combina organização, descanso e boas escolhas. Vai de 0 a 100. O seu: {equilibrio}/100.", "Equilíbrio sobe quando você faz escolhas de cuidado nas quatro áreas. É a nota que mais conta no final."],
    en: ["🌱 Balance combines organization, rest and good choices (0–100). Yours: {equilibrio}/100.", "Balance rises with caring choices across all four areas. It's the score that matters most at the end."],
    es: ["🌱 Equilibrio combina organización, descanso y buenas elecciones (0–100). El tuyo: {equilibrio}/100.", "El equilibrio sube con elecciones de cuidado en las cuatro áreas. Es lo que más pesa al final."],
  },
  significado_pontos: {
    pt: ["⭐ Pontos são recompensas do jogo, de 0 a 9999. Somam a cada ação — não substituem as três métricas de 0 a 100.", "Pontos ficam sempre em 0 ou mais. Total atual: {pontos}."],
    en: ["⭐ Points are game rewards from 0 to 9999. They add up per action, separate from the three 0–100 metrics.", "Points never go below 0. Current: {pontos}."],
    es: ["⭐ Los puntos son recompensas del juego (0–9999). Se suman por acción, separados de las tres métricas 0–100.", "Los puntos nunca bajan de 0. Total: {pontos}."],
  },
  estatistica_baixa: {
    pt: ["Sua Clareza está em {clareza} e o Equilíbrio em {equilibrio}. Escolhas de cuidado somam pontos e sobem esses valores.", "Para elevar essas métricas, prefira opções que envolvam pausa, organização ou conversar — cada área tem pelo menos uma."],
    en: ["Your Clarity is {clareza} and Balance {equilibrio}. Caring choices raise both.", "To raise them, pick options about pausing, organizing or talking — each area has at least one."],
    es: ["Tu Claridad es {clareza} y tu Equilibrio {equilibrio}. Las elecciones de cuidado los elevan.", "Para subirlas, elige opciones de pausa, organización o conversar — cada área tiene al menos una."],
  },
  estatistica_alta: {
    pt: ["Seu Estresse está em {estresse}. Escolhas de impulso costumam ser as culpadas — a próxima decisão de cuidado já ajuda a baixar.", "Estresse alto ({estresse}) reduz o Equilíbrio final. Uma pausa ou uma conversa dentro da fase alivia."],
    en: ["Your Stress is {estresse}. Impulsive choices usually cause it — the next caring choice already brings it down.", "High stress ({estresse}) lowers final Balance. A pause or a talk inside the phase eases it."],
    es: ["Tu Estrés es {estresse}. Los impulsos suelen ser la causa — la próxima elección de cuidado ya ayuda a bajarlo.", "Estrés alto ({estresse}) baja el Equilibrio final. Una pausa o conversar dentro de la fase alivia."],
  },
  estresse_jogo: {
    pt: ["Se o jogo está pesado, você pode pausar a fase, respirar e voltar. Nenhuma fase tem tempo obrigatório correndo contra você.", "Não existe pressa: você pode voltar ao Menu e retomar depois. As estatísticas ficam salvas."],
    en: ["If the game feels heavy, you can pause the phase, breathe and come back. No phase runs a mandatory clock.", "There's no rush: go to the Menu and come back later. Stats are saved."],
    es: ["Si el juego se siente pesado, pausa la fase, respira y vuelve. Ninguna fase corre un reloj obligatorio.", "No hay prisa: puedes volver al Menú y retomar. Las estadísticas se guardan."],
  },
  dica_area1: {
    pt: ["🌫️ Vale da Preocupação: 3 situações rápidas. Leia com calma e escolha o que ajuda mais — as respostas trocam de posição a cada partida.", "No Vale, escolhas de cuidado somam ~25 pontos. Escolhas de impulso somam pouco e aumentam o Estresse."],
    en: ["🌫️ Valley of Worry: 3 quick situations. Read calmly and pick what helps most — options shuffle each run.", "In the Valley, caring choices score ~25. Impulse ones score less and raise Stress."],
    es: ["🌫️ Valle de la Preocupación: 3 situaciones rápidas. Lee con calma; las opciones se mezclan cada partida.", "En el Valle, las elecciones de cuidado dan ~25 puntos. Las impulsivas dan menos y suben el Estrés."],
  },
  dica_area2: {
    pt: ["⚡ Cidade do Estresse: distribua 6 blocos de tempo entre 6 áreas do dia. O melhor é 1 em cada — evita desequilíbrio.", "Na Cidade, deixar uma área com 0 blocos custa nota. Toque uma vez em cada e ajuste no fim."],
    en: ["⚡ City of Stress: split 6 time blocks across 6 areas. Best is 1 each — avoids imbalance.", "In the City, leaving an area with 0 blocks costs points. Tap once in each, then adjust."],
    es: ["⚡ Ciudad del Estrés: reparte 6 bloques entre 6 áreas del día. Lo ideal: 1 en cada una.", "En la Ciudad, dejar un área en 0 baja la nota. Toca cada una una vez y ajusta al final."],
  },
  dica_area3: {
    pt: ["🧩 Labirinto: memória com 6 pares no padrão. Menos tentativas = mais bônus. Existe uma Dica opcional que já dá +3.", "No Labirinto, calma rende mais que velocidade. O bônus de precisão pode dobrar seus pontos."],
    en: ["🧩 Labyrinth: memory with 6 pairs by default. Fewer tries = more bonus. There's an optional Hint worth +3.", "In the Labyrinth, calm beats speed. The accuracy bonus can double your score."],
    es: ["🧩 Laberinto: memoria con 6 pares por defecto. Menos intentos = más bonus. Hay una pista opcional (+3).", "En el Laberinto, la calma vale más que la prisa. El bonus por precisión puede duplicar puntos."],
  },
  dica_area4: {
    pt: ["🌱 Jardim: toque nos 5 elementos para ler mensagens curtas. Cada um dá pontos e a área conclui quando você vê todos.", "No Jardim é só explorar. Depois dele, você chega à tela final da jornada."],
    en: ["🌱 Garden: tap the 5 elements to read short messages. Each gives points; the area completes when you see all.", "In the Garden you just explore. After it, you reach the journey's final screen."],
    es: ["🌱 Jardín: toca los 5 elementos para leer mensajes cortos. Cada uno da puntos; el área se completa al ver todos.", "En el Jardín solo explora. Después llegas a la pantalla final."],
  },
  preocupacao_vida: {
    pt: ["Preocupação é comum e passageira. Uma pergunta útil: o que depende de mim agora? Anote um passo pequeno e adie o resto.", "Falar sobre a preocupação com alguém de confiança organiza a cabeça — inclusive antes de decidir qualquer coisa."],
    en: ["Worry is common and passing. A useful question: what depends on me right now? Note one small step and defer the rest.", "Talking about the worry with someone you trust organizes your mind — even before deciding anything."],
    es: ["La preocupación es común y pasajera. Pregúntate: ¿qué depende de mí ahora? Anota un paso pequeño y aplaza el resto.", "Hablar la preocupación con alguien de confianza ordena la cabeza, incluso antes de decidir."],
  },
  cansaco_vida: {
    pt: ["Cansaço é um sinal, não um defeito. Vale checar sono, alimentação e pausas antes de se cobrar mais.", "Se o cansaço durar bastante, converse com um adulto de confiança ou procure um serviço de saúde."],
    en: ["Tiredness is a signal, not a flaw. Check sleep, meals and breaks before pushing yourself further.", "If tiredness lasts, talk to a trusted adult or seek a health service."],
    es: ["El cansancio es una señal, no un defecto. Revisa sueño, comidas y pausas antes de exigirte más.", "Si el cansancio dura mucho, habla con un adulto de confianza o busca un servicio de salud."],
  },
  organizacao_vida: {
    pt: ["Tire as tarefas da cabeça e coloque no papel. Escolha só três prioridades para hoje — o resto pode esperar.", "Dividir uma tarefa grande em partes pequenas costuma render bem mais do que tentar tudo de uma vez."],
    en: ["Get tasks out of your head and onto paper. Pick only three priorities for today — the rest can wait.", "Splitting a big task into small parts usually works better than trying everything at once."],
    es: ["Saca las tareas de la cabeza y ponlas en papel. Elige solo tres prioridades hoy — el resto puede esperar.", "Dividir una tarea grande en partes pequeñas rinde más que intentar todo de una vez."],
  },
  amigos_familia: {
    pt: ["Conflitos são normais. Espere a emoção baixar, diga o que sentiu usando \"eu senti…\" e ouça o outro lado antes de concluir.", "Se ficar pesado, peça a mediação de um adulto de confiança. Falar sobre ajuda quase sempre."],
    en: ["Conflicts are normal. Let emotion settle, say what you felt using \"I felt…\" and hear the other side first.", "If it gets heavy, ask a trusted adult to mediate. Talking about it almost always helps."],
    es: ["Los conflictos son normales. Deja bajar la emoción, di lo que sentiste con \"yo sentí…\" y escucha primero.", "Si pesa mucho, pide la mediación de un adulto de confianza. Hablarlo casi siempre ayuda."],
  },
  apoio_profissional: {
    pt: ["Pedir ajuda é inteligente. Escolha uma pessoa de confiança — família, professor, orientador — e conte o que está acontecendo. Serviços de saúde da escola também podem apoiar.", "Eu sou só um personagem do jogo e não substituo psicólogos, médicos ou adultos de confiança. Se algo está difícil, procure alguém real."],
    en: ["Asking for help is smart. Pick someone you trust — family, teacher, counselor — and tell them. School health services can also support.", "I'm just a game character and don't replace psychologists, doctors or trusted adults. If things are hard, reach a real person."],
    es: ["Pedir ayuda es inteligente. Elige a alguien de confianza — familia, docente, orientador — y cuéntale. Los servicios escolares también ayudan.", "Solo soy un personaje del juego y no sustituyo a psicólogos, médicos ni adultos de confianza. Si algo cuesta, busca a alguien real."],
  },
  desconhecido: {
    pt: [
      "Não entendi direito, mas posso ajudar com o jogo. Tente perguntar sobre: objetivo, pontos, uma das fases (Vale, Cidade, Labirinto, Jardim), Clareza, Estresse ou Equilíbrio.",
      "Sou um assistente do jogo. Que tal me perguntar \"o que eu faço?\", \"como ganho pontos?\" ou \"o que significa Clareza?\"",
    ],
    en: [
      "I didn't quite catch that, but I can help with the game. Try asking about: goal, points, one of the phases (Valley, City, Labyrinth, Garden), Clarity, Stress or Balance.",
      "I'm a game assistant. Try asking \"what do I do?\", \"how do I earn points?\" or \"what does Clarity mean?\"",
    ],
    es: [
      "No lo entendí bien, pero puedo ayudar con el juego. Pregunta por: objetivo, puntos, una fase (Valle, Ciudad, Laberinto, Jardín), Claridad, Estrés o Equilibrio.",
      "Soy un asistente del juego. Prueba \"¿qué hago?\", \"¿cómo gano puntos?\" o \"¿qué significa Claridad?\"",
    ],
  },
};

/* ══════════════════ CONTEXTO E PLACEHOLDERS ══════════════════ */

export type ContextoMentor = {
  /** Última tela de gameplay visitada (mapa/area1..area4). */
  ultimaFase: "mapa" | "area1" | "area2" | "area3" | "area4" | null;
  stats: Estatisticas;
  concluidas: AreaId[];
  conquistas: string[];
  objetos: string[];
  jornadas: number;
  sequencia: number;
  melhorSequencia: number;
};

const NOMES_FASES: Record<Idioma, string[]> = {
  pt: ["Vale da Preocupação", "Cidade do Estresse", "Labirinto da Concentração", "Jardim do Equilíbrio"],
  en: ["Valley of Worry", "City of Stress", "Focus Labyrinth", "Garden of Balance"],
  es: ["Valle de la Preocupación", "Ciudad del Estrés", "Laberinto de la Concentración", "Jardín del Equilibrio"],
};

const NOME_MAPA: Record<Idioma, string> = { pt: "Mapa da Jornada", en: "Journey Map", es: "Mapa del Viaje" };
const NOME_FIM: Record<Idioma, string> = { pt: "o final da jornada", en: "the journey's end", es: "el final del viaje" };

/** Substitui os placeholders pelos dados reais do contexto. */
function preencher(texto: string, ctx: ContextoMentor, idioma: Idioma): string {
  const restantes = ([1, 2, 3, 4] as AreaId[]).filter((id) => !ctx.concluidas.includes(id));
  const proxima = restantes[0] ? NOMES_FASES[idioma][restantes[0] - 1] : NOME_FIM[idioma];
  const faseAtual = nomeFaseAtual(ctx.ultimaFase, idioma);

  return texto
    .replace(/\{clareza\}/g, String(ctx.stats.clareza))
    .replace(/\{estresse\}/g, String(ctx.stats.estresse))
    .replace(/\{equilibrio\}/g, String(ctx.stats.equilibrio))
    .replace(/\{pontos\}/g, String(ctx.stats.pontos))
    .replace(/\{concluidas\}/g, String(ctx.concluidas.length))
    .replace(/\{restam\}/g, String(4 - ctx.concluidas.length))
    .replace(/\{proxima\}/g, proxima)
    .replace(/\{faseAtual\}/g, faseAtual);
}

function nomeFaseAtual(fase: ContextoMentor["ultimaFase"], idioma: Idioma): string {
  if (fase === "area1") return NOMES_FASES[idioma][0];
  if (fase === "area2") return NOMES_FASES[idioma][1];
  if (fase === "area3") return NOMES_FASES[idioma][2];
  if (fase === "area4") return NOMES_FASES[idioma][3];
  return NOME_MAPA[idioma];
}

/* ══════════════════ DETECÇÃO DE INTENÇÃO ══════════════════ */

/**
 * Detecta a intenção mais provável. Palavras-chave de todos os idiomas são
 * testadas, então o jogador pode escrever em qualquer um dos três.
 */
export function detectarIntent(texto: string): Intent {
  const t = normalizar(texto);
  if (!t.trim()) return "desconhecido";

  let melhor: Intent = "desconhecido";
  let maior = 0;

  (Object.keys(INTENCOES) as Intent[]).forEach((intent) => {
    if (intent === "desconhecido") return;
    const marcadores = INTENCOES[intent];
    let pontuacao = 0;
    for (const lang of ["pt", "en", "es"] as Idioma[]) {
      const lista = marcadores[lang] ?? [];
      for (const kw of lista) {
        if (t.includes(kw)) {
          // Peso: tamanho + bônus por expressão multipalavra.
          pontuacao += kw.trim().length + (kw.trim().includes(" ") ? 6 : 0);
        }
      }
    }
    if (pontuacao > maior) {
      maior = pontuacao;
      melhor = intent;
    }
  });

  return melhor;
}

/**
 * Refina a intenção usando pistas do contexto.
 * Ex.: se a pergunta cita "clareza" mas o jogador escreveu "está baixa", vira
 * "estatistica_baixa" em vez de "significado_clareza".
 */
function refinarIntent(intent: Intent, texto: string, ctx: ContextoMentor): Intent {
  const t = normalizar(texto);

  const citaBaixa = /(bai(x|j)|low|baja)/.test(t);
  const citaAlta = /(alt|high)/.test(t);

  if (["significado_clareza", "significado_equilibrio"].includes(intent) && citaBaixa) return "estatistica_baixa";
  if (intent === "significado_estresse" && citaAlta) return "estatistica_alta";

  // Se está no meio de uma fase e pergunta "como funciona", direciona para a dica da fase.
  if (intent === "como_fase" && ctx.ultimaFase) {
    if (ctx.ultimaFase === "area1") return "dica_area1";
    if (ctx.ultimaFase === "area2") return "dica_area2";
    if (ctx.ultimaFase === "area3") return "dica_area3";
    if (ctx.ultimaFase === "area4") return "dica_area4";
  }
  return intent;
}

/* ══════════════════ COMPLEMENTOS CONTEXTUAIS ══════════════════ */

const COMPLEMENTOS: Record<Idioma, { estresseAlto: string; clarezaBaixa: string; quaseFim: string; conquista: string }> = {
  pt: {
    estresseAlto: "Como o seu Estresse está em {estresse}, uma pausa antes da próxima escolha pode ajudar.",
    clarezaBaixa: "Sua Clareza está em {clareza} — organizar em passos pequenos costuma subir esse número.",
    quaseFim: "Falta só {restam} área para você fechar a jornada!",
    conquista: "🔥 Você está em uma boa sequência: cada nova escolha de cuidado vale bônus.",
  },
  en: {
    estresseAlto: "Since your Stress is at {estresse}, a pause before the next choice may help.",
    clarezaBaixa: "Your Clarity is {clareza} — organizing in small steps usually raises it.",
    quaseFim: "Only {restam} area left to finish the journey!",
    conquista: "🔥 You're on a streak: each new caring choice grants a bonus.",
  },
  es: {
    estresseAlto: "Como tu Estrés está en {estresse}, una pausa antes de la próxima elección puede ayudar.",
    clarezaBaixa: "Tu Claridad es {clareza} — organizar en pasos pequeños suele subirla.",
    quaseFim: "¡Solo queda {restam} área para terminar el viaje!",
    conquista: "🔥 Estás en buena racha: cada nueva elección de cuidado da bonus.",
  },
};

function complemento(intent: Intent, ctx: ContextoMentor, idioma: Idioma): string {
  const c = COMPLEMENTOS[idioma];
  const restam = 4 - ctx.concluidas.length;

  // Alerta de estresse alto em intenções de ajuda/decisão.
  if (["o_que_faco", "objetivo", "estatistica_alta", "estresse_jogo"].includes(intent) && ctx.stats.estresse >= 70) {
    return c.estresseAlto;
  }
  // Alerta de clareza baixa nas mesmas.
  if (["o_que_faco", "objetivo", "estatistica_baixa"].includes(intent) && ctx.stats.clareza <= 30) {
    return c.clarezaBaixa;
  }
  // Convite para fechar a jornada.
  if (["o_que_faco", "o_que_falta", "terminei"].includes(intent) && restam === 1) {
    return c.quaseFim;
  }
  // Reforço de sequência.
  if (intent === "como_pontos" && ctx.sequencia >= 2) {
    return c.conquista;
  }
  return "";
}

/* ══════════════════ RESPOSTA (com variação) ══════════════════ */

export type Resposta = { intent: Intent; texto: string; idioma: Idioma };

/**
 * Gera a resposta do Mentor.
 * @param texto        pergunta do jogador
 * @param idioma       idioma escolhido para a resposta
 * @param ctx          contexto da partida
 * @param historico    intenções já usadas na conversa (para não repetir)
 */
export function responder(
  texto: string,
  idioma: Idioma,
  ctx: ContextoMentor,
  historico: Intent[] = [],
): Resposta {
  const bruta = detectarIntent(texto);
  const intent = refinarIntent(bruta, texto, ctx);

  const opcoes = RESPOSTAS[intent]?.[idioma] ?? RESPOSTAS.desconhecido[idioma];

  // Variação: percorre as opções em ordem para não repetir a mesma frase logo em
  // seguida quando a mesma intenção reaparece.
  const ocorrencias = historico.filter((i) => i === intent).length;
  const indice = opcoes.length > 0 ? ocorrencias % opcoes.length : 0;

  let corpo = opcoes[indice];
  const extra = complemento(intent, ctx, idioma);
  if (extra) corpo = corpo + " " + extra;

  return { intent, texto: preencher(corpo, ctx, idioma), idioma };
}

/* ══════════════════ SUGESTÕES E NOMES ══════════════════ */

export const SUGESTOES: Record<Idioma, string[]> = {
  pt: [
    "Qual é o meu objetivo?",
    "O que eu faço agora?",
    "Como ganho mais pontos?",
    "O que significa Clareza?",
    "Por que meu equilíbrio está baixo?",
    "Como funciona essa fase?",
    "Já terminei?",
    "Preciso de ajuda, com quem posso falar?",
  ],
  en: [
    "What is my goal?",
    "What do I do now?",
    "How do I earn more points?",
    "What does Clarity mean?",
    "Why is my balance low?",
    "How does this phase work?",
    "Am I done?",
    "I need help — who can I talk to?",
  ],
  es: [
    "¿Cuál es mi objetivo?",
    "¿Qué hago ahora?",
    "¿Cómo gano más puntos?",
    "¿Qué significa Claridad?",
    "¿Por qué mi equilibrio está bajo?",
    "¿Cómo funciona esta fase?",
    "¿Ya terminé?",
    "Necesito ayuda, ¿con quién puedo hablar?",
  ],
};

export const NOME_INTENT: Record<Idioma, Partial<Record<Intent, string>>> = {
  pt: {
    saudacao: "Saudação",
    agradecimento: "Obrigado",
    objetivo: "Objetivo",
    o_que_faco: "Próximo passo",
    como_pontos: "Pontos",
    perdi_pontos: "Pontos",
    como_fase: "Fase",
    terminei: "Progresso",
    o_que_falta: "Progresso",
    desbloquear: "Desbloqueio",
    voltar_fase: "Fases",
    reiniciar: "Reiniciar",
    configuracoes: "Configurações",
    duracao: "Duração",
    conquistas: "Conquistas",
    exploracao: "Exploração",
    significado_clareza: "Clareza",
    significado_estresse: "Estresse",
    significado_equilibrio: "Equilíbrio",
    significado_pontos: "Pontos",
    estatistica_baixa: "Estatística",
    estatistica_alta: "Estatística",
    estresse_jogo: "Estresse do jogo",
    dica_area1: "Vale",
    dica_area2: "Cidade",
    dica_area3: "Labirinto",
    dica_area4: "Jardim",
    preocupacao_vida: "Preocupação",
    cansaco_vida: "Cansaço",
    organizacao_vida: "Organização",
    amigos_familia: "Convívio",
    apoio_profissional: "Apoio",
    quem_e_vc: "Mentor",
    desconhecido: "Dica geral",
  },
  en: {
    saudacao: "Greeting",
    agradecimento: "Thanks",
    objetivo: "Goal",
    o_que_faco: "Next step",
    como_pontos: "Points",
    perdi_pontos: "Points",
    como_fase: "Phase",
    terminei: "Progress",
    o_que_falta: "Progress",
    desbloquear: "Unlock",
    voltar_fase: "Phases",
    reiniciar: "Restart",
    configuracoes: "Settings",
    duracao: "Duration",
    conquistas: "Achievements",
    exploracao: "Exploration",
    significado_clareza: "Clarity",
    significado_estresse: "Stress",
    significado_equilibrio: "Balance",
    significado_pontos: "Points",
    estatistica_baixa: "Stat",
    estatistica_alta: "Stat",
    estresse_jogo: "Game stress",
    dica_area1: "Valley",
    dica_area2: "City",
    dica_area3: "Labyrinth",
    dica_area4: "Garden",
    preocupacao_vida: "Worry",
    cansaco_vida: "Tiredness",
    organizacao_vida: "Organizing",
    amigos_familia: "People",
    apoio_profissional: "Support",
    quem_e_vc: "Mentor",
    desconhecido: "General tip",
  },
  es: {
    saudacao: "Saludo",
    agradecimento: "Gracias",
    objetivo: "Objetivo",
    o_que_faco: "Siguiente paso",
    como_pontos: "Puntos",
    perdi_pontos: "Puntos",
    como_fase: "Fase",
    terminei: "Progreso",
    o_que_falta: "Progreso",
    desbloquear: "Desbloqueo",
    voltar_fase: "Fases",
    reiniciar: "Reiniciar",
    configuracoes: "Configuración",
    duracao: "Duración",
    conquistas: "Logros",
    exploracao: "Exploración",
    significado_clareza: "Claridad",
    significado_estresse: "Estrés",
    significado_equilibrio: "Equilibrio",
    significado_pontos: "Puntos",
    estatistica_baixa: "Estadística",
    estatistica_alta: "Estadística",
    estresse_jogo: "Estrés del juego",
    dica_area1: "Valle",
    dica_area2: "Ciudad",
    dica_area3: "Laberinto",
    dica_area4: "Jardín",
    preocupacao_vida: "Preocupación",
    cansaco_vida: "Cansancio",
    organizacao_vida: "Organización",
    amigos_familia: "Convivencia",
    apoio_profissional: "Apoyo",
    quem_e_vc: "Mentor",
    desconhecido: "Consejo",
  },
};

/** Contagem total de respostas-base (todas as intenções × todos os idiomas). */
export function totalRespostas(): number {
  return Object.values(RESPOSTAS).reduce(
    (soma, tri) => soma + Object.values(tri).reduce((s, lista) => s + lista.length, 0),
    0,
  );
}

/** Contagem de intenções únicas. */
export function totalIntencoes(): number {
  return Object.keys(RESPOSTAS).length;
}
