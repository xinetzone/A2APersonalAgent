'use client';

import { memo, useCallback, useRef, useEffect, useState } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { spaceTypeConfig, iconComponents } from './StepIndicator';

type SpaceType = 'dao-space' | 'market' | 'lounge';

interface Step1TypeSelectionProps {
  type: SpaceType;
  onTypeChange: (type: SpaceType) => void;
}

function Step1TypeSelectionComponent({ type, onTypeChange }: Step1TypeSelectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (container) {
      setIsDragging(true);
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = scrollContainerRef.current;
    if (container) {
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    }
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">选择空间类型</h3>
        <p className="text-gray-500 text-sm">不同类型的空间有不同的互动方式</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">滑动查看更多类型</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              canScrollLeft
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              canScrollRight
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative group/scroll">
        <div
          className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex gap-4 overflow-x-auto scrollbar-hide pb-2 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {(['dao-space', 'market', 'lounge'] as const).map((t) => {
            const config = spaceTypeConfig[t];
            const TypeIcon = iconComponents[t];
            const isSelected = type === t;

            return (
              <button
                key={t}
                type="button"
                onClick={() => onTypeChange(t)}
                className={`relative flex-shrink-0 w-[180px] sm:w-[200px] p-6 rounded-2xl border-2 transition-all duration-300 ease-out text-left select-none ${
                  isSelected
                    ? `${config.borderColor.replace('200', '400')} ${config.bgColor} shadow-lg ring-2 ring-offset-2 ${config.borderColor.replace('border-', 'ring-')}`
                    : `border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5`
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      isSelected ? config.bgColor : 'bg-gray-100'
                    }`}
                  >
                    <TypeIcon
                      className={`w-8 h-8 transition-colors duration-300 ${
                        isSelected ? config.lightTextColor : 'text-gray-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">{config.emoji}</span>
                      <h3
                        className={`font-bold text-lg transition-colors duration-300 ${
                          isSelected ? config.textColor : 'text-gray-700'
                        }`}
                      >
                        {config.label}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {config.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-4">
        {(['dao-space', 'market', 'lounge'] as const).map((t) => (
          <div
            key={t}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              type === t ? 'w-6 bg-amber-500' : 'w-1.5 bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className={`mt-6 p-4 rounded-xl ${spaceTypeConfig[type].bgColor} border ${spaceTypeConfig[type].borderColor}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{spaceTypeConfig[type].emoji}</span>
          <div>
            <h4 className={`font-semibold ${spaceTypeConfig[type].textColor}`}>
              {spaceTypeConfig[type].label}适合你，如果...
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {type === 'dao-space' && '你想就特定话题进行深度讨论，探索思想边界，与志同道合的人碰撞智慧火花。'}
              {type === 'market' && '你想交换价值、分享资源、发现新机会，在互惠中建立有意义的连接。'}
              {type === 'lounge' && '你想轻松闲聊、随机偶遇有趣的人，在自然的对话中发现惊喜。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Step1TypeSelection = memo(Step1TypeSelectionComponent);
