/**
 * 自定义光标扩展 - 用于显示其他用户的光标和选区
 * 不依赖Yjs provider
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface CursorUser {
  userId: string
  username: string
  color: string
  position?: number
}

export interface CustomCursorOptions {
  onUpdate?: (users: CursorUser[]) => void
}

export const CustomCursor = Extension.create<CustomCursorOptions>({
  name: 'customCursor',

  addOptions() {
    return {
      onUpdate: () => {},
    }
  },

  addProseMirrorPlugins() {
    const { onUpdate } = this.options
    const users = new Map<string, CursorUser>()

    return [
      new Plugin({
        key: new PluginKey('customCursor'),
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldState) {
            // 获取光标信息
            const meta = tr.getMeta('customCursor')
            if (meta) {
              const { action, user } = meta
              if (action === 'add' || action === 'update') {
                users.set(user.userId, user)
              } else if (action === 'remove') {
                users.delete(user.userId)
              }

              if (onUpdate) {
                onUpdate(Array.from(users.values()))
              }
            }

            // 创建装饰
            const decorations: Decoration[] = []
            users.forEach((user) => {
              if (user.position !== undefined && user.position >= 0) {
                // 创建光标装饰
                const cursorDOM = document.createElement('span')
                cursorDOM.className = 'collaboration-cursor'
                cursorDOM.style.borderLeft = `2px solid ${user.color}`
                cursorDOM.style.position = 'absolute'
                cursorDOM.style.pointerEvents = 'none'

                // 创建标签
                const label = document.createElement('span')
                label.className = 'collaboration-cursor-label'
                label.textContent = user.username
                label.style.backgroundColor = user.color
                label.style.color = '#fff'
                label.style.padding = '2px 6px'
                label.style.borderRadius = '3px'
                label.style.fontSize = '12px'
                label.style.position = 'absolute'
                label.style.top = '-20px'
                label.style.left = '0'
                label.style.whiteSpace = 'nowrap'
                cursorDOM.appendChild(label)

                decorations.push(
                  Decoration.widget(user.position, cursorDOM, {
                    side: -1,
                  })
                )
              }
            })

            return DecorationSet.create(tr.doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },

  addCommands() {
    return {
      updateCursor:
        (user: CursorUser) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta('customCursor', { action: 'update', user })
          }
          return true
        },
      removeCursor:
        (userId: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta('customCursor', {
              action: 'remove',
              user: { userId },
            })
          }
          return true
        },
    }
  },
})
