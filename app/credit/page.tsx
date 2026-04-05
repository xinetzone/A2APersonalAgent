'use client';

import { useState, useEffect } from 'react';
import { Award, TrendingUp, TrendingDown, Minus, BookOpen, Heart, Shield, Gem, Sun, Clock } from 'lucide-react';

interface DimensionData {
  score: number;
  evidence: string[];
  trend: 'up' | 'stable' | 'down';
}

interface CreditProfile {
  userId: string;
  sixDimensions: {
    [key: string]: DimensionData;
  };
  creditScore: number;
  rank: string;
}

const DIMENSION_INFO: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  '闻道': { icon: <BookOpen className="w-5 h-5" />, color: 'bg-amber-100 border-amber-400', description: '对道德经典的研习程度' },
  '行善': { icon: <Heart className="w-5 h-5" />, color: 'bg-red-100 border-red-400', description: '日常善行实践' },
  '清静': { icon: <Shield className="w-5 h-5" />, color: 'bg-blue-100 border-blue-400', description: '冲突中的处理方式' },
  '知足': { icon: <Gem className="w-5 h-5" />, color: 'bg-purple-100 border-purple-400', description: '欲望管理能力' },
  '玄德': { icon: <Sun className="w-5 h-5" />, color: 'bg-yellow-100 border-yellow-400', description: '付出不求回报的行为' },
  '应时': { icon: <Clock className="w-5 h-5" />, color: 'bg-green-100 border-green-400', description: '与时俱进的适应能力' },
};

const RANK_INFO: Record<string, { minScore: number; description: string; color: string }> = {
  '闻道': { minScore: 0, description: '初入修行之门', color: 'bg-gray-100 text-gray-800' },
  '悟道': { minScore: 40, description: '渐悟道德真谛', color: 'bg-green-100 text-green-800' },
  '行道': { minScore: 60, description: '知行合一，开始影响他人', color: 'bg-blue-100 text-blue-800' },
  '得道': { minScore: 80, description: '道德已成为生命一部分', color: 'bg-purple-100 text-purple-800' },
  '同道': { minScore: 95, description: '成为他人修行的标杆', color: 'bg-amber-100 text-amber-800' },
};

export default function CreditPage() {
  const [profile, setProfile] = useState<CreditProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tool: 'moral_credit', action: 'get_profile', userId: 'default-user' });
      const res = await fetch(`/api/mcp?${params.toString()}`);
      const data = await res.json();

      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        setProfile(JSON.parse(text));
      }
    } catch (error) {
      console.error('Failed to fetch credit profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'stable' | 'down' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const rankInfo = profile ? RANK_INFO[profile.rank] || RANK_INFO['闻道'] : RANK_INFO['闻道'];

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-dao-primary mb-4 flex items-center justify-center gap-3">
          <Award className="w-10 h-10" />
          道德信誉
        </h1>
        <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
          六维度信誉体系，追踪你的道德修行之路
        </p>
      </section>

      <section className="dao-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-dao-primary">修行境界</h2>
            <p className="text-gray-600">当前境界与信誉总分</p>
          </div>
          <span className={`px-4 py-2 rounded-full font-bold ${rankInfo.color}`}>
            {profile?.rank || '闻道'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-dao-light rounded-lg p-6 text-center">
            <p className="text-5xl font-bold text-dao-gold">{profile?.creditScore || 0}</p>
            <p className="text-gray-600 mt-2">信誉总分</p>
          </div>
          <div className="bg-dao-light rounded-lg p-6 text-center">
            <p className="text-xl font-bold text-dao-primary mb-2">{rankInfo.description}</p>
            <p className="text-gray-600">当前境界</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>信誉等级：</span>
          {Object.entries(RANK_INFO).map(([rank, info]) => (
            <span key={rank} className="px-2 py-1 rounded bg-gray-100 text-xs">{rank}</span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-dao-primary mb-4">六维度详情</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {profile && Object.entries(profile.sixDimensions).map(([dim, data]) => {
            const info = DIMENSION_INFO[dim] || DIMENSION_INFO['闻道'];
            return (
              <div key={dim} className={`dao-card border-l-4 ${info.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {info.icon}
                    <span className="font-semibold text-dao-primary">{dim}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={data.trend} />
                    <span className="text-2xl font-bold text-dao-gold">{data.score}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                <div className="flex flex-wrap gap-1">
                  {data.evidence.slice(0, 3).map((e, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/50 rounded text-xs text-gray-700">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dao-card bg-dao-light">
        <h2 className="text-xl font-bold text-dao-primary mb-4">如何提升信誉</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <BookOpen className="w-6 h-6 text-amber-500 mb-2" />
            <p className="font-medium text-dao-primary mb-1">闻道</p>
            <p className="text-gray-600">每日研读经典，参与道德圆桌</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <Heart className="w-6 h-6 text-red-500 mb-2" />
            <p className="font-medium text-dao-primary mb-1">行善</p>
            <p className="text-gray-600">记录善行，帮助他人解决困境</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <Shield className="w-6 h-6 text-blue-500 mb-2" />
            <p className="font-medium text-dao-primary mb-1">清静</p>
            <p className="text-gray-600">躁中取静，静观自得</p>
          </div>
        </div>
      </section>
    </div>
  );
}
