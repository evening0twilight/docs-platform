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
    // 只对「项目直接依赖」的 yjs 全家桶去重,确保运行时唯一一份 yjs 实例
    // (避免 Collaboration/Caret 拿到不同的 ySyncPluginKey 而崩溃)。
    // 注:prosemirror-*/@tiptap/y-tiptap 是传递依赖,pnpm 严格布局下无法从项目根解析,
    // 列入 dedupe 会让生产构建(Rollup)解析失败;它们经 @tiptap/pm 已是单实例,无需去重。
    dedupe: ['yjs', 'y-prosemirror', 'y-protocols'],
  },
  optimizeDeps: {
    // 把 yjs 协同相关入口放进同一次预打包,配合上面的 dedupe,
    // 让 Collaboration 与 CollaborationCaret 经由 @tiptap/y-tiptap 共享同一份 yjs 实例。
    // 注:@tiptap/y-tiptap 是传递依赖、无法作为裸标识被 include 解析(会告警),
    // 它会随 collaboration/caret 一起被预打包并经 resolve.dedupe 共享同一份 yjs,
    // 故此处无需(也不能)单独列出。
    include: [
      'yjs',
      'y-prosemirror',
      '@hocuspocus/provider',
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-caret',
    ],
  },
  // 生产构建时把 console.log/console.debug 标记为「无副作用」,
  // 交给压缩阶段 tree-shake 掉,清理生产环境的调试噪音(保留 console.warn/error)。
  esbuild: {
    pure:
      process.env.NODE_ENV === 'production'
        ? ['console.log', 'console.debug']
        : [],
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