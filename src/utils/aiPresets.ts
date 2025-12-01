// AI快捷操作预设配置

export interface AIPreset {
  id: string;
  label: string;
  icon: string;
  requiresSelection: boolean;
  description: string;
}

export const AI_PRESETS: AIPreset[] = [
  {
    id: 'polish',
    label: '润色文本',
    icon: '✨',
    requiresSelection: true,
    description: '优化表达,使文本更流畅专业',
  },
  {
    id: 'expand',
    label: '扩写内容',
    icon: '📝',
    requiresSelection: true,
    description: '增加细节和解释,丰富内容',
  },
  {
    id: 'summarize',
    label: '生成摘要',
    icon: '📋',
    requiresSelection: true,
    description: '提取核心要点,生成摘要',
  },
  {
    id: 'translate',
    label: '翻译',
    icon: '🌐',
    requiresSelection: true,
    description: '中英互译',
  },
  {
    id: 'continue',
    label: '继续写作',
    icon: '➡️',
    requiresSelection: false,
    description: '基于上下文续写内容',
  },
];

/**
 * 根据ID获取预设配置
 */
export function getPresetById(id: string): AIPreset | undefined {
  return AI_PRESETS.find((preset) => preset.id === id);
}

/**
 * 获取可用的预设(根据是否有选中文本)
 */
export function getAvailablePresets(hasSelection: boolean): AIPreset[] {
  return AI_PRESETS.filter(
    (preset) => !preset.requiresSelection || hasSelection
  );
}
