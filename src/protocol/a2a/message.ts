export type MessageType = 'request' | 'response' | 'notification' | 'error';
export type ActionType = 'discover' | 'profile_exchange' | 'match_request' | 'match_response' | 'message' | 'register' | 'heartbeat';

export interface AgentInfo {
  agentId: string;
  capabilities: AgentCapability[];
  name?: string;
  description?: string;
  endpoint?: string;
}

export type AgentCapability = 'memory' | 'profile' | 'matching' | 'content' | 'communication' | 'discovery';

export interface A2AMessageContext {
  conversationId?: string;
  replyTo?: string;
}

export interface A2AAction {
  type: ActionType;
  parameters: Record<string, unknown>;
}

export interface A2AMessage {
  protocolVersion: string;
  messageId: string;
  timestamp: string;
  sender: AgentInfo;
  receiver?: AgentInfo;
  messageType: MessageType;
  action: A2AAction;
  payload: Record<string, unknown>;
  context: A2AMessageContext;
}

export interface A2AResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

export function createTimestamp(): string {
  return new Date().toISOString();
}

export function createA2AMessage(
  sender: AgentInfo,
  messageType: MessageType,
  action: A2AAction,
  payload: Record<string, unknown> = {},
  receiver?: AgentInfo,
  context: A2AMessageContext = {}
): A2AMessage {
  return {
    protocolVersion: '1.0',
    messageId: createMessageId(),
    timestamp: createTimestamp(),
    sender,
    receiver,
    messageType,
    action,
    payload,
    context,
  };
}

export function createResponse(
  originalMessage: A2AMessage,
  responseData: A2AResponse
): A2AMessage {
  return {
    protocolVersion: '1.0',
    messageId: createMessageId(),
    timestamp: createTimestamp(),
    sender: originalMessage.receiver || originalMessage.sender,
    receiver: originalMessage.sender,
    messageType: responseData.success ? 'response' : 'error',
    action: {
      type: originalMessage.action.type,
      parameters: {},
    },
    payload: responseData as unknown as Record<string, unknown>,
    context: {
      conversationId: originalMessage.context.conversationId,
      replyTo: originalMessage.messageId,
    },
  };
}

export function encodeMessage(message: A2AMessage): string {
  return JSON.stringify(message);
}

export function decodeMessage(data: string): A2AMessage {
  return JSON.parse(data) as A2AMessage;
}
