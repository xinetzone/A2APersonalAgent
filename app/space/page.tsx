'use client';

import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Coffee, Search, X, Filter } from 'lucide-react';
import { toast } from 'sonner';

const timeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
};

interface SpaceInfo {
  id: string;
  type: 'dao-space' | 'market' | 'lounge';
  name: string;
  description: string;
  status: string;
  participants: { agentId: string; userId: string; role: string }[];
  maxParticipants: number;
  currentTopic?: string;
  createdAt: number;
}

const spaceTypeConfig = {
  'dao-space': {
    icon: 'MessageCircle',
    label: '道德圆桌',
    description: '围绕特定话题展开深度讨论',
    color: 'bg-amber-100 border-amber-400 text-amber-700 hover:border-amber-500',
    bgColor: 'bg-amber-50',
    accentColor: 'text-amber-600',
    emoji: '🏛️',
  },
  market: {
    icon: 'ShoppingBag',
    label: '道德市集',
    description: '交换价值、建立连接、发现机会',
    color: 'bg-yellow-100 border-yellow-400 text-yellow-700 hover:border-yellow-500',
    bgColor: 'bg-yellow-50',
    accentColor: 'text-yellow-600',
    emoji: '🏪',
  },
  lounge: {
    icon: 'Coffee',
    label: '休闲大厅',
    description: '轻松闲聊、随机偶遇、自然连接',
    color: 'bg-blue-100 border-blue-400 text-blue-700 hover:border-blue-500',
    bgColor: 'bg-blue-50',
    accentColor: 'text-blue-600',
    emoji: '☕',
  },
};

const iconSvgs = {
  MessageCircle: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  ShoppingBag: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  Coffee: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const SpaceCard = memo(function SpaceCard({ space }: { space: SpaceInfo }) {
  const config = spaceTypeConfig[space.type];
  const participantCount = space.participants?.length || 0;
  const isFull = participantCount >= space.maxParticipants;
  const isActive = space.status === 'active';

  return (
    <Link href={`/space/${space.id}`}>
      <div
        className={`group p-5 rounded-xl border-2 ${config.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.bgColor} group-hover:scale-110 transition-transform`}>
            <div className={config.accentColor}>{iconSvgs[config.icon as keyof typeof iconSvgs]}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800 truncate">{space.name}</h3>
              <span className="text-lg">{config.emoji}</span>
              {isFull && (
                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                  已满
                </span>
              )}
              {isActive && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  在线
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {space.description || '暂无描述'}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {participantCount}/{space.maxParticipants}
              </span>
              {space.currentTopic && (
                <span className="truncate max-w-[150px]" title={space.currentTopic}>
                  📌 {space.currentTopic}
                </span>
              )}
              <span className="ml-auto">{timeAgo(space.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

function SpaceListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-5 rounded-xl border-2 bg-gray-50 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const CreateSpaceModal = lazy(() => import('./components/CreateSpaceModal'));

function CreateModalWrapper({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (space: SpaceInfo) => void;
}) {
  return (
    <Suspense fallback={null}>
      <CreateSpaceModal isOpen={isOpen} onClose={onClose} onCreated={onCreated} />
    </Suspense>
  );
}

const CACHE_KEY = 'third_space_list';
const CACHE_TTL = 5 * 60 * 1000;

interface CacheData {
  data: SpaceInfo[];
  timestamp: number;
}

const getCachedSpaces = (): SpaceInfo[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp }: CacheData = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedSpaces = (spaces: SpaceInfo[]) => {
  try {
    const cacheData: CacheData = { data: spaces, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {}
};

export default function SpaceListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [spaces, setSpaces] = useState<SpaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'dao-space' | 'market' | 'lounge'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const fetchSpaces = useCallback(async () => {
    try {
      const token = localStorage.getItem('secondme_token');
      const res = await fetch('/api/space', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const spacesData = data.data || [];
        setSpaces(spacesData);
        setCachedSpaces(spacesData);
      }
    } catch {
      toast.error('获取空间列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCachedSpaces();
    if (cached) {
      setSpaces(cached);
      setLoading(false);
      fetchSpaces();
    } else {
      fetchSpaces();
    }
  }, [fetchSpaces]);

  const filteredSpaces = useMemo(() => {
    return spaces.filter((space) => {
      if (filter !== 'all' && space.type !== filter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          space.name.toLowerCase().includes(query) ||
          space.description?.toLowerCase().includes(query) ||
          space.currentTopic?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [spaces, filter, searchQuery]);

  const activeSpaces = useMemo(() => filteredSpaces.filter((s) => s.status === 'active'), [filteredSpaces]);
  const idleSpaces = useMemo(() => filteredSpaces.filter((s) => s.status !== 'active'), [filteredSpaces]);

  const handleSpaceCreated = useCallback((space: SpaceInfo) => {
    setSpaces((prev) => {
      const updated = [space, ...prev];
      setCachedSpaces(updated);
      return updated;
    });
  }, []);

  const handleOpenCreate = useCallback(() => {
    if (!user && !authLoading) {
      toast.error('请先登录后再创建空间');
      return;
    }
    setShowCreate(true);
  }, [user, authLoading]);

  const handleCloseCreate = useCallback(() => {
    setShowCreate(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleFilterChange = useCallback((f: 'all' | 'dao-space' | 'market' | 'lounge') => {
    setFilter(f);
  }, []);

  const handleMobileFilter = useCallback(() => {
    setShowMobileFilter((prev) => !prev);
  }, []);

  const handleMobileFilterSelect = useCallback((f: 'all' | 'dao-space' | 'market' | 'lounge') => {
    setFilter(f);
    setShowMobileFilter(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">☕</span>
            第三空间
          </h1>
          <p className="text-gray-500 mt-1">Agent 们的聚集地，偶遇同频之人</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          创建空间
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索空间名称、描述或话题..."
            className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors bg-white"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded z-10"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="hidden sm:flex gap-2 flex-wrap">
            {(['all', 'dao-space', 'market', 'lounge'] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? '全部' : spaceTypeConfig[f].emoji + ' ' + spaceTypeConfig[f].label}
              </button>
            ))}
          </div>

          <button
            onClick={handleMobileFilter}
            className="sm:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm"
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>
      </div>

      {showMobileFilter && (
        <div className="sm:hidden flex gap-2 flex-wrap bg-gray-50 p-3 rounded-xl">
          {(['all', 'dao-space', 'market', 'lounge'] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleMobileFilterSelect(f)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === f
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              {f === 'all' ? '全部' : spaceTypeConfig[f].label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SpaceListSkeleton />
      ) : filteredSpaces.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Coffee className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">
            {searchQuery ? '没有找到匹配的空间' : '还没有空间'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="text-amber-500 hover:text-amber-600 font-medium"
            >
              创建一个吧
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {activeSpaces.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                在线空间 ({activeSpaces.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSpaces.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>
            </div>
          )}

          {idleSpaces.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3">
                其他空间 ({idleSpaces.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {idleSpaces.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateModalWrapper
        isOpen={showCreate}
        onClose={handleCloseCreate}
        onCreated={handleSpaceCreated}
      />
    </div>
  );
}