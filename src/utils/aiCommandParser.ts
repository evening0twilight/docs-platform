import type { Editor } from '@tiptap/vue-3';

// ========== 类型定义 ==========

export interface AICommand {
  action: string;
  args?: Record<string, any>;
}

// ========== 命令解析 ==========

/**
 * 从AI回复中解析命令
 * 格式: [AI_COMMAND: action, {"key": "value"}]
 */
export function parseAICommand(response: string): AICommand | null {
  const commandRegex = /\[AI_COMMAND:\s*(\w+)(?:,\s*({.*?}))?\]/;
  const match = response.match(commandRegex);

  if (!match) return null;

  const action = match[1];
  const args = match[2] ? JSON.parse(match[2]) : undefined;

  return { action, args };
}

/**
 * 执行AI命令
 */
export function executeAICommand(command: AICommand, editor: Editor): boolean {
  const { action, args } = command;

  try {
    switch (action) {
      // ========== 格式化命令 ==========
      case 'formatBold':
        editor.chain().focus().toggleBold().run();
        break;

      case 'formatItalic':
        editor.chain().focus().toggleItalic().run();
        break;

      case 'formatUnderline':
        editor.chain().focus().toggleUnderline().run();
        break;

      case 'formatStrike':
        editor.chain().focus().toggleStrike().run();
        break;

      case 'formatCode':
        editor.chain().focus().toggleCode().run();
        break;

      case 'formatHighlight':
        editor.chain().focus().toggleHighlight().run();
        break;

      // ========== 文本操作 ==========
      case 'insertText':
        if (args?.text) {
          editor.chain().focus().insertContent(args.text).run();
        }
        break;

      case 'replaceSelection':
        if (args?.text) {
          editor.chain().focus().deleteSelection().insertContent(args.text).run();
        }
        break;

      case 'deleteSelection':
        editor.chain().focus().deleteSelection().run();
        break;

      // ========== 列表操作 ==========
      case 'insertBulletList':
        editor.chain().focus().toggleBulletList().run();
        break;

      case 'insertOrderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;

      case 'insertTaskList':
        editor.chain().focus().toggleTaskList().run();
        break;

      // ========== 标题操作 ==========
      case 'setHeading':
        if (args?.level) {
          editor.chain().focus().setHeading({ level: args.level }).run();
        }
        break;

      case 'setParagraph':
        editor.chain().focus().setParagraph().run();
        break;

      // ========== 区块操作 ==========
      case 'insertBlockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;

      case 'insertCodeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;

      case 'insertHorizontalRule':
        editor.chain().focus().setHorizontalRule().run();
        break;

      // ========== 对齐操作 (需要安装@tiptap/extension-text-align) ==========
      // case 'alignLeft':
      //   editor.chain().focus().setTextAlign('left').run();
      //   break;

      // case 'alignCenter':
      //   editor.chain().focus().setTextAlign('center').run();
      //   break;

      // case 'alignRight':
      //   editor.chain().focus().setTextAlign('right').run();
      //   break;

      // ========== 其他操作 ==========
      case 'clearFormatting':
        editor.chain().focus().clearNodes().unsetAllMarks().run();
        break;

      case 'undo':
        editor.chain().focus().undo().run();
        break;

      case 'redo':
        editor.chain().focus().redo().run();
        break;

      default:
        console.warn('未知的AI命令:', action);
        return false;
    }

    return true;
  } catch (error) {
    console.error('执行AI命令失败:', error);
    return false;
  }
}

/**
 * 解析并执行AI命令(组合函数)
 */
export function parseAndExecuteCommand(response: string, editor: Editor): boolean {
  const command = parseAICommand(response);
  if (!command) {
    console.log('AI回复中未找到命令');
    return false;
  }

  console.log('解析到AI命令:', command);
  return executeAICommand(command, editor);
}
