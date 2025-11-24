import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// 远程光标数据结构
interface RemoteCursor {
  userId: string
  username: string
  color: string
  position: { line: number; column: number }
  lastUpdate: number
}

// Plugin state结构
interface CursorPluginState {
  remoteCursors: Map<string, RemoteCursor>
  decorationSet: DecorationSet
}

export const CollaborationCursor = Extension.create({
  name: 'collaborationCursor',

  addProseMirrorPlugins() {
    console.log('[CollaborationCursor] 🔌 初始化Plugin')
    return [
      new Plugin<CursorPluginState>({
        key: new PluginKey('collaborationCursor'),
        
        state: {
          init() {
            console.log('[CollaborationCursor] 📦 初始化Plugin State')
            return {
              remoteCursors: new Map<string, RemoteCursor>(),
              decorationSet: DecorationSet.empty
            }
          },
          
          apply(tr, oldPluginState, oldEditorState, newEditorState) {
            console.log('[CollaborationCursor] ⚡ apply函数被调用')
            
            // 创建新的Map（不可变更新）
            const remoteCursors = new Map(oldPluginState.remoteCursors)
            
            // 从transaction获取远程光标更新
            const meta = tr.getMeta('updateRemoteCursor')
            if (meta) {
              console.log('[CollaborationCursor] 收到meta更新:', meta)
              // 更新或删除光标
              if (meta.action === 'set') {
                remoteCursors.set(meta.userId, {
                  userId: meta.userId,
                  username: meta.username,
                  color: meta.color,
                  position: meta.position,
                  lastUpdate: Date.now(),
                })
                console.log('[CollaborationCursor] 已添加光标:', meta.userId, '总数:', remoteCursors.size)
              } else if (meta.action === 'delete') {
                remoteCursors.delete(meta.userId)
                console.log('[CollaborationCursor] 已删除光标:', meta.userId)
              }
            }
            
            // 移除过期的光标(超过5秒未更新)
            const now = Date.now()
            remoteCursors.forEach((cursor, userId) => {
              if (now - cursor.lastUpdate > 5000) {
                console.log(`[CollaborationCursor] 移除过期光标: ${userId}`)
                remoteCursors.delete(userId)
              }
            })

            // 重新构建装饰器集合
            const decorations: Decoration[] = []
            
            console.log(`[CollaborationCursor] 当前远程光标数: ${remoteCursors.size}`)
            
            remoteCursors.forEach((cursor, userId) => {
              console.log(`[CollaborationCursor] 处理用户 ${cursor.username} 的光标, 位置:`, cursor.position)
              const pos = getCursorPosition(tr.doc, cursor.position)
              
              if (pos !== null && pos >= 0 && pos <= tr.doc.content.size) {
                console.log(`[CollaborationCursor] 创建光标装饰器: 用户 ${cursor.username}, 位置 ${pos}`)
                // 创建光标元素
                const cursorElement = document.createElement('span')
                cursorElement.className = 'collaboration-cursor'
                cursorElement.style.borderLeftColor = cursor.color
                
                // 创建用户名标签
                const label = document.createElement('span')
                label.className = 'collaboration-cursor-label'
                label.style.backgroundColor = cursor.color
                label.textContent = cursor.username
                cursorElement.appendChild(label)
                
                decorations.push(
                  Decoration.widget(pos, cursorElement, {
                    side: 1,
                    key: `cursor-${cursor.userId}`,
                  })
                )
              } else {
                console.warn(`[CollaborationCursor] 光标位置无效: 用户 ${cursor.username}, pos=${pos}, 文档大小=${tr.doc.content.size}`)
              }
            })

            console.log(`[CollaborationCursor] 创建了 ${decorations.length} 个光标装饰器`)
            
            // 返回新的state对象
            return {
              remoteCursors: remoteCursors,
              decorationSet: DecorationSet.create(tr.doc, decorations)
            }
          },
        },

        props: {
          decorations(state) {
            return this.getState(state)?.decorationSet
          },
        },
      }),
    ]
  },
})

// 辅助方法: 将行列坐标转换为ProseMirror的position
function getCursorPosition(doc: any, position: { line: number; column: number }): number | null {
  try {
    let currentLine = 0
    let pos = 0
    let found = false
    
    console.log(`[getCursorPosition] 开始转换: line=${position.line}, column=${position.column}`)
    
    doc.descendants((node: any, nodePos: number) => {
      if (found) return false
      
      if (node.isBlock && node.type.name !== 'doc') {
        console.log(`[getCursorPosition] 检查块: currentLine=${currentLine}, nodePos=${nodePos}, nodeSize=${node.nodeSize}, content.size=${node.content.size}, type=${node.type.name}`)
        
        if (currentLine === position.line) {
          // 找到目标行，计算ProseMirror位置
          // position.column是相对于块内容的偏移
          const maxColumn = Math.min(position.column, node.content.size)
          pos = nodePos + 1 + maxColumn // +1 跳过节点开始标记
          found = true
          console.log(`[getCursorPosition] ✅ 找到光标位置: line ${position.line}, col ${position.column} -> nodePos ${nodePos} + 1 + ${maxColumn} = ${pos}`)
          console.log(`[getCursorPosition] 节点内容: "${node.textContent}", 长度: ${node.content.size}`)
          return false
        }
        currentLine++
      }
      
      return true
    })
    
    if (!found) {
      console.warn(`[getCursorPosition] ⚠️ 未找到光标位置: line ${position.line}, col ${position.column}, 文档总行数: ${currentLine}`)
    }
    
    return found ? pos : null
  } catch (error) {
    console.error('[getCursorPosition] 转换光标位置失败:', error)
    return null
  }
}
