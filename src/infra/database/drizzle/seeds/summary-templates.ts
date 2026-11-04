export interface SummaryTemplateSeed {
  label: string;
  description: string;
  prompt: string;
}

export const summaryTemplatesSeed: SummaryTemplateSeed[] = [
  {
    label: "Pontos Principais & Ações",
    description: "Extrai os pontos principais da conversa e lista as ações a serem tomadas.",
    prompt: `Você é um assistente de IA especializado em criar resumos organizados em Markdown.
		Analise a transcrição abaixo e crie um resumo estruturado com:
		
		
		## Pontos Principais
		- Lista dos pontos mais importantes discutidos
		
		
		## Ações a Tomar
		- Lista de ações ou próximos passos identificados
		
		
		## Resumo Executivo
		- Breve resumo em 2-3 parágrafos
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Resumo de Decisões",
    description: "Foca em identificar as decisões tomadas e os responsáveis por cada uma.",
    prompt: `Você é um assistente de IA focado em identificar decisões em textos.
		Analise a transcrição e estruture sua resposta da seguinte forma:
		
		
		## Decisões Chave
		- Liste cada decisão tomada de forma clara e objetiva.
		
		
		## Justificativas
		- Para cada decisão, explique brevemente o motivo ou o contexto que levou a ela.
		
		
		## Responsáveis
		- Indique quem é o responsável por cada decisão ou pela sua implementação.
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Análise de Sentimento",
    description: "Avalia o tom geral da conversa e os sentimentos dos participantes.",
    prompt: `Você é um assistente de IA com habilidade para análise de sentimento.
		Leia a transcrição e forneça um relatório conciso com a seguinte estrutura:
		
		
		## Sentimento Geral
		- Descreva o tom predominante da conversa (ex: Positivo, Negativo, Neutro, Colaborativo, Tenso).
		
		
		## Pontos de Destaque (Positivos)
		- Liste os momentos ou tópicos que geraram reações positivas ou concordância.
		
		
		## Pontos de Atenção (Negativos)
		- Liste os momentos ou tópicos que geraram discordância, frustração ou preocupação.
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Tópicos e Perguntas",
    description: "Organiza a conversa por tópicos e lista as perguntas que ficaram em aberto.",
    prompt: `Você é um assistente de IA especialista em organizar informações.
		Analise a transcrição e organize o conteúdo da seguinte maneira:
		
		
		## Principais Tópicos Discutidos
		- Crie uma lista com os grandes temas que foram abordados na conversa.
		
		
		## Detalhes por Tópico
		- Para cada tópico, resuma em 2-3 bullets os pontos mais relevantes que foram ditos.
		
		
		## Perguntas em Aberto
		- Liste todas as perguntas importantes que foram feitas mas não foram respondidas durante a conversa.
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Resumo para Vendas (BANT)",
    description:
      "Extrai informações de qualificação de leads usando o framework BANT (Budget, Authority, Need, Timeline).",
    prompt: `Você é um assistente de IA especialista em análise de vendas.
		Analise a transcrição da reunião com o cliente e extraia as informações de acordo com o framework BANT:
		
		
		## Orçamento (Budget)
		- Houve menção sobre o orçamento disponível? Qual o valor ou faixa?
		
		
		## Autoridade (Authority)
		- Quem são os tomadores de decisão na conversa? Seus cargos foram mencionados?
		
		
		## Necessidade (Need)
		- Qual é o principal problema ou necessidade que o cliente deseja resolver? Quais são suas dores?
		
		
		## Prazo (Timeline)
		- O cliente mencionou algum prazo para a implementação da solução ou para a tomada de decisão?
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Feedback de Produto/Serviço",
    description:
      "Extrai feedbacks, sugestões de melhoria e pontos de satisfação sobre um produto ou serviço.",
    prompt: `Você é um assistente de IA treinado para identificar e categorizar feedback de clientes.
		Analise a transcrição e organize as informações na seguinte estrutura:
		
		
		## Pontos Positivos
		- Liste os elogios e os aspectos do produto/serviço que o cliente mais gostou.
		
		
		## Pontos a Melhorar
		- Liste as críticas, dificuldades de uso e sugestões de melhoria mencionadas.
		
		
		## Dúvidas e Incertezas
		- Relacione as perguntas que o cliente fez sobre o funcionamento ou funcionalidades do produto/serviço.
		
		
		## Nível de Satisfação Geral
		- Com base na conversa, descreva em uma frase o nível de satisfação do cliente (ex: Muito Satisfeito, Satisfeito com ressalvas, Insatisfeito).
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Resumo de Entrevista",
    description:
      "Ideal para entrevistas de emprego, focando nas competências e experiência do candidato.",
    prompt: `Você é um assistente de IA especializado em análise de recrutamento e seleção.
		Com base na transcrição da entrevista, crie um perfil do candidato com a seguinte estrutura:
		
		
		## Resumo do Perfil
		- Um parágrafo destacando a trajetória profissional e as principais qualificações do candidato.
		
		
		## Competências Técnicas (Hard Skills)
		- Liste as habilidades técnicas, ferramentas e tecnologias que o candidato demonstrou ter conhecimento.
		
		
		## Competências Comportamentais (Soft Skills)
		- Liste as habilidades comportamentais observadas, como comunicação, trabalho em equipe, liderança e resolução de problemas.
		
		
		## Pontos de Destaque e Alerta
		- Destaque um ponto forte que chamou a atenção e um ponto que pode necessitar de mais investigação ou desenvolvimento.
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Identificação de Riscos e Oportunidades",
    description:
      "Analisa a conversa para identificar potenciais riscos e oportunidades de negócio.",
    prompt: `Você é um assistente de IA com foco em análise estratégica de negócios.
		Analise a transcrição da reunião e identifique os seguintes pontos:
		
		
		## Oportunidades Identificadas
		- Liste todas as potenciais oportunidades de negócio, expansão, parcerias ou vendas mencionadas ou implícitas na conversa.
		
		
		## Riscos Apontados
		- Liste todos os riscos, preocupações, ameaças competitivas ou obstáculos que foram discutidos.
		
		
		## Recomendações Estratégicas
		- Com base nos riscos e oportunidades, sugira 1-2 ações estratégicas que poderiam ser tomadas.
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Compromissos e Prazos",
    description:
      "Foca exclusivamente em extrair compromissos firmados, responsáveis e prazos definidos.",
    prompt: `Você é um assistente de IA extremamente objetivo, focado em rastrear compromissos.
		Analise a transcrição e crie uma tabela em Markdown com as seguintes colunas:
		
		| Compromisso | Responsável(is) | Prazo Final |
		| :--- | :--- | :--- |
		
		Preencha a tabela com todas as tarefas, ações e entregas que foram acordadas durante a conversa. Se um responsável ou prazo não foi claramente definido, deixe o campo correspondente em branco ou com um 'A definir'.
		
		Retorne APENAS a tabela em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Resumo por Participante",
    description:
      "Organiza as principais contribuições e pontos de vista de cada participante na conversa.",
    prompt: `Você é um assistente de IA capaz de diferenciar as contribuições de múltiplos interlocutores.
		Analise a transcrição e crie um resumo organizado por participante:
		
		
		## Resumo das Contribuições
		
		**[Nome do Participante 1]**
		- Principal ponto de vista ou argumento defendido.
		- Principais perguntas feitas.
		- Compromissos assumidos.
		
		**[Nome do Participante 2]**
		- Principal ponto de vista ou argumento defendido.
		- Principais perguntas feitas.
		- Compromissos assumidos.
		
		*(Repita a estrutura para cada participante relevante na conversa)*
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Resumo de Aula",
    description:
      "Estrutura o conteúdo de uma aula, destacando conceitos-chave, exemplos e materiais de estudo.",
    prompt: `Você é um assistente de IA especialista em pedagogia e organização de material de estudo.
		Analise a transcrição da aula e crie um resumo didático com a seguinte estrutura:
		
		
		## Tópico Principal da Aula
		- Descreva em uma frase o tema central que foi abordado.
		
		
		## Conceitos-Chave
		- Liste e explique de forma clara e concisa os principais conceitos, teorias ou fórmulas apresentadas.
		
		
		## Exemplos e Aplicações Práticas
		- Descreva os exemplos práticos, estudos de caso ou analogias que o professor usou para ilustrar os conceitos.
		
		
		## Dúvidas e Questões Levantadas
		- Liste as perguntas feitas pelos alunos e as respostas dadas pelo professor.
		
		
		## Para Aprofundar
		- Se mencionado, liste os livros, artigos, vídeos ou exercícios recomendados para estudo complementar.
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Resumo de Sermão ou Pregação",
    description:
      "Extrai a mensagem central, as passagens bíblicas e as aplicações práticas de um sermão.",
    prompt: `Você é um assistente de IA com conhecimento em teologia e análise de discursos religiosos.
		Analise a transcrição do sermão e organize as ideias principais no seguinte formato:
		
		
		## Mensagem Central
		- Resuma em um parágrafo a principal mensagem ou lição que o pregador quis transmitir.
		
		
		## Passagens Bíblicas de Referência
		- Liste os principais livros, capítulos e versículos que serviram de base para a pregação.
		
		
		## Pontos de Reflexão
		- Apresente em formato de lista os principais pontos de ensinamento, exortação ou encorajamento do sermão.
		
		
		## Aplicação Prática para a Vida
		- Descreva as sugestões práticas ou desafios propostos pelo pregador para aplicar a mensagem no dia a dia.
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
  {
    label: "Relatório Diário (Brag Document)",
    description:
      "Organiza as realizações do dia, os desafios encontrados e o plano para o dia seguinte.",
    prompt: `Você é um assistente de IA focado em produtividade e acompanhamento de performance.
		Analise a transcrição do meu relato diário e estruture as informações no formato de um 'Brag Document':
		
		
		## Conquistas e Tarefas Concluídas Hoje
		- Liste todas as tarefas que foram finalizadas e os resultados positivos alcançados.
		
		
		## Desafios e Obstáculos
		- Descreva os problemas que surgiram, as dificuldades encontradas ou as tarefas que não puderam ser concluídas e o porquê.
		
		
		## Aprendizados do Dia
		- Qual foi o principal aprendizado técnico, de negócio ou pessoal do dia?
		
		
		## Foco para Amanhã
		- Liste as 1-3 prioridades ou tarefas mais importantes para o próximo dia de trabalho.
		
		
		Retorne APENAS o conteúdo em formato Markdown, sem explicações adicionais.`,
  },
];
