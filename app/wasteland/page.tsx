'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Lock, Unlock, Eye, Clock, Mountain, Wind, Star } from 'lucide-react';

interface WastelandZones {
  [key: string]: {
    name: string;
    description: string;
    characteristics: string[];
    entryCondition: string;
    meditationFocus: string[];
  };
}

interface WorldState {
  cultivationProgress: {
    level: string;
    experience: number;
  };
}

const ZONE_ICONS: Record<string, React.ReactNode> = {
  '太虚': <Wind className="w-8 h-8" />,
  '玄墟': <Mountain className="w-8 h-8" />,
  '浑沌': <Star className="w-8 h-8" />,
  '无无': <Sparkles className="w-8 h-8" />,
};

export default function WastelandPage() {
  const [zones, setZones] = useState<WastelandZones | null>(null);
  const [state, setState] = useState<WorldState | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [canEnter, setCanEnter] = useState<Record<string, boolean>>({});
  const [narrative, setNarrative] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const [meditationResult, setMeditationResult] = useState<string>('');
  const [meditationDuration, setMeditationDuration] = useState(30);
  const [meditating, setMeditating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWastelandData();
  }, []);

  const fetchWastelandData = async () => {
    setLoading(true);
    try {
      const [zonesRes, stateRes] = await Promise.all([
        fetch(`/api/mcp?tool=wasteland&action=get_zones&userId=default-user`),
        fetch(`/api/mcp?tool=daoist_town&action=get_state&userId=default-user`),
      ]);

      const [zonesData, stateData] = await Promise.all([zonesRes.json(), stateRes.json()]);

      if (zonesData.result?.content) {
        const zonesText = zonesData.result.content[0]?.text || '{}';
        setZones(JSON.parse(zonesText));
      }
      if (stateData.result?.content) {
        const stateText = stateData.result.content[0]?.text || '{}';
        setState(JSON.parse(stateText));
      }

      const canEnterResult: Record<string, boolean> = {};
      for (const zone of ['太虚', '玄墟', '浑沌', '无无']) {
        const res = await fetch(`/api/mcp?tool=wasteland&action=can_enter&userId=default-user&zone=${zone}`);
        const data = await res.json();
        if (data.result?.content) {
          const result = JSON.parse(data.result.content[0]?.text || '{}');
          canEnterResult[zone] = result.canEnter;
        }
      }
      setCanEnter(canEnterResult);
    } catch (error) {
      console.error('Failed to fetch wasteland data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterZone = async (zoneName: string) => {
    if (!canEnter[zoneName]) return;

    setSelectedZone(zoneName);
    try {
      const params = new URLSearchParams({
        tool: 'wasteland',
        action: 'enter',
        userId: 'default-user',
        zone: zoneName,
      });

      const res = await fetch(`/api/mcp?${params.toString()}`);
      const data = await res.json();

      if (data.result?.content) {
        const result = JSON.parse(data.result.content[0]?.text || '{}');
        if (result.error) {
          setNarrative(result.error);
        } else {
          setNarrative(result.narrative || '');
          setQuote(result.returnQuote || '');
        }
      }
    } catch (error) {
      console.error('Failed to enter zone:', error);
    }
  };

  const handleMeditate = async () => {
    if (!selectedZone) return;

    setMeditating(true);
    try {
      const params = new URLSearchParams({
        tool: 'wasteland',
        action: 'meditate',
        userId: 'default-user',
        zone: selectedZone,
        durationMinutes: meditationDuration.toString(),
      });

      const res = await fetch(`/api/mcp?${params.toString()}`);
      const data = await res.json();

      if (data.result?.content) {
        const result = JSON.parse(data.result.content[0]?.text || '{}');
        setMeditationResult(result.insight || '');
        fetchWastelandData();
      }
    } catch (error) {
      console.error('Failed to meditate:', error);
    } finally {
      setMeditating(false);
    }
  };

  const handleGetWisdom = async () => {
    try {
      const params = new URLSearchParams({
        tool: 'wasteland',
        action: 'get_wisdom',
        userId: 'default-user',
      });

      const res = await fetch(`/api/mcp?${params.toString()}`);
      const data = await res.json();

      if (data.result?.content) {
        const result = JSON.parse(data.result.content[0]?.text || '{}');
        setNarrative(result.wisdom || '');
      }
    } catch (error) {
      console.error('Failed to get wisdom:', error);
    }
  };

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-dao-primary mb-4 flex items-center justify-center gap-3">
          <Sparkles className="w-10 h-10" />
          荒域
        </h1>
        <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
          返璞归真的终极圣地，体验"道法自然"的最高境界
        </p>
      </section>

      <section className="dao-card bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-400">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-purple-800">当前境界</h2>
            <p className="text-sm text-gray-600">修行经验</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-600">{state?.cultivationProgress?.level || '闻道'}</p>
            <p className="text-sm text-gray-500">{state?.cultivationProgress?.experience || 0} 经验</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          荒域是返璞归真的圣地，需要达到一定境界才能进入不同区域
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-dao-primary mb-4">荒域四境</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {zones && Object.entries(zones).map(([key, zone]) => {
            const canEnterZone = canEnter[key];
            return (
              <div
                key={key}
                className={`dao-card ${canEnterZone ? 'hover:border-purple-400' : 'opacity-60'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-full ${canEnterZone ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                    {canEnterZone ? ZONE_ICONS[key] : <Lock className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dao-primary">{zone.name}</h3>
                    <p className="text-xs text-gray-500">{zone.entryCondition}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">{zone.description}</p>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">特征：</p>
                  <div className="flex flex-wrap gap-1">
                    {zone.characteristics.map((char, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">修行要点：</p>
                  <div className="flex flex-wrap gap-1">
                    {zone.meditationFocus.map((focus, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>

                {canEnterZone && (
                  <button
                    onClick={() => handleEnterZone(key)}
                    className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    进入此境
                  </button>
                )}

                {!canEnterZone && (
                  <div className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    境界不足
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {selectedZone && (
        <section className="dao-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dao-primary flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              {selectedZone} - 冥想修炼
            </h2>
          </div>

          {narrative && (
            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{narrative}</p>
              {quote && (
                <p className="text-right text-purple-600 italic mt-2">—— {quote}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">冥想时长：</span>
              <select
                value={meditationDuration}
                onChange={(e) => setMeditationDuration(parseInt(e.target.value))}
                className="dao-input w-24 py-1"
              >
                <option value={15}>15分钟</option>
                <option value={30}>30分钟</option>
                <option value={60}>60分钟</option>
              </select>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleMeditate}
              disabled={meditating}
              className="dao-button flex items-center gap-2"
            >
              {meditating ? <span className="animate-spin">⟳</span> : <Sparkles className="w-5 h-5" />}
              开始冥想
            </button>
            <button
              onClick={handleGetWisdom}
              className="px-4 py-2 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            >
              获取先贤智慧
            </button>
          </div>

          {meditationResult && (
            <div className="mt-4 bg-gradient-to-br from-purple-100 to-white rounded-lg p-4 border-l-4 border-purple-400">
              <p className="text-gray-700 leading-relaxed">{meditationResult}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
