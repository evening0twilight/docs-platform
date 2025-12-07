import { ref, computed } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import { sendAIChat, quickAction, streamAIChat } from '@/api/ai';
import type { AIContext } from '@/api/ai';
import { parseAndExecuteCommand } from '@/utils/aiCommandParser';
import { Message } from '@arco-design/web-vue';

// ========== 类型定义 ==========

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  error?: string;
}

// ========== 组合式函数 ==========

export function useAIChat(editor: Editor) {
  const messages = ref<AIMessage[]>([]);
  const isLoading = ref(false);
  const currentStreamingMessageId = ref<string | null>(null);

  // 是否有选中文本
  const hasSelection = computed(() => {
    if (!editor) return false;
    const { from, to } = editor.state.selection;
    return from !== to;
  });

  // 生成唯一ID
  function generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取编辑器上下文
  function getEditorContext(): AIContext {
    const { state } = editor;
    const { from, to } = state.selection;

    return {
      selectedText: state.doc.textBetween(from, to, ' '),
      cursorPosition: from,
      documentContent: editor.getText(),
      hasSelection: from !== to,
    };
  }

  // 添加系统消息
  function addSystemMessage(content: string) {
    const message: AIMessage = {
      id: generateId(),
      role: 'system',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(message);
  }

  // 发送消息(非流式)
  async function sendMessage(userInput: string) {
    if (!userInput.trim()) {
      Message.warning('请输入内容');
      return;
    }

    isLoading.value = true;

    // 添加用户消息
    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };
    messages.value.push(userMessage);

    try {
      const context = getEditorContext();
      const response = await sendAIChat({
        message: userInput,
        context,
      });

      // 添加AI回复
      const aiMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
      };
      messages.value.push(aiMessage);

      // 解析并执行命令
      const executed = parseAndExecuteCommand(response.content, editor);
      if (executed) {
        console.log('✅ AI命令执行成功');
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);

      const errorMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        error: error.message || '发送失败,请重试',
      };
      messages.value.push(errorMessage);

      Message.error('AI请求失败: ' + (error.message || '未知错误'));
    } finally {
      isLoading.value = false;
    }
  }

  // 发送消息(流式)
  async function sendMessageStream(userInput: string) {
    if (!userInput.trim()) {
      Message.warning('请输入内容');
      return;
    }

    isLoading.value = true;

    // 添加用户消息
    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };
    messages.value.push(userMessage);

    // 创建AI消息占位符
    const aiMessageId = generateId();
    const aiMessage: AIMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    messages.value.push(aiMessage);
    currentStreamingMessageId.value = aiMessageId;

    try {
      const context = getEditorContext();

      // 使用流式API
      for await (const chunk of streamAIChat({
        message: userInput,
        context,
      })) {
        // 更新消息内容
        const messageIndex = messages.value.findIndex(
          (m) => m.id === aiMessageId
        );
        if (messageIndex !== -1) {
          messages.value[messageIndex].content += chunk;
        }
      }

      // 流式结束
      const messageIndex = messages.value.findIndex((m) => m.id === aiMessageId);
      if (messageIndex !== -1) {
        messages.value[messageIndex].isStreaming = false;

        // 解析并执行命令
        const executed = parseAndExecuteCommand(
          messages.value[messageIndex].content,
          editor
        );
        if (executed) {
          console.log('✅ AI命令执行成功');
        }
      }
    } catch (error: any) {
      console.error('流式请求失败:', error);

      const messageIndex = messages.value.findIndex((m) => m.id === aiMessageId);
      if (messageIndex !== -1) {
        messages.value[messageIndex].isStreaming = false;
        messages.value[messageIndex].error =
          error.message || '发送失败,请重试';
      }

      Message.error('AI请求失败: ' + (error.message || '未知错误'));
    } finally {
      isLoading.value = false;
      currentStreamingMessageId.value = null;
    }
  }

  // 快捷操作
  async function executeQuickAction(
    actionId: 'polish' | 'expand' | 'summarize' | 'translate' | 'continue'
  ) {
    const context = getEditorContext();

    // 根据操作类型确定使用的文本
    let text = '';
    if (actionId === 'continue') {
      // 继续写作使用完整文档内容(取最后500字)
      text = context.documentContent?.slice(-500) || '';
      if (!text) {
        Message.warning('文档内容为空');
        return;
      }
    } else {
      // 其他操作需要选中文本
      if (!context.hasSelection || !context.selectedText) {
        Message.warning('请先选中文本');
        return;
      }
      text = context.selectedText;
    }

    isLoading.value = true;

    // 添加系统消息
    const actionLabels = {
      polish: '润色文本',
      expand: '扩写内容',
      summarize: '生成摘要',
      translate: '翻译',
      continue: '继续写作',
    };
    addSystemMessage(`正在${actionLabels[actionId]}...`);

    try {
      const response = await quickAction(actionId, text);

      // 添加AI回复
      const aiMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
      };
      messages.value.push(aiMessage);

      // 解析并执行命令
      const executed = parseAndExecuteCommand(response.content, editor);
      if (executed) {
        Message.success(`${actionLabels[actionId]}完成`);
      }
    } catch (error: any) {
      console.error('快捷操作失败:', error);
      Message.error(
        `${actionLabels[actionId]}失败: ` + (error.message || '未知错误')
      );
    } finally {
      isLoading.value = false;
    }
  }

  // 清空对话
  function clearChat() {
    messages.value = [];
    Message.success('对话已清空');
  }

  // 停止流式响应
  function stopStreaming() {
    if (currentStreamingMessageId.value) {
      const messageIndex = messages.value.findIndex(
        (m) => m.id === currentStreamingMessageId.value
      );
      if (messageIndex !== -1) {
        messages.value[messageIndex].isStreaming = false;
      }
      currentStreamingMessageId.value = null;
      isLoading.value = false;
    }
  }

  return {
    messages,
    isLoading,
    hasSelection,
    sendMessage,
    sendMessageStream,
    executeQuickAction,
    clearChat,
    stopStreaming,
  };
}
