import type { ConexaoBot, DefinicaoBot, NoBot, VariavelBot } from "@syncra/shared";
import type { NomeIcone } from "../components/Icon";
import { layoutEmCamadas } from "../lib/layout";

/**
 * Catálogo de DEMONSTRAÇÃO. Os itens são locais e não representam bots
 * publicados; servem para exibir a experiência da vitrine (E7) antes da API.
 * Cada definição passa pelo validador canônico de `@syncra/shared`.
 */

export type CategoriaMarketplace =
  | "Saúde"
  | "Alimentação"
  | "Imóveis"
  | "Varejo"
  | "Educação"
  | "Serviços"
  | "Finanças"
  | "Tecnologia"
  | "Marketing";

export type ItemMarketplace = {
  id: string;
  nome: string;
  autor: string;
  verificado: boolean;
  categoria: CategoriaMarketplace;
  icone: NomeIcone;
  cor: string;
  resumo: string;
  descricao: string;
  destaques: string[];
  precoMensal: number;
  avaliacao: number;
  avaliacoes: number;
  instalacoes: number;
  canais: ("WhatsApp" | "Site" | "Instagram")[];
  emDestaque?: boolean;
  novo?: boolean;
  definicao: DefinicaoBot;
};

type NoSemId = NoBot extends infer T ? (T extends { id: string } ? Omit<T, "id"> : never) : never;

/** Monta uma definição já com as posições distribuídas em camadas. */
function montar(
  nome: string,
  instrucao_global: string,
  variaveis: VariavelBot[],
  nos: Record<string, NoSemId>,
  conexoes: [string, string, string?][],
): DefinicaoBot {
  const listaNos = Object.entries(nos).map(([id, no]) => ({ id, ...no }) as NoBot);
  const listaConexoes: ConexaoBot[] = conexoes.map(([de, para, condicao]) => ({
    de,
    para,
    condicao: condicao ?? null,
  }));
  const definicao: DefinicaoBot = {
    versao_schema: 1,
    nome,
    modelo_padrao: "modelo-rapido",
    instrucao_global,
    no_inicial: listaNos[0]!.id,
    variaveis,
    nos: listaNos,
    conexoes: listaConexoes,
  };
  return { ...definicao, metadados_editor: { posicoes: layoutEmCamadas(definicao) } };
}

const texto = (chave: string, obrigatoria = false): VariavelBot => ({
  chave,
  tipo: "texto",
  obrigatoria,
});

export const ITENS_MARKETPLACE: ItemMarketplace[] = [
  {
    id: "clinica-agendamento",
    nome: "Recepção de Clínica",
    autor: "Syncra Labs",
    verificado: true,
    categoria: "Saúde",
    icone: "stethoscope",
    cor: "#58d6b5",
    resumo: "Triagem, escolha de especialidade e pré-agendamento de consultas.",
    descricao:
      "Atende pacientes 24h, identifica a especialidade desejada, tira dúvidas sobre convênios com IA e coleta o melhor horário para a recepção confirmar.",
    destaques: ["Triagem por especialidade", "Dúvidas de convênio com IA", "Coleta de horário preferido"],
    precoMensal: 49,
    avaliacao: 4.9,
    avaliacoes: 312,
    instalacoes: 2840,
    canais: ["WhatsApp", "Site"],
    emDestaque: true,
    definicao: montar(
      "Recepção de Clínica",
      "Você é a recepcionista virtual de uma clínica. Seja acolhedora e nunca faça diagnósticos.",
      [texto("nome_paciente", true), texto("especialidade"), texto("horario")],
      {
        boas_vindas: { tipo: "mensagem", texto: "Olá! Sou a assistente da Clínica Vida. Vou te ajudar a marcar sua consulta." },
        pergunta_nome: { tipo: "pergunta", texto: "Para começar, qual é o seu nome?", variavel_destino: "nome_paciente" },
        pergunta_especialidade: { tipo: "pergunta", texto: "Prazer, {{nome_paciente}}! Qual especialidade você procura?", variavel_destino: "especialidade" },
        ia_convenio: { tipo: "ia", instrucao: "Explique brevemente como funciona o atendimento de {{especialidade}} e os convênios aceitos.", modelo: "modelo-rapido", usar_historico: true },
        pergunta_horario: { tipo: "pergunta", texto: "Qual o melhor dia e horário para você?", variavel_destino: "horario" },
        tem_horario: { tipo: "condicao", expressao: "horario" },
        confirmacao: { tipo: "mensagem", texto: "Anotado: {{especialidade}} em {{horario}}. A recepção confirma em instantes!" },
        fim: { tipo: "encerramento", texto_final: "Obrigada, {{nome_paciente}}. Até breve!" },
        fim_sem_horario: { tipo: "encerramento", texto_final: "Sem problemas! Quando quiser, é só chamar." },
      },
      [
        ["boas_vindas", "pergunta_nome"],
        ["pergunta_nome", "pergunta_especialidade"],
        ["pergunta_especialidade", "ia_convenio"],
        ["ia_convenio", "pergunta_horario"],
        ["pergunta_horario", "tem_horario"],
        ["tem_horario", "confirmacao", "truthy"],
        ["tem_horario", "fim_sem_horario", "else"],
        ["confirmacao", "fim"],
      ],
    ),
  },
  {
    id: "restaurante-pedidos",
    nome: "Delivery do Restaurante",
    autor: "Syncra Labs",
    verificado: true,
    categoria: "Alimentação",
    icone: "utensils",
    cor: "#f6b963",
    resumo: "Apresenta o cardápio, recebe o pedido e confirma o endereço de entrega.",
    descricao:
      "Ideal para restaurantes e lanchonetes: recomenda pratos com IA, anota o pedido e coleta endereço, liberando a equipe na hora do pico.",
    destaques: ["Recomendação de pratos com IA", "Coleta de endereço", "Resumo do pedido"],
    precoMensal: 0,
    avaliacao: 4.7,
    avaliacoes: 528,
    instalacoes: 6120,
    canais: ["WhatsApp", "Instagram"],
    emDestaque: true,
    definicao: montar(
      "Delivery do Restaurante",
      "Você atende pedidos de um restaurante. Seja simpático e objetivo.",
      [texto("pedido", true), texto("endereco", true)],
      {
        ola: { tipo: "mensagem", texto: "Oi! Bem-vindo ao Sabor da Casa. Hoje temos promoção de massas!" },
        ia_cardapio: { tipo: "ia", instrucao: "Apresente 3 sugestões do cardápio do dia de forma curta e apetitosa.", modelo: "modelo-rapido", usar_historico: false },
        pergunta_pedido: { tipo: "pergunta", texto: "O que vai ser hoje?", variavel_destino: "pedido" },
        pergunta_endereco: { tipo: "pergunta", texto: "Perfeito! Qual o endereço para entrega?", variavel_destino: "endereco" },
        resumo: { tipo: "mensagem", texto: "Pedido: {{pedido}}. Entrega em: {{endereco}}. Tempo estimado: 40 min." },
        fim: { tipo: "encerramento", texto_final: "Pedido confirmado! Bom apetite." },
      },
      [
        ["ola", "ia_cardapio"],
        ["ia_cardapio", "pergunta_pedido"],
        ["pergunta_pedido", "pergunta_endereco"],
        ["pergunta_endereco", "resumo"],
        ["resumo", "fim"],
      ],
    ),
  },
  {
    id: "imobiliaria-leads",
    nome: "Qualificador de Leads Imobiliários",
    autor: "PropTech Studio",
    verificado: true,
    categoria: "Imóveis",
    icone: "building",
    cor: "#59a9ff",
    resumo: "Descobre perfil, bairro e orçamento antes de passar o lead ao corretor.",
    descricao:
      "Qualifica interessados em compra ou locação, entende orçamento e região e entrega ao corretor um lead pronto para visita.",
    destaques: ["Perfil compra x locação", "Faixa de orçamento", "Encaminhamento ao corretor"],
    precoMensal: 79,
    avaliacao: 4.8,
    avaliacoes: 194,
    instalacoes: 1430,
    canais: ["WhatsApp", "Site", "Instagram"],
    emDestaque: true,
    definicao: montar(
      "Qualificador de Leads Imobiliários",
      "Você qualifica leads de uma imobiliária. Faça uma pergunta por vez.",
      [texto("objetivo", true), texto("bairro"), texto("orcamento")],
      {
        ola: { tipo: "mensagem", texto: "Olá! Vou entender o que você procura para indicar os melhores imóveis." },
        pergunta_objetivo: { tipo: "pergunta", texto: "Você quer comprar ou alugar?", variavel_destino: "objetivo" },
        pergunta_bairro: { tipo: "pergunta", texto: "Em qual bairro ou região?", variavel_destino: "bairro" },
        pergunta_orcamento: { tipo: "pergunta", texto: "Qual a sua faixa de orçamento?", variavel_destino: "orcamento" },
        tem_orcamento: { tipo: "condicao", expressao: "orcamento" },
        ia_sugestao: { tipo: "ia", instrucao: "Sugira tipos de imóvel para {{objetivo}} em {{bairro}} até {{orcamento}}.", modelo: "modelo-qualidade", usar_historico: true },
        corretor: { tipo: "mensagem", texto: "Um corretor vai te chamar em até 15 minutos com opções selecionadas." },
        sem_orcamento: { tipo: "mensagem", texto: "Tudo bem! Vou te enviar opções variadas para você comparar." },
        fim: { tipo: "encerramento", texto_final: "Obrigado pelo contato!" },
      },
      [
        ["ola", "pergunta_objetivo"],
        ["pergunta_objetivo", "pergunta_bairro"],
        ["pergunta_bairro", "pergunta_orcamento"],
        ["pergunta_orcamento", "tem_orcamento"],
        ["tem_orcamento", "ia_sugestao", "truthy"],
        ["tem_orcamento", "sem_orcamento", "else"],
        ["ia_sugestao", "corretor"],
        ["corretor", "fim"],
        ["sem_orcamento", "fim"],
      ],
    ),
  },
  {
    id: "ecommerce-pos-venda",
    nome: "Pós-venda de E-commerce",
    autor: "Syncra Labs",
    verificado: true,
    categoria: "Varejo",
    icone: "cart",
    cor: "#a589ff",
    resumo: "Rastreio de pedidos, trocas e devoluções sem fila de atendimento.",
    descricao:
      "Responde as perguntas mais comuns do pós-venda: onde está meu pedido, como trocar e como devolver. Escala para humano quando necessário.",
    destaques: ["Consulta por número do pedido", "Política de trocas com IA", "Escalonamento humano"],
    precoMensal: 0,
    avaliacao: 4.6,
    avaliacoes: 871,
    instalacoes: 9350,
    canais: ["WhatsApp", "Site"],
    definicao: montar(
      "Pós-venda de E-commerce",
      "Você é o suporte de uma loja online. Seja cordial e resolva rápido.",
      [texto("numero_pedido", true), texto("duvida")],
      {
        ola: { tipo: "mensagem", texto: "Oi! Sou o assistente de pós-venda da Loja Aurora." },
        pergunta_pedido: { tipo: "pergunta", texto: "Qual o número do seu pedido?", variavel_destino: "numero_pedido" },
        pergunta_duvida: { tipo: "pergunta", texto: "Como posso ajudar com o pedido {{numero_pedido}}?", variavel_destino: "duvida" },
        ia_resposta: { tipo: "ia", instrucao: "Responda a dúvida sobre o pedido considerando a política de trocas de 30 dias.", modelo: "modelo-rapido", usar_historico: true },
        fim: { tipo: "encerramento", texto_final: "Qualquer coisa, estou por aqui!" },
      },
      [
        ["ola", "pergunta_pedido"],
        ["pergunta_pedido", "pergunta_duvida"],
        ["pergunta_duvida", "ia_resposta"],
        ["ia_resposta", "fim"],
      ],
    ),
  },
  {
    id: "escola-matricula",
    nome: "Matrículas Escolares",
    autor: "EduBots",
    verificado: false,
    categoria: "Educação",
    icone: "cap",
    cor: "#ff9f7a",
    resumo: "Tira dúvidas de matrícula e agenda visita à escola.",
    descricao:
      "Apresenta a escola, coleta série de interesse e agenda uma visita guiada para a família conhecer a estrutura.",
    destaques: ["Apresentação da escola", "Série de interesse", "Agendamento de visita"],
    precoMensal: 0,
    avaliacao: 4.5,
    avaliacoes: 143,
    instalacoes: 980,
    canais: ["WhatsApp"],
    novo: true,
    definicao: montar(
      "Matrículas Escolares",
      "Você atende famílias interessadas em matrícula. Seja acolhedor.",
      [texto("nome_responsavel", true), texto("serie"), texto("quer_visita")],
      {
        ola: { tipo: "mensagem", texto: "Olá! Que bom ter você aqui no Colégio Horizonte." },
        pergunta_nome: { tipo: "pergunta", texto: "Qual o nome do responsável?", variavel_destino: "nome_responsavel" },
        pergunta_serie: { tipo: "pergunta", texto: "Para qual série é a matrícula?", variavel_destino: "serie" },
        ia_info: { tipo: "ia", instrucao: "Apresente diferenciais pedagógicos para a série {{serie}}.", modelo: "modelo-qualidade", usar_historico: false },
        pergunta_visita: { tipo: "pergunta", texto: "Quer agendar uma visita? Diga o melhor dia.", variavel_destino: "quer_visita" },
        decide_visita: { tipo: "condicao", expressao: "quer_visita" },
        visita_ok: { tipo: "mensagem", texto: "Visita agendada para {{quer_visita}}. Enviaremos o endereço!" },
        fim: { tipo: "encerramento", texto_final: "Obrigado, {{nome_responsavel}}!" },
      },
      [
        ["ola", "pergunta_nome"],
        ["pergunta_nome", "pergunta_serie"],
        ["pergunta_serie", "ia_info"],
        ["ia_info", "pergunta_visita"],
        ["pergunta_visita", "decide_visita"],
        ["decide_visita", "visita_ok", "truthy"],
        ["decide_visita", "fim", "else"],
        ["visita_ok", "fim"],
      ],
    ),
  },
  {
    id: "academia-experimental",
    nome: "Aula Experimental na Academia",
    autor: "FitFlow",
    verificado: true,
    categoria: "Serviços",
    icone: "dumbbell",
    cor: "#f18c9a",
    resumo: "Converte curiosos em alunos com aula experimental gratuita.",
    descricao:
      "Descobre o objetivo do aluno, recomenda modalidades com IA e agenda a aula experimental.",
    destaques: ["Objetivo do aluno", "Recomendação de modalidade", "Agenda de aula grátis"],
    precoMensal: 29,
    avaliacao: 4.7,
    avaliacoes: 98,
    instalacoes: 760,
    canais: ["WhatsApp", "Instagram"],
    novo: true,
    definicao: montar(
      "Aula Experimental na Academia",
      "Você é consultor de uma academia. Seja motivador.",
      [texto("objetivo", true), texto("horario")],
      {
        ola: { tipo: "mensagem", texto: "Bora treinar? A primeira aula é por nossa conta!" },
        pergunta_objetivo: { tipo: "pergunta", texto: "Qual o seu objetivo: emagrecer, ganhar massa ou condicionamento?", variavel_destino: "objetivo" },
        ia_modalidade: { tipo: "ia", instrucao: "Recomende 2 modalidades para o objetivo {{objetivo}}.", modelo: "modelo-rapido", usar_historico: false },
        pergunta_horario: { tipo: "pergunta", texto: "Qual horário fica melhor para a aula experimental?", variavel_destino: "horario" },
        fim: { tipo: "encerramento", texto_final: "Aula marcada para {{horario}}. Traga uma garrafinha de água!" },
      },
      [
        ["ola", "pergunta_objetivo"],
        ["pergunta_objetivo", "ia_modalidade"],
        ["ia_modalidade", "pergunta_horario"],
        ["pergunta_horario", "fim"],
      ],
    ),
  },
  {
    id: "oficina-orcamento",
    nome: "Orçamento de Oficina",
    autor: "AutoBots",
    verificado: false,
    categoria: "Serviços",
    icone: "car",
    cor: "#7fd3ff",
    resumo: "Coleta modelo do carro e sintomas para gerar pré-orçamento.",
    descricao:
      "Entende o problema do veículo, coleta modelo e ano e envia uma estimativa inicial gerada por IA para o cliente.",
    destaques: ["Diagnóstico inicial", "Pré-orçamento com IA", "Agendamento de vistoria"],
    precoMensal: 0,
    avaliacao: 4.4,
    avaliacoes: 61,
    instalacoes: 410,
    canais: ["WhatsApp"],
    definicao: montar(
      "Orçamento de Oficina",
      "Você atende clientes de uma oficina mecânica. Não prometa valores exatos.",
      [texto("modelo_carro", true), texto("sintoma", true)],
      {
        ola: { tipo: "mensagem", texto: "Olá! Oficina Pit Stop, vamos cuidar do seu carro." },
        pergunta_modelo: { tipo: "pergunta", texto: "Qual o modelo e ano do veículo?", variavel_destino: "modelo_carro" },
        pergunta_sintoma: { tipo: "pergunta", texto: "O que está acontecendo com ele?", variavel_destino: "sintoma" },
        ia_estimativa: { tipo: "ia", instrucao: "Dê uma estimativa inicial para {{sintoma}} em {{modelo_carro}}, deixando claro que depende de vistoria.", modelo: "modelo-qualidade", usar_historico: true },
        fim: { tipo: "encerramento", texto_final: "Te esperamos para a vistoria gratuita!" },
      },
      [
        ["ola", "pergunta_modelo"],
        ["pergunta_modelo", "pergunta_sintoma"],
        ["pergunta_sintoma", "ia_estimativa"],
        ["ia_estimativa", "fim"],
      ],
    ),
  },
  {
    id: "financeiro-cobranca",
    nome: "Cobrança Amigável",
    autor: "FinAssist",
    verificado: true,
    categoria: "Finanças",
    icone: "wallet",
    cor: "#63d7ad",
    resumo: "Lembra vencimentos e negocia parcelamento com empatia.",
    descricao:
      "Reduz inadimplência com lembretes cordiais, oferta de segunda via e proposta de parcelamento conduzida pela IA.",
    destaques: ["Lembrete de vencimento", "Segunda via", "Negociação com IA"],
    precoMensal: 99,
    avaliacao: 4.8,
    avaliacoes: 207,
    instalacoes: 1890,
    canais: ["WhatsApp"],
    definicao: montar(
      "Cobrança Amigável",
      "Você conduz cobranças com empatia e sem tom ameaçador.",
      [texto("cpf_final", true), texto("quer_negociar")],
      {
        ola: { tipo: "mensagem", texto: "Olá! Passando para lembrar de uma fatura em aberto." },
        pergunta_cpf: { tipo: "pergunta", texto: "Para sua segurança, informe os 3 últimos dígitos do CPF.", variavel_destino: "cpf_final" },
        pergunta_negociar: { tipo: "pergunta", texto: "Prefere a segunda via ou negociar um parcelamento?", variavel_destino: "quer_negociar" },
        decide: { tipo: "condicao", expressao: "quer_negociar" },
        ia_negociacao: { tipo: "ia", instrucao: "Proponha até 3 opções de parcelamento de forma empática.", modelo: "modelo-qualidade", usar_historico: true },
        segunda_via: { tipo: "mensagem", texto: "Enviamos a segunda via para o seu e-mail cadastrado." },
        fim: { tipo: "encerramento", texto_final: "Obrigado por resolver com a gente!" },
      },
      [
        ["ola", "pergunta_cpf"],
        ["pergunta_cpf", "pergunta_negociar"],
        ["pergunta_negociar", "decide"],
        ["decide", "ia_negociacao", "truthy"],
        ["decide", "segunda_via", "else"],
        ["ia_negociacao", "fim"],
        ["segunda_via", "fim"],
      ],
    ),
  },
  {
    id: "saas-suporte",
    nome: "Suporte N1 para SaaS",
    autor: "Syncra Labs",
    verificado: true,
    categoria: "Tecnologia",
    icone: "zap",
    cor: "#b49cff",
    resumo: "Resolve dúvidas técnicas comuns e abre chamado quando precisa.",
    descricao:
      "Primeiro nível de suporte com IA usando o histórico da conversa. Coleta e-mail e descrição para abrir chamado quando a dúvida não é resolvida.",
    destaques: ["Respostas com contexto", "Coleta de e-mail", "Abertura de chamado"],
    precoMensal: 59,
    avaliacao: 4.9,
    avaliacoes: 402,
    instalacoes: 3210,
    canais: ["Site"],
    novo: true,
    definicao: montar(
      "Suporte N1 para SaaS",
      "Você é o suporte técnico de um software. Responda em passos numerados.",
      [texto("email", true), texto("problema", true), texto("resolvido")],
      {
        ola: { tipo: "mensagem", texto: "Oi! Sou o suporte da Nuvem App. Vamos resolver isso juntos." },
        pergunta_email: { tipo: "pergunta", texto: "Qual o e-mail da sua conta?", variavel_destino: "email" },
        pergunta_problema: { tipo: "pergunta", texto: "Descreva o problema que você está enfrentando.", variavel_destino: "problema" },
        ia_solucao: { tipo: "ia", instrucao: "Proponha uma solução passo a passo para: {{problema}}.", modelo: "modelo-qualidade", usar_historico: true },
        pergunta_resolvido: { tipo: "pergunta", texto: "Isso resolveu? Se não, conte o que aconteceu.", variavel_destino: "resolvido" },
        decide: { tipo: "condicao", expressao: "resolvido" },
        chamado: { tipo: "mensagem", texto: "Abri um chamado para {{email}}. Nosso time responde em até 2h." },
        fim: { tipo: "encerramento", texto_final: "Obrigado por usar a Nuvem App!" },
      },
      [
        ["ola", "pergunta_email"],
        ["pergunta_email", "pergunta_problema"],
        ["pergunta_problema", "ia_solucao"],
        ["ia_solucao", "pergunta_resolvido"],
        ["pergunta_resolvido", "decide"],
        ["decide", "chamado", "truthy"],
        ["decide", "fim", "else"],
        ["chamado", "fim"],
      ],
    ),
  },
  {
    id: "marketing-nps",
    nome: "Pesquisa NPS",
    autor: "Syncra Labs",
    verificado: true,
    categoria: "Marketing",
    icone: "chart",
    cor: "#ffd166",
    resumo: "Coleta nota de 0 a 10 e o motivo, com agradecimento personalizado.",
    descricao:
      "Pesquisa de satisfação curta e simpática. A IA agradece de forma personalizada com base no comentário do cliente.",
    destaques: ["Nota de 0 a 10", "Motivo da nota", "Agradecimento com IA"],
    precoMensal: 0,
    avaliacao: 4.6,
    avaliacoes: 233,
    instalacoes: 4470,
    canais: ["WhatsApp", "Site", "Instagram"],
    definicao: montar(
      "Pesquisa NPS",
      "Você conduz pesquisas de satisfação curtas e simpáticas.",
      [{ chave: "nota", tipo: "texto", obrigatoria: true }, texto("motivo")],
      {
        ola: { tipo: "mensagem", texto: "Oi! Leva menos de 1 minuto: queremos ouvir você." },
        pergunta_nota: { tipo: "pergunta", texto: "De 0 a 10, quanto você nos recomendaria?", variavel_destino: "nota" },
        pergunta_motivo: { tipo: "pergunta", texto: "O que mais pesou na sua nota?", variavel_destino: "motivo" },
        ia_agradecimento: { tipo: "ia", instrucao: "Agradeça de forma personalizada considerando a nota {{nota}} e o motivo.", modelo: "modelo-rapido", usar_historico: true },
        fim: { tipo: "encerramento", texto_final: "Valeu demais pela sua resposta!" },
      },
      [
        ["ola", "pergunta_nota"],
        ["pergunta_nota", "pergunta_motivo"],
        ["pergunta_motivo", "ia_agradecimento"],
        ["ia_agradecimento", "fim"],
      ],
    ),
  },
];

export const CATEGORIAS: CategoriaMarketplace[] = [
  "Saúde",
  "Alimentação",
  "Imóveis",
  "Varejo",
  "Educação",
  "Serviços",
  "Finanças",
  "Tecnologia",
  "Marketing",
];

export function formatarPreco(valor: number): string {
  return valor === 0
    ? "Grátis"
    : `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/mês`;
}

export function formatarNumero(valor: number): string {
  return valor >= 1000 ? `${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : String(valor);
}

const CHAVE_ADQUIRIDOS = "syncra.marketplace.adquiridos.v1";

export function carregarAdquiridos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ADQUIRIDOS) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function salvarAdquiridos(ids: string[]) {
  try {
    localStorage.setItem(CHAVE_ADQUIRIDOS, JSON.stringify(ids));
  } catch {
    // apenas em memória.
  }
}
