'use client';

import { memo, useCallback } from 'react';
import { UserPlus, Lock, Globe, AlertCircle, Users } from 'lucide-react';
import { spaceTypeConfig } from './StepIndicator';

type SpaceType = 'dao-space' | 'market' | 'lounge';

interface ValidationErrors {
  maxParticipants?: string;
}

interface Step3AdvancedSettingsProps {
  type: SpaceType;
  maxParticipants: number;
  isPrivate: boolean;
  onMaxParticipantsChange: (count: number) => void;
  onIsPrivateChange: (isPrivate: boolean) => void;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  onBlur: (field: string) => void;
}

function Step3AdvancedSettingsComponent({
  type,
  maxParticipants,
  isPrivate,
  onMaxParticipantsChange,
  onIsPrivateChange,
  errors,
  touched,
  onBlur,
}: Step3AdvancedSettingsProps) {
  const config = spaceTypeConfig[type];

  const handleBlur = useCallback(() => {
    onBlur('maxParticipants');
  }, [onBlur]);

  const participantPresets = [
    { value: 5, label: '小型', desc: '亲密对话' },
    { value: 15, label: '中型', desc: '小组讨论' },
    { value: 30, label: '大型', desc: '社区活动' },
    { value: 50, label: '超大', desc: '公开演讲' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">高级设置</h3>
        <p className="text-gray-500 text-sm">配置空间的大小和访问权限</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4" />
          最大参与人数 <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {participantPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onMaxParticipantsChange(preset.value)}
              className={`p-3 rounded-xl border-2 transition-all duration-300 text-center ${
                maxParticipants === preset.value
                  ? `${config.borderColor.replace('200', '400')} ${config.bgColor} shadow-md`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={`font-bold text-lg ${maxParticipants === preset.value ? config.textColor : 'text-gray-700'}`}>
                {preset.value}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">{preset.label}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <input
            type="range"
            min={2}
            max={100}
            value={maxParticipants}
            onChange={(e) => onMaxParticipantsChange(Number(e.target.value))}
            onBlur={handleBlur}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="w-16 text-center bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100">
            <span className="font-bold text-xl text-gray-800">{maxParticipants}</span>
            <span className="text-xs text-gray-400 block">人</span>
          </div>
        </div>

        {touched.maxParticipants && errors.maxParticipants && (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{errors.maxParticipants}</span>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">
          {maxParticipants <= 5 && '小型空间适合深度对话和紧密协作'}
          {maxParticipants > 5 && maxParticipants <= 15 && '中型空间适合小组讨论和头脑风暴'}
          {maxParticipants > 15 && maxParticipants <= 30 && '大型空间适合社区活动和主题分享'}
          {maxParticipants > 30 && '超大空间适合公开演讲和大型活动'}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">访问权限</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onIsPrivateChange(false)}
            className={`p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
              !isPrivate
                ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-md'
                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className={`p-3 rounded-xl ${!isPrivate ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Globe className={`w-6 h-6 ${!isPrivate ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <div className="text-center">
              <span className="font-semibold block">公开</span>
              <span className="text-xs text-gray-500">所有人可发现和加入</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onIsPrivateChange(true)}
            className={`p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
              isPrivate
                ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-md'
                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className={`p-3 rounded-xl ${isPrivate ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Lock className={`w-6 h-6 ${isPrivate ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <div className="text-center">
              <span className="font-semibold block">私密</span>
              <span className="text-xs text-gray-500">仅受邀者可加入</span>
            </div>
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
        <h4 className={`font-semibold ${config.textColor} mb-2 flex items-center gap-2`}>
          <UserPlus className="w-4 h-4" />
          设置总结
        </h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>空间类型</span>
            <span className="font-medium">{config.emoji} {config.label}</span>
          </div>
          <div className="flex justify-between">
            <span>最大人数</span>
            <span className="font-medium">{maxParticipants} 人</span>
          </div>
          <div className="flex justify-between">
            <span>访问权限</span>
            <span className="font-medium">{isPrivate ? '🔒 私密' : '🌐 公开'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Step3AdvancedSettings = memo(Step3AdvancedSettingsComponent);
