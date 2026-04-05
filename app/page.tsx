'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Sword, Award, Wallet, Map, Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const FEATURES = [
  {
    iconName: 'Users',
    title: '道德圆桌',
    description: '多智者在圆桌会议中为你的困境提供多元视角',
    href: '/roundtable',
    color: 'bg-amber-100 border-amber-400',
    tag: '核心功能',
  },
  {
    iconName: 'Sword',
    title: '道德修炼场',
    description: '在安全环境中修炼道德抉择能力',
    href: '/training',
    color: 'bg-green-100 border-green-400',
    tag: '新功能',
  },
  {
    iconName: 'Award',
    title: '道德信誉',
    description: '六维度信誉体系，追踪你的修行轨迹',
    href: '/credit',
    color: 'bg-blue-100 border-blue-400',
    tag: '新功能',
  },
  {
    iconName: 'Wallet',
    title: '道德钱包',
    description: '功德积分体系，让修行可量化流通',
    href: '/wallet',
    color: 'bg-yellow-100 border-yellow-400',
    tag: '新功能',
  },
  {
    iconName: 'Map',
    title: '道德小镇',
    description: '探访道德宗秘境，与修行者共修道德',
    href: '/town',
    color: 'bg-purple-100 border-purple-400',
    tag: '新功能',
  },
  {
    iconName: 'Sparkles',
    title: '荒域',
    description: '返璞归真的终极圣地，体验道法自然',
    href: '/wasteland',
    color: 'bg-indigo-100 border-indigo-400',
    tag: '新功能',
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Sword,
  Award,
  Wallet,
  Map,
  Sparkles,
};

function FeatureIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="space-y-12">
      <section className="text-center py-16 bg-gradient-to-b from-dao-light to-white rounded-3xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <BookOpen className="w-12 h-12 text-dao-gold" />
          <h1 className="text-5xl font-bold text-dao-primary">道德人生</h1>
        </div>
        <p className="text-xl text-dao-secondary/80 max-w-2xl mx-auto mb-8">
          基于帛书版《道德经》的智能修行平台<br />
          与多元 Agent 组成&quot;道德圆桌&quot;，在协作与对话中共同成长
        </p>

        {!mounted ? (
          <div className="h-14" />
        ) : !isAuthenticated ? (
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="dao-button text-lg px-8 py-4 flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                登录 / 开始修行
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Link href="/profile" className="dao-button px-6 py-3">
              进入个人中心
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-dao-primary mb-6 text-center">核心功能</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className={`dao-card hover:shadow-xl transition-all border-l-4 ${feature.color} hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/50">
                  <FeatureIcon name={feature.iconName} className="w-8 h-8" />
                </div>
                <span className="px-2 py-1 bg-white/50 rounded text-xs font-medium">
                  {feature.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-dao-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
              <div className="flex items-center text-dao-gold text-sm font-medium">
                探索
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="dao-card bg-gradient-to-br from-dao-gold/10 to-dao-light">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-dao-primary mb-2">帛书智慧</h2>
          <p className="text-dao-secondary/80">上善治水，水善利万物而有静</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/50 rounded-lg p-4">
            <p className="font-medium text-dao-primary mb-1">道法自然</p>
            <p className="text-gray-600">道遵法自身本然，非效法外物</p>
          </div>
          <div className="bg-white/50 rounded-lg p-4">
            <p className="font-medium text-dao-primary mb-1">上德不德</p>
            <p className="text-gray-600">最高级的德是不刻意为德</p>
          </div>
          <div className="bg-white/50 rounded-lg p-4">
            <p className="font-medium text-dao-primary mb-1">玄德</p>
            <p className="text-gray-600">生而弗有，为而弗恃，长而弗宰</p>
          </div>
        </div>
      </section>

      <section className="text-center text-sm text-gray-500">
        <p>道德人生 v2.0 | 基于帛书版《道德经》+ A2A 协议</p>
        <p className="mt-1">Powered by SecondMe & Vercel</p>
      </section>
    </div>
  );
}
