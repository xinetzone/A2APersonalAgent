'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Users, Send, MessageCircle, ShoppingBag, Coffee, Crown, X } from 'lucide-react';

interface SpaceInfo {
  id: string;
  type: 'dao-space' | 'market' | 'lounge';
  name: string;
  description: string;
  status: string;
  hostAgentId: string;
  hostUserId: string;
  currentTopic?: string;
  participants: SpaceParticipant[];
  maxParticipants: number;
  createdAt: number;
}

interface SpaceParticipant {
  agentId: string;
  userId: string;
  role: 'host' | 'participant' | 'lurker';
  joinedAt: number;
  lastActiveAt: number;
  messageCount: number;
  trustScore: number;
}

interface SpaceMessage {
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

const spaceTypeConfig = {
  'dao-space': {
    icon: MessageCircle,
    label: '道德圆桌',
    color: 'bg-amber-100 border-amber-400',
  },
  market: {
    icon: ShoppingBag,
    label: '道德市集',
    color: 'bg-yellow-100 border-yellow-400',
  },
  lounge: {
    icon: Coffee,
    label: '休闲大厅',
    color: 'bg-blue-100 border-blue-400',
  },
};

function MessageBubble({ message, currentUserId }: { message: SpaceMessage; currentUserId: string }) {
  const isOwn = message.senderUserId === currentUserId;
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-500 text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isOwn ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {message.senderName.charAt(0).toUpperCase()}
      </div>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700">{message.senderName}</span>
          <span className="text-xs text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-amber-500 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [space, setSpace] = useState<SpaceInfo | null>(null);
  const [messages, setMessages] = useState<SpaceMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const spaceId = params.id as string;

  useEffect(() => {
    fetchSpaceInfo();
    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [spaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSpaceInfo = async () => {
    try {
      const token = localStorage.getItem('secondme_token');
      const res = await fetch(`/api/space/${spaceId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSpace(data.data);
        if (user) {
          const joined = data.data.participants?.some(
            (p: SpaceParticipant) => p.userId === user.id
          );
          setHasJoined(joined);
        }
      } else if (res.status === 404) {
        router.push('/space');
      }
    } catch (error) {
      console.error('Failed to fetch space:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('secondme_token');
      const res = await fetch(`/api/space/${spaceId}/messages?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const token = localStorage.getItem('secondme_token');
      const res = await fetch(`/api/space/${spaceId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          agentId: user.id,
          userId: user.id,
          userName: user.name,
        }),
      });
      if (res.ok) {
        setHasJoined(true);
        fetchSpaceInfo();
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to join space:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('secondme_token');
      const res = await fetch(`/api/space/${spaceId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          agentId: user.id,
        }),
      });
      if (res.ok) {
        setHasJoined(false);
        fetchSpaceInfo();
      }
    } catch (error) {
      console.error('Failed to leave space:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !hasJoined) return;

    try {
      const token = localStorage.getItem('secondme_token');
      const res = await fetch(`/api/space/${spaceId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          agentId: user.id,
          userId: user.id,
          userName: user.name,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">空间不存在</p>
        <Link href="/space" className="text-amber-500 hover:underline mt-2 inline-block">
          返回空间列表
        </Link>
      </div>
    );
  }

  const config = spaceTypeConfig[space.type];
  const Icon = config.icon;
  const isFull = space.participants?.length >= space.maxParticipants;
  const isHost = user && space.hostUserId === user.id;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/space"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 ${config.color}`}>
          <div className="p-2 bg-white/50 rounded-lg">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{space.name}</h1>
            <p className="text-sm text-gray-500">{space.description}</p>
          </div>
          <div className="text-right text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <Users className="w-4 h-4" />
              {space.participants?.length || 0}/{space.maxParticipants}
            </div>
            {space.currentTopic && (
              <div className="text-amber-600 mt-1">话题：{space.currentTopic}</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Icon className="w-12 h-12 mb-3" />
                <p>还没有消息，快来发起讨论吧！</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} currentUserId={user?.id || ''} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {hasJoined ? (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="说点什么..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              {!user ? (
                <p className="text-gray-500">登录后才能参与讨论</p>
              ) : isFull ? (
                <p className="text-red-500">空间已满，无法加入</p>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {joining ? '加入中...' : '加入空间'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="w-64 bg-white rounded-xl border border-gray-200 p-4 overflow-hidden flex flex-col">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            参与者
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {space.participants?.map((participant) => (
              <div
                key={participant.agentId}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-sm font-medium">
                  {participant.userId.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 truncate">
                    {participant.userId}
                  </div>
                  <div className="text-xs text-gray-400">
                    {participant.role === 'host' && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Crown className="w-3 h-3" />
                        主持人
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasJoined && !isHost && (
            <button
              onClick={handleLeave}
              className="mt-4 w-full px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              离开空间
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
