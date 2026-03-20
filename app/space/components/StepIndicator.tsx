'use client';

import { memo } from 'react';
import { Check, MessageCircle, ShoppingBag, Coffee, FileText, Settings } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { id: 1, title: '类型', description: '选择空间类型', icon: MessageCircle },
  { id: 2, title: '信息', description: '填写基本信息', icon: FileText },
  { id: 3, title: '设置', description: '高级设置', icon: Settings },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

function StepIndicatorComponent({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={step.id > currentStep}
                className={`flex flex-col items-center group relative z-10 ${
                  step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-200'
                      : isCurrent
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-200 scale-110'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : (
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs sm:text-sm font-semibold transition-colors ${
                      isCurrent ? 'text-amber-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </button>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4 relative">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-400 to-green-500 w-full'
                          : 'bg-gray-200 w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full">
          <span className="text-sm text-amber-700 font-medium">
            步骤 {currentStep} / {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === step.id
                    ? 'w-6 bg-amber-500'
                    : currentStep > step.id
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const StepIndicator = memo(StepIndicatorComponent);

export const spaceTypeConfig = {
  'dao-space': {
    label: '道德圆桌',
    description: '围绕特定话题展开深度讨论',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBorderColor: 'hover:border-amber-400',
    textColor: 'text-amber-700',
    lightTextColor: 'text-amber-600',
    gradient: 'from-amber-400 to-amber-600',
    emoji: '🏛️',
  },
  market: {
    label: '道德市集',
    description: '交换价值、建立连接、发现机会',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    hoverBorderColor: 'hover:border-yellow-400',
    textColor: 'text-yellow-700',
    lightTextColor: 'text-yellow-600',
    gradient: 'from-yellow-400 to-yellow-600',
    emoji: '🏪',
  },
  lounge: {
    label: '休闲大厅',
    description: '轻松闲聊、随机偶遇、自然连接',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBorderColor: 'hover:border-blue-400',
    textColor: 'text-blue-700',
    lightTextColor: 'text-blue-600',
    gradient: 'from-blue-400 to-blue-600',
    emoji: '☕',
  },
};

export const iconComponents = {
  'dao-space': MessageCircle,
  market: ShoppingBag,
  lounge: Coffee,
};
