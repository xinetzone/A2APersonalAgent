'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, CheckCircle, AlertCircle, Loader2, WifiOff, Wifi, Server, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { StepIndicator } from './StepIndicator';
import { Step1TypeSelection } from './Step1TypeSelection';
import { Step2BasicInfo } from './Step2BasicInfo';
import { Step3AdvancedSettings } from './Step3AdvancedSettings';
import { NavigationButtons } from './NavigationButtons';

type SpaceType = 'dao-space' | 'market' | 'lounge';

interface SpaceInfo {
  id: string;
  type: SpaceType;
  name: string;
  description: string;
  status: string;
  participants: { agentId: string; userId: string; role: string }[];
  maxParticipants: number;
  currentTopic?: string;
  createdAt: number;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  maxParticipants?: string;
}

type LoadingState = 'idle' | 'validating' | 'submitting' | 'processing' | 'success' | 'error';

interface LoadingStatus {
  state: LoadingState;
  message: string;
  progress: number;
  canRetry: boolean;
}

const TOTAL_STEPS = 3;

const loadingMessages: Record<LoadingState, { title: string; subtitle: string }> = {
  idle: { title: '准备就绪', subtitle: '点击创建开始' },
  validating: { title: '验证中', subtitle: '正在检查表单数据...' },
  submitting: { title: '发送请求', subtitle: '正在连接服务器...' },
  processing: { title: '创建空间', subtitle: '服务器正在处理您的请求...' },
  success: { title: '创建成功', subtitle: '正在为您准备空间...' },
  error: { title: '创建失败', subtitle: '请检查网络连接后重试' },
};

function validateSpaceForm(name: string, description: string, maxParticipants: number): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!name.trim()) {
    errors.name = '请输入空间名称';
  } else if (name.trim().length < 2) {
    errors.name = '空间名称至少需要 2 个字符';
  } else if (name.trim().length > 30) {
    errors.name = '空间名称不能超过 30 个字符';
  }

  if (description.length > 200) {
    errors.description = '描述不能超过 200 个字符';
  }

  if (maxParticipants < 2) {
    errors.maxParticipants = '至少需要 2 人参与';
  } else if (maxParticipants > 100) {
    errors.maxParticipants = '最多支持 100 人';
  }

  return errors;
}

function useProgressSimulation(
  isActive: boolean,
  targetProgress: number,
  duration: number = 1000
): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const startProgress = progress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      const currentProgress = startProgress + (targetProgress - startProgress) * easedProgress;

      setProgress(currentProgress);

      if (rawProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isActive, targetProgress, duration]);

  return progress;
}

function LoadingAnimation({
  status,
  progress,
  onRetry,
}: {
  status: LoadingStatus;
  progress: number;
  onRetry?: () => void;
}) {
  const messages = loadingMessages[status.state];

  const getStatusIcon = () => {
    switch (status.state) {
      case 'validating':
      case 'submitting':
      case 'processing':
        return (
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-amber-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            </div>
            <div
              className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            />
          </div>
        );
      case 'success':
        return (
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        );
      case 'error':
        return (
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-red-500" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="mb-6">{getStatusIcon()}</div>

      <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">{messages.title}</h3>
      <p className="text-gray-500 text-center mb-6 max-w-xs">{messages.subtitle}</p>

      {(status.state === 'validating' || status.state === 'submitting' || status.state === 'processing') && (
        <div className="w-full max-w-xs mb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-400">
        {status.state === 'submitting' && <Wifi className="w-4 h-4 animate-pulse" />}
        {status.state === 'processing' && <Server className="w-4 h-4 animate-pulse" />}
        {status.state === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
        <span>
          {status.state === 'validating' && '验证表单数据...'}
          {status.state === 'submitting' && '建立网络连接...'}
          {status.state === 'processing' && '服务器处理中...'}
          {status.state === 'success' && '即将跳转...'}
          {status.state === 'error' && '网络异常'}
        </span>
      </div>

      {status.canRetry && onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all duration-200 hover:shadow-lg active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
          <span>重新尝试</span>
        </button>
      )}

      {status.state === 'processing' && (
        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 max-w-xs">
          <p className="text-xs text-amber-700 text-center">正在为您创建专属空间，请稍候...</p>
        </div>
      )}
    </div>
  );
}

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (space: SpaceInfo) => void;
}

export default function CreateSpaceModal({ isOpen, onClose, onCreated }: CreateSpaceModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType>('dao-space');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [initialTopic, setInitialTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
    state: 'idle',
    message: '',
    progress: 0,
    canRetry: false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const progress = useProgressSimulation(
    loadingStatus.state === 'validating' || loadingStatus.state === 'submitting' || loadingStatus.state === 'processing',
    loadingStatus.state === 'validating' ? 20 : loadingStatus.state === 'submitting' ? 50 : loadingStatus.state === 'processing' ? 90 : 100,
    loadingStatus.state === 'validating' ? 300 : loadingStatus.state === 'submitting' ? 800 : 1500
  );

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setName('');
      setType('dao-space');
      setDescription('');
      setMaxParticipants(10);
      setInitialTopic('');
      setIsPrivate(false);
      setErrors({});
      setTouched({});
      setLoadingStatus({ state: 'idle', message: '', progress: 0, canRetry: false });
    }
  }, [isOpen]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validateSpaceForm(name, description, maxParticipants);
    setErrors(newErrors);
  }, [name, description, maxParticipants]);

  useEffect(() => {
    if (touched.name || touched.description || touched.maxParticipants) {
      const newErrors = validateSpaceForm(name, description, maxParticipants);
      setErrors(newErrors);
    }
  }, [name, description, maxParticipants, touched]);

  const canGoNext = useMemo(() => {
    if (currentStep === 1) {
      return true;
    }
    if (currentStep === 2) {
      return name.trim().length >= 2 && name.trim().length <= 30 && !errors.name && !errors.description;
    }
    if (currentStep === 3) {
      return maxParticipants >= 2 && maxParticipants <= 100 && !errors.maxParticipants;
    }
    return false;
  }, [currentStep, name, errors, maxParticipants]);

  const handleNext = useCallback(() => {
    if (!canGoNext) return;

    if (currentStep === 2) {
      setTouched({ name: true, description: true });
      const newErrors = validateSpaceForm(name, description, maxParticipants);
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast.error('请检查表单输入');
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canGoNext, currentStep, name, description, maxParticipants]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback(
    (step: number) => {
      if (step <= currentStep) {
        setCurrentStep(step);
      }
    },
    [currentStep]
  );

  const handleRetry = useCallback(() => {
    setLoadingStatus({ state: 'idle', message: '', progress: 0, canRetry: false });
    handleSubmit();
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoadingStatus({ state: 'validating', message: '验证中...', progress: 0, canRetry: false });

    const newErrors = validateSpaceForm(name, description, maxParticipants);
    setErrors(newErrors);
    setTouched({ name: true, description: true, maxParticipants: true });

    if (Object.keys(newErrors).length > 0) {
      setLoadingStatus({ state: 'idle', message: '', progress: 0, canRetry: false });
      toast.error('请检查表单输入');
      return;
    }

    if (!user) {
      setLoadingStatus({ state: 'idle', message: '', progress: 0, canRetry: false });
      toast.error('请先登录');
      return;
    }

    setLoadingStatus({ state: 'submitting', message: '发送请求中...', progress: 20, canRetry: false });

    try {
      const token = localStorage.getItem('secondme_token');

      const requestBody = {
        type,
        name: name.trim(),
        description: description.trim(),
        maxParticipants,
        hostAgentId: user.id,
        hostUserId: user.id,
        hostName: user.name,
        isPrivate,
        initialTopic: initialTopic.trim() || undefined,
      };

      setLoadingStatus({ state: 'processing', message: '服务器处理中...', progress: 50, canRetry: false });

      const res = await fetch('/api/space', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || '创建失败');
      }

      if (!data.data || !data.data.id) {
        throw new Error('响应数据格式错误，缺少空间 ID');
      }

      setLoadingStatus({ state: 'success', message: '创建成功', progress: 100, canRetry: false });
      toast.success('空间创建成功！');

      setTimeout(() => {
        try {
          if (onCreated) {
            onCreated(data.data);
          }
          onClose();
          router.push(`/space/${data.data.id}`);
        } catch (callbackError) {
          toast.error('空间创建成功，但跳转失败，请手动访问空间');
        }
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败，请重试';
      setLoadingStatus({ state: 'error', message, progress: 0, canRetry: true });
      toast.error(message);
    }
  }, [name, description, maxParticipants, user, type, isPrivate, initialTopic, onCreated, onClose, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isOpen && loadingStatus.state === 'idle') {
        if (currentStep < TOTAL_STEPS) {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, loadingStatus.state, handleNext, handleSubmit]);

  if (!isOpen) return null;

  const isLoading = loadingStatus.state !== 'idle' && loadingStatus.state !== 'error';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-6 sm:px-8 py-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">创建第三空间</h2>
            </div>
            <p className="text-amber-100 text-xs sm:text-sm">与志同道合的人连接，开启新的对话</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="relative z-10 p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        <div className="px-6 sm:px-8 py-4 border-b border-gray-100 bg-gray-50/50">
          <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          {loadingStatus.state === 'success' ? (
            <LoadingAnimation status={loadingStatus} progress={progress} />
          ) : loadingStatus.state === 'error' ? (
            <LoadingAnimation status={loadingStatus} progress={progress} onRetry={handleRetry} />
          ) : isLoading ? (
            <LoadingAnimation status={loadingStatus} progress={progress} />
          ) : (
            <div className="space-y-6">
              {currentStep === 1 && <Step1TypeSelection type={type} onTypeChange={setType} />}

              {currentStep === 2 && (
                <Step2BasicInfo
                  type={type}
                  name={name}
                  description={description}
                  initialTopic={initialTopic}
                  onNameChange={setName}
                  onDescriptionChange={setDescription}
                  onInitialTopicChange={setInitialTopic}
                  errors={errors}
                  touched={touched}
                  onBlur={handleBlur}
                />
              )}

              {currentStep === 3 && (
                <Step3AdvancedSettings
                  type={type}
                  maxParticipants={maxParticipants}
                  isPrivate={isPrivate}
                  onMaxParticipantsChange={setMaxParticipants}
                  onIsPrivateChange={setIsPrivate}
                  errors={errors}
                  touched={touched}
                  onBlur={handleBlur}
                />
              )}
            </div>
          )}
        </div>

        {loadingStatus.state === 'idle' && (
          <div className="px-6 sm:px-8 py-4 bg-gray-50/50">
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              canGoNext={canGoNext}
              isLoading={isLoading}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
