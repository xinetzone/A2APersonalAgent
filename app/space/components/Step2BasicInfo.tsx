'use client';

import { memo, useCallback } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { iconComponents, spaceTypeConfig } from './StepIndicator';

type SpaceType = 'dao-space' | 'market' | 'lounge';

interface ValidationErrors {
  name?: string;
  description?: string;
}

interface Step2BasicInfoProps {
  type: SpaceType;
  name: string;
  description: string;
  initialTopic: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onInitialTopicChange: (topic: string) => void;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  onBlur: (field: string) => void;
}

function Step2BasicInfoComponent({
  type,
  name,
  description,
  initialTopic,
  onNameChange,
  onDescriptionChange,
  onInitialTopicChange,
  errors,
  touched,
  onBlur,
}: Step2BasicInfoProps) {
  const Icon = iconComponents[type];
  const config = spaceTypeConfig[type];

  const handleNameBlur = useCallback(() => {
    onBlur('name');
  }, [onBlur]);

  const handleDescriptionBlur = useCallback(() => {
    onBlur('description');
  }, [onBlur]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">填写基本信息</h3>
        <p className="text-gray-500 text-sm">给你的空间起个名字，让其他人更容易找到</p>
      </div>

      <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor} mb-6`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/50">
            <Icon className={`w-5 h-5 ${config.lightTextColor}`} />
          </div>
          <div>
            <span className="text-sm text-gray-500">当前类型</span>
            <p className={`font-semibold ${config.textColor}`}>
              {config.emoji} {config.label}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          空间名称 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="给你的空间起个有吸引力的名字"
            maxLength={30}
            className={`w-full pl-12 pr-12 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none text-base ${
              touched.name && errors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50/30'
                : 'border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 bg-gray-50/50 focus:bg-white hover:border-gray-300'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span
              className={`text-xs font-medium transition-colors duration-300 ${
                name.length > 25 ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              {name.length}/30
            </span>
          </div>
        </div>
        {touched.name && errors.name && (
          <div className="flex items-center gap-2 mt-2 text-red-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{errors.name}</span>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          好的名字能吸引志同道合的人
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">空间描述</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="描述这个空间的主题、目的，以及参与者可以期待什么..."
          rows={4}
          maxLength={200}
          className={`w-full px-4 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none resize-none text-base ${
            touched.description && errors.description
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50/30'
              : 'border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 bg-gray-50/50 focus:bg-white hover:border-gray-300'
          }`}
        />
        <div className="flex justify-between items-center">
          {touched.description && errors.description ? (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{errors.description}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">好的描述能帮助人们快速了解这个空间</span>
          )}
          <span
            className={`text-xs font-medium transition-colors duration-300 ${
              description.length > 150 ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            {description.length}/200
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          初始话题（可选）
        </label>
        <div className="relative">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
          <input
            type="text"
            value={initialTopic}
            onChange={(e) => onInitialTopicChange(e.target.value)}
            placeholder="例如：AI 时代的伦理困境"
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl transition-all duration-300 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 bg-gray-50/50 focus:bg-white hover:border-gray-300"
          />
        </div>
        <p className="text-xs text-gray-500">设置后，参与者进入空间时可以看到这个话题</p>
      </div>
    </div>
  );
}

export const Step2BasicInfo = memo(Step2BasicInfoComponent);
