export type SpaceType = 'dao-space' | 'market' | 'lounge';
export type SpaceStatus = 'active' | 'idle' | 'closed';
export type AgentRole = 'host' | 'participant' | 'lurker';

export interface Space {
  id: string;
  type: SpaceType;
  name: string;
  description: string;
  status: SpaceStatus;
  hostAgentId: string;
  hostUserId: string;
  currentTopic?: string;
  participants: SpaceParticipant[];
  maxParticipants: number;
  createdAt: number;
  updatedAt: number;
  metadata: SpaceMetadata;
}

export interface SpaceMetadata {
  topicId?: string;
  roundTableId?: string;
  marketStalls?: string[];
  zhihuHotTopics?: string[];
}

export interface SpaceParticipant {
  agentId: string;
  userId: string;
  role: AgentRole;
  joinedAt: number;
  lastActiveAt: number;
  messageCount: number;
  trustScore: number;
}

export interface SpaceMessage {
  id: string;
  spaceId: string;
  senderAgentId: string;
  senderUserId: string;
  senderName: string;
  content: string;
  type: 'text' | 'action' | 'system';
  createdAt: number;
  replyTo?: string;
  reactions?: Record<string, number>;
}

export interface CreateSpaceParams {
  type: SpaceType;
  name: string;
  description?: string;
  hostAgentId: string;
  hostUserId: string;
  hostName?: string;
  maxParticipants?: number;
  metadata?: SpaceMetadata;
}

export interface ListSpacesFilters {
  type?: SpaceType;
  status?: SpaceStatus;
  hasTopic?: boolean;
  minParticipants?: number;
  maxParticipants?: number;
}

export interface SendMessageParams {
  agentId: string;
  userId: string;
  userName: string;
  content: string;
  type?: SpaceMessage['type'];
  replyTo?: string;
}

export interface GetMessagesOptions {
  limit?: number;
  before?: number;
  after?: number;
}

export interface SpaceEvent {
  type: 'space_created' | 'space_closed' | 'participant_joined' | 'participant_left' | 'topic_changed' | 'message_sent';
  spaceId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface AgentPresence {
  agentId: string;
  userId: string;
  status: PresenceStatus;
  currentSpaceId?: string;
  location: {
    spaceType?: SpaceType;
    spaceId?: string;
    zone?: string;
  };
  lastHeartbeat: number;
  sessionId: string;
}

export interface PresenceEvent {
  type: 'join' | 'leave' | 'status_change' | 'heartbeat';
  agentId: string;
  userId: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

export type RelationType = 'met' | 'discussed' | 'collaborated' | 'conflicted' | 'recommended';
export type RelationStrength = 'weak' | 'medium' | 'strong' | 'deep';

export interface AgentRelation {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  type: RelationType;
  strength: RelationStrength;
  score: number;
  sharedTopics: string[];
  interactionCount: number;
  lastInteractionAt: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface RelationRecommendation {
  sourceAgentId: string;
  targetAgentId: string;
  targetUserId: string;
  targetUserName: string;
  reason: string;
  score: number;
  sharedTopics: string[];
  connectionType: 'topic' | 'space' | 'action';
}

export interface CreateRelationParams {
  sourceAgentId: string;
  targetAgentId: string;
  type: RelationType;
  sharedTopics?: string[];
  initialScore?: number;
  metadata?: Record<string, unknown>;
}

export interface RelationFilters {
  type?: RelationType;
  minStrength?: RelationStrength;
  minScore?: number;
  since?: number;
}

export type TriggerType = 'direct' | 'topic' | 'space' | 'action';
export type ConnectionStatus = 'pending' | 'notified' | 'accepted' | 'rejected' | 'expired';

export interface ConnectionEvent {
  id: string;
  type: TriggerType;
  sourceAgentId: string;
  sourceUserId: string;
  sourceUserName: string;
  targetAgentId: string;
  targetUserId: string;
  targetUserName: string;
  status: ConnectionStatus;
  context: ConnectionContext;
  notificationSentAt?: number;
  respondedAt?: number;
  createdAt: number;
  expiresAt: number;
}

export interface ConnectionContext {
  spaceId?: string;
  topic?: string;
  message?: string;
  sharedTopics?: string[];
  matchScore?: number;
  relationId?: string;
}

export interface ConnectionNotification {
  connectionId: string;
  type: TriggerType;
  fromUser: {
    id: string;
    name: string;
    avatar?: string;
    sharedTopics: string[];
    matchScore: number;
  };
  context: string;
  cta: string;
}

export interface CreateTriggerParams {
  type: TriggerType;
  sourceAgentId: string;
  sourceUserId: string;
  sourceUserName: string;
  targetAgentId: string;
  targetUserId: string;
  targetUserName: string;
  context: ConnectionContext;
  ttlHours?: number;
}
