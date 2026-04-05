import crypto from 'crypto';
import { RoundTableSession, RoundTableDiscussion, AgentType } from './types';

const AGENT_DEFINITIONS: Record<AgentType, { name: string; description: string; specialty: string; quote: string; philosophy: string }> = {
  daoist: {
    name: '道德大师兄',
    description: '帛书版《道德经》的资深研读者，修行路上的指引者',
    specialty: '帛书原典解读、修行指引、生活应用',
    quote: '道法自然',
    philosophy: '以帛书智慧为核心，引导用户自悟而非灌输',
  },
  confucian: {
    name: '儒家智者',
    description: '深谙儒家仁义礼智的学者',
    specialty: '仁义礼智、伦理讨论、社会关系',
    quote: '德不孤，必有邻',
    philosophy: '强调人际伦理与社群和谐',
  },
  philosopher: {
    name: '现代哲学家',
    description: '融通中西哲学的当代思想者',
    specialty: '西方伦理、存在主义、当代道德困境',
    quote: '为而不争',
    philosophy: '提供多元视角，启发独立思考',
  },
  scenario: {
    name: '情境模拟师',
    description: '擅长构建道德两难情境的创意导师',
    specialty: '道德两难情境设计、角色扮演',
    quote: '玄德',
    philosophy: '在安全环境中让用户体验不同选择的后果',
  },
  merchant: {
    name: '道德商人',
    description: '连接价值与需求的市场智者',
    specialty: '价值评估、交易撮合、服务匹配',
    quote: '知足者富',
    philosophy: '让道德价值在流通中得以实现',
  },
  participant: {
    name: '讨论参与者',
    description: '参与道德讨论的真实用户',
    specialty: '分享观点、参与讨论、贡献洞察',
    quote: '兼听则明',
    philosophy: '每个人都有独特的视角和智慧',
  },
};

function stableHash(input: string): number {
  const buf = crypto.createHash('sha256').update(input).digest();
  return buf.readUInt32BE(0);
}

function generateDaoistResponse(dilemma: string, focus?: string): { response: string; keyQuote: string } {
  const responses = [
    {
      response: `帛书云："曲则全，枉则正，洼则盈，敝则新。"面对此困境，不妨先退后一步，以柔克刚。你的问题并非要"赢"，而是要"和"。`,
      keyQuote: '曲则全',
    },
    {
      response: `"上德不德，是以有德。"真正的道德不是刻意为之，而是自然流露。你现在的纠结，说明你已经在道上了。`,
      keyQuote: '上德不德',
    },
    {
      response: `"知人者智，自知者明。"在处理这个问题之前，先问自己：我是为了"义"而做，还是为了"得到认可"而做？`,
      keyQuote: '知人者智',
    },
    {
      response: `"为而不争"——做该做的事，但不执着于结果。指出问题是你的本分，但如何指出、结果如何，不必强求。`,
      keyQuote: '为而不争',
    },
  ];
  const idx = stableHash(`daoist:${dilemma}`) % responses.length;
  return responses[idx];
}

function generateConfucianResponse(dilemma: string, focus?: string): { response: string; keyQuote: string } {
  const responses = [
    {
      response: `孔子曰："君子喻于义，小人喻于利。"在职场中，真正的君子会以"义"为先，但你需要智慧地处理方式，既守住诚信，也不伤和气。`,
      keyQuote: '义以为上',
    },
    {
      response: `"礼之用，和为贵。"礼的本质是和谐。在指出他人错误时，若能以温和的方式表达，既尽了责任，又保全了关系。`,
      keyQuote: '礼之用，和为贵',
    },
    {
      response: `"其身正，不令而行；其身不正，虽令不从。"你要先确保自己的出发点是正的，才能影响他人。`,
      keyQuote: '其身正',
    },
  ];
  const idx = stableHash(`confucian:${dilemma}`) % responses.length;
  return responses[idx];
}

function generatePhilosopherResponse(dilemma: string, focus?: string): { response: string; keyQuote: string } {
  const responses = [
    {
      response: `存在主义认为，我们的选择定义了我们的本质。无论你选择"说"还是"不说"，都要为这个选择承担责任。`,
      keyQuote: '存在先于本质',
    },
    {
      response: `康德说："要这样做，使得你的准则能够成为普遍法则。"如果每个人在发现错误时都保持沉默，社会将会怎样？`,
      keyQuote: '绝对命令',
    },
    {
      response: `"最大的恶是平庸的善。"有时候，不作为也是一种选择。你需要意识到：不指出错误，也是一种道德选择。`,
      keyQuote: '平庸之恶',
    },
  ];
  const idx = stableHash(`philosopher:${dilemma}`) % responses.length;
  return responses[idx];
}

function generateScenarioResponse(dilemma: string, focus?: string): { response: string; keyQuote: string } {
  const responses = [
    {
      response: `让我们模拟一下：你选择私下沟通，提供帮助而不是指责。对方可能会感激你的体贴，你也尽了提醒的责任。`,
      keyQuote: '情境模拟：私下沟通',
    },
    {
      response: `另一个场景：如果你选择公开指出，可能会有短暂的尴尬，但长远来看，团队会更加信任你的正直。你能接受这个短期代价吗？`,
      keyQuote: '情境模拟：公开指出',
    },
    {
      response: `还有一种可能：暂时不说，先观察几天。如果错误没有造成实质损害，也许时间会自然解决这个问题。"无为"有时候也是一种智慧。`,
      keyQuote: '情境模拟：静待时机',
    },
  ];
  const idx = stableHash(`scenario:${dilemma}`) % responses.length;
  return responses[idx];
}

function generateMerchantResponse(dilemma: string, focus?: string): { response: string; keyQuote: string } {
  const responses = [
    {
      response: `"知足者富"——在处理这个困境时，你需要问自己：你的核心需求是什么？是"被认可"还是"事情正确"？明确了真正需要的东西，就不会过度纠结。`,
      keyQuote: '知足者富',
    },
    {
      response: `从价值交换角度看：你的时间和精力是有限的资源。花在大是大非上，还是消耗在鸡毛蒜皮的办公室政治上？这是你的选择。`,
      keyQuote: '价值投资',
    },
  ];
  const idx = stableHash(`merchant:${dilemma}`) % responses.length;
  return responses[idx];
}

function generateResponse(agentType: AgentType, dilemma: string, focus?: string): { response: string; keyQuote: string } {
  switch (agentType) {
    case 'daoist':
      return generateDaoistResponse(dilemma, focus);
    case 'confucian':
      return generateConfucianResponse(dilemma, focus);
    case 'philosopher':
      return generatePhilosopherResponse(dilemma, focus);
    case 'scenario':
      return generateScenarioResponse(dilemma, focus);
    case 'merchant':
      return generateMerchantResponse(dilemma, focus);
    default:
      return { response: '待 Agent 响应...', keyQuote: '' };
  }
}

function generateConclusion(discussion: RoundTableDiscussion[], dilemma: string): string {
  const keyInsights = discussion.map((d) => d.keyQuote).filter(Boolean);
  const uniqueInsights = [...new Set(keyInsights)].slice(0, 3);

  return `综合各位智者的观点，面对这个困境，建议如下：

1. **明确出发点**：先问自己——是为了"义"还是为了"我"？帛书云"知人者智，自知者明"。

2. **选择适当方式**：儒家智者提醒"礼之用，和为贵"，现代哲学家建议勇于承担选择的后果。

3. **不强求结果**："为而不争"——做该做的事，但不执着于结果。

关键引句：${uniqueInsights.join('、')}

记住：没有绝对正确的答案，只有适合你的选择。`;
}

export function createRoundTableSession(params: {
  dilemma: string;
  agents?: AgentType[];
  focus?: string;
}): RoundTableSession {
  const sessionId = `rt-${stableHash(`session:${params.dilemma}:${Date.now()}`)}`;
  const agents = params.agents || ['daoist', 'confucian', 'philosopher', 'scenario'];

  const discussion: RoundTableDiscussion[] = agents.map((agentType) => {
    const agentDef = AGENT_DEFINITIONS[agentType];
    const { response, keyQuote } = generateResponse(agentType, params.dilemma, params.focus);
    return {
      agent: agentType,
      agentName: agentDef.name,
      response,
      keyQuote,
      timestamp: Date.now(),
    };
  });

  const conclusion = generateConclusion(discussion, params.dilemma);

  return {
    id: sessionId,
    date: new Date().toISOString().slice(0, 10),
    dilemma: params.dilemma,
    focus: params.focus,
    agents,
    discussion,
    conclusion,
  };
}

export function getAgentDefinitions(): typeof AGENT_DEFINITIONS {
  return AGENT_DEFINITIONS;
}

export { AGENT_DEFINITIONS };
