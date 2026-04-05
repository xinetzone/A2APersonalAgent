'use client';

import { useState, useEffect } from 'react';

interface LoadingStateProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  children?: React.ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
}

export function LoadingState({
  status,
  message,
  children,
  errorMessage,
  onRetry
}: LoadingStateProps) {
  const [showRetry, setShowRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    if (status === 'error') {
      setShowRetry(true);
    } else {
      setShowRetry(false);
      setRetryCount(0);
    }
  }, [status]);

  const handleRetry = () => {
    if (retryCount < maxRetries && onRetry) {
      setRetryCount(prev => prev + 1);
      onRetry();
    }
  };

  const handleReset = () => {
    setShowRetry(false);
    setRetryCount(0);
  };

  return (
    <div className="loading-container">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dao-primary mb-2"></div>
          {message && <p className="text-dao-secondary">{message}</p>}
        </div>
      )}

      {status === 'success' && children}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">{errorMessage || '操作失败，请重试'}</p>
          {showRetry && retryCount < maxRetries && onRetry && (
            <button
              onClick={handleRetry}
              className="dao-button"
            >
              重试 ({retryCount + 1}/{maxRetries})
            </button>
          )}
          {retryCount >= maxRetries && (
            <div className="mt-4">
              <p className="text-gray-500 mb-2">重试次数已达上限</p>
              <button
                onClick={handleReset}
                className="dao-button-secondary"
              >
                重新开始
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'idle' && children}
    </div>
  );
}

export function withLoadingState<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingMessage?: string
) {
  return function WithLoadingComponent(props: P) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | undefined>();

    const handleLoad = async (loadFn: () => Promise<void>) => {
      setStatus('loading');
      try {
        await loadFn();
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : '操作失败');
      }
    };

    const handleRetry = () => {
      setStatus('idle');
    };

    return (
      <LoadingState
        status={status}
        message={loadingMessage}
        errorMessage={error}
        onRetry={handleRetry}
      >
        <WrappedComponent {...props} />
      </LoadingState>
    );
  };
}
