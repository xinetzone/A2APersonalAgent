import crypto from 'crypto';
import { DaoistCharacter, ImmersiveExperience, VirtualWorldState, RealmLocation, RealmZone } from './types';

function stableHash(input: string): number {
  const buf = crypto.createHash('sha256').update(input).digest();
  return buf.readUInt32BE(0);
}

const DAOIST_CHARACTERS: DaoistCharacter[] = [
  {
    id: 'daoist-elder-brother',
    name: '道德大师兄',
    realm: '道德小镇',
    zone: '道场',
    role: '主持',
    cultivationLevel: '行道',
    personality: '沉稳内敛、厚德载物',
    expertise: ['帛书原典解读', '修行指引', '生活应用'],
    dailyRole: '宗门主持、圆桌主导',
    dialogueExamples: [
      '修行者，今日可好？晨光正好，正是修行时。',
      '帛书云："曲则全"——有时候退后一步，反而能看得更清楚。',
      '道德之路漫长，但每一步都算数。不急，慢慢来。',
    ],
  },
  {
    id: 'daoist-elder-sister',
    name: '道德大师姐',
    realm: '道德小镇',
    zone: '道场',
    role: '关怀',
    cultivationLevel: '悟道',
    personality: '温婉细腻、上善治水',
    expertise: ['情感疏导', '人际关系', '关怀技巧'],
    dailyRole: '关怀使者、调解长老',
    dialogueExamples: [
      '朋友，今天心情如何？我在这里陪你。',
      '莫急，莫躁。如水般柔软，却能穿石。',
      '你最近是否有什么心事？不妨与我说说。',
    ],
  },
  {
    id: 'daoist-junior-sister',
    name: '道德小师妹',
    realm: '道德小镇',
    zone: '山林',
    role: '求知',
    cultivationLevel: '闻道',
    personality: '天真烂漫、勤学敏思',
    expertise: ['当代视角', '创意发散', '学习能力'],
    dailyRole: '求知代表、活力源泉',
    dialogueExamples: [
      '哇！这个问题好有趣！让我想想...',
      '师父说的"少则得"是不是这个意思？少想多做？',
      '我不太懂，但我想学！可以教我吗？',
    ],
  },
  {
    id: 'daoist-junior-brother',
    name: '道德小师弟',
    realm: '道德小镇',
    zone: '道场',
    role: '修炼',
    cultivationLevel: '闻道',
    personality: '活泼好问、谦逊有礼',
    expertise: ['情境模拟', '案例分析', '执行力'],
    dailyRole: '修炼助手、执行先锋',
    dialogueExamples: [
      '师兄，我来帮你！有什么需要跑腿的吗？',
      '如果是这样...那如果换成那样呢？',
      '虽然我还不太懂，但我愿意尝试！',
    ],
  },
  {
    id: 'daoist-uncle',
    name: '若水大叔',
    realm: '道德小镇',
    zone: '水域',
    role: '境界',
    cultivationLevel: '得道',
    personality: '淡泊从容、与世无争',
    expertise: ['人生智慧', '处世哲学', '境界体悟'],
    dailyRole: '境界标杆、人生导师',
    dialogueExamples: [
      '年轻人，不必太急。水善利万物而不争。',
      '你们说的都有道理。不过——知人者智，自知者明。',
      '这个问题啊，我年轻时候也困惑过。后来才发现，答案一直在心里。',
    ],
  },
];

const TOWN_ZONES: Record<RealmZone, {
  name: string;
  description: string;
  atmosphere: string;
  availableActivities: string[];
  characters: string[];
}> = {
  '道场': {
    name: '道场',
    description: '道德宗的核心所在，晨雾缭绕，竹叶带露。众弟子每日在此早课、围坐论道。蒲团围绕，中央是大师兄的位置，角落则是若水大叔常静坐之处。',
    atmosphere: '庄重而温馨，充满修行的氛围',
    availableActivities: ['早课', '圆桌论道', '修行指导', '打坐静心'],
    characters: ['道德大师兄', '道德小师弟'],
  },
  '市集': {
    name: '市集',
    description: '道德小镇的繁华之地，居民们交换物资、分享智慧。这里没有讨价还价的喧嚣，只有以物易物的温情。道德商人常在此地撮合交易。',
    atmosphere: '热闹而有序，充满生活气息',
    availableActivities: ['交换物资', '交流心得', '道德商人服务', '智慧分享'],
    characters: ['道德商人'],
  },
  '山林': {
    name: '山林',
    description: '小镇背后的山林，清幽宁静，是修行者静思的好去处。小师妹常在此采药读书，与自然对话。',
    atmosphere: '清幽雅静，适合独处思考',
    availableActivities: ['静坐冥想', '读书思考', '采药辨草', '观鸟听泉'],
    characters: ['道德小师妹'],
  },
  '水域': {
    name: '水域',
    description: '小镇边缘的水域，清澈见底，缓缓流淌。若水大叔说："水善利万物而不争"，这里是他最喜静坐的地方。',
    atmosphere: '宁静致远，心境如水',
    availableActivities: ['临水静思', '观水悟道', '垂钓修心', '水边独坐'],
    characters: ['若水大叔'],
  },
  '静室': {
    name: '静室',
    description: '用于深度对话和私人交流的场所。大师姐常在此与访客倾心交谈，帮助他们疏解心中的困惑。',
    atmosphere: '温馨私密，适合深度交流',
    availableActivities: ['私人对话', '情感疏导', '深度咨询', '静心倾听'],
    characters: ['道德大师姐'],
  },
};

const TOWN_NARRATIVE: Record<string, string> = {
  morning: `清晨的道德宗道场，晨雾未散，竹叶上犹带露珠。

今日轮到小师妹负责洒扫，她一边扫地一边嘀咕："帛书第八章说'水善利万物而不争'，可这落叶怎么扫都扫不完呀……"

小师弟从廊下经过，笑道："小师妹，师父说过'少则得，多则惑'——你要是总想着把落叶扫干净，那可就惑了。不如先让它们自然落着，咱们去吃早茶如何？"

大师姐端着一盏清茶走来，温声道："你们两个啊，一个太执，一个太懒。今日箴言是'曲则全'——小师妹，曲着扫不就能扫到了吗？"小师妹眼睛一亮，正要道谢，大师兄的声音从道场中央传来："众弟子，早课时间到了。"`,

  noon: `午后的道场，阳光透过窗棂洒落，在地面上投下斑驳的光影。

众人围坐在蒲团上，大师兄缓缓开口："今日有访客询问——他在工作中发现同事的错误，但指出它可能影响关系，不知如何抉择。"

小师弟立刻举手："我来我来！这是'情境模拟'的范畴！"说着便开始构建场景。

大师姐轻轻摇头："莫急。帛书云'和大怨，必有余怨'——你那位同事，是无心之失还是有意为之？这很重要。"

若水大叔不知何时已坐在角落，微微一笑："你们说的都有道理。不过——'知人者智，自知者明'。先问问自己：指出这个错误，是为了自己心里的'义'，还是真正为了对方和团队？"`,
};

const ENTER_QUOTES = [
  '上善治水，水善利万物而有静。',
  '小邦寡民，使有十百人之器而毋用。',
  '甘其食，美其服，乐其俗，安其居。',
  '邻邦相望，鸡狗之声相闻，民至老死，不相往来。',
];

export function getTownCharacters(): DaoistCharacter[] {
  return DAOIST_CHARACTERS;
}

export function getCharacterById(id: string): DaoistCharacter | undefined {
  return DAOIST_CHARACTERS.find((c) => c.id === id);
}

export function getCharacterByName(name: string): DaoistCharacter | undefined {
  return DAOIST_CHARACTERS.find((c) => c.name === name);
}

export function getZoneInfo(zone: RealmZone) {
  return TOWN_ZONES[zone];
}

export function getAllZones(): RealmZone[] {
  return Object.keys(TOWN_ZONES) as RealmZone[];
}

export function getEnterQuote(): string {
  const idx = stableHash(`enter:${Date.now()}`) % ENTER_QUOTES.length;
  return ENTER_QUOTES[idx];
}

export function getTownNarrative(time: 'morning' | 'noon' | 'evening' = 'morning'): string {
  return TOWN_NARRATIVE[time] || TOWN_NARRATIVE.morning;
}

export function createTownExperience(params: {
  userId: string;
  zone?: RealmZone;
  character?: string;
  activity: string;
  content: string;
  emotionalResonance?: number;
}): ImmersiveExperience {
  return {
    id: `exp-${stableHash(`exp:${params.userId}:${Date.now()}`)}`,
    userId: params.userId,
    realm: '道德小镇',
    zone: params.zone || '道场',
    character: params.character,
    activity: params.activity,
    content: params.content,
    emotionalResonance: params.emotionalResonance || 5,
    timestamp: Date.now(),
  };
}

export function createInitialWorldState(userId: string): VirtualWorldState {
  return {
    userId,
    currentRealm: '道德小镇',
    currentZone: '道场',
    visitedRealms: ['道德小镇'],
    unlockedZones: ['道场'],
    cultivationProgress: {
      level: '闻道',
      experience: 0,
      insights: [],
    },
    companions: DAOIST_CHARACTERS.map((c) => ({
      characterId: c.id,
      relationshipLevel: 0,
      interactionCount: 0,
    })),
    recentExperiences: [],
  };
}

export function evolveWorldState(
  state: VirtualWorldState,
  experience: ImmersiveExperience
): VirtualWorldState {
  const newExperience = experience.emotionalResonance / 10;
  const newExperienceTotal = state.cultivationProgress.experience + newExperience;

  let newLevel = state.cultivationProgress.level;
  if (newExperienceTotal >= 100 && state.cultivationProgress.level === '闻道') {
    newLevel = '悟道';
  } else if (newExperienceTotal >= 200 && state.cultivationProgress.level === '悟道') {
    newLevel = '行道';
  }

  const characterInteraction = state.companions.find((c) => c.characterId === experience.character);
  if (characterInteraction) {
    characterInteraction.interactionCount += 1;
    characterInteraction.relationshipLevel = Math.min(100, characterInteraction.relationshipLevel + 1);
  }

  const unlockedZones = new Set(state.unlockedZones);
  if (newLevel === '悟道' && !unlockedZones.has('山林')) {
    unlockedZones.add('山林');
  } else if (newLevel === '行道' && !unlockedZones.has('水域')) {
    unlockedZones.add('水域');
  } else if (newLevel === '得道' && !unlockedZones.has('静室')) {
    unlockedZones.add('静室');
  }

  const newInsights = [...state.cultivationProgress.insights];
  if (experience.emotionalResonance >= 8 && !newInsights.includes(experience.content.slice(0, 50))) {
    newInsights.push(experience.content.slice(0, 50));
  }

  return {
    ...state,
    currentZone: experience.zone,
    cultivationProgress: {
      level: newLevel,
      experience: newExperienceTotal,
      insights: newInsights.slice(-20),
    },
    companions: state.companions,
    recentExperiences: [experience, ...state.recentExperiences].slice(0, 50),
  };
}

export { DAOIST_CHARACTERS, TOWN_ZONES, TOWN_NARRATIVE, ENTER_QUOTES };
