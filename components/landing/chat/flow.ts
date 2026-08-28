// Roteiro da Nina — portado do protótipo original (index.html) quase 1:1,
// só trocando mutação direta de uma variável global por atualizações
// imutáveis (cada onInput/onOption devolve o pedaço de UserData que mudou).

export interface UserData {
  nome: string;
  tel: string;
  end: string;
  tipo: string;
  visita: string;
  ambiente: string;
  cor: string;
  estilo: string;
  geladeira: string;
  fogao: string;
  outros: string;
  microondas: string;
  coifa: string;
  maquina: string;
  cama: string;
}

export const initialUserData: UserData = {
  nome: "", tel: "", end: "", tipo: "", visita: "", ambiente: "", cor: "",
  estilo: "", geladeira: "", fogao: "", outros: "", microondas: "",
  coifa: "", maquina: "", cama: "",
};

export interface FlowMessage {
  delay: number;
  text: string | ((u: UserData) => string);
}

export interface FlowStep {
  condition?: (u: UserData) => boolean;
  messages: FlowMessage[];
  options?: string[];
  multiSelect?: boolean;
  onOption?: (val: string) => Partial<UserData>;
  input?: boolean;
  inputPlaceholder?: string;
  maxChars?: number;
  onInput?: (val: string) => Partial<UserData>;
  final?: boolean;
}

export const flow: FlowStep[] = [
  {
    messages: [
      { delay: 400, text: "Olá! 🌿 Sou a Nina, assistente da <strong>Novaes Planejados</strong>. Estou aqui para te ajudar a solicitar seu orçamento de móveis planejados." },
      { delay: 1600, text: "Vamos começar? Qual é o seu <strong>nome completo</strong>?" },
    ],
    input: true,
    inputPlaceholder: "Digite seu nome...",
    onInput: (val) => ({ nome: val }),
  },
  {
    messages: [
      { delay: 400, text: (u) => `Prazer, <strong>${u.nome}</strong>! 😊 Agora me passa o seu <strong>número de WhatsApp</strong> com DDD.` },
    ],
    input: true,
    inputPlaceholder: "(21) 99999-9999",
    maxChars: 15,
    onInput: (val) => ({ tel: val }),
  },
  {
    messages: [
      { delay: 400, text: "Perfeito! Agora preciso do seu <strong>endereço completo</strong> — rua, número, bairro e cidade — para verificar se conseguimos atender sua região." },
    ],
    input: true,
    inputPlaceholder: "Ex: Rua das Flores, 123 — Campo Grande, RJ",
    onInput: (val) => ({ end: val }),
  },
  {
    messages: [
      { delay: 400, text: "Anotado! E esse endereço é de <strong>apartamento ou casa</strong>?" },
    ],
    options: ["🏠 Casa", "🏢 Apartamento"],
    onOption: (val) => ({ tipo: val }),
  },
  {
    messages: [
      { delay: 400, text: "Certo! Me conta: qual <strong>ambiente</strong> você quer planejar? (pode escolher mais de um)" },
    ],
    options: ["🍳 Cozinha", "🛏 Quarto", "🛋 Sala", "🫧 Banheiro", "👕 Lavanderia", "💼 Escritório"],
    multiSelect: true,
    onOption: (val) => ({ ambiente: val }),
  },
  // --- CONDICIONAIS DA COZINHA ---
  {
    condition: (u) => u.ambiente.includes("Cozinha"),
    messages: [
      { delay: 400, text: "Como você selecionou <strong>Cozinha</strong>, vamos planejar os espaços dos eletrodomésticos. Qual é o modelo da sua <strong>geladeira</strong>? (ex: Brastemp 400L duplex)" },
    ],
    input: true,
    inputPlaceholder: "Marca e modelo da geladeira...",
    onInput: (val) => ({ geladeira: val }),
  },
  {
    condition: (u) => u.ambiente.includes("Cozinha"),
    messages: [
      { delay: 400, text: "E o <strong>fogão ou cooktop</strong>? (ex: Electrolux 5 bocas, embutir)" },
    ],
    input: true,
    inputPlaceholder: "Modelo do fogão/cooktop...",
    onInput: (val) => ({ fogao: val }),
  },
  {
    condition: (u) => u.ambiente.includes("Cozinha"),
    messages: [
      { delay: 400, text: "Tem <strong>microondas ou coifa</strong> para incluir no projeto da cozinha?" },
    ],
    options: ["Sim, tenho microondas", "Sim, tenho coifa", "Tenho os dois", "Não por enquanto"],
    onOption: (val) => ({ outros: val }),
  },
  {
    condition: (u) => u.ambiente.includes("Cozinha") && (u.outros.includes("microondas") || u.outros.includes("dois")),
    messages: [
      { delay: 400, text: "Qual é a marca e o modelo do seu <strong>microondas</strong>? (ex: Electrolux 31L de embutir)" },
    ],
    input: true,
    inputPlaceholder: "Modelo do microondas...",
    onInput: (val) => ({ microondas: val }),
  },
  {
    condition: (u) => u.ambiente.includes("Cozinha") && (u.outros.includes("coifa") || u.outros.includes("dois")),
    messages: [
      { delay: 400, text: "E sobre a <strong>coifa ou depurador</strong>, qual é o modelo? (ex: Tramontina 90cm parede)" },
    ],
    input: true,
    inputPlaceholder: "Modelo da coifa...",
    onInput: (val) => ({ coifa: val }),
  },
  // --- CONDICIONAIS DO QUARTO ---
  {
    condition: (u) => u.ambiente.includes("Quarto"),
    messages: [
      { delay: 400, text: "Como você selecionou <strong>Quarto</strong>, qual é o tamanho da sua <strong>cama</strong>?" },
    ],
    options: ["Solteiro", "Casal", "Viúva", "Queen", "King"],
    onOption: (val) => ({ cama: val }),
  },
  {
    condition: (u) => u.ambiente.includes("Quarto"),
    messages: [
      { delay: 400, text: "Perfeito! Fique totalmente à vontade para nos enviar as medidas detalhadas do quarto depois pelo WhatsApp." },
    ],
    options: ["Combinado! 👍"],
    onOption: () => ({}),
  },
  // --- CONDICIONAIS DA LAVANDERIA ---
  {
    condition: (u) => u.ambiente.includes("Lavanderia"),
    messages: [
      { delay: 400, text: "Como você selecionou <strong>Lavanderia</strong>, qual é o modelo da sua <strong>máquina de lavar</strong>? (ex: Samsung Lava e Seca 11kg frontal)" },
    ],
    input: true,
    inputPlaceholder: "Modelo da máquina de lavar...",
    onInput: (val) => ({ maquina: val }),
  },
  // --- PASSOS GERAIS FINAIS ---
  {
    messages: [
      { delay: 400, text: "Entendido! E qual <strong>estilo</strong> mais combina com você para esse projeto?" },
    ],
    options: ["✨ Moderno e clean", "🤍 Minimalista branco", "🖤 Escuro e sofisticado", "🌿 Natural e acolhedor", "💡 Não sei ainda, preciso de inspiração!"],
    onOption: (val) => ({ estilo: val }),
  },
  {
    messages: [
      { delay: 400, text: "Você tem alguma <strong>cor em mente</strong> para os móveis?" },
    ],
    options: ["⬜ Branco", "🩶 Cinza / Grafite", "🤎 Madeira / Natural", "🖤 Preto", "💚 Verde / Sage", "🎨 Ainda não sei"],
    onOption: (val) => ({ cor: val }),
  },
  {
    messages: [
      { delay: 600, text: "Ótimo! ✦ Nossos especialistas adoram fazer uma <strong>visita técnica</strong> para tomar as medidas com precisão e te mostrar nosso catálogo de cores pessoalmente. Você gostaria de agendar?" },
    ],
    options: ["✅ Sim, quero agendar visita", "📱 Prefiro enviar as informações online"],
    onOption: (val) => ({ visita: val.includes("Sim") ? "Sim" : "Não" }),
  },
  {
    messages: [
      { delay: 1000, text: "🌟 Incrível! Já organizamos toda a estrutura básica do projeto." },
      { delay: 1000, text: (u) => `Vou gerar agora o resumo do seu pedido, <strong>${u.nome.split(" ")[0]}</strong>. Você poderá revisá-lo e enviar diretamente para nossa equipe!` },
    ],
    final: true,
  },
];

// Índice do passo do flow -> índice visual na barra lateral (0-5).
export const SIDEBAR_STEP_MAP: Record<number, number> = {
  0: 0, 1: 0,
  2: 1, 3: 1,
  4: 2,
  5: 4, 6: 4, 7: 4, 8: 4, 9: 4,
  10: 4, 11: 4,
  12: 4,
  13: 3, 14: 3, 15: 5, 16: 5,
};
