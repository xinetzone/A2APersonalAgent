'use client';

import { memo } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

function NavigationButtonsComponent({
  currentStep,
  totalSteps,
  canGoNext,
  isLoading,
  onPrevious,
  onNext,
  onSubmit,
}: NavigationButtonsProps) {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-100">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep || isLoading}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
          isFirstStep || isLoading
            ? 'opacity-0 pointer-events-none'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
        }`}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>上一步</span>
      </button>

      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>按 Enter 键继续</span>
        </div>
      </div>

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canGoNext || isLoading}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden ${
            !canGoNext || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>创建中...</span>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              <Sparkles className="w-5 h-5 relative z-10" />
              <span className="relative z-10">创建空间</span>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
            !canGoNext || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md'
          }`}
        >
          <span>下一步</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export const NavigationButtons = memo(NavigationButtonsComponent);
