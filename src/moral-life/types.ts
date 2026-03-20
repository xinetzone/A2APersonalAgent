export type DaoQuote = {
  id: string;
  title?: string;
  text: string;
  source: 'mawangdui' | 'sample';
  themes: string[];
};

export type DaoGuidance = {
  id: string;
  date?: string;
  topic?: string;
  mood?: string;
  quote: DaoQuote;
  interpretation: string;
  reflectionQuestions: string[];
  practices: string[];
};

export type AgentType = 'daoist' | 'confucian' | 'philosopher' | 'scenario' | 'merchant';

export type AgentRole = {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  specialty: string;
  quote: string;
  philosophy: string;
};

export type RoundTableDiscussion = {
  agent: AgentType;
  agentName: string;
  response: string;
  keyQuote: string;
  timestamp: number;
};

export type RoundTableSession = {
  id: string;
  date: string;
  dilemma: string;
  focus?: string;
  agents: AgentType[];
  discussion: RoundTableDiscussion[];
  conclusion?: string;
  userDecision?: string;
  userReflection?: string;
};

export type CompanionType = 'daoist-brother' | 'confucian-sage' | 'modern-philosopher';

export type CompanionPersonality = {
  communicationStyle: 'guiding' | 'questioning' | 'contemplative' | 'direct';
  emphasis: string;
  interactionFrequency: 'daily' | 'weekly' | 'monthly';
};

export type CompanionMilestone = {
  date: string;
  event: string;
  insight: string;
};

export type CompanionJournal = {
  date: string;
  content: string;
  reflection?: string;
};

export type CompanionRelationship = {
  trustLevel: 'low' | 'moderate' | 'high' | 'deep';
  interactionStyle: 'contemplative' | 'active' | 'balanced';
  sharedValues: string[];
};

export type CompanionSession = {
  companionId: CompanionType;
  userId: string;
  startDate: string;
  personality: CompanionPersonality;
  progress: {
    currentChapter: number;
    insightsCount: number;
    dilemmasResolved: number;
  };
  relationship: CompanionRelationship;
  milestones: CompanionMilestone[];
  journal: CompanionJournal[];
};

export type MoralDimension = '闻道' | '行善' | '清静' | '知足' | '玄德' | '应时';

export type MoralCreditProfile = {
  userId: string;
  sixDimensions: {
    [K in MoralDimension]: {
      score: number;
      evidence: string[];
      trend: 'up' | 'stable' | 'down';
    };
  };
  creditScore: number;
  rank: '闻道' | '悟道' | '行道' | '得道' | '同道';
};

export type ScenarioType = '两难抉择' | '欲望考验' | '人际冲突' | '权力使用' | '长期规划';
export type DifficultyLevel = '初级' | '中级' | '进阶' | '高阶';

export type TrainingScenario = {
  id: string;
  type: ScenarioType;
  difficulty: DifficultyLevel;
  theme: string;
  title: string;
  description: string;
  situation: string;
  choices: {
    id: string;
    text: string;
    consequence?: string;
  }[];
  moralPrinciples: string[];
};

export type TrainingResult = {
  scenarioId: string;
  userChoice: string;
  agentFeedback: string;
  moralInsight: string;
  relatedQuotes: string[];
};

export type TransactionType = 'earning' | 'spending' | 'donation' | 'transfer';

export type MoralWalletTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  source?: string;
  target?: string;
  recipient?: string;
  date: string;
  note?: string;
};

export type AgentCard = {
  cardId: string;
  name: string;
  level: '闻道' | '悟道' | '行道' | '得道' | '同道';
  publicKey: string;
  dailyLimit: number;
};

export type MoralWallet = {
  userId: string;
  walletId: string;
  balance: {
    merit: number;
    trustQuota: number;
  };
  agentCard: AgentCard;
  transactions: MoralWalletTransaction[];
  trustScore: number;
};

export type ServiceType = 'mentoring' | 'experience_sharing' | 'collaborative_creation' | 'consulting';

export type MoralService = {
  serviceId: string;
  type: ServiceType;
  title: string;
  description: string;
  priceRange: string;
  status: 'active' | 'inactive' | 'pending';
  completedSessions: number;
  rating: number;
};

export type Earnings = {
  total: number;
  withdrawn: number;
  pending: number;
};

export type Qualification = {
  level: '闻道' | '悟道' | '行道' | '得道' | '同道';
  certified: boolean;
  certificationDate?: string;
};

export type LifeMonetizationProfile = {
  userId: string;
  services: MoralService[];
  earnings: Earnings;
  qualifications: Qualification;
};

export type MarketOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type MarketOrderProgress = {
  step: string;
  date: string;
  notes: string;
};

export type MarketOrder = {
  orderId: string;
  requester: string;
  provider: string;
  serviceType: ServiceType;
  serviceId: string;
  status: MarketOrderStatus;
  price: number;
  progress: MarketOrderProgress[];
  feedback?: {
    requesterRating: number;
    requesterComment?: string;
  };
};

export type RealmLocation = '道德小镇' | '荒域' | '现实';
export type RealmZone = '道场' | '市集' | '山林' | '水域' | '静室';

export type DaoistCharacter = {
  id: string;
  name: string;
  realm: RealmLocation;
  zone: RealmZone;
  role: '主持' | '关怀' | '求知' | '修炼' | '境界';
  cultivationLevel: '闻道' | '悟道' | '行道' | '得道' | '同道';
  personality: string;
  expertise: string[];
  dailyRole: string;
  dialogueExamples: string[];
};

export type ImmersiveExperience = {
  id: string;
  userId: string;
  realm: RealmLocation;
  zone: RealmZone;
  character?: string;
  activity: string;
  content: string;
  emotionalResonance: number;
  timestamp: number;
};

export type VirtualWorldState = {
  userId: string;
  currentRealm: RealmLocation;
  currentZone: RealmZone;
  visitedRealms: RealmLocation[];
  unlockedZones: RealmZone[];
  cultivationProgress: {
    level: '闻道' | '悟道' | '行道' | '得道' | '同道';
    experience: number;
    insights: string[];
  };
  companions: {
    characterId: string;
    relationshipLevel: number;
    interactionCount: number;
  }[];
  recentExperiences: ImmersiveExperience[];
};
