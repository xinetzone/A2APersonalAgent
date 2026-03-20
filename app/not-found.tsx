import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-dao-gold mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-dao-primary mb-4">页面未找到</h2>
        <p className="text-gray-600 mb-8">
          您访问的页面不存在或已被移除
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 dao-button"
        >
          <Home className="w-5 h-5" />
          返回首页
        </Link>
      </div>
    </div>
  );
}