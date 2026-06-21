import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    // 确保 yjs / y-prosemirror 等只解析到唯一一份物理副本,
    // 否则 Collaboration 与 CollaborationCursor 会拿到不同的 ySyncPluginKey,
    // 导致协同光标插件初始化时读取 sync 状态为 undefined（reading 'doc' 崩溃）。
    dedupe: [
      'yjs',
      'y-prosemirror',
      'y-protocols',
      '@tiptap/y-tiptap',
      'prosemirror-state',
      'prosemirror-view',
      'prosemirror-model',
      'prosemirror-transform',
    ],
  },
  optimizeDeps: {
    // 把 yjs 协同相关入口放进同一次预打包,配合上面的 dedupe,
    // 让 Collaboration 与 CollaborationCaret 经由 @tiptap/y-tiptap 共享同一份 yjs 实例。
    include: [
      'yjs',
      'y-prosemirror',
      '@tiptap/y-tiptap',
      '@hocuspocus/provider',
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-caret',
    ],
  },
  build: {
    // 生成带哈希的文件名，防止缓存问题
    rollupOptions: {
      output: {
        // 为 JS 文件添加哈希
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
})