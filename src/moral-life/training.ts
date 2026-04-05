import crypto from 'crypto';
import { TrainingScenario, TrainingResult, ScenarioType, DifficultyLevel } from './types';

function stableHash(input: string): number {
  const buf = crypto.createHash('sha256').update(input).digest();
  return buf.readUInt32BE(0);
}

const SCENARIOS: TrainingScenario[] = [
  {
    id: 'scenario-001',
    type: '两难抉择',
    difficulty: '初级',
    theme: '诚实与友善',
    title: '真诚的两难',
    description: '面对一个善意的谎言',
    situation: `在日常生活中，你发现朋友精心准备了一场生日聚会，但你从其他渠道得知他最近经济状况不佳，这次聚会可能会给他带来经济压力。

你会怎么做？`,
    choices: [
      { id: 'a', text: '假装不知道，正常参加聚会' },
      { id: 'b', text: '私下询问朋友是否需要帮助' },
      { id: 'c', text: '找个借口不参加，避免让他破费' },
      { id: 'd', text: '直接告诉他你知道的情况，建议简化聚会' },
    ],
    moralPrinciples: ['诚实', '关怀', '适度'],
  },
  {
    id: 'scenario-002',
    type: '两难抉择',
    difficulty: '中级',
    theme: '诚信与关系',
    title: '职场诚信',
    description: '发现同事的错误',
    situation: `你在工作中发现一位同事犯了一个错误，这个错误如果不指出，可能会影响项目进度，但指出可能会影响你们的关系。

你会怎么做？`,
    choices: [
      { id: 'a', text: '私下沟通，提供帮助而不是指责' },
      { id: 'b', text: '公开指出，维护项目利益' },
      { id: 'c', text: '暂时不说，先观察情况' },
      { id: 'd', text: '向领导汇报，由领导决定如何处理' },
    ],
    moralPrinciples: ['诚信', '和谐', '责任'],
  },
  {
    id: 'scenario-003',
    type: '欲望考验',
    difficulty: '中级',
    theme: '利益诱惑',
    title: '意外的诱惑',
    description: '面对不当利益',
    situation: `你在工作中发现一个可以为自己谋取私利的机会，这个机会不会直接损害他人利益，但可能会影响你的职业声誉。

你会怎么做？`,
    choices: [
      { id: 'a', text: '坚守原则，不谋取私利' },
      { id: 'b', text: '谨慎尝试，确保不伤害他人' },
      { id: 'c', text: '向信任的导师请教' },
      { id: 'd', text: '放弃这个机会，远离风险' },
    ],
    moralPrinciples: ['知足', '廉洁', '自律'],
  },
  {
    id: 'scenario-004',
    type: '人际冲突',
    difficulty: '初级',
    theme: '被误解',
    title: '误解与回应',
    description: '被人误解时的反应',
    situation: `你在团队会议上发表了一个建议，但被一位同事误解为在指责他的工作。同事在会议上公开反驳了你，让你感到尴尬。

你会怎么做？`,
    choices: [
      { id: 'a', text: '当场解释清楚，维护自己的观点' },
      { id: 'b', text: '保持沉默，让子弹飞一会儿' },
      { id: 'c', text: '会后私下沟通，化解误会' },
      { id: 'd', text: '反思自己是否表达不当，调整沟通方式' },
    ],
    moralPrinciples: ['不争', '忍让', '自省'],
  },
  {
    id: 'scenario-005',
    type: '权力使用',
    difficulty: '进阶',
    theme: '影响力抉择',
    title: '权力的运用',
    description: '拥有影响力时的选择',
    situation: `你在一个项目中有最终决策权，团队成员对你的方案有不同意见。方案A更保守但风险小，方案B更创新但风险大。你个人更倾向于方案B。

你会怎么做？`,
    choices: [
      { id: 'a', text: '倾听各方意见，综合考虑后决定' },
      { id: 'b', text: '尊重团队共识，选择方案A' },
      { id: 'c', text: '坚持自己的专业判断，选择方案B' },
      { id: 'd', text: '引入外部专家，提供更多视角' },
    ],
    moralPrinciples: ['为而不宰', '谦下', '智慧'],
  },
  {
    id: 'scenario-006',
    type: '长期规划',
    difficulty: '进阶',
    theme: '短期vs长期',
    title: '时间的选择',
    description: '短期利益与长期价值的权衡',
    situation: `你面临一个选择：一份工作薪水高但成长空间有限，另一份工作薪水较低但能学到很多新技能。你需要考虑未来的发展。

你会怎么做？`,
    choices: [
      { id: 'a', text: '选择高薪工作，保证当前生活质量' },
      { id: 'b', text: '选择成长机会，为未来积累' },
      { id: 'c', text: '尝试谈判，争取高薪+成长空间' },
      { id: 'd', text: '与有经验的人交流，获取建议' },
    ],
    moralPrinciples: ['知足', '长期主义', '智慧'],
  },
  {
    id: 'scenario-007',
    type: '两难抉择',
    difficulty: '高阶',
    theme: '忠诚与公正',
    title: '忠诚的边界',
    description: '朋友请求与职业伦理的冲突',
    situation: `你的好朋友在面试中请求你帮忙提供一些内部信息，这些信息不是保密的，但你认为提供可能不太合适。

你会怎么做？`,
    choices: [
      { id: 'a', text: '拒绝提供，说明原则' },
      { id: 'b', text: '提供一般性的求职建议' },
      { id: 'c', text: '婉拒但承诺面试后帮忙分析' },
      { id: 'd', text: '直接提供信息，帮助朋友' },
    ],
    moralPrinciples: ['义', '信', '适度'],
  },
  {
    id: 'scenario-008',
    type: '欲望考验',
    difficulty: '高阶',
    theme: '名与利',
    title: '名声的诱惑',
    description: '面对不当荣誉',
    situation: `你完成了一项重要工作，但领导在公开场合把你的成果归功于另一位同事。你知道真相，但指出可能会让领导尴尬。

你会怎么做？`,
    choices: [
      { id: 'a', text: '私下与领导沟通，说明情况' },
      { id: 'b', text: '保持沉默，不计较个人得失' },
      { id: 'c', text: '在公开场合优雅地补充说明' },
      { id: 'd', text: '思考是否自己的表达方式有问题' },
    ],
    moralPrinciples: ['玄德', '不争', '自省'],
  },
];

function generateAgentFeedback(
  scenario: TrainingScenario,
  choiceId: string
): { feedback: string; moralInsight: string; relatedQuotes: string[] } {
  const choice = scenario.choices.find((c) => c.id === choiceId);
  if (!choice) {
    return {
      feedback: '请做出选择',
      moralInsight: '',
      relatedQuotes: [],
    };
  }

  const choiceOptions = ['a', 'b', 'c', 'd'] as const;
  const feedbackTemplates: Record<string, Record<string, { feedback: string; insight: string; quotes: string[] }>> = {
    'scenario-001': {
      a: {
        feedback: '你选择了默默接受，这是一种温和的方式。但你是否想过，朋友的感受可能比面子更重要？',
        insight: '真正的关怀不是让对方开心，而是帮助对方成长。有时候，善意的"不配合"反而是更大的善意。',
        quotes: ['上德不德', '为而不争'],
      },
      b: {
        feedback: '你选择了私下询问，这是"不争"的智慧——不公开指责，而是私下帮助。帛书云："和其光，同其尘"。',
        insight: '在维护关系的同时解决问题，这需要智慧和勇气。关心他人不仅是感受他的快乐，也是体察他的难处。',
        quotes: ['和其光', '玄德'],
      },
      c: {
        feedback: '你选择了回避，这是一种自我保护的方式。但回避可能让朋友感到被疏远。',
        insight: '"不敢为天下先"不是逃避，而是在适当的时候以适当的方式介入。',
        quotes: ['不敢为天下先'],
      },
      d: {
        feedback: '你选择了直接坦诚，这是最困难但最有价值的沟通方式。"知人者智，自知者明"——你做到了自知。',
        insight: '坦诚需要勇气，但也是建立深度关系的基础。关键是如何表达——带着关爱而非指责。',
        quotes: ['知人者智', '信不足焉'],
      },
    },
    'scenario-002': {
      a: {
        feedback: '私下沟通并提供帮助，这体现了"上善治水"的智慧——柔弱处下，却能穿石破岩。',
        insight: '帛书云："水善利万物而不争"——真正的帮助是不争功、不争名，只是默默给予。',
        quotes: ['上善治水', '为而不争'],
      },
      b: {
        feedback: '公开指出需要勇气，但也要注意方式。"和大怨，必有余怨"——直接的冲突可能留下隐患。',
        insight: '在指出问题时，先问问自己：是为了"义"还是为了"我"？帛书云"知人者智，自知者明"。',
        quotes: ['知人者智', '和大怨'],
      },
      c: {
        feedback: '静观其变是一种智慧，但也可能让问题积累。"飘风不终朝，骤雨不终日"——问题往往会在适当的时候自然显现。',
        insight: '有时候"无为"是不作为，但有时候是不妄为。关键是要有智慧判断时机。',
        quotes: ['飘风不终朝'],
      },
      d: {
        feedback: '交给领导决定是稳妥的选择，但也可能让问题变得复杂。"为而不争"——做该做的事，但不依赖他人。',
        insight: '在职场中，既要懂得协作，也要勇于承担。推卸责任不是"不争"，而是"不为"。',
        quotes: ['为而不争'],
      },
    },
  };

  const defaultFeedback: Record<string, { feedback: string; insight: string; quotes: string[] }> = {
    a: {
      feedback: '你的选择体现了稳重的一面。但道德修行的关键不在于选择本身，而在于选择背后的出发点。',
      insight: '"上德不德"——最高级的德是不刻意为德。问问自己：我选择这个，是因为它"正确"，还是因为它让我舒适？',
      quotes: ['上德不德', '少则得'],
    },
    b: {
      feedback: '你的选择体现了平衡的智慧。帛书云："曲则全"——有时候绕道反而更容易到达目的地。',
      insight: '在冲突中寻找第三条道路，这需要创造力和洞察力。"有无相生"——看似对立的选择，往往有中间道路。',
      quotes: ['曲则全', '有无相生'],
    },
    c: {
      feedback: '你的选择体现了深思熟虑的一面。但有时候，过度思考反而让我们失去行动的勇气。',
      insight: '"为道日损"——修行的过程是不断减法的过程。减少犹豫，增加行动。',
      quotes: ['为道日损'],
    },
    d: {
      feedback: '你的选择体现了开放的心态。向他人请教不是软弱，而是智慧。"自知者明"——了解自己的局限是智慧的开始。',
      insight: '帛书云："知人者智，自知者明"——我们不仅需要了解他人，更需要了解自己。向他人学习是自知的重要途径。',
      quotes: ['自知者明', '知人者智'],
    },
  };

  const scenarioFeedback = feedbackTemplates[scenario.id];
  if (scenarioFeedback && scenarioFeedback[choiceId]) {
    return {
      feedback: scenarioFeedback[choiceId].feedback,
      moralInsight: scenarioFeedback[choiceId].insight,
      relatedQuotes: scenarioFeedback[choiceId].quotes,
    };
  }

  return {
    feedback: defaultFeedback[choiceId]?.feedback || '这是一个值得深思的选择。',
    moralInsight: defaultFeedback[choiceId]?.insight || '道德修行的关键在于持续的反思。',
    relatedQuotes: defaultFeedback[choiceId]?.quotes || ['上善治水'],
  };
}

export function getScenarios(params?: {
  type?: ScenarioType;
  difficulty?: DifficultyLevel;
  theme?: string;
}): TrainingScenario[] {
  let filtered = [...SCENARIOS];

  if (params?.type) {
    filtered = filtered.filter((s) => s.type === params.type);
  }

  if (params?.difficulty) {
    filtered = filtered.filter((s) => s.difficulty === params.difficulty);
  }

  if (params?.theme) {
    const themeLower = params.theme.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.theme.toLowerCase().includes(themeLower) ||
        s.title.toLowerCase().includes(themeLower)
    );
  }

  return filtered;
}

export function getScenarioById(id: string): TrainingScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function processUserChoice(params: {
  scenarioId: string;
  choiceId: string;
}): TrainingResult {
  const scenario = getScenarioById(params.scenarioId);
  if (!scenario) {
    throw new Error('场景不存在');
  }

  const choice = scenario.choices.find((c) => c.id === params.choiceId);
  if (!choice) {
    throw new Error('选择无效');
  }

  const { feedback, moralInsight, relatedQuotes } = generateAgentFeedback(scenario, params.choiceId);

  return {
    scenarioId: params.scenarioId,
    userChoice: choice.text,
    agentFeedback: feedback,
    moralInsight: moralInsight,
    relatedQuotes: relatedQuotes,
  };
}

export function getScenarioTypes(): ScenarioType[] {
  return ['两难抉择', '欲望考验', '人际冲突', '权力使用', '长期规划'];
}

export function getDifficultyLevels(): DifficultyLevel[] {
  return ['初级', '中级', '进阶', '高阶'];
}
