'use client';

import { useState, useEffect, useMemo } from 'react';
import { Map, Users, Home, TreePine, Waves, Building2, Sparkles, ChevronRight, MessageCircle, Search, Lock, Unlock, Star, MapPin, Info } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  role: string;
  cultivationLevel: string;
  personality: string;
  expertise: string[];
  dialogueExamples: string[];
  zone: string;
}

interface Zone {
  name: string;
  description: string;
  atmosphere: string;
  availableActivities: string[];
  characters: string[];
}

interface WorldState {
  currentRealm: string;
  currentZone: string;
  cultivationProgress: {
    level: string;
    experience: number;
    insights: string[];
  };
  unlockedZones?: string[];
}

const CULTIVATION_LEVELS = ['闻道', '悟道', '行道', '得道', '同道'];
const CULTIVATION_COLORS: Record<string, string> = {
  '闻道': 'bg-gray-100 text-gray-700',
  '悟道': 'bg-green-100 text-green-700',
  '行道': 'bg-blue-100 text-blue-700',
  '得道': 'bg-purple-100 text-purple-700',
  '同道': 'bg-amber-100 text-amber-700',
};

const ZONE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgGradient: string; borderColor: string }> = {
  '道场': {
    icon: <Home className="w-8 h-8" />,
    color: 'text-amber-700',
    bgGradient: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-300',
  },
  '市集': {
    icon: <Building2 className="w-8 h-8" />,
    color: 'text-orange-700',
    bgGradient: 'from-orange-50 to-yellow-50',
    borderColor: 'border-orange-300',
  },
  '山林': {
    icon: <TreePine className="w-8 h-8" />,
    color: 'text-green-700',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-300',
  },
  '水域': {
    icon: <Waves className="w-8 h-8" />,
    color: 'text-blue-700',
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-300',
  },
  '静室': {
    icon: <Sparkles className="w-8 h-8" />,
    color: 'text-purple-700',
    bgGradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-300',
  },
};

const ZONE_LORE: Record<string, string> = {
  '道场': '众弟子每日在此早课、围坐论道',
  '市集': '以物易物的温情，没有喧嚣',
  '山林': '清幽宁静，修行者静思的好去处',
  '水域': '若水大叔最喜静坐之处',
  '静室': '深度对话和私人交流的场所',
};

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function ZoneCard({ zone, isSelected, isUnlocked, onEnter, currentLevel }: {
  zone: Zone;
  isSelected: boolean;
  isUnlocked: boolean;
  onEnter: () => void;
  currentLevel: string;
}) {
  const config = ZONE_CONFIG[zone.name] || ZONE_CONFIG['道场'];
  const levelIndex = CULTIVATION_LEVELS.indexOf(currentLevel);
  const requiredIndex = zone.name === '道场' ? 0 :
    zone.name === '山林' ? 1 :
    zone.name === '水域' ? 2 :
    zone.name === '静室' ? 3 : 0;
  const isAccessible = isUnlocked || levelIndex >= requiredIndex;

  return (
    <button
      onClick={onEnter}
      disabled={!isAccessible}
      className={`
        relative p-5 rounded-xl border-2 transition-all duration-300 text-left
        ${isSelected ? `${config.borderColor} bg-gradient-to-br ${config.bgGradient} shadow-lg scale-[1.02]` : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}
        ${!isAccessible ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        group
      `}
    >
      {!isAccessible && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
      )}
      {isAccessible && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Unlock className="w-4 h-4 text-green-500" />
        </div>
      )}

      <div className={`${config.color} mb-3`}>
        {config.icon}
      </div>

      <h3 className="font-bold text-dao-primary mb-1">{zone.name}</h3>
      <p className="text-xs text-gray-500 mb-2">{ZONE_LORE[zone.name]}</p>

      <div className="flex items-center gap-1 text-xs text-gray-600">
        <MapPin className="w-3 h-3" />
        <span>{zone.availableActivities.slice(0, 2).join('、')}</span>
      </div>

      {zone.characters.length > 0 && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{zone.characters.join('、')}</span>
        </div>
      )}
    </button>
  );
}

function CharacterCard({ character, isSelected, onToggle }: {
  character: Character;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const zoneConfig = ZONE_CONFIG[character.zone] || ZONE_CONFIG['道场'];

  return (
    <div
      className={`
        dao-card cursor-pointer transition-all duration-300
        ${isSelected ? 'ring-2 ring-dao-gold shadow-lg' : 'hover:shadow-md'}
      `}
      onClick={onToggle}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-14 h-14 rounded-full flex items-center justify-center text-2xl
          bg-gradient-to-br ${zoneConfig.bgGradient}
          border-2 ${zoneConfig.borderColor}
        `}>
          {character.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-dao-primary truncate">{character.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CULTIVATION_COLORS[character.cultivationLevel]}`}>
              {character.cultivationLevel}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-1">{character.role}</p>
          <p className="text-sm text-gray-700 line-clamp-2">{character.personality}</p>
        </div>
      </div>

      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${zoneConfig.bgGradient}`}>
            <p className="text-sm italic text-gray-700">{`'${character.dialogueExamples[0]}'`}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Star className="w-3 h-3" />
              专长领域
            </p>
            <div className="flex flex-wrap gap-1">
              {character.expertise.map((exp, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                  {exp}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-dao-gold text-sm">
            <MessageCircle className="w-4 h-4" />
            <span>查看更多对话</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {!isSelected && (
        <div className="flex items-center justify-center text-dao-gold text-sm mt-3 pt-3 border-t border-gray-100">
          <MessageCircle className="w-4 h-4 mr-1" />
          <span>点击展开详情</span>
        </div>
      )}
    </div>
  );
}

export default function TownPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [state, setState] = useState<WorldState | null>(null);
  const [narrative, setNarrative] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('道场');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState<string>('全部');
  const [sortBy, setSortBy] = useState<'level' | 'name'>('level');

  useEffect(() => {
    fetchTownData();
  }, []);

  const fetchTownData = async () => {
    setLoading(true);
    try {
      const [charsRes, zonesRes, stateRes, narrativeRes] = await Promise.all([
        fetch(`/api/mcp?tool=daoist_town&action=get_characters&userId=default-user`),
        fetch(`/api/mcp?tool=daoist_town&action=get_zones&userId=default-user`),
        fetch(`/api/mcp?tool=daoist_town&action=get_state&userId=default-user`),
        fetch(`/api/mcp?tool=daoist_town&action=get_narrative&userId=default-user`),
      ]);

      const [charsData, zonesData, stateData, narrativeData] = await Promise.all([
        charsRes.json(),
        zonesRes.json(),
        stateRes.json(),
        narrativeRes.json(),
      ]);

      if (charsData.result?.content) setCharacters(JSON.parse(charsData.result.content[0]?.text || '[]'));
      if (zonesData.result?.content) setZones(JSON.parse(zonesData.result.content[0]?.text || '[]'));
      if (stateData.result?.content) setState(JSON.parse(stateData.result.content[0]?.text || '{}'));
      if (narrativeData.result?.content) setNarrative(JSON.parse(narrativeData.result.content[0]?.text || '{}').narrative || '');
    } catch (error) {
      console.error('Failed to fetch town data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterZone = async (zoneName: string) => {
    setSelectedZone(zoneName);
    try {
      const params = new URLSearchParams({
        tool: 'daoist_town',
        action: 'enter_zone',
        userId: 'default-user',
        zone: zoneName,
      });

      const res = await fetch(`/api/mcp?${params.toString()}`);
      const data = await res.json();

      if (data.result?.content) {
        const result = JSON.parse(data.result.content[0]?.text || '{}');
        setNarrative(result.state?.narrative || '');
      }
    } catch (error) {
      console.error('Failed to enter zone:', error);
    }
  };

  const filteredAndSortedCharacters = useMemo(() => {
    let result = [...characters];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.role.toLowerCase().includes(query) ||
        c.personality.toLowerCase().includes(query)
      );
    }

    if (filterZone !== '全部') {
      result = result.filter(c => c.zone === filterZone);
    }

    if (sortBy === 'level') {
      result.sort((a, b) => {
        const levelOrder = ['闻道', '悟道', '行道', '得道', '同道'];
        return levelOrder.indexOf(b.cultivationLevel) - levelOrder.indexOf(a.cultivationLevel);
      });
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [characters, searchQuery, filterZone, sortBy]);

  const currentZoneData = zones.find(z => z.name === selectedZone);
  const zoneConfig = ZONE_CONFIG[selectedZone] || ZONE_CONFIG['道场'];

  if (loading) {
    return (
      <div className="space-y-8">
        <section className="text-center py-8">
          <h1 className="text-4xl font-bold text-dao-primary mb-4 flex items-center justify-center gap-3">
            <Map className="w-10 h-10" />
            道德小镇
          </h1>
        </section>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-dao-primary mb-3 flex items-center justify-center gap-3">
          <Map className="w-8 md:w-10 h-8 md:h-10" />
          道德小镇
        </h1>
        <p className="text-base md:text-lg text-dao-secondary/80">
          探访道德宗秘境，与五位修行者共修道德
        </p>
      </section>

      <section className="dao-card bg-gradient-to-br from-dao-light to-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-dao-primary flex items-center gap-2">
              <MapPin className="w-5 h-5 text-dao-gold" />
              当前状态
            </h2>
            <p className="text-sm text-gray-600">
              境界：<span className={`font-medium px-2 py-0.5 rounded ${CULTIVATION_COLORS[state?.cultivationProgress?.level || '闻道']}`}>{state?.cultivationProgress?.level || '闻道'}</span>
              {' '}| 当前区域：{selectedZone}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-3xl font-bold text-dao-gold">{state?.cultivationProgress?.experience || 0}</p>
            <p className="text-xs text-gray-500">修行经验</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(state?.cultivationProgress?.insights || []).slice(0, 5).map((insight: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-dao-gold/20 text-dao-gold rounded-full text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {insight.slice(0, 15)}{insight.length > 15 ? '...' : ''}
            </span>
          ))}
          {(state?.cultivationProgress?.insights || []).length === 0 && (
            <span className="text-xs text-gray-400 italic">暂无感悟，继续探索吧</span>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-dao-primary flex items-center gap-2">
            <Map className="w-5 md:w-6 h-5 md:h-6" />
            小镇地图
          </h2>
          {currentZoneData && (
            <span className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
              <Info className="w-3 md:w-4 h-3 md:h-4" />
              点击区域进入探索
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {zones.map((zone) => {
            const isUnlocked = state?.unlockedZones?.includes(zone.name) || false;
            return (
              <ZoneCard
                key={zone.name}
                zone={zone}
                isSelected={selectedZone === zone.name}
                isUnlocked={isUnlocked}
                onEnter={() => handleEnterZone(zone.name)}
                currentLevel={state?.cultivationProgress?.level || '闻道'}
              />
            );
          })}
        </div>

        {currentZoneData && (
          <div className={`mt-4 p-4 rounded-xl border-2 ${zoneConfig.borderColor} bg-gradient-to-r ${zoneConfig.bgGradient}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={zoneConfig.color}>{zoneConfig.icon}</span>
              <h3 className="font-semibold text-dao-primary">{currentZoneData.name}</h3>
            </div>
            <p className="text-sm text-gray-700 mb-3">{currentZoneData.description}</p>
            <div className="flex flex-wrap gap-2">
              {currentZoneData.availableActivities.map((activity, i) => (
                <span key={i} className="px-2 py-1 bg-white/60 rounded text-xs text-gray-700">
                  {activity}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {narrative && (
        <section className="dao-card bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-amber-800">小镇故事</span>
          </div>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
            {narrative.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-2">{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg md:text-xl font-bold text-dao-primary flex items-center gap-2">
            <Users className="w-5 md:w-6 h-5 md:h-6" />
            修行者一览
            <span className="text-sm font-normal text-gray-500">({filteredAndSortedCharacters.length})</span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索修行者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dao-gold/50 w-36 md:w-48"
              />
            </div>

            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dao-gold/50 bg-white"
            >
              <option value="全部">全部区域</option>
              {zones.map(zone => (
                <option key={zone.name} value={zone.name}>{zone.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'level' | 'name')}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dao-gold/50 bg-white"
            >
              <option value="level">按境界排序</option>
              <option value="name">按姓名排序</option>
            </select>
          </div>
        </div>

        {filteredAndSortedCharacters.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedCharacter?.id === character.id}
                onToggle={() => setSelectedCharacter(
                  selectedCharacter?.id === character.id ? null : character
                )}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>未找到匹配的修行者</p>
            <p className="text-sm text-gray-400 mt-1">尝试调整筛选条件</p>
          </div>
        )}
      </section>
    </div>
  );
}
