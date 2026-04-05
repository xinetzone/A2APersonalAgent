'use client';

import { AuthProvider } from './context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, Search, Users, Award, Sword, Wallet, Map, User, Coffee } from 'lucide-react';
import { memo, useMemo } from 'react';
import { Toaster } from 'sonner';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/topic', icon: Search, label: '主题' },
  { href: '/roundtable', icon: Users, label: '圆桌' },
  { href: '/training', icon: Sword, label: '修炼' },
  { href: '/credit', icon: Award, label: '信誉' },
  { href: '/town', icon: Map, label: '小镇' },
  { href: '/space', icon: Coffee, label: '空间' },
  { href: '/wallet', icon: Wallet, label: '钱包' },
  { href: '/profile', icon: User, label: '我的' },
] as const;

const NavLink = memo(function NavLink({
  href,
  icon: Icon,
  label,
  isActive
}: {
  href: string;
  icon: typeof Home;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-1 px-2 py-2 rounded-lg transition-colors text-sm ${
        isActive
          ? 'bg-dao-primary/30 text-dao-gold'
          : 'hover:bg-dao-primary/20 text-dao-light'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
});

function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = useMemo(() =>
    NAV_ITEMS.map((item) => ({
      ...item,
      isActive: pathname === item.href,
    })),
    [pathname]
  );

  return (
    <AuthProvider>
      <Toaster position="top-right" richColors expand={false} />
      <nav className="bg-dao-dark text-dao-light sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
              <BookOpen className="w-6 h-6" />
              <span>道德人生</span>
            </Link>
            <div className="flex space-x-1">
              {navLinks.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-dao-dark text-dao-light py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm opacity-75">
            A2A Personal Agent - 道德人生 v2.0 | 基于帛书版道德经的智能指导
          </p>
          <p className="text-xs opacity-50 mt-2">
            Powered by SecondMe & Vercel
          </p>
        </div>
      </footer>
    </AuthProvider>
  );
}

export default ClientLayout;
