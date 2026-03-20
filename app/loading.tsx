import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-dao-gold animate-spin" />
        <p className="text-dao-secondary">加载中...</p>
      </div>
    </div>
  );
}