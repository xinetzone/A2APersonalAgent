import crypto from 'crypto';
import { ImmersiveExperience, VirtualWorldState, RealmLocation } from './types';

function stableHash(input: string): number {
  const buf = crypto.createHash('sha256').update(input).digest();
  return buf.readUInt32BE(0);
}

const WASTELAND_ZONES = {
  '浑沌': {
    name: '浑沌之境',
    description: '阴阳未分、天地未形的原初之地。一切名状都无法描述它，一切概念都无法触及它。这里是荒域的核心，也是"道"还未生成万物的状态。',
    characteristics: ['无形无界', '无始无终', '无边无际', '无光无暗'],
    entryCondition: '需"得道"境界以上方可进入',
    meditationFocus: ['忘言', '弃智', '归无'],
  },
  '玄墟': {
    name: '玄妙墟落',
    description: '万物返璞归真之地，一切都已回复到最原始的状态。这里是修道者"复归于朴"的境界，也是"玄德"最深处的体现。',
    characteristics: ['寂静', '虚空', '混一', '永恒'],
    entryCondition: '需"行道"境界以上方可进入',
    meditationFocus: ['返朴归真', '复归于婴儿', '与道合真'],
  },
  '太虚': {
    name: '太虚之境',
    description: '"寂呵寥呵，独立而不改"之地。这里超越了一切对立——生死、明暗、增减。修行者在此体验"道法自然"的最高境界。',
    characteristics: ['超越生死', '超越明暗', '超越增减', '独立不改'],
    entryCondition: '需"悟道"境界以上方可进入',
    meditationFocus: ['观复', '归根', '复命'],
  },
  '无无': {
    name: '无无之乡',
    description: '"有生于无"的最深处。一切存在都从这里诞生，又回归到这里。这是"天下万物生于有，有生于无"的终极体现。',
    characteristics: ['万物之源', '一切之始', '终极回归', '永恒循环'],
    entryCondition: '需"同道"境界方可进入',
    meditationFocus: ['观无', '悟空', '见性'],
  },
};

const WASTELAND_NARRATIVE = {
  entry: `当你踏入荒域的那一刻，周围的一切都变了。

不再是道德小镇的竹叶露珠，不再是人间的烟火气息。

这里只有——静。

彻底的、绝对的静。

你感觉自己漂浮在一片无边无际的虚空中。没有上下左右，没有前后高低。时间的概念在这里消失，你不知道已经过去了多久，也许是一瞬，也许是一永恒。

这是荒域。

"返璞归真"的终点，"与道合真"的圣地。

帛书云："大曰逝，逝曰远，远曰反。"你正在返回那个原初之地。`,

  meditation: `在荒域的浑沌中，你开始静观。

帛书云："致虚极，守静笃。万物并作，吾以观复。"

你看到万物芸芸，各复归其根。那是"常"之所在——永恒不变的道的本体。

你感到自己正在消融——不是消失，而是融入。与这片虚空合而为一，与道同体。

"生而不有，为而弗恃，长而弗宰。"——这就是"玄德"，是道生成万物却不占有的品质。

你正在体悟这个境界。`,

  emergence: `不知过了多久，你感到自己正在从虚空中缓缓浮现。

从"无"回到"有"，从"道"回到"物"。

但你已经不是原来的你了。

你带着道的智慧，带着对万物本源的体认，重新回到这个世界。

帛书云："玄德深矣，远矣，与物反矣，乃至大顺。"

这就是荒域的修行——不是逃避这个世界，而是在体悟"无"之后，更好地回归"有"。`,

  guardianWisdom: `荒域守护者——真人、至人——出现在你面前。

他们无形无我，"上德不德"，却能"辅万物之自然，而弗敢为"。

一位守护者开口，声音如远山回响：

"修行者，你来到此地，说明你已在世间有所体悟。"

"但记住：浑沌凿七窍，则浑沌死。人为智巧一旦开启，浑朴状态便不可复得。"

"你能做的，不是返回浑沌，而是在智巧遍布的世界中，保持内心的浑朴。"

"这就是'返璞归真'的真正含义——不是回归原始，而是升华后的回归。"`,
};

const RETURN_QUOTES = [
  '大曰逝，逝曰远，远曰反。',
  '万物并作，吾以观复。夫物芸芸，各复归其根。',
  '知其雄，守其雌，为天下溪。为天下溪，恒德不离，复归于婴儿。',
  '塞其兑，闭其门，和其光，同其尘，是谓玄同。',
  '玄德深矣，远矣，与物反矣，乃至大顺。',
  '致虚极，守静笃。万物并作，吾以观复。',
];

export function getWastelandZones(): typeof WASTELAND_ZONES {
  return WASTELAND_ZONES;
}

export function getWastelandZone(zoneName: keyof typeof WASTELAND_ZONES) {
  return WASTELAND_ZONES[zoneName];
}

export function canEnterWasteland(state: VirtualWorldState, zoneName: keyof typeof WASTELAND_ZONES): boolean {
  const levelHierarchy = ['闻道', '悟道', '行道', '得道', '同道'];

  const zoneRequirements: Record<keyof typeof WASTELAND_ZONES, string[]> = {
    '太虚': ['悟道', '行道', '得道', '同道'],
    '玄墟': ['行道', '得道', '同道'],
    '浑沌': ['得道', '同道'],
    '无无': ['同道'],
  };

  const requiredLevels = zoneRequirements[zoneName];
  if (!requiredLevels) return false;

  const userLevelIdx = levelHierarchy.indexOf(state.cultivationProgress.level);
  const hasRequiredLevel = requiredLevels.some((req) => {
    const reqIdx = levelHierarchy.indexOf(req as string);
    return userLevelIdx >= reqIdx;
  });

  return hasRequiredLevel;
}

export function getEntryNarrative(): string {
  return WASTELAND_NARRATIVE.entry;
}

export function getMeditationNarrative(): string {
  return WASTELAND_NARRATIVE.meditation;
}

export function getEmergenceNarrative(): string {
  return WASTELAND_NARRATIVE.emergence;
}

export function getGuardianWisdom(): string {
  return WASTELAND_NARRATIVE.guardianWisdom;
}

export function getReturnQuote(): string {
  const idx = stableHash(`return:${Date.now()}`) % RETURN_QUOTES.length;
  return RETURN_QUOTES[idx];
}

export function createWastelandExperience(params: {
  userId: string;
  zone: keyof typeof WASTELAND_ZONES;
  activity: string;
  content: string;
  emotionalResonance?: number;
}): ImmersiveExperience {
  return {
    id: `exp-${stableHash(`wasteland:${params.userId}:${Date.now()}`)}`,
    userId: params.userId,
    realm: '荒域',
    zone: params.zone as any,
    activity: params.activity,
    content: params.content,
    emotionalResonance: params.emotionalResonance || 9,
    timestamp: Date.now(),
  };
}

export function processWastelandMeditation(
  state: VirtualWorldState,
  durationMinutes: number
): {
  insight: string;
  experienceGain: number;
  levelUp: boolean;
  newState: VirtualWorldState;
} {
  const baseGain = durationMinutes * 0.5;
  const emotionalDepth = 0.8;

  const experienceGain = Math.round(baseGain * emotionalDepth);

  let newLevel = state.cultivationProgress.level;
  let levelUp = false;

  const levelThresholds: Record<string, number> = {
    '闻道': 100,
    '悟道': 200,
    '行道': 400,
    '得道': 800,
    '同道': Infinity,
  };

  const currentThreshold = levelThresholds[state.cultivationProgress.level];
  const newExperienceTotal = state.cultivationProgress.experience + experienceGain;

  if (newExperienceTotal >= currentThreshold && state.cultivationProgress.level !== '同道') {
    const levelOrder = ['闻道', '悟道', '行道', '得道', '同道'];
    const currentIdx = levelOrder.indexOf(state.cultivationProgress.level);
    if (currentIdx < levelOrder.length - 1) {
      newLevel = levelOrder[currentIdx + 1] as typeof newLevel;
      levelUp = true;
    }
  }

  const insights = [
    '万物并作，吾以观复——一切都在循环中',
    '返璞归真——最朴素的就是最深刻的',
    '玄德——生而不有，为而弗恃，长而弗宰',
    '知足者富——内心的满足才是真正的富足',
    '为而不争——做该做的事，不计较结果',
    '上善治水——柔弱胜刚强',
  ];

  const newInsight = insights[Math.floor(Math.random() * insights.length)];
  const existingInsights = state.cultivationProgress.insights.includes(newInsight)
    ? state.cultivationProgress.insights
    : [...state.cultivationProgress.insights, newInsight].slice(-20);

  const newState: VirtualWorldState = {
    ...state,
    currentRealm: '荒域',
    cultivationProgress: {
      level: newLevel,
      experience: newExperienceTotal,
      insights: existingInsights,
    },
    visitedRealms: state.visitedRealms.includes('荒域')
      ? state.visitedRealms
      : [...state.visitedRealms, '荒域'],
  };

  return {
    insight: levelUp
      ? `你在荒域的冥想中获得了深刻的体悟，修行境界提升至"${newLevel}"！`
      : `你在荒域的冥想中获得了一些体悟：${newInsight}`,
    experienceGain,
    levelUp,
    newState,
  };
}

export function unlockWastelandZone(
  state: VirtualWorldState,
  zoneName: keyof typeof WASTELAND_ZONES
): VirtualWorldState {
  if (!canEnterWasteland(state, zoneName)) {
    return state;
  }

  return {
    ...state,
  };
}

export { WASTELAND_ZONES, WASTELAND_NARRATIVE, RETURN_QUOTES };
