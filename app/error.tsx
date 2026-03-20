'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dao-light">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto border-l-4 border-dao-primary">
        <h2 className="text-2xl font-bold text-dao-primary mb-4">出现了一些问题</h2>
        <p className="text-gray-600 mb-6">{error.message || '应用程序遇到了一个错误'}</p>
        <button
          onClick={reset}
          className="dao-button"
        >
          重试
        </button>
      </div>
    </div>
  );
}